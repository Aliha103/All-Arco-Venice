import { Request } from 'express';

// Simple audit logging function for our routes
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
    
    const auditEntry = {
      timestamp: new Date().toISOString(),
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
      sessionId: session.sessionId,
      success,
      errorMessage
    };

    // For now, just log to console. In production, this would go to a database
    console.log('AUDIT LOG:', JSON.stringify(auditEntry, null, 2));
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}