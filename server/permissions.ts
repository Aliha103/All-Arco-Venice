import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { users, adminSessions, teamMembers, adminRoles, adminAuditLog } from './db/admin-schema';
import { PERMISSIONS } from './db/admin-schema';
import { eq, and, or } from 'drizzle-orm';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions?: string[];
    sessionId?: string;
  };
}

// Advanced permission checking system
export class PermissionManager {
  private static instance: PermissionManager;
  private permissionCache = new Map<string, { permissions: string[]; expires: number }>();

  static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }

  // Get user permissions with caching
  async getUserPermissions(userId: string): Promise<string[]> {
    const cacheKey = `user_permissions_${userId}`;
    const cached = this.permissionCache.get(cacheKey);
    
    if (cached && cached.expires > Date.now()) {
      return cached.permissions;
    }

    try {
      // Get user's base role permissions
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user.length) return [];

      let permissions: string[] = [];

      // Super admin gets all permissions
      if (user[0].role === 'admin' && user[0].email === process.env.SUPER_ADMIN_EMAIL) {
        permissions = Object.values(PERMISSIONS);
      } else {
        // Get team member specific permissions
        const teamMember = await db.select({
          customPermissions: teamMembers.customPermissions,
          restrictions: teamMembers.restrictions,
          allowedFeatures: teamMembers.allowedFeatures,
          rolePermissions: adminRoles.permissions,
          isActive: teamMembers.isActive
        })
        .from(teamMembers)
        .leftJoin(adminRoles, eq(teamMembers.roleId, adminRoles.id))
        .where(and(
          eq(teamMembers.userId, userId),
          eq(teamMembers.isActive, true)
        ))
        .limit(1);

        if (teamMember.length && teamMember[0].isActive) {
          const member = teamMember[0];
          
          // Start with role permissions
          const rolePermissions = (member.rolePermissions as string[]) || [];
          
          // Add custom permissions
          const customPermissions = (member.customPermissions as string[]) || [];
          
          // Remove restrictions
          const restrictions = (member.restrictions as string[]) || [];
          
          permissions = [...new Set([...rolePermissions, ...customPermissions])]
            .filter(p => !restrictions.includes(p));
            
          // Filter by allowed features if specified
          const allowedFeatures = member.allowedFeatures as string[];
          if (allowedFeatures && allowedFeatures.length > 0) {
            permissions = permissions.filter(p => 
              allowedFeatures.some(feature => p.startsWith(feature))
            );
          }
        }
      }

      // Cache for 5 minutes
      this.permissionCache.set(cacheKey, {
        permissions,
        expires: Date.now() + 5 * 60 * 1000
      });

      return permissions;
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  // Check if user has specific permission
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permission);
  }

  // Check if user has any of the specified permissions
  async hasAnyPermission(userId: string, requiredPermissions: string[]): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return requiredPermissions.some(p => permissions.includes(p));
  }

  // Check if user has all specified permissions
  async hasAllPermissions(userId: string, requiredPermissions: string[]): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return requiredPermissions.every(p => permissions.includes(p));
  }

  // Clear permission cache for user
  clearUserCache(userId: string) {
    this.permissionCache.delete(`user_permissions_${userId}`);
  }

  // Clear all permission cache
  clearAllCache() {
    this.permissionCache.clear();
  }
}

