import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./localAuth";
import { setupGoogleAuth } from "./googleAuth";
import { requireAdminAuth, generateTOTPSecret, verifyTOTP, requireMFAVerification } from "./auth";
import { logAuditEvent } from "./auditLogger";
import { insertBookingSchema, insertAmenitySchema, insertPropertyImageSchema, insertReviewSchema, insertMessageSchema, signupSchema, loginSchema, updateUserProfileSchema, guestReviewSchema, insertVoucherSchema, insertVoucherUsageSchema, voucherValidationSchema, vouchers, voucherUsage, bookings, users } from "@shared/schema";
import Stripe from "stripe";
import bcrypt from "bcryptjs";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { db } from "./db";
import { sql, eq, desc } from "drizzle-orm";
import { loggedOutSessions } from "@shared/schema";
// import pmsRoutes from "./pms-routes"; // Temporarily disabled

// Skip Stripe initialization for local development
let stripe: Stripe | undefined;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-05-28.basil",
  });
} else {
  // Stripe not configured - payment features will be disabled
}

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = crypto.randomUUID() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  
  // Setup Google OAuth
  try {
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && 
        process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id-here' &&
        process.env.GOOGLE_CLIENT_SECRET !== 'your-google-client-secret-here') {
      setupGoogleAuth(app);
      console.log('✅ Google OAuth configured successfully');
    } else {
      console.log('⚠️  Google OAuth not configured - add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env');
      // Setup minimal routes for testing
      app.get('/api/auth/google', (req, res) => {
        res.status(503).json({ error: 'Google OAuth not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env file.' });
      });
    }
  } catch (error) {
    console.error('❌ Google OAuth setup failed:', error);
  }

  // Serve uploaded files statically
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  }, (req, res, next) => {
    const filePath = path.join(uploadDir, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('File not found');
    }
  });

  // Team Management Endpoints

  // GET all roles
  app.get('/api/admin/team/roles', async (req, res) => {
    try {
      const roles = await storage.getAllRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch roles' });
    }
  });

  // GET all team members
  app.get('/api/admin/team/members', async (req, res) => {
    try {
      const members = await storage.getAllTeamMembers();
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch team members' });
    }
  });

  // POST create a new team member
  app.post('/api/admin/team/members', async (req, res) => {
    try {
      const { userId, roleId, email, firstName, lastName, password, customPermissions, restrictions, accessLevel, expiresAt } = req.body;
      const newMember = await storage.createTeamMember({
        userId,
        roleId,
        email,
        firstName,
        lastName,
        password,
        customPermissions,
        restrictions,
        accessLevel,
        expiresAt
      });
      res.status(201).json(newMember);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create team member' });
    }
  });

  // PATCH update team member status
  app.patch('/api/admin/team/members/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      await storage.updateTeamMemberStatus(id, isActive);
      res.json({ 
        message: 'Member status updated successfully',
        memberId: id,
        isActive 
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update member status' });
    }
  });

  // DELETE team member
  app.delete('/api/admin/team/members/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTeamMember(id);
      res.json({ message: 'Team member deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete team member' });
    }
  });

  // POST reset team member password
  app.post('/api/admin/team/members/:id/reset-password', async (req, res) => {
    try {
      const { id } = req.params;
      const newPassword = await storage.resetTeamMemberPassword(id);
      res.json({ 
        message: 'Password reset successfully',
        newPassword 
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });

  // PATCH update team member access level (for testing)
  app.patch('/api/admin/team/members/:id/access-level', async (req, res) => {
    try {
      const { id } = req.params;
      const { accessLevel } = req.body;
      
      if (!['full', 'limited', 'read_only', 'custom'].includes(accessLevel)) {
        return res.status(400).json({ message: 'Invalid access level' });
      }
      
      await storage.updateTeamMemberAccessLevel(id, accessLevel);
      res.json({ 
        message: 'Access level updated successfully',
        accessLevel
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update access level' });
    }
  });

  // POST create a new role
  app.post('/api/admin/team/roles', async (req, res) => {
    try {
      const { name, displayName, description, permissions, color } = req.body;
      const newRole = {
        id: Date.now().toString(),
        name,
        displayName,
        description,
        permissions,
        color,
        priority: 50,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      res.status(201).json(newRole);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create role' });
    }
  });

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    // Check if this session has been logged out
    try {
      const loggedOutSession = await db.select().from(loggedOutSessions).where(eq(loggedOutSessions.sessionId, req.sessionID));
      if (loggedOutSession.length > 0) {
        return res.status(401).json({ message: "Session invalidated" });
      }
    } catch (error) {
      // Error checking logged out sessions
    }
    
    // Check for logout flag in session
    if ((req.session as any)?.loggedOut) {
      return res.status(401).json({ message: "Logged out" });
    }
    
    if (!req.user || !req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      // For local auth users, get fresh data from database
      if ((req.user as any).authProvider === 'local') {
        const user = await storage.getUser((req.user as any).id);
        if (!user) {
          req.logout(() => {
            req.session.destroy(() => {
              res.status(401).json({ message: "User not found" });
            });
          });
          return;
        }
        return res.json(user);
      }

      // For Replit auth users, return user from session
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {

      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update user profile
  app.put('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = updateUserProfileSchema.parse(req.body);
      
      const updatedUser = await storage.updateUserProfile(userId, validatedData);
      res.json(updatedUser);
    } catch (error) {

      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Get user referral statistics
  app.get('/api/auth/referral-stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserReferralStats(userId);
      res.json(stats);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch referral statistics" });
    }
  });

  // Initialize admin user if it doesn't exist
  async function initializeAdminUser() {
    try {
      const adminEmail = "admin@allarco.com";
      const existingAdmin = await storage.getUserByEmail(adminEmail);
      
      if (!existingAdmin) {
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash("admin123", saltRounds);
        
        const adminUser = await storage.createAdminUser({
          firstName: "Hassan",
          lastName: "Cheema",
          email: adminEmail,
          password: hashedPassword,
        });
        
        // Admin user created successfully
      } else {
        // Admin user already exists
      }
    } catch (error) {

    }
  }

  // Initialize admin user on server start
  initializeAdminUser();

  // Local signup route
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const validatedData = signupSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds);

      // Create user
      const user = await storage.createLocalUser({
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        password: hashedPassword,
        referralCode: validatedData.referralCode,
      });

      // Create session automatically after signup (same logic as login)
      const sessionUser = {
        claims: { sub: user.id },
        access_token: 'local_session',
        expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
      };

      req.login(sessionUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Account created but session creation failed" });
        }
        
        // Return user without password, include referral info for confirmation
        const { password, ...userResponse } = user;
        res.status(201).json({ 
          message: "Account created successfully",
          user: userResponse,
          referralCode: user.referralCode,
          wasReferred: !!user.referrerName,
          referrerName: user.referrerName
        });
      });
    } catch (error: any) {

      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Local login route
  app.post('/api/auth/login', async (req, res) => {
    try {


      const validatedData = loginSchema.parse(req.body);

      // Find user by email

      const user = await storage.getUserByEmail(validatedData.email);

      if (!user) {

        return res.status(401).json({ message: "Invalid email or password" });
      }


      if (user.authProvider !== 'local' || !user.password) {

        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password

      const isValidPassword = await bcrypt.compare(validatedData.password, user.password);

      if (!isValidPassword) {

        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Create session compatible with Replit Auth middleware
      const sessionUser = {
        claims: { sub: user.id },
        access_token: 'local_session',
        expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
      };

      // Check if user is admin or team member - both should access admin dashboard
      if (user.role === 'admin' || user.role === 'team_member') {
        // Get team member access level if exists
        const teamMember = await storage.getTeamMemberByUserId(user.id);
        const accessLevel = teamMember?.accessLevel || 'full'; // Default to full for original admins
        const isOriginalAdmin = user.createdBy !== 'admin'; // Original admin vs team member
        
        // Set up admin session manually
        (req.session as any).userId = user.id;
        (req.session as any).adminUserId = user.id;
        (req.session as any).user = user;
        (req.session as any).isAdmin = true;
        (req.session as any).pendingAdminLogin = true;
        (req.session as any).accessLevel = accessLevel;
        (req.session as any).isOriginalAdmin = isOriginalAdmin;
        
        // Only require TOTP for original admin users, not team members
        if (isOriginalAdmin && !user.totpSecret) {
          // Original admin needs to set up TOTP first
          const { password, ...userResponse } = user;
          return res.json({ 
            message: "Admin login - TOTP setup required",
            user: userResponse,
            requiresTOTPSetup: true
          });
        } else if (isOriginalAdmin && user.totpSecret) {
          // Original admin has TOTP, require verification
          const { password, ...userResponse } = user;
          return res.json({ 
            message: "Admin login - TOTP verification required",
            user: userResponse,
            requiresTOTPVerification: true
          });
        } else {
          // Team member - skip TOTP and login directly to admin
          // Use passport login for team members as well
          req.login(sessionUser, (err) => {
            if (err) {
              console.error('Team member login error:', err);
              return res.status(500).json({ message: "Session creation failed" });
            }
            
            // Set admin session data AFTER passport login
            (req.session as any).userId = user.id;
            (req.session as any).adminUserId = user.id;
            (req.session as any).user = user;
            (req.session as any).isAdmin = true;
            (req.session as any).adminAuthenticated = true;
            (req.session as any).totpVerified = true; // Skip TOTP for team members
            (req.session as any).mfaVerifiedAt = new Date();
            (req.session as any).accessLevel = accessLevel;
            (req.session as any).isOriginalAdmin = isOriginalAdmin;
            
            const { password, ...userResponse } = user;
            return res.json({ 
              message: "Team member login successful",
              user: { ...userResponse, accessLevel },
              redirectTo: '/admin',
              accessLevel
            });
          });
        }
      } else {
        // Regular user login - use standard login flow
        req.login(sessionUser, (err) => {
          if (err) {
            console.error('Session creation error:', err);
            return res.status(500).json({ message: "Session creation failed" });
          }
          
          const { password, ...userResponse } = user;
          res.json({ 
            message: "Login successful",
            user: userResponse 
          });
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ 
        message: "Login failed", 
        error: process.env.NODE_ENV === 'development' ? error.message : undefined 
      });
    }
  });

  // Emergency admin bypass (for development/testing)
  app.post('/api/admin/auth/emergency-login', async (req, res) => {
    try {
      const { email, password, emergencyCode } = req.body;
      
      // Emergency bypass code (change this in production!)
      const EMERGENCY_CODE = process.env.ADMIN_EMERGENCY_CODE || 'EMERGENCY2025';
      
      if (emergencyCode !== EMERGENCY_CODE) {
        return res.status(403).json({ message: 'Invalid emergency code' });
      }

      // Verify admin credentials
      const user = await storage.getUserByEmail(email);
      if (!user || user.role !== 'admin') {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Complete admin authentication without TOTP
      const session = req.session as any;
      session.userId = user.id;
      session.adminUserId = user.id;
      session.user = user;
      session.isAdmin = true;
      session.adminAuthenticated = true;
      session.totpVerified = true; // Bypass TOTP
      session.mfaVerifiedAt = new Date();

      await logAuditEvent(req, 'emergency_login_success', 'authentication', user.id, {
        email: user.email,
        method: 'emergency_bypass'
      }, true);

      const { password: _, ...userResponse } = user;
      res.json({ 
        success: true,
        message: 'Emergency login successful',
        user: userResponse
      });
    } catch (error) {
      console.error('Emergency login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // TOTP Reset endpoint - allows admin to reset and register new TOTP
  app.post('/api/admin/auth/reset-totp', async (req, res) => {
    try {
      const { email, password, resetCode } = req.body;
      
      // Reset code for development (change in production)
      const RESET_CODE = process.env.ADMIN_RESET_CODE || 'RESET2025';
      
      if (resetCode !== RESET_CODE) {
        return res.status(403).json({ message: 'Invalid reset code' });
      }

      // Verify admin credentials
      const user = await storage.getUserByEmail(email);
      if (!user || user.role !== 'admin') {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Clear existing TOTP secret to force new setup
      await db.update(users).set({ 
        totpSecret: null,
        updatedAt: new Date()
      }).where(eq(users.id, user.id));

      // Set up session for new TOTP setup
      const session = req.session as any;
      session.userId = user.id;
      session.adminUserId = user.id;
      session.user = user;
      session.isAdmin = true;
      session.pendingAdminLogin = true;

      await logAuditEvent(req, 'totp_reset_success', 'security', user.id, {
        email: user.email,
        method: 'reset_code'
      }, true);

      const { password: _, ...userResponse } = user;
      res.json({ 
        success: true,
        message: 'TOTP reset successful - setup required',
        user: { ...userResponse, totpSecret: null },
        requiresTOTPSetup: true
      });
    } catch (error) {
      console.error('TOTP reset error:', error);
      res.status(500).json({ message: 'Reset failed' });
    }
  });

  // Admin authentication routes - Google Authenticator only

  app.post('/api/admin/auth/setup-totp', isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { secret, qrCode } = await generateTOTPSecret(user.id);
      
      // Store secret temporarily in session until verified
      (req.session as any).pendingTOTPSecret = secret;
      
      res.json({ 
        message: "TOTP setup initiated",
        qrCode,
        secret // For manual entry if QR code doesn't work
      });
    } catch (error) {
      console.error('TOTP setup error:', error);
      res.status(500).json({ message: "Failed to setup TOTP" });
    }
  });


  // Admin user endpoint - returns admin user data if authenticated
  app.get('/api/admin/auth/user', async (req, res) => {
    try {
      const session = req.session as any;
      
      // Check if admin is authenticated
      if (!session.adminAuthenticated && !session.pendingAdminLogin) {
        return res.status(401).json({ message: 'Admin not authenticated' });
      }
      
      // Get user ID from session
      const userId = session.userId || session.adminUserId;
      if (!userId) {
        return res.status(401).json({ message: 'No user ID in session' });
      }
      
      // Get user from database
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if user is admin
      if (user.role !== 'admin' && user.role !== 'team_member') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      // Get team member access level if exists
      const teamMember = await storage.getTeamMemberByUserId(userId);
      const accessLevel = teamMember?.accessLevel || session.accessLevel || 'full'; // Default to full for original admins
      const isOriginalAdmin = session.isOriginalAdmin || user.createdBy !== 'admin';
      
      // Return user data without password, include access level
      const { password, ...userResponse } = user;
      res.json({ 
        ...userResponse, 
        accessLevel,
        isOriginalAdmin
      });
    } catch (error) {
      console.error('Admin user fetch error:', error);
      res.status(500).json({ message: 'Failed to get admin user' });
    }
  });

  app.get('/api/admin/auth/status', async (req, res) => {
    try {
      const session = req.session as any;
      
      // For session-based admin auth (post-TOTP)
      if (session.adminAuthenticated || session.pendingAdminLogin) {
        const userId = session.userId || session.adminUserId;
        if (userId) {
          const user = await storage.getUser(userId);
          if (user && (user.role === 'admin' || user.role === 'team_member')) {
            return res.json({
              isAdmin: true,
              mfaVerified: session.mfaVerified || false,
              smsVerified: session.smsVerified || false,
              totpVerified: session.totpVerified || false,
              adminAuthenticated: session.adminAuthenticated || false,
              hasTOTPSetup: !!user.totpSecret,
              pendingAdminLogin: session.pendingAdminLogin || false
            });
          }
        }
      }
      
      // For passport-based auth (fallback)
      if (req.isAuthenticated && req.isAuthenticated()) {
        const user = await storage.getUser(req.user.claims.sub);
        
        if (!user || (user.role !== 'admin' && user.role !== 'team_member')) {
          return res.status(403).json({ message: "Admin access required" });
        }
        
        const session = req.session as any;
        
        res.json({
          isAdmin: user.role === 'admin' || user.role === 'team_member',
          mfaVerified: session.mfaVerified || false,
          smsVerified: session.smsVerified || false,
          totpVerified: session.totpVerified || false,
          adminAuthenticated: session.adminAuthenticated || false,
          hasTOTPSetup: !!user.totpSecret,
          pendingAdminLogin: session.pendingAdminLogin || false
        });
      } else {
        res.status(401).json({ message: 'Not authenticated' });
      }
    } catch (error) {
      console.error('Admin status error:', error);
      res.status(500).json({ message: "Failed to get admin status" });
    }
  });

  // Block dates endpoint for admin
  app.post('/api/admin/block-dates', isAuthenticated, requireMFAVerification, async (req, res) => {
    try {
      const { startDate, endDate, reason } = req.body;
      
      if (!startDate || !endDate || !reason) {
        return res.status(400).json({ message: "Start date, end date, and reason are required" });
      }

      // Create blocked booking entries for each date in the range
      const start = new Date(startDate);
      const end = new Date(endDate);
      const currentDate = new Date(start);

      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Create a blocked booking for this date
        await storage.createBooking({
          guestFirstName: 'Blocked',
          guestLastName: 'Period',
          guestEmail: 'admin@system.local',
          guestCountry: 'System',
          guestPhone: '000-000-0000',
          checkInDate: dateStr,
          checkOutDate: dateStr,
          guests: 0,
          paymentMethod: 'property',
          createdBy: 'admin',
          blockReason: reason,
          bookedForSelf: false
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      res.json({ message: "Dates blocked successfully" });
    } catch (error: any) {

      res.status(500).json({ message: "Failed to block dates" });
    }
  });

  // Manual booking endpoint for admin
  app.post('/api/admin/manual-booking', isAuthenticated, requireMFAVerification, async (req, res) => {
    try {
      const {
        guestFirstName,
        guestLastName,
        guestEmail,
        checkInDate,
        checkOutDate,
        guests,
        paymentMethod,
        customPrice
      } = req.body;

      if (!guestFirstName || !guestLastName || !guestEmail || !checkInDate || !checkOutDate) {
        return res.status(400).json({ message: "All guest details and dates are required" });
      }

      // Check availability
      const isAvailable = await storage.checkAvailability(checkInDate, checkOutDate);
      if (!isAvailable) {
        return res.status(400).json({ message: "Selected dates are not available" });
      }

      // Calculate pricing with custom price if provided
      const pricingData = await storage.calculateBookingPricing(
        checkInDate, 
        checkOutDate, 
        guests, 
        false, // no pet for manual bookings
        undefined // no referral code
      );

      // Override base price if custom price provided
      let finalTotalPrice = pricingData.totalPrice;
      if (customPrice && parseFloat(customPrice) > 0) {
        const customBasePrice = parseFloat(customPrice);
        const nightsTotal = customBasePrice * pricingData.totalNights;
        finalTotalPrice = nightsTotal + pricingData.cleaningFee + pricingData.serviceFee + pricingData.cityTax;
      }

      // Create the booking
      const booking = await storage.createBooking({
        guestFirstName,
        guestLastName,
        guestEmail,
        guestCountry: 'Admin Entry',
        guestPhone: '000-000-0000',
        checkInDate,
        checkOutDate,
        guests,
        paymentMethod: paymentMethod || 'property',
        createdBy: 'admin',
        bookedForSelf: false,
        hasPet: false
      });

      // Broadcast updates via WebSocket
      broadcastAnalyticsUpdate();
      broadcastToAdmins({
        type: 'new_booking',
        data: { confirmationNumber: booking.confirmationCode }
      });

      res.json({ 
        message: "Manual booking created successfully",
        booking,
        totalPrice: finalTotalPrice
      });
    } catch (error: any) {

      res.status(500).json({ message: "Failed to create manual booking" });
    }
  });

  // Local logout route - complete session reset with database cleanup
  app.post('/api/auth/logout', async (req, res) => {



    const sessionId = req.sessionID;
    
    // Clear the user immediately
    req.user = undefined;
    
    // Logout using passport first
    req.logout((err) => {
      if (err) {

      }

      // Destroy the session completely
      req.session.destroy(async (sessionErr) => {
        if (sessionErr) {

        }

        // Delete session from database directly as backup
        try {
          if (sessionId) {
            const { db } = await import('./db');
            const { sql } = await import('drizzle-orm');
            await db.execute(sql`DELETE FROM sessions WHERE sid = ${sessionId}`);

          }
        } catch (dbError) {

        }
        
        // Clear all possible cookie variations
        res.clearCookie('connect.sid', { path: '/' });
        res.clearCookie('connect.sid', { path: '/', domain: req.hostname });
        res.clearCookie('connect.sid', { path: '/', httpOnly: true });
        res.clearCookie('connect.sid', { path: '/', httpOnly: true, secure: true });

        // Set headers to prevent caching
        res.set({
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });

        res.json({ message: "Logout successful", cleared: true, sessionCleared: true });
      });
    });
  });

  // Logout redirect endpoint - complete session termination with logout tracking
  app.get('/api/auth/logout-redirect', async (req, res) => {




    const sessionId = req.sessionID;
    
    // Record this session as logged out
    try {
      // Get user ID from session with proper fallback
      let userId = 'unknown';
      if (req.user) {
        const user = req.user as any;
        userId = user.id || user.claims?.sub || 'unknown';
      }
      
      await db.insert(loggedOutSessions).values({
        sessionId: sessionId,
        userId: userId,
      });

    } catch (error) {

    }
    
    // Set logout flag in session before destroying
    (req.session as any).loggedOut = true;

    // Clear the user immediately
    req.user = undefined;

    try {
      // Delete session from database directly
      if (sessionId) {
        await db.execute(sql`DELETE FROM sessions WHERE sid = ${sessionId}`);

      }
    } catch (dbError) {

    }
    
    // Logout using passport
    req.logout((err) => {
      if (err) {

      }

      // Destroy the session completely
      req.session.destroy((sessionErr) => {
        if (sessionErr) {

        }

        // Clear all cookies with all possible variations
        const cookieOptions = [
          { path: '/' },
          { path: '/', domain: req.hostname },
          { path: '/', httpOnly: true },
          { path: '/', httpOnly: true, secure: true },
          { path: '/', httpOnly: true, secure: false },
          { path: '/', sameSite: 'lax' as const },
          { path: '/', sameSite: 'strict' as const },
        ];
        
        cookieOptions.forEach(options => {
          res.clearCookie('connect.sid', options);
        });

        // Set aggressive no-cache headers
        res.set({
          'Cache-Control': 'no-cache, no-store, must-revalidate, private, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Last-Modified': new Date(0).toUTCString(),
          'ETag': ''
        });

        // Redirect to homepage with cache busting

        res.redirect('/?logout=success&t=' + Date.now());
      });
    });
  });

  // Calculate booking pricing endpoint
  app.post('/api/bookings/calculate-pricing', async (req, res) => {
    try {
      const { checkInDate, checkOutDate, guests, hasPet, referralCode, promoCode, voucherCode } = req.body;
      
      if (!checkInDate || !checkOutDate || !guests) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const pricing = await storage.calculateBookingPricing(
        checkInDate,
        checkOutDate,
        parseInt(guests),
        Boolean(hasPet),
        referralCode || undefined,
        promoCode || undefined,
        voucherCode || undefined
      );

      res.json(pricing);
    } catch (error) {

      res.status(500).json({ message: "Failed to calculate pricing" });
    }
  });

  // Separate endpoint for blocking dates (administrative blocks)
  app.post("/api/block-dates", isAuthenticated, async (req, res) => {
    try {

      const { checkInDate, checkOutDate, blockReason } = req.body;
      
      if (!checkInDate || !checkOutDate || !blockReason) {

        return res.status(400).json({ message: "Missing required block information" });
      }
      
      // Create administrative block entry
      const blockData = {
        guestFirstName: "BLOCKED",
        guestLastName: blockReason,
        guestEmail: "system@blocked.com",
        guestCountry: "Administrative",
        guestPhone: "000-000-0000",
        checkInDate,
        checkOutDate,
        guests: 0,
        paymentMethod: "property" as const,
        hasPet: false,
        createdBy: "admin" as const,
        bookedForSelf: false,
        bookingSource: "blocked" as const,
        blockReason,
        totalPrice: 0,
      };

      const block = await storage.createBooking(blockData);

      res.json({ success: true, blockId: block.id });
    } catch (error: any) {

      res.status(400).json({ message: error.message || "Failed to block dates" });
    }
  });

  // Create comprehensive booking endpoint
  app.post('/api/bookings', async (req, res) => {
    try {

      const {
        guestFirstName,
        guestLastName,
        guestEmail,
        guestCountry,
        guestPhone,
        checkInDate,
        checkOutDate,
        guests,
        paymentMethod = 'online',
        hasPet = false,
        referralCode,
        promoCode,
        voucherCode,
        creditsUsed = 0,
        createdBy = 'guest',
        bookedForSelf = true
      } = req.body;

      // Validate required fields
      if (!guestFirstName || !guestLastName || !guestEmail || !guestCountry || !guestPhone || !checkInDate || !checkOutDate || !guests) {

        return res.status(400).json({ message: "Missing required booking information" });
      }

      // Check availability first
      const isAvailable = await storage.checkAvailability(checkInDate, checkOutDate);
      if (!isAvailable) {
        return res.status(400).json({ message: "Selected dates are not available" });
      }

      // Validate booking length (max 15 days)
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const totalNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      
      if (totalNights > 15) {
        return res.status(400).json({ message: "Maximum booking length is 15 days" });
      }

      if (totalNights < 1) {
        return res.status(400).json({ message: "Invalid booking dates" });
      }

      // Validate guest count
      if (guests < 1 || guests > 5) {
        return res.status(400).json({ message: "Guest count must be between 1 and 5" });
      }

      const booking = await storage.createBooking({
        guestFirstName,
        guestLastName,
        guestEmail,
        guestCountry,
        guestPhone,
        checkInDate,
        checkOutDate,
        guests: parseInt(guests),
        paymentMethod: paymentMethod as "online" | "property",
        hasPet,
        referralCode,
        promoCode,
        voucherCode,
        creditsUsed: creditsUsed ? parseFloat(creditsUsed) : 0,
        createdBy: createdBy as "admin" | "guest",
        bookedForSelf,
        userId: req.isAuthenticated() ? (req.user as any)?.claims?.sub || null : null
      });

      // Broadcast new booking via WebSocket
      broadcastToAdmins({
        type: 'new_booking',
        data: booking
      });

      res.status(201).json(booking);
    } catch (error) {

      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // Get booking by confirmation code
  app.get('/api/bookings/confirmation/:code', async (req, res) => {
    try {
      const { code } = req.params;
      const booking = await storage.getBookingByConfirmationCode(code);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(booking);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  // Temporary debug endpoint to check bookings
  app.get('/api/debug/bookings', async (req, res) => {
    try {
      const allBookings = await storage.getBookings();
      const summary = allBookings.map(b => ({
        id: b.id,
        confirmationCode: b.confirmationCode,
        status: b.status,
        guestEmail: b.guestEmail,
        guestFirstName: b.guestFirstName,
        guestLastName: b.guestLastName
      }));
      res.json({ total: allBookings.length, bookings: summary });
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Get booking dates for calendar (public endpoint for real-time availability)
  app.get('/api/bookings/dates', async (req, res) => {
    try {
      // Get all confirmed bookings for calendar availability
      const bookings = await storage.getBookings({ status: 'confirmed' });
      
      // Generate all blocked dates for each booking (check-in through check-out minus 1 day)
      const allBlockedDates: string[] = [];
      
      bookings.forEach(booking => {
        const checkIn = new Date(booking.checkInDate);
        const checkOut = new Date(booking.checkOutDate);
        
        // Block from check-in date up to (but not including) check-out date
        const currentDate = new Date(checkIn);
        while (currentDate < checkOut) {
          allBlockedDates.push(currentDate.toISOString().split('T')[0]);
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });
      
      // Return unique blocked dates using filter to remove duplicates
      const uniqueBlockedDates = allBlockedDates.filter((date, index, self) => 
        self.indexOf(date) === index
      );
      
      res.json(uniqueBlockedDates);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch booking dates" });
    }
  });

  // Get user's own bookings
  app.get('/api/user/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookings = await storage.getBookings({ userId });
      res.json(bookings);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Lookup booking by confirmation code and email (public endpoint)
  app.post('/api/bookings/lookup', async (req, res) => {
    try {
      const { confirmationCode, email } = req.body;
      
      if (!confirmationCode || !email) {
        return res.status(400).json({ message: "Confirmation code and email are required" });
      }

      const booking = await storage.getBookingByConfirmationCode(confirmationCode);
      
      if (!booking || booking.guestEmail.toLowerCase() !== email.toLowerCase()) {
        return res.status(404).json({ message: "Booking not found or email doesn't match" });
      }

      res.json(booking);
    } catch (error) {

      res.status(500).json({ message: "Failed to lookup booking" });
    }
  });

  // Associate booking with authenticated user account
  app.post('/api/bookings/associate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { bookingId } = req.body;
      
      if (!bookingId) {
        return res.status(400).json({ message: "Booking ID is required" });
      }

      // Get the booking to verify it exists
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check if booking is already associated with this user
      if (booking.userId === userId) {
        return res.status(400).json({ message: "Booking is already in your account" });
      }

      // Associate booking with user
      await storage.associateBookingWithUser(bookingId, userId);
      
      res.json({ message: "Booking added to your account successfully" });
    } catch (error) {

      res.status(500).json({ message: "Failed to add booking to account" });
    }
  });

  app.get('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const filters: any = {};
      if (user?.role === 'guest') {
        filters.userId = userId;
      }
      if (req.query.status) {
        filters.status = req.query.status as string;
      }
      const bookings = await storage.getBookings(filters);
      res.json(bookings);
    } catch (error) {
      console.error('Error in /api/bookings:', error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Calendar endpoint that includes both bookings AND blocks for display
  app.get('/api/bookings/calendar/:year/:month', async (req, res) => {
    try {
      const { year, month } = req.params;
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

      // Get ALL bookings for calendar display (including blocks)
      const allBookings = await storage.getBookingsByDateRange(startDate, endDate, true); // true = include blocks

      res.json(allBookings);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch calendar data" });
    }
  });

  // Get booking by ID for review verification (must come after specific routes like /dates, /calendar, etc.)
  app.get('/api/bookings/:id', async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);

      if (isNaN(bookingId)) {

        return res.status(400).json({ message: "Invalid booking ID" });
      }

      const booking = await storage.getBooking(bookingId);


      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(booking);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });


  // Get voucher usage data for a specific booking
  app.get('/api/bookings/:id/voucher-usage', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const bookingId = parseInt(req.params.id);
      if (isNaN(bookingId)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }

      const voucherUsage = await storage.getVoucherUsageByBookingId(bookingId);
      res.json(voucherUsage);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch voucher usage" });
    }
  });

  // Property images routes
  app.get('/api/property-images', async (req, res) => {
    try {
      const images = await storage.getPropertyImages();
      res.json(images);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch property images" });
    }
  });

  app.post('/api/property-images', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const imageData = insertPropertyImageSchema.parse(req.body);
      const image = await storage.addPropertyImage(imageData);
      res.json(image);
    } catch (error: any) {

      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/property-images/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      await storage.deletePropertyImage(parseInt(id));
      res.json({ success: true });
    } catch (error) {

      res.status(500).json({ message: "Failed to delete property image" });
    }
  });

  // Amenities routes
  app.get('/api/amenities', async (req, res) => {
    try {
      const amenities = await storage.getAmenities();
      res.json(amenities);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch amenities" });
    }
  });

  app.post('/api/amenities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const amenityData = insertAmenitySchema.parse(req.body);
      const amenity = await storage.addAmenity(amenityData);
      res.json(amenity);
    } catch (error: any) {

      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/amenities/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      await storage.deleteAmenity(parseInt(id));
      res.json({ success: true });
    } catch (error) {

      res.status(500).json({ message: "Failed to delete amenity" });
    }
  });

  // Reviews routes
  app.get('/api/reviews', async (req, res) => {
    try {
      const reviews = await storage.getReviews();
      res.json(reviews);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get('/api/reviews/stats', async (req, res) => {
    try {
      const stats = await storage.getReviewStats();
      res.json(stats);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch review stats" });
    }
  });

  // Get all reviews for admin (including pending and rejected)
  app.get('/api/reviews/all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const reviews = await storage.getAllReviews();
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch all reviews" });
    }
  });

  app.post('/api/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const reviewData = insertReviewSchema.parse(req.body);
      const review = await storage.addReview({
        ...reviewData,
        userId: req.user.claims.sub,
      });
      res.json(review);
    } catch (error: any) {

      res.status(400).json({ message: error.message });
    }
  });

  // Guest review submission endpoint (no authentication required)
  app.post('/api/reviews/guest', async (req, res) => {
    try {
      const reviewData = guestReviewSchema.parse(req.body);
      
      // Verify the booking exists and is checked out
      const booking = await storage.getBookingById(reviewData.bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Verify the guest email matches the booking
      if (booking.guestEmail !== reviewData.guestEmail) {
        return res.status(403).json({ message: "Email does not match booking" });
      }
      
      // Verify the booking is checked out
      if (booking.status !== 'checked_out') {
        return res.status(400).json({ message: "Only checked-out guests can leave reviews" });
      }
      
      // Check if guest has already reviewed this booking
      const existingReview = await storage.getReviewByBookingAndEmail(reviewData.bookingId, reviewData.guestEmail);
      if (existingReview) {
        return res.status(400).json({ message: "You have already reviewed this booking" });
      }
      
      // Create the review (pending admin approval)
      const review = await storage.addGuestReview({
        ...reviewData,
        isVisible: false,
        isApproved: false,
      });
      
      res.json({ 
        message: "Review submitted successfully and is pending approval",
        reviewId: review.id 
      });
    } catch (error: any) {

      res.status(400).json({ message: error.message });
    }
  });

  // Admin approve review endpoint
  app.patch('/api/reviews/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const reviewId = parseInt(req.params.id);
      const review = await storage.approveReview(reviewId);
      
      // Broadcast review update via WebSocket
      broadcastReviewUpdate();
      
      res.json(review);
    } catch (error: any) {

      res.status(500).json({ message: "Failed to approve review" });
    }
  });

  // Admin reject review endpoint
  app.patch('/api/reviews/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const reviewId = parseInt(req.params.id);
      const { reason } = req.body;
      const review = await storage.rejectReview(reviewId, reason);
      
      // Broadcast review update via WebSocket
      broadcastReviewUpdate();
      
      res.json(review);
    } catch (error: any) {

      res.status(500).json({ message: "Failed to reject review" });
    }
  });

  // Get pending reviews for admin
  app.get('/api/reviews/pending', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const pendingReviews = await storage.getPendingReviews();
      res.json(pendingReviews);
    } catch (error: any) {

      res.status(500).json({ message: "Failed to fetch pending reviews" });
    }
  });

  // Check if booking has a review
  app.get('/api/reviews/check/:bookingId', async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      
      if (isNaN(bookingId)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }

      const existingReview = await storage.getReviewByBookingId(bookingId);
      res.json({ hasReview: !!existingReview });
    } catch (error: any) {

      res.status(500).json({ message: "Failed to check review status" });
    }
  });

  // Delete review endpoint
  app.delete('/api/reviews/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const reviewId = parseInt(req.params.id);
      await storage.deleteReview(reviewId);
      res.json({ message: "Review deleted successfully" });
    } catch (error: any) {

      res.status(500).json({ message: "Failed to delete review" });
    }
  });

  // Messages routes
  app.get('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages', async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.addMessage({
        ...messageData,
        userId: req.isAuthenticated() ? (req.user as any)?.claims?.sub : null,
      });

      // Broadcast new message via WebSocket
      broadcastToAdmins({
        type: 'new_message',
        data: message
      });

      res.json(message);
    } catch (error: any) {

      res.status(400).json({ message: error.message });
    }
  });

  app.patch('/api/messages/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.markMessageAsRead(parseInt(id));
      res.json({ success: true });
    } catch (error) {

      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  app.put('/api/messages/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const messageId = parseInt(req.params.id);
      await storage.markMessageAsRead(messageId);
      res.json({ message: "Message marked as read" });
    } catch (error) {

      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Admin booking status update with enhanced functionality
  app.patch('/api/bookings/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const bookingId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // Get booking to check its date
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Security restriction: Only allow status changes for current or past bookings
      const today = new Date().toISOString().split('T')[0];
      if (booking.checkInDate > today && (status === 'checked_in' || status === 'no_show')) {
        return res.status(400).json({ 
          message: "Status changes for check-in and no-show can only be made for current or past bookings, not future bookings." 
        });
      }
      await storage.updateBookingStatus(bookingId, status);
      
      // Award referral credits when admin confirms checkout of a referral booking
      if (status === 'checked_out' && booking.referredByUserId) {
        try {
          // Verify the referrer exists in the database
          const existingReferrer = await storage.getUser(booking.referredByUserId);
          if (existingReferrer) {
            // Award 5€ credit per night to the referrer
            const creditAmount = booking.totalNights * 5; // 5€ per night
            await storage.addUserCredits(booking.referredByUserId, creditAmount);
            
            console.log(`Awarded ${creditAmount}€ referral credits to user ${booking.referredByUserId} for booking ${bookingId}`);
            
            // Update credit expiry - reset 120 days from now
            await storage.updateUserCreditExpiry(booking.referredByUserId);
            
            // Broadcast credit award notification
            broadcastToAdmins({
              type: 'referral_credit_awarded',
              data: { 
                bookingId, 
                referredByUserId: booking.referredByUserId, 
                creditAmount,
                totalNights: booking.totalNights,
                referrerEmail: existingReferrer.email,
                referrerName: `${existingReferrer.firstName} ${existingReferrer.lastName}`
              }
            });
            
            // Broadcast celebration notification to the referrer
            broadcastCreditEarned(booking.referredByUserId, creditAmount, existingReferrer, booking);
          }
        } catch (error) {
          console.error('Failed to award referral credits:', error);
          // Don't fail the status update if credit awarding fails
        }
      }

      // Broadcast status update via WebSocket
      broadcastToAdmins({
        type: 'booking_status_updated',
        data: { bookingId, status }
      });

      res.json({ message: "Booking status updated successfully", bookingId, status });
    } catch (error) {

      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Update payment collection information
  app.patch('/api/bookings/:id/payment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const bookingId = parseInt(req.params.id);
      const { paymentReceived, paymentReceivedBy } = req.body;
      
      if (typeof paymentReceived !== 'boolean') {
        return res.status(400).json({ message: "paymentReceived must be a boolean" });
      }

      // Get booking to verify it exists
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Update payment collection information
      await storage.updateBookingPaymentInfo(bookingId, {
        paymentReceived,
        paymentReceivedBy: paymentReceived ? paymentReceivedBy : null,
        paymentReceivedAt: paymentReceived ? new Date().toISOString() : null
      });
      
      // Broadcast payment update via WebSocket
      broadcastToAdmins({
        type: 'booking_payment_updated',
        data: { bookingId, paymentReceived, paymentReceivedBy }
      });

      res.json({ 
        message: "Payment information updated successfully", 
        bookingId, 
        paymentReceived,
        paymentReceivedBy 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update payment information" });
    }
  });

  // Update city tax collection information
  app.patch('/api/bookings/:id/city-tax', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const bookingId = parseInt(req.params.id);
      const { cityTaxCollected, cityTaxCollectedBy } = req.body;
      
      if (typeof cityTaxCollected !== 'boolean') {
        return res.status(400).json({ message: "cityTaxCollected must be a boolean" });
      }

      // Get booking to verify it exists
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Update city tax collection information
      await storage.updateBookingCityTaxInfo(bookingId, {
        cityTaxCollected,
        cityTaxCollectedBy: cityTaxCollected ? cityTaxCollectedBy : null,
        cityTaxCollectedAt: cityTaxCollected ? new Date().toISOString() : null
      });
      
      // Broadcast city tax update via WebSocket
      broadcastToAdmins({
        type: 'booking_city_tax_updated',
        data: { bookingId, cityTaxCollected, cityTaxCollectedBy }
      });

      res.json({ 
        message: "City tax information updated successfully", 
        bookingId, 
        cityTaxCollected,
        cityTaxCollectedBy 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update city tax information" });
    }
  });

  // Booking postponement endpoint
  app.patch('/api/bookings/:id/postpone', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const bookingId = parseInt(req.params.id);
      const { newCheckInDate, newCheckOutDate, newCheckInTime, newCheckOutTime } = req.body;
      
      if (!newCheckInDate || !newCheckOutDate) {
        return res.status(400).json({ message: "New check-in and check-out dates are required" });
      }

      // Get the original booking to calculate new city tax
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Calculate new city tax based on new dates
      const originalCheckIn = new Date(booking.checkInDate);
      const originalCheckOut = new Date(booking.checkOutDate);
      const newCheckIn = new Date(newCheckInDate);
      const newCheckOut = new Date(newCheckOutDate);
      
      const originalNights = Math.ceil((originalCheckOut.getTime() - originalCheckIn.getTime()) / (1000 * 60 * 60 * 24));
      const newNights = Math.ceil((newCheckOut.getTime() - newCheckIn.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate new city tax (€4 per person per night, max 5 nights)
      const maxTaxNights = Math.min(newNights, 5);
      const newCityTax = booking.guests * 4 * maxTaxNights;

      // Update booking with new dates and recalculated city tax
      await storage.postponeBooking(bookingId, {
        newCheckInDate,
        newCheckOutDate,
        newCheckInTime: newCheckInTime || "15:00",
        newCheckOutTime: newCheckOutTime || "10:00",
        newCityTax
      });
      
      // Broadcast postponement via WebSocket
      broadcastToAdmins({
        type: 'booking_postponed',
        data: { bookingId, newCheckInDate, newCheckOutDate, newCityTax }
      });

      res.json({ 
        message: "Booking postponed successfully", 
        bookingId, 
        newCheckInDate, 
        newCheckOutDate,
        newCityTax,
        originalNights,
        newNights
      });
    } catch (error) {

      res.status(500).json({ message: "Failed to postpone booking" });
    }
  });

  // Public pricing endpoint for frontend display
  app.get('/api/pricing', async (req, res) => {
    try {
      const settings = await storage.getPricingSettings();
      
      if (settings) {
        // Convert decimal strings to numbers for frontend
        const pricingData = {
          basePrice: parseFloat(settings.basePrice),
          cleaningFee: parseFloat(settings.cleaningFee),
          petFee: parseFloat(settings.petFee),
          discountWeekly: settings.discountWeekly,
          discountMonthly: settings.discountMonthly
        };
        res.json(pricingData);
      } else {
        // Provide default values if no settings exist
        res.json({
          basePrice: 110.50,
          cleaningFee: 25.00,
          petFee: 25.00,
          discountWeekly: 5,
          discountMonthly: 10
        });
      }
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch pricing" });
    }
  });

  // Pricing Intelligence API - Real analysis based on booking data
  app.get('/api/pricing-intelligence', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get current pricing settings
      const pricingSettings = await storage.getPricingSettings();
      const currentBasePrice = parseFloat(pricingSettings?.basePrice || "110");
      
      // Get all bookings for analysis
      const allBookings = await storage.getBookings();
      
      // Get last 30 days of bookings
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentBookings = allBookings.filter(booking => 
        booking.createdAt && new Date(booking.createdAt) >= thirtyDaysAgo && 
        booking.status !== 'cancelled'
      );
      
      // Calculate metrics
      const totalBookings = recentBookings.length;
      const totalRevenue = recentBookings.reduce((sum, booking) => sum + Number(booking.totalPrice), 0);
      const avgRevenuePerBooking = totalBookings > 0 ? totalRevenue / totalBookings : 0;
      
      // Calculate occupancy rate (rough estimate)
      const confirmedBookings = recentBookings.filter(b => 
        b.status && ['confirmed', 'checked_in', 'checked_out'].includes(b.status)
      );
      const occupancyRate = totalBookings > 0 ? (confirmedBookings.length / totalBookings) * 100 : 0;
      
      // Calculate average price per night from recent bookings
      const avgPriceFromBookings = recentBookings.length > 0 
        ? recentBookings.reduce((sum, booking) => {
            const nights = Math.ceil((new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24));
            return sum + (Number(booking.basePrice) / Math.max(nights, 1));
          }, 0) / recentBookings.length
        : currentBasePrice;
      
      // Pricing analysis logic
      let pricingStatus = 'optimal';
      let recommendation = '';
      let confidenceLevel = 'high';
      
      if (occupancyRate > 85) {
        pricingStatus = 'underpriced';
        recommendation = 'High demand detected. Consider increasing prices by 10-15%.';
        confidenceLevel = 'high';
      } else if (occupancyRate < 30) {
        pricingStatus = 'overpriced';
        recommendation = 'Low booking rate suggests pricing may be too high. Consider a 5-10% reduction.';
        confidenceLevel = 'medium';
      } else if (occupancyRate >= 60 && occupancyRate <= 85) {
        pricingStatus = 'optimal';
        recommendation = 'Current pricing appears well-balanced for market demand.';
        confidenceLevel = 'high';
      } else {
        pricingStatus = 'moderate';
        recommendation = 'Monitor booking trends and consider minor adjustments.';
        confidenceLevel = 'medium';
      }
      
      // Seasonal analysis
      const currentMonth = new Date().getMonth();
      const peakMonths = [5, 6, 7, 11]; // June, July, August, December
      const isPeakSeason = peakMonths.includes(currentMonth);
      
      // Revenue optimization suggestions
      let revenueOptimization = '';
      if (isPeakSeason && pricingStatus !== 'overpriced') {
        revenueOptimization = 'Peak season detected. Consider implementing weekend premiums.';
      } else if (!isPeakSeason && pricingStatus === 'optimal') {
        revenueOptimization = 'Off-peak period. Consider promotional pricing to boost bookings.';
      } else {
        revenueOptimization = 'Monitor competitor pricing and adjust accordingly.';
      }
      
      // Quick action recommendations
      const quickActions = [];
      if (pricingStatus === 'underpriced') {
        quickActions.push({ label: '+15% Increase', percentage: 15, reasoning: 'High demand' });
        quickActions.push({ label: '+10% Increase', percentage: 10, reasoning: 'Conservative boost' });
      } else if (pricingStatus === 'overpriced') {
        quickActions.push({ label: '-10% Decrease', percentage: -10, reasoning: 'Boost bookings' });
        quickActions.push({ label: '-5% Decrease', percentage: -5, reasoning: 'Minor adjustment' });
      } else {
        quickActions.push({ label: '+5% Test', percentage: 5, reasoning: 'Market test' });
        quickActions.push({ label: '-3% Promo', percentage: -3, reasoning: 'Promotional rate' });
      }
      
      const intelligence = {
        currentBasePrice,
        pricingStatus,
        recommendation,
        confidenceLevel,
        revenueOptimization,
        metrics: {
          totalBookings,
          totalRevenue,
          avgRevenuePerBooking,
          occupancyRate: Math.round(occupancyRate),
          avgPriceFromBookings: Math.round(avgPriceFromBookings * 100) / 100
        },
        quickActions,
        isPeakSeason,
        analysisDate: new Date().toISOString()
      };
      
      res.json(intelligence);
    } catch (error) {

      res.status(500).json({ message: "Failed to generate pricing intelligence" });
    }
  });

  // Pricing settings routes - public for basic pricing, admin for full access
  app.get('/api/pricing-settings', async (req: any, res) => {
    try {
      // Get pricing settings from database
      const settings = await storage.getPricingSettings();
      
      if (settings) {
        // Check if user is authenticated and admin for full access
        const isAdmin = req.user && req.isAuthenticated() && req.user.claims?.sub;
        let user = null;
        
        if (isAdmin) {
          try {
            user = await storage.getUser(req.user.claims.sub);
          } catch (error) {
            // If user fetch fails, treat as non-admin
          }
        }
        
        // Convert decimal strings to numbers for frontend
        const pricingData = {
          basePrice: parseFloat(settings.basePrice),
          cleaningFee: parseFloat(settings.cleaningFee),
          petFee: parseFloat(settings.petFee),
          discountWeekly: settings.discountWeekly,
          discountMonthly: settings.discountMonthly
        };
        
        // For admin users, return full data
        if (user?.role === 'admin' || user?.role === 'team_member') {
          res.json(pricingData);
        } else {
          // For public access, return basic pricing info
          res.json({
            basePrice: pricingData.basePrice,
            cleaningFee: pricingData.cleaningFee,
            petFee: pricingData.petFee,
            discountWeekly: pricingData.discountWeekly,
            discountMonthly: pricingData.discountMonthly
          });
        }
      } else {
        // Provide default values if no settings exist
        res.json({
          basePrice: 110,
          cleaningFee: 25,
          petFee: 25,
          discountWeekly: 5,
          discountMonthly: 10
        });
      }
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch pricing settings" });
    }
  });

  app.put('/api/pricing-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin' && user?.role !== 'team_member') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { basePrice, cleaningFee, petFee, discountWeekly, discountMonthly } = req.body;
      
      // Validate input data
      if (basePrice === undefined || basePrice === null || 
          cleaningFee === undefined || cleaningFee === null || 
          petFee === undefined || petFee === null ||
          typeof discountWeekly !== 'number' || typeof discountMonthly !== 'number') {
        return res.status(400).json({ message: "Invalid pricing data provided" });
      }
      
      // Validate price ranges (allow 0 but not negative)
      if (basePrice < 0 || cleaningFee < 0 || petFee < 0 || 
          discountWeekly < 0 || discountMonthly < 0 ||
          discountWeekly > 100 || discountMonthly > 100) {
        return res.status(400).json({ message: "Invalid price or discount values" });
      }
      
      // Warn about unusual pricing
      if (basePrice === 0) {

      }

      // Convert numbers to decimal strings for database storage
      const settingsData = {
        basePrice: Number(basePrice).toFixed(2),
        cleaningFee: Number(cleaningFee).toFixed(2),
        petFee: Number(petFee).toFixed(2),
        discountWeekly: Number(discountWeekly),
        discountMonthly: Number(discountMonthly)
      };

      // Update pricing settings in database
      const updatedSettings = await storage.updatePricingSettings(settingsData);

      // Convert back to numbers for response
      res.json({ 
        message: "Pricing settings updated successfully",
        basePrice: parseFloat(updatedSettings.basePrice),
        cleaningFee: parseFloat(updatedSettings.cleaningFee),
        petFee: parseFloat(updatedSettings.petFee),
        discountWeekly: updatedSettings.discountWeekly,
        discountMonthly: updatedSettings.discountMonthly
      });
    } catch (error) {


      res.status(500).json({
        message: "Internal server error",
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      });
    }
  });

  app.get('/api/messages/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const count = await storage.getUnreadMessagesCount();
      res.json({ count });
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch unread messages count" });
    }
  });

  // Promotions routes
  app.get('/api/promotions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const promotions = await storage.getPromotions();
      res.json(promotions);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch promotions" });
    }
  });

  app.get('/api/promotions/active', async (req, res) => {
    try {
      const activePromotions = await storage.getActivePromotions();
      res.json(activePromotions);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch active promotions" });
    }
  });

  // Get current promotion pricing effect
  app.get('/api/promotions/current-effect', async (req, res) => {
    try {
      const activePromotions = await storage.getActivePromotions();
      
      if (activePromotions.length === 0) {
        return res.json({ 
          hasActivePromotion: false,
          promotionName: null,
          discountPercentage: 0 
        });
      }

      // Get the best (highest discount) promotion
      const bestPromotion = activePromotions.reduce((best, current) => 
        current.discountPercentage > best.discountPercentage ? current : best
      );

      res.json({
        hasActivePromotion: true,
        promotionName: bestPromotion.name,
        discountPercentage: bestPromotion.discountPercentage,
        tag: bestPromotion.tag,
        description: bestPromotion.description
      });
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch promotion effect" });
    }
  });

  app.post('/api/promotions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Validate required fields
      const { name, tag, discountPercentage, startDate, endDate, description } = req.body;


      if (!name || !tag || !discountPercentage || !startDate || !endDate) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      if (start >= end) {
        return res.status(400).json({ message: "End date must be after start date" });
      }

      const promotionData = {
        name,
        tag,
        discountPercentage: parseInt(discountPercentage),
        startDate: start,
        endDate: end,
        description: description || "",
        isActive: req.body.isActive === true || req.body.isActive === 'true',
      };

      const promotion = await storage.addPromotion(promotionData);
      res.json(promotion);
    } catch (error) {

      // Check if it's our custom error about active promotions
      if (error instanceof Error && error.message.includes("Cannot add new promotion while another promotion is active")) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create promotion" });
      }
    }
  });

  app.put('/api/promotions/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      const { isActive } = req.body;
      
      await storage.updatePromotionStatus(id, isActive);
      res.json({ message: "Promotion status updated successfully" });
    } catch (error) {

      // Check if it's our custom error about active promotions
      if (error instanceof Error && error.message.includes("Cannot activate promotion")) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to update promotion status" });
      }
    }
  });

  app.delete('/api/promotions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      await storage.deletePromotion(id);
      res.json({ message: "Promotion deleted successfully" });
    } catch (error) {

      res.status(500).json({ message: "Failed to delete promotion" });
    }
  });

  // Promo codes routes
  app.get('/api/promo-codes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const promoCodes = await storage.getPromoCodes();
      res.json(promoCodes);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch promo codes" });
    }
  });

  app.post('/api/promo-codes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Validate required fields
      const { code, discountType, discountValue, startDate, endDate, description, usageLimit, minOrderAmount, maxDiscountAmount } = req.body;
      
      if (!code || !discountType || !discountValue || !startDate || !endDate) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start >= end) {
        return res.status(400).json({ message: "End date must be after start date" });
      }

      const promoCodeData = {
        code: code.toUpperCase(),
        discountType,
        discountValue: discountValue.toString(),
        startDate: start,
        endDate: end,
        description: description || "",
        usageLimit,
        minOrderAmount,
        maxDiscountAmount,
        isActive: req.body.isActive !== false,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const promoCode = await storage.createPromoCode(promoCodeData);
      res.json(promoCode);
    } catch (error) {

      res.status(500).json({ message: "Failed to create promo code" });
    }
  });

  app.delete('/api/promo-codes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      await storage.deletePromoCode(id);
      res.json({ message: "Promo code deleted successfully" });
    } catch (error) {

      res.status(500).json({ message: "Failed to delete promo code" });
    }
  });

  // Validate promo code endpoint
  app.post('/api/promo-codes/validate', async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ 
          valid: false, 
          message: "Promo code is required" 
        });
      }

      const promoCode = await storage.validatePromoCode(code.toUpperCase());
      
      if (!promoCode) {
        return res.json({ 
          valid: false, 
          message: "Invalid promo code" 
        });
      }

      res.json({
        valid: true,
        promoCode: {
          id: promoCode.id,
          code: promoCode.code,
          discountType: promoCode.discountType,
          discountValue: Number(promoCode.discountValue),
          description: promoCode.description,
          minOrderAmount: promoCode.minOrderAmount,
          maxDiscountAmount: promoCode.maxDiscountAmount
        },
        message: `${promoCode.discountType === 'percentage' ? promoCode.discountValue + '%' : '€' + promoCode.discountValue} discount applied`
      });
    } catch (error) {

      res.status(500).json({ 
        valid: false, 
        message: "Failed to validate promo code" 
      });
    }
  });

  // Get promo code usage details endpoint
  app.get('/api/promo-codes/:id/usage', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      const result = await storage.getPromoCodeWithUsage(id);
      
      if (!result) {
        return res.status(404).json({ message: "Promo code not found" });
      }

      res.json(result);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch promo code usage" });
    }
  });

  // Hero images routes
  app.get('/api/hero-images', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const images = await storage.getHeroImages();
      res.json(images);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch hero images" });
    }
  });

  app.get('/api/hero-images/active', async (req, res) => {
    try {
      const activeImages = await storage.getActiveHeroImages();
      res.json(activeImages);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch active hero images" });
    }
  });

  // File upload endpoint for hero images
  app.post('/api/hero-images/upload', isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No image file uploaded" });
      }

      const { title, alt, position, isActive, displayOrder } = req.body;
      
      if (!title || !alt || !position) {
        return res.status(400).json({ message: "Title, alt text, and position are required" });
      }

      // Create the image URL for serving
      const imageUrl = `/uploads/${req.file.filename}`;
      
      const imageData = {
        url: imageUrl,
        title,
        alt,
        position,
        isActive: isActive === 'true',
        displayOrder: parseInt(displayOrder) || 0,
      };

      const image = await storage.addHeroImage(imageData);
      res.json(image);
    } catch (error) {

      // Clean up uploaded file if database save failed
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {

        }
      }
      
      res.status(500).json({ message: "Failed to upload hero image" });
    }
  });

  app.post('/api/hero-images', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { url, alt, title, position } = req.body;
      
      if (!url || !alt || !title || !position) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const imageData = {
        url,
        alt,
        title,
        position,
        isActive: req.body.isActive !== false,
        displayOrder: req.body.displayOrder || 0,
      };

      const image = await storage.addHeroImage(imageData);
      res.json(image);
    } catch (error) {

      res.status(500).json({ message: "Failed to create hero image" });
    }
  });

  // Batch reorder hero images (must come before /:id routes)
  app.put("/api/hero-images/reorder", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { updates } = req.body;

      if (!Array.isArray(updates)) {
        return res.status(400).json({ message: "Updates must be an array" });
      }

      // Update each image's display order
      for (const update of updates) {
        const { id, displayOrder } = update;

        if (typeof id === 'number' && typeof displayOrder === 'number' && !isNaN(id) && !isNaN(displayOrder)) {
          await storage.updateHeroImageOrder(id, displayOrder);
        } else {

        }
      }

      res.json({ message: "Image order updated successfully" });
    } catch (error: any) {

      res.status(500).json({ message: "Failed to reorder images" });
    }
  });

  app.put('/api/hero-images/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      await storage.updateHeroImage(id, req.body);
      res.json({ message: "Hero image updated successfully" });
    } catch (error) {

      res.status(500).json({ message: "Failed to update hero image" });
    }
  });

  app.delete('/api/hero-images/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteHeroImage(id);
      res.json({ message: "Hero image deleted successfully" });
    } catch (error) {

      res.status(500).json({ message: "Failed to delete hero image" });
    }
  });

  // About content routes
  app.get('/api/about-content', async (req, res) => {
    try {
      const content = await storage.getAboutContent();
      res.json(content);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch about content" });
    }
  });

  // Analytics routes
  app.get('/api/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Activity timeline routes
  app.get('/api/activity-timeline', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const timeline = await storage.getActivityTimeline();
      res.json(timeline);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch activity timeline" });
    }
  });

  app.post('/api/activity-timeline', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const timelineData = req.body;
      const timeline = await storage.addActivityTimeline(timelineData);
      res.json(timeline);
    } catch (error: any) {

      res.status(400).json({ message: error.message });
    }
  });

  // Users management routes
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const usersWithDetails = await storage.getAllUsersWithDetails();
      res.json(usersWithDetails);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin block dates route
  app.post('/api/admin/block-dates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { startDate, endDate, reason } = req.body;
      
      if (!startDate || !endDate || !reason) {
        return res.status(400).json({ message: "Start date, end date, and reason are required" });
      }

      // Create blocked booking entry
      const blockedBooking = await storage.createBooking({
        guestFirstName: 'Blocked',
        guestLastName: 'Period',
        guestEmail: 'admin@allarco.com',
        guestCountry: 'IT',
        guestPhone: '+390000000000',
        checkInDate: startDate,
        checkOutDate: endDate,
        guests: 1,
        paymentMethod: 'property',
        createdBy: 'admin',
        userId: userId,
        referralCode: undefined
      });

      // Broadcast to all connected clients
      broadcastToAdmins({
        type: 'dates_blocked',
        data: {
          startDate,
          endDate,
          reason,
          booking: blockedBooking
        }
      });

      res.json({ success: true, booking: blockedBooking });
    } catch (error) {

      res.status(500).json({ message: "Failed to block dates" });
    }
  });

  // Enhanced Stripe payment routes
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, bookingId, type = 'full_payment' } = req.body;
      
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "eur",
        metadata: {
          bookingId: bookingId?.toString() || '',
          type
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {

      res.status(500).json({ 
        message: 'Failed to create payment intent: ' + error.message 
      });
    }
  });

  // Card authorization for property payment
  app.post('/api/authorize-card', async (req, res) => {
    try {
      const { bookingId, amount = 100 } = req.body;
      
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // €100 authorization in cents
        currency: 'eur',
        capture_method: 'manual', // Only authorize, don't capture
        metadata: {
          bookingId: bookingId?.toString() || '',
          type: 'authorization'
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        authorizationId: paymentIntent.id,
        amount: amount
      });
    } catch (error: any) {

      res.status(500).json({ 
        message: 'Failed to authorize card: ' + error.message 
      });
    }
  });

  app.post("/api/create-card-authorization", async (req, res) => {
    try {
      const { amount } = req.body;
      
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "eur",
        capture_method: "manual", // This creates an authorization
        automatic_payment_methods: {
          enabled: true,
        },
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating card authorization: " + error.message });
    }
  });

  // Stripe webhook handler for payment confirmation
  app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }
      
      event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {

      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle payment success events
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as any;
      const bookingId = paymentIntent.metadata.bookingId;
      
      if (bookingId && paymentIntent.metadata.type === 'full_payment') {
        try {
          // Confirm the booking when payment succeeds
          await storage.confirmBooking(parseInt(bookingId));

        } catch (error) {

        }
      }
    }

    res.json({ received: true });
  });

  // Payment success confirmation endpoint (client-side confirmation)
  app.post('/api/confirm-payment', async (req, res) => {
    try {
      const { paymentIntentId, bookingId } = req.body;
      
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }
      
      // Verify payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded' && bookingId) {
        await storage.confirmBooking(bookingId);
        res.json({ success: true, message: 'Booking confirmed' });
      } else {
        res.status(400).json({ success: false, message: 'Payment not completed' });
      }
    } catch (error: any) {

      res.status(500).json({ success: false, message: 'Failed to confirm payment' });
    }
  });

  const httpServer = createServer(app);

  // Periodic cleanup of abandoned pending bookings (every 10 minutes)
  setInterval(async () => {
    try {
      await storage.cleanupAbandonedBookings();

    } catch (error) {

    }
  }, 10 * 60 * 1000); // 10 minutes

  // WebSocket health check endpoint
  app.get('/api/ws/health', (req, res) => {
    res.json({ 
      status: 'healthy',
      connections: adminConnections?.size || 0,
      timestamp: new Date().toISOString()
    });
  });

  // WebSocket setup for real-time updates


  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const adminConnections = new Set<WebSocket>();

  wss.on('connection', (ws, req) => {
    console.log('✅ New WebSocket connection established from:', req.socket.remoteAddress);

    // Add to admin connections (in a real app, verify admin role)
    adminConnections.add(ws);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection_established',
      message: 'WebSocket connected successfully',
      timestamp: new Date().toISOString()
    }));
    
    ws.on('close', (code, reason) => {




      adminConnections.delete(ws);
    });
    
    ws.on('error', (error) => {


      adminConnections.delete(ws);
    });
    
    ws.on('message', (message) => {


    });
  });
  
  wss.on('error', (error) => {


  });


  // Edit booking dates
  app.put('/api/bookings/:id/edit-dates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const bookingId = parseInt(req.params.id);
      const { newCheckInDate, newCheckOutDate } = req.body;
      
      if (!newCheckInDate || !newCheckOutDate) {
        return res.status(400).json({ message: "New check-in and check-out dates are required" });
      }

      // Check if new dates are available
      const conflictingBookings = await storage.checkBookingConflicts(newCheckInDate, newCheckOutDate, bookingId);
      
      if (conflictingBookings.length > 0) {
        return res.status(400).json({ 
          message: "Selected dates are not available",
          conflicts: conflictingBookings 
        });
      }

      const oldBooking = await storage.getBooking(bookingId);
      if (!oldBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      await storage.updateBookingDates(bookingId, newCheckInDate, newCheckOutDate);
      
      // Add activity timeline entry
      await storage.addActivityTimeline({
        actionType: 'booking_dates_changed',
        description: `Booking dates changed from ${oldBooking.checkInDate} - ${oldBooking.checkOutDate} to ${newCheckInDate} - ${newCheckOutDate}`,
        guestName: `${oldBooking.guestFirstName} ${oldBooking.guestLastName}`,
        bookingId: bookingId,
        totalPrice: oldBooking.totalPrice.toString(),
        guestEmail: oldBooking.guestEmail,
        checkInDate: newCheckInDate,
        checkOutDate: newCheckOutDate
      });

      res.json({ message: "Booking dates updated successfully" });
    } catch (error) {

      res.status(500).json({ message: "Failed to edit booking dates" });
    }
  });

  // Delete booking (cancel and free dates)
  app.delete('/api/bookings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Update booking status to cancelled instead of deleting
      await storage.updateBookingStatus(bookingId, 'cancelled');
      
      // Add activity timeline entry
      await storage.addActivityTimeline({
        actionType: 'booking_cancelled',
        description: `Booking #${bookingId} cancelled by admin - dates now available for new bookings`,
        guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
        bookingId: bookingId,
        totalPrice: booking.totalPrice.toString(),
        guestEmail: booking.guestEmail,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate
      });

      res.json({ message: "Booking cancelled successfully - dates are now available" });
    } catch (error) {

      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // ====================== VOUCHER ENDPOINTS ======================
  
  // Test endpoint to create sample vouchers (temporary)
  app.post('/api/vouchers/create-test', async (req, res) => {
    try {

      // Create WELCOME20 voucher
      const testVoucher1 = {
        code: 'WELCOME20',
        discountType: 'percentage' as const,
        discountValue: '20',
        description: 'Welcome discount for new customers',
        usageLimit: 2,
        usageCount: 0,
        minBookingAmount: '0.00',
        maxDiscountAmount: null,
        isActive: true,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31'),
        createdBy: 'admin',
      };
      
      // Create HASSAN30 voucher
      const testVoucher2 = {
        code: 'HASSAN30',
        discountType: 'fixed' as const,
        discountValue: '40',
        description: 'Special discount for Hassan',
        usageLimit: 1,
        usageCount: 1,
        minBookingAmount: '0.00',
        maxDiscountAmount: null,
        isActive: false,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-06-30'),
        createdBy: 'admin',
      };
      
      // Insert vouchers (ignore if they already exist)
      const existingVouchers = await db.select().from(vouchers);
      
      if (existingVouchers.length === 0) {
        await db.insert(vouchers).values(testVoucher1);
        await db.insert(vouchers).values(testVoucher2);

      } else {

      }
      
      const allVouchers = await db.select().from(vouchers);
      res.json({ message: 'Test vouchers ready', vouchers: allVouchers });
    } catch (error: any) {

      res.status(500).json({ message: 'Failed to create test vouchers', error: error.message });
    }
  });
  
  // Validate voucher for booking (public endpoint) - MOVED TO TOP
  app.post('/api/vouchers/validate', async (req, res) => {
    try {



      // Try to parse with error handling - handle empty fields
      let validatedData;
      try {
        const processedBody = {
          ...req.body,
          guestEmail: req.body.guestEmail || 'guest@example.com',
          guestName: (req.body.guestName || '').trim() || 'Guest User',
        };
        
        validatedData = voucherValidationSchema.parse(processedBody);

      } catch (schemaError: any) {


        return res.status(400).json({ message: "Invalid request format", error: schemaError.message });
      }


      // Find voucher by code (case-insensitive)

      // First check if the vouchers table has any data
      const allVouchers = await db.select().from(vouchers);

      // If no vouchers exist, create a test voucher for WELCOME20
      if (allVouchers.length === 0 && validatedData.code.toUpperCase() === 'WELCOME20') {

        const testVoucher = {
          code: 'WELCOME20',
          discountType: 'percentage' as const,
          discountValue: '20',
          description: 'Welcome discount for new customers',
          usageLimit: 2,
          usageCount: 0,
          minBookingAmount: '0.00',
          maxDiscountAmount: null,
          isActive: true,
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2024-12-31'),
          createdBy: 'admin',
        };
        
        await db.insert(vouchers).values(testVoucher);

      }
      
      const voucher = await db.select().from(vouchers).where(eq(vouchers.code, validatedData.code.toUpperCase())).limit(1);

      if (voucher.length === 0) {
        return res.status(404).json({ message: "Voucher not found" });
      }

      const voucherData = voucher[0];
      
      // Check if voucher is active
      if (!voucherData.isActive) {
        return res.status(400).json({ message: "Voucher is not active" });
      }

      // Check if voucher is within valid date range
      const now = new Date();
      const validFrom = new Date(voucherData.validFrom);
      const validUntil = new Date(voucherData.validUntil);
      
      if (now < validFrom || now > validUntil) {
        return res.status(400).json({ message: "Voucher is not valid for current date" });
      }

      // Check if voucher has reached usage limit
      if (voucherData.usageCount >= voucherData.usageLimit) {
        return res.status(400).json({ message: "Voucher usage limit reached" });
      }

      // Check minimum booking amount
      if (voucherData.minBookingAmount && validatedData.bookingAmount < Number(voucherData.minBookingAmount)) {
        return res.status(400).json({ message: `Minimum booking amount of €${voucherData.minBookingAmount} required` });
      }

      // Calculate discount amount
      let discountAmount = 0;
      if (voucherData.discountType === 'percentage') {
        discountAmount = validatedData.bookingAmount * (Number(voucherData.discountValue) / 100);
        // Apply max discount limit if set
        if (voucherData.maxDiscountAmount && Number(voucherData.maxDiscountAmount) > 0) {
          discountAmount = Math.min(discountAmount, Number(voucherData.maxDiscountAmount));
        }
      } else {
        discountAmount = Number(voucherData.discountValue);
      }

      res.json({
        valid: true,
        voucher: voucherData,
        discountAmount: discountAmount,
        finalAmount: validatedData.bookingAmount - discountAmount,
      });
    } catch (error: any) {


      res.status(500).json({ message: "Failed to validate voucher", error: error.message });
    }
  });

  // Get all vouchers (admin only)
  app.get('/api/vouchers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const voucherList = await db.select({
        id: vouchers.id,
        code: vouchers.code,
        discountType: vouchers.discountType,
        discountValue: vouchers.discountValue,
        description: vouchers.description,
        usageLimit: vouchers.usageLimit,
        usageCount: vouchers.usageCount,
        minBookingAmount: vouchers.minBookingAmount,
        maxDiscountAmount: vouchers.maxDiscountAmount,
        isActive: vouchers.isActive,
        validFrom: vouchers.validFrom,
        validUntil: vouchers.validUntil,
        createdBy: vouchers.createdBy,
        createdAt: vouchers.createdAt,
        updatedAt: vouchers.updatedAt,
      }).from(vouchers);

      res.json(voucherList);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch vouchers" });
    }
  });

  // Get voucher usage history (admin only)
  app.get('/api/vouchers/:id/usage', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const voucherId = parseInt(req.params.id);

      const usageHistory = await db.select().from(voucherUsage).where(eq(voucherUsage.voucherId, voucherId));


      res.json(usageHistory);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch voucher usage" });
    }
  });

  // Create new voucher (admin only)
  app.post('/api/vouchers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = insertVoucherSchema.parse(req.body);
      
      // Check if voucher code already exists (case-insensitive)
      const upperCaseCode = validatedData.code.toUpperCase();
      const existingVoucher = await db.select().from(vouchers).where(eq(vouchers.code, upperCaseCode)).limit(1);
      if (existingVoucher.length > 0) {
        return res.status(400).json({ message: "Voucher code already exists" });
      }

      const voucherData: any = {
        code: upperCaseCode,
        discountType: validatedData.discountType,
        discountValue: validatedData.discountValue.toString(),
        usageLimit: validatedData.usageLimit,
        minBookingAmount: validatedData.minBookingAmount.toString(),
        isActive: validatedData.isActive ?? true,
        validFrom: new Date(validatedData.validFrom),
        validUntil: new Date(validatedData.validUntil),
        createdBy: user.id,
      };

      // Only add optional fields if they have values
      if (validatedData.description) {
        voucherData.description = validatedData.description;
      }
      
      if (validatedData.maxDiscountAmount !== undefined && validatedData.maxDiscountAmount >= 0) {
        voucherData.maxDiscountAmount = validatedData.maxDiscountAmount.toString();
      }

      const newVoucher = await db.insert(vouchers).values(voucherData).returning();

      res.status(201).json(newVoucher[0]);
    } catch (error) {

      // Check if it's a validation error
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Validation error", 
          details: error.message 
        });
      }
      
      // Check if it's a database constraint error
      if (error instanceof Error && error.message.includes('duplicate key')) {
        return res.status(400).json({ message: "Voucher code already exists" });
      }
      
      res.status(500).json({ 
        message: "Failed to create voucher",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Update voucher (admin only)
  app.put('/api/vouchers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const voucherId = parseInt(req.params.id);
      const { isActive } = req.body;

      const updatedVoucher = await db.update(vouchers)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(vouchers.id, voucherId))
        .returning();

      if (updatedVoucher.length === 0) {
        return res.status(404).json({ message: "Voucher not found" });
      }

      res.json(updatedVoucher[0]);
    } catch (error) {

      res.status(500).json({ message: "Failed to update voucher" });
    }
  });

  // Delete voucher (admin only)
  app.delete('/api/vouchers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const voucherId = parseInt(req.params.id);
      
      // Check if voucher has been used
      const usageCount = await db.select().from(voucherUsage).where(eq(voucherUsage.voucherId, voucherId));
      if (usageCount.length > 0) {
        return res.status(400).json({ message: "Cannot delete voucher that has been used" });
      }

      const deletedVoucher = await db.delete(vouchers).where(eq(vouchers.id, voucherId)).returning();

      if (deletedVoucher.length === 0) {
        return res.status(404).json({ message: "Voucher not found" });
      }

      res.json({ message: "Voucher deleted successfully" });
    } catch (error) {

      res.status(500).json({ message: "Failed to delete voucher" });
    }
  });


  // Use voucher (called when booking is confirmed)
  app.post('/api/vouchers/:id/use', async (req, res) => {
    try {
      const voucherId = parseInt(req.params.id);
      const usageData = insertVoucherUsageSchema.parse(req.body);
      
      // Verify voucher exists and is still valid
      const voucher = await db.select().from(vouchers).where(eq(vouchers.id, voucherId)).limit(1);
      
      if (voucher.length === 0) {
        return res.status(404).json({ message: "Voucher not found" });
      }

      const voucherData = voucher[0];
      
      // Check if voucher has reached usage limit
      if (voucherData.usageCount >= voucherData.usageLimit) {
        return res.status(400).json({ message: "Voucher usage limit reached" });
      }

      // Record voucher usage
      await db.insert(voucherUsage).values({
        voucherId,
        bookingId: usageData.bookingId,
        userId: usageData.userId,
        guestEmail: usageData.guestEmail,
        guestName: usageData.guestName,
        discountAmount: usageData.discountAmount,
        bookingAmount: usageData.bookingAmount,
        checkInDate: usageData.checkInDate,
        checkOutDate: usageData.checkOutDate,
      });

      // Update voucher usage count
      await db.update(vouchers)
        .set({ 
          usageCount: voucherData.usageCount + 1,
          updatedAt: new Date()
        })
        .where(eq(vouchers.id, voucherId));

      res.json({ message: "Voucher used successfully" });
    } catch (error) {

      res.status(500).json({ message: "Failed to use voucher" });
    }
  });

  // Add test voucher usage data (admin only - for testing)
  app.post('/api/vouchers/:id/add-test-usage', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const voucherId = parseInt(req.params.id);

      // Find the most recent booking to use as test data
      const [recentBooking] = await db.select({
        id: bookings.id,
        guestFirstName: bookings.guestFirstName,
        guestLastName: bookings.guestLastName,
        guestEmail: bookings.guestEmail,
        checkInDate: bookings.checkInDate,
        checkOutDate: bookings.checkOutDate,
        totalPrice: bookings.totalPrice
      }).from(bookings).orderBy(desc(bookings.id)).limit(1);
      
      if (!recentBooking) {
        return res.status(404).json({ message: "No bookings found to create test voucher usage" });
      }
      
      // Create test voucher usage data using real booking
      const testUsageData = {
        voucherId,
        bookingId: recentBooking.id,
        userId: null,
        guestEmail: recentBooking.guestEmail,
        guestName: `${recentBooking.guestFirstName} ${recentBooking.guestLastName}`,
        discountAmount: "40.00",
        bookingAmount: recentBooking.totalPrice,
        checkInDate: recentBooking.checkInDate,
        checkOutDate: recentBooking.checkOutDate
      };

      await db.insert(voucherUsage).values(testUsageData);

      res.json({ message: "Test voucher usage data added successfully", data: testUsageData });
    } catch (error) {

      res.status(500).json({ message: "Failed to add test voucher usage", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Debug endpoint to check voucher usage without authentication (remove in production)
  app.get('/api/debug/vouchers/:id/usage', async (req, res) => {
    try {
      const voucherId = parseInt(req.params.id);

      // Join with bookings table to get confirmation code
      const usageHistory = await db.select({
        id: voucherUsage.id,
        voucherId: voucherUsage.voucherId,
        bookingId: voucherUsage.bookingId,
        userId: voucherUsage.userId,
        guestEmail: voucherUsage.guestEmail,
        guestName: voucherUsage.guestName,
        discountAmount: voucherUsage.discountAmount,
        bookingAmount: voucherUsage.bookingAmount,
        usedAt: voucherUsage.usedAt,
        checkInDate: voucherUsage.checkInDate,
        checkOutDate: voucherUsage.checkOutDate,
        confirmationCode: bookings.confirmationCode
      })
      .from(voucherUsage)
      .leftJoin(bookings, eq(voucherUsage.bookingId, bookings.id))
      .where(eq(voucherUsage.voucherId, voucherId));


      res.json(usageHistory);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch voucher usage" });
    }
  });

  // Debug endpoint to create test voucher usage with booking ID 23
  app.post('/api/debug/vouchers/:id/create-test-usage', async (req, res) => {
    try {
      const voucherId = parseInt(req.params.id);

      // Create test voucher usage data with booking ID 23
      const testUsageData = {
        voucherId,
        bookingId: 23,
        userId: null,
        guestEmail: "test@test.com",
        guestName: "cheema cheema",
        discountAmount: "40.00",
        bookingAmount: "123.00",
        checkInDate: "2025-07-28",
        checkOutDate: "2025-07-29"
      };

      await db.insert(voucherUsage).values(testUsageData);

      // Update voucher usage count
      const updatedVoucher = await db.update(vouchers)
        .set({ 
          usageCount: sql`${vouchers.usageCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(vouchers.id, voucherId))
        .returning();

      res.json({ message: "Test voucher usage created successfully", data: testUsageData });
    } catch (error) {

      res.status(500).json({ message: "Failed to create test voucher usage", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Debug endpoint to clear voucher usage and reset usage count (remove in production)
  app.delete('/api/debug/vouchers/:id/clear-usage', async (req, res) => {
    try {
      const voucherId = parseInt(req.params.id);

      // Delete all usage records for this voucher
      const deletedUsage = await db.delete(voucherUsage).where(eq(voucherUsage.voucherId, voucherId)).returning();

      // Reset usage count to 0
      const updatedVoucher = await db.update(vouchers)
        .set({ usageCount: 0, updatedAt: new Date() })
        .where(eq(vouchers.id, voucherId))
        .returning();

      res.json({ 
        message: "Voucher usage cleared successfully", 
        deletedRecords: deletedUsage.length,
        voucher: updatedVoucher[0]
      });
    } catch (error) {

      res.status(500).json({ message: "Failed to clear voucher usage" });
    }
  });

  // Broadcast function for admin notifications
  function broadcastToAdmins(message: any) {
    const messageStr = JSON.stringify(message);

    let successCount = 0;
    let errorCount = 0;
    
    adminConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr);
          successCount++;
        } catch (error) {
          errorCount++;
        }
      } else {
        errorCount++;
      }
    });
  }

  // Helper functions for different update types
  function broadcastAnalyticsUpdate() {
    broadcastToAdmins({ type: 'analytics_update' });
  }

  function broadcastPricingUpdate() {
    broadcastToAdmins({ type: 'pricing_update' });
  }

  function broadcastPromotionUpdate() {
    broadcastToAdmins({ type: 'promotion_update' });
  }

  function broadcastReviewUpdate() {
    broadcastToAdmins({ type: 'review_update' });
  }

  function broadcastHeroImagesUpdate() {
    broadcastToAdmins({ type: 'hero_images_update' });
  }

  function broadcastUsersUpdate() {
    broadcastToAdmins({ type: 'users_update' });
  }

  function broadcastPMSIntegrationUpdate() {
    broadcastToAdmins({ type: 'pms_integration_update' });
  }

  function broadcastDatabaseStatusUpdate() {
    broadcastToAdmins({ type: 'database_status_update' });
  }

  function broadcastPMSSyncProgress(integrationId: string, progress: number, status: string, processedItems: number, totalItems: number) {
    broadcastToAdmins({
      type: 'pms_sync_progress',
      data: {
        integrationId,
        progress,
        status,
        processedItems,
        totalItems
      }
    });
  }

  // Enhanced celebration system with multiple notification channels
  async function broadcastCreditEarned(userId: string, creditAmount: number, referrerDetails: any, bookingDetails: any) {
    const celebrationData = {
      userId,
      creditAmount,
      referrerEmail: referrerDetails.email,
      referrerName: `${referrerDetails.firstName} ${referrerDetails.lastName}`,
      bookingId: bookingDetails.id,
      totalNights: bookingDetails.totalNights,
      timestamp: new Date().toISOString(),
      celebrationId: crypto.randomUUID(),
      messages: {
        primary: `🎉 Congratulations! You've earned ${creditAmount}€ in referral credits!`,
        secondary: `Your friend just completed their stay. Keep referring to earn more!`,
        action: `You now have credits to use on your next booking!`
      },
      animations: {
        confetti: true,
        fireworks: true,
        duration: 5000
      },
      achievements: {
        isFirstReferral: await checkIfFirstReferral(userId),
        totalReferrals: await getTotalReferralCount(userId),
        totalCreditsEarned: await getTotalCreditsEarned(userId)
      }
    };

    // 1. Broadcast celebration to all admin connections
    broadcastToAdmins({
      type: 'referral_credit_celebration',
      data: celebrationData
    });

    // 2. Store celebration notification in database for the user
    try {
      await storage.createUserNotification({
        userId,
        type: 'referral_credit_earned',
        title: '🎉 Referral Credits Earned!',
        message: `You've earned ${creditAmount}€ in referral credits! Your friend just completed their stay.`,
        data: JSON.stringify(celebrationData),
        isRead: false
      });
    } catch (error) {
      console.error('Failed to store user notification:', error);
    }

    // 3. Send real-time notification to user if they're connected
    broadcastToUser(userId, {
      type: 'celebration_notification',
      data: celebrationData
    });

    // 4. Send email notification with celebration content
    try {
      await sendCelebrationEmail(referrerDetails, celebrationData);
    } catch (error) {
      console.error('Failed to send celebration email:', error);
    }

    // 5. Log celebration for analytics
    console.log(`🎊 CELEBRATION: User ${userId} earned ${creditAmount}€ referral credits! Total referrals: ${celebrationData.achievements.totalReferrals}`);
  }

  // Helper functions for celebration system
  async function checkIfFirstReferral(userId: string): Promise<boolean> {
    try {
      const referralStats = await storage.getUserReferralStats(userId);
      return referralStats.totalReferrals <= 1;
    } catch (error) {
      return false;
    }
  }

  async function getTotalReferralCount(userId: string): Promise<number> {
    try {
      const referralStats = await storage.getUserReferralStats(userId);
      return referralStats.totalReferrals || 0;
    } catch (error) {
      return 0;
    }
  }

  async function getTotalCreditsEarned(userId: string): Promise<number> {
    try {
      const user = await storage.getUser(userId);
      return user?.credits || 0;
    } catch (error) {
      return 0;
    }
  }

  // Send notification to specific user (if they have an active connection)
  function broadcastToUser(userId: string, message: any) {
    const messageStr = JSON.stringify(message);
    
    // In a real implementation, you'd maintain user-specific WebSocket connections
    // For now, we'll broadcast to all connections with user identification
    adminConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({
            ...message,
            targetUserId: userId
          }));
        } catch (error) {
          console.error('Failed to send user notification:', error);
        }
      }
    });
  }

  // Send celebration email
  async function sendCelebrationEmail(referrerDetails: any, celebrationData: any) {
    // Email template for celebration
    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .celebration { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; color: white; }
          .amount { font-size: 32px; font-weight: bold; color: #FFD700; }
          .message { font-size: 18px; margin: 15px 0; }
          .cta { background: #FFD700; color: #333; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
        </style>
      </head>
      <body>
        <div class="celebration">
          <h1>🎉 Congratulations ${referrerDetails.firstName}!</h1>
          <div class="amount">${celebrationData.creditAmount}€ Earned!</div>
          <p class="message">${celebrationData.messages.primary}</p>
          <p class="message">${celebrationData.messages.secondary}</p>
          <br>
          <a href="${process.env.FRONTEND_URL}/profile" class="cta">View My Credits</a>
        </div>
      </body>
      </html>
    `;

    // In a real implementation, send email using your email service
    console.log(`📧 CELEBRATION EMAIL: Sent to ${referrerDetails.email}`);
    console.log(`Email content preview: ${celebrationData.messages.primary}`);
  }

  // Real-time calendar updates (only when clients are connected)
  setInterval(async () => {
    // Only broadcast if there are connected clients
    if (adminConnections.size === 0) {
      return;
    }

    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      
      const bookings = await storage.getBookingsByDateRange(startDate, endDate);
      
      broadcastToAdmins({
        type: 'calendar_update',
        data: { bookings, year, month }
      });
    } catch (error) {

    }
  }, 5000); // Changed to 5 seconds instead of 100ms for better performance


  // Advanced admin authentication routes
  app.post('/api/admin/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        await logAuditEvent(req, 'login_failed', 'authentication', null, {
          reason: 'Missing credentials',
          email
        }, false);
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        await logAuditEvent(req, 'login_failed', 'authentication', null, {
          reason: 'User not found',
          email
        }, false);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const passwordValid = await bcrypt.compare(password, user.password || '');
      if (!passwordValid) {
        await logAuditEvent(req, 'login_failed', 'authentication', user.id, {
          reason: 'Invalid password',
          email
        }, false);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check if user is admin
      if (user.role !== 'admin' && user.role !== 'team_member') {
        await logAuditEvent(req, 'login_failed', 'authorization', user.id, {
          reason: 'Insufficient privileges',
          role: user.role
        }, false);
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Update session
      const session = req.session as any;
      session.userId = user.id;
      session.adminUserId = user.id; // Add this for TOTP verification
      session.user = user;
      session.isAdmin = true;
      session.pendingAdminLogin = true; // Add this for TOTP verification
      session.loginAt = new Date();

      // Check if TOTP is set up
      if (!user.totpSecret) {
        await logAuditEvent(req, 'login_totp_setup_required', 'authentication', user.id, {
          email
        }, true);
        return res.json({ 
          success: true, 
          requiresTOTPSetup: true,
          message: 'TOTP setup required' 
        });
      }

      // Require TOTP verification
      await logAuditEvent(req, 'login_totp_required', 'authentication', user.id, {
        email
      }, true);
      
      res.json({ 
        success: true, 
        requiresTOTP: true,
        message: 'TOTP verification required' 
      });
    } catch (error) {
      console.error('Login error:', error);
      await logAuditEvent(req, 'login_error', 'system', null, {
        error: error.message
      }, false);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/admin/auth/generate-totp', requireAdminAuth, async (req, res) => {
    try {
      const session = req.session as any;
      const userId = session.userId;

      const { secret, qrCode } = await generateTOTPSecret(userId);
      
      // Generate backup codes
      const backupCodes = Array.from({ length: 8 }, () => 
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );

      // Store TOTP secret temporarily (will be saved permanently on verification)
      session.pendingTOTPSecret = secret;
      session.backupCodes = backupCodes;

      await logAuditEvent(req, 'totp_secret_generated', 'security', userId, {
        userId
      }, true);

      res.json({ secret, qrCode, backupCodes });
    } catch (error) {
      console.error('TOTP generation error:', error);
      res.status(500).json({ message: 'Failed to generate TOTP secret' });
    }
  });

  app.post('/api/admin/auth/verify-totp-setup', requireAdminAuth, async (req, res) => {
    try {
      const { code, secret } = req.body;
      const session = req.session as any;
      const userId = session.userId;

      if (!code || !secret) {
        return res.status(400).json({ message: 'Code and secret are required' });
      }

      const isValid = verifyTOTP(secret, code);
      
      if (isValid) {
        // Save TOTP secret to user database
        await db.update(users).set({ 
          totpSecret: secret,
          isActive: true,
          lastLoginAt: new Date(),
          updatedAt: new Date()
        }).where(eq(users.id, userId));

        // Complete admin authentication
        session.totpVerified = true;
        session.mfaVerifiedAt = new Date();
        session.adminAuthenticated = true;
        session.isAdmin = true; // Preserve admin flag
        delete session.pendingTOTPSecret;
        delete session.pendingAdminLogin; // Clean up if exists

        await logAuditEvent(req, 'totp_setup_completed', 'security', userId, {
          userId
        }, true);

        res.json({ success: true, message: 'TOTP setup completed' });
      } else {
        await logAuditEvent(req, 'totp_setup_failed', 'security', userId, {
          reason: 'Invalid code',
          userId
        }, false);
        res.status(400).json({ message: 'Invalid verification code' });
      }
    } catch (error) {
      console.error('TOTP setup verification error:', error);
      res.status(500).json({ message: 'Verification failed' });
    }
  });

  app.post('/api/admin/auth/verify-totp', async (req, res) => {
    try {
      const { code } = req.body;
      const session = req.session as any;
      
      // Check if there's a pending admin login
      if (!session.pendingAdminLogin || !session.adminUserId) {
        return res.status(403).json({ message: "No pending admin login found" });
      }

      if (!code) {
        return res.status(400).json({ message: 'Verification code is required' });
      }

      // Get user's TOTP secret 
      const user = await storage.getUser(session.adminUserId);
      
      if (!user || !user.totpSecret) {
        return res.status(400).json({ message: 'TOTP not set up' });
      }

      const isValid = verifyTOTP(user.totpSecret, code);
      
      if (isValid) {
        // Complete admin authentication
        session.totpVerified = true;
        session.mfaVerifiedAt = new Date();
        session.adminAuthenticated = true;
        session.isAdmin = true; // Preserve admin flag
        session.userId = session.adminUserId; // Ensure userId is set
        delete session.pendingAdminLogin;

        await logAuditEvent(req, 'login_success', 'authentication', user.id, {
          email: user.email,
          mfaType: 'totp'
        }, true);

        res.json({ success: true, message: 'Authentication successful' });
      } else {
        await logAuditEvent(req, 'totp_verification_failed', 'security', user.id, {
          reason: 'Invalid code'
        }, false);
        res.status(400).json({ message: 'Invalid verification code' });
      }
    } catch (error) {
      console.error('TOTP verification error:', error);
      res.status(500).json({ message: 'Verification failed' });
    }
  });

  // Admin dashboard endpoint - checks if admin requires additional verification
  app.get('/api/admin/dashboard', async (req, res) => {
    try {
      const session = req.session as any;
      
      // Check if admin is authenticated
      if (!session.adminAuthenticated && !session.pendingAdminLogin) {
        return res.status(401).json({ message: 'Admin not authenticated' });
      }
      
      // Get user ID from session
      const userId = session.userId || session.adminUserId;
      if (!userId) {
        return res.status(401).json({ message: 'No user ID in session' });
      }
      
      // Get user from database
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if user is admin
      if (user.role !== 'admin' && user.role !== 'team_member') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      // Check if SMS verification is required (placeholder logic)
      // In a real implementation, this would check admin settings/requirements
      const requiresSMSVerification = false; // Set to true to test SMS verification flow
      
      if (requiresSMSVerification && !session.smsVerified) {
        return res.status(403).json({ 
          message: 'SMS verification required',
          requiresVerification: true,
          verificationType: 'sms'
        });
      }
      
      // Return successful dashboard access
      res.json({ 
        message: 'Dashboard access granted',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        mfaStatus: {
          totpVerified: session.totpVerified || false,
          smsVerified: session.smsVerified || false,
          adminAuthenticated: session.adminAuthenticated || false
        }
      });
    } catch (error) {
      console.error('Admin dashboard error:', error);
      res.status(500).json({ message: 'Failed to load dashboard' });
    }
  });

  // Development route to create admin user
  app.post('/api/dev/create-admin', async (req, res) => {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ message: 'Only available in development' });
      }

      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const adminUser = await storage.createAdminUser({
        email: 'admin@allarco.com',
        firstName: 'Admin',
        lastName: 'User',
        password: hashedPassword
      });

      res.json({ 
        message: 'Admin user created successfully', 
        user: { ...adminUser, password: undefined }
      });
    } catch (error) {
      console.error('Error creating admin user:', error);
      res.status(500).json({ message: 'Failed to create admin user' });
    }
  });

  // Test celebration endpoint for development
  app.post('/api/test-celebration', async (req, res) => {
    try {
      const { userEmail, creditAmount, referrerName, bookingDetails } = req.body;
      
      if (!userEmail || !creditAmount) {
        return res.status(400).json({ message: 'userEmail and creditAmount are required' });
      }

      // Find user by email
      const user = await storage.getUserByEmail(userEmail);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Create mock referrer details
      const referrerDetails = {
        email: user.email,
        firstName: user.firstName || 'Test',
        lastName: user.lastName || 'User'
      };

      // Create mock booking details
      const mockBookingDetails = {
        id: bookingDetails?.id || 'test-booking-' + Date.now(),
        totalNights: bookingDetails?.totalNights || 3
      };

      console.log(`🧪 Triggering test celebration for ${userEmail} with ${creditAmount}€ credits`);
      
      // Trigger the celebration
      await broadcastCreditEarned(user.id, creditAmount, referrerDetails, mockBookingDetails);
      
      res.json({ 
        success: true,
        message: `Test celebration triggered for ${userEmail}`,
        details: {
          userId: user.id,
          creditAmount,
          userEmail
        }
      });
    } catch (error) {
      console.error('Error triggering test celebration:', error);
      res.status(500).json({ message: 'Failed to trigger test celebration: ' + error.message });
    }
  });

  // PMS routes - temporarily disabled
  // app.use('/api/pms', pmsRoutes);

  return httpServer;
}
