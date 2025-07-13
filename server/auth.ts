import { Request, Response, NextFunction } from 'express';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { storage } from './storage';


export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const session = req.session as any;
  
  // Allow access if admin is fully authenticated OR if there's a pending admin login
  if (!session.isAdmin && !session.pendingAdminLogin && !session.adminAuthenticated) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
}


// Google Authenticator / TOTP functions
export async function generateTOTPSecret(userId: string): Promise<{secret: string, qrCode: string}> {
  const secret = speakeasy.generateSecret({
    name: `ApartmentBooker Admin (${userId.slice(0, 8)})`,
    issuer: 'ApartmentBooker',
    length: 32
  });
  
  const qrCode = await QRCode.toDataURL(secret.otpauth_url!);
  
  return {
    secret: secret.base32!,
    qrCode
  };
}

export function verifyTOTP(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2 // Allow 2 time steps before/after for clock drift
  });
}

export function requireTOTPVerification(req: Request, res: Response, next: NextFunction) {
  const session = req.session as any;
  
  if (!session.totpVerified) {
    return res.status(403).json({ 
      error: 'TOTP verification required',
      requiresVerification: true 
    });
  }
  
  next();
}

export function requireMFAVerification(req: Request, res: Response, next: NextFunction) {
  const session = req.session as any;
  
  // Require TOTP verification for admin users
  if (!session.totpVerified) {
    return res.status(403).json({ 
      error: 'Google Authenticator verification required',
      requiresVerification: true 
    });
  }
  
  next();
}