// Middleware factory for permission checking
export function requirePermission(permission: string | string[], options?: {
  requireAll?: boolean; // true = all permissions required, false = any permission required
  allowSuperAdmin?: boolean; // Allow super admin to bypass check
}) {
  const { requireAll = false, allowSuperAdmin = true } = options || {};

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const session = req.session as any;
      const userId = session.userId || session.user?.id;

      if (!userId) {
        await logAuditEvent(req, 'permission_denied', 'authentication', null, {
          reason: 'No user session',
          requiredPermission: permission
        }, false);
        return res.status(401).json({ error: 'Authentication required' });
      }

      const permissionManager = PermissionManager.getInstance();
      const permissions = Array.isArray(permission) ? permission : [permission];

      // Check if super admin bypass is allowed
      if (allowSuperAdmin) {
        const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (user.length && user[0].role === 'admin' && user[0].email === process.env.SUPER_ADMIN_EMAIL) {
          req.user = {
            id: userId,
            email: user[0].email,
            role: user[0].role,
            permissions: Object.values(PERMISSIONS),
            sessionId: session.sessionId
          };
          return next();
        }
      }

      // Check permissions
      const hasPermission = requireAll
        ? await permissionManager.hasAllPermissions(userId, permissions)
        : await permissionManager.hasAnyPermission(userId, permissions);

      if (!hasPermission) {
        await logAuditEvent(req, 'permission_denied', 'authorization', null, {
          reason: 'Insufficient permissions',
          requiredPermissions: permissions,
          requireAll
        }, false);
        
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: permissions,
          requireAll
        });
      }

      // Attach user info to request
      const userPermissions = await permissionManager.getUserPermissions(userId);
      req.user = {
        id: userId,
        email: session.user?.email || session.email,
        role: session.user?.role || session.role,
        permissions: userPermissions,
        sessionId: session.sessionId
      };

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      await logAuditEvent(req, 'permission_error', 'system', null, {
        error: error.message,
        requiredPermission: permission
      }, false);
      
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Enhanced MFA verification middleware
export function requireMFA(options?: {
  requireTOTP?: boolean;
  requireSMS?: boolean;
  maxSessionAge?: number; // in minutes
}) {
  const { requireTOTP = true, requireSMS = false, maxSessionAge = 480 } = options || {};

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const session = req.session as any;
      const userId = session.userId || session.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if session has required MFA verifications
      if (requireTOTP && !session.totpVerified) {
        await logAuditEvent(req, 'mfa_required', 'authentication', null, {
          reason: 'TOTP verification required',
          mfaType: 'totp'
        }, false);
        
        return res.status(403).json({
          error: 'TOTP verification required',
          requiresVerification: true,
          mfaType: 'totp'
        });
      }

      if (requireSMS && !session.smsVerified) {
        await logAuditEvent(req, 'mfa_required', 'authentication', null, {
          reason: 'SMS verification required',
          mfaType: 'sms'
        }, false);
        
        return res.status(403).json({
          error: 'SMS verification required',
          requiresVerification: true,
          mfaType: 'sms'
        });
      }

      // Check session age
      const sessionStart = session.mfaVerifiedAt || session.createdAt;
      if (sessionStart && maxSessionAge) {
        const sessionAge = (Date.now() - new Date(sessionStart).getTime()) / (1000 * 60);
        if (sessionAge > maxSessionAge) {
          await logAuditEvent(req, 'session_expired', 'authentication', null, {
            sessionAge,
            maxAge: maxSessionAge
          }, false);
          
          return res.status(403).json({
            error: 'Session expired, re-authentication required',
            requiresReauth: true
          });
        }
      }

      next();
    } catch (error) {
      console.error('MFA check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Audit logging function
export async function logAuditEvent(
  req: Request,
  action: string,
  resource: string,
  resourceId: string | null,
  details: any = {},
  success: boolean = true,
  errorMessage?: string
) {
  try {
    const session = req.session as any;
    const userId = session.userId || session.user?.id || 'anonymous';
    
    await db.insert(adminAuditLog).values({
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      sessionId: session.sessionId,
      success,
      errorMessage
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

// Risk assessment for sessions
export function calculateRiskScore(req: Request, userAgent?: string, location?: any): number {
  let risk = 0;

  // Check for suspicious user agents
  if (userAgent) {
    const suspiciousPatterns = ['bot', 'crawler', 'spider', 'scraper'];
    if (suspiciousPatterns.some(pattern => userAgent.toLowerCase().includes(pattern))) {
      risk += 30;
    }
  }

  // Check for unusual IP patterns (placeholder - would integrate with IP geolocation)
  const ip = req.ip || req.connection.remoteAddress;
  if (ip && (ip.includes('tor') || ip.includes('proxy'))) {
    risk += 40;
  }

  // Time-based risk (logins outside business hours)
  const hour = new Date().getHours();
  if (hour < 6 || hour > 22) {
    risk += 10;
  }

  return Math.min(risk, 100);
}

// Session management
export async function createAdminSession(userId: string, req: Request): Promise<string> {
  try {
    const sessionToken = require('crypto').randomBytes(32).toString('hex');
    const userAgent = req.get('User-Agent');
    const ipAddress = req.ip || req.connection.remoteAddress;
    const riskScore = calculateRiskScore(req, userAgent);

    await db.insert(adminSessions).values({
      userId,
      sessionToken,
      deviceInfo: {
        userAgent,
        platform: req.get('Platform'),
        browser: req.get('Browser')
      },
      ipAddress,
      riskScore,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours
    });

    return sessionToken;
  } catch (error) {
    console.error('Failed to create admin session:', error);
    throw error;
  }
}

export { PERMISSIONS };