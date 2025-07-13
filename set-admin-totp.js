import { db } from './server/db.js';
import { users } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function setAdminTOTP() {
  try {
    // Set a TOTP secret for the admin user
    const adminEmail = 'admin@allarco.com';
    const testTOTPSecret = 'JBSWY3DPEHPK3PXP'; // Base32 test secret
    
    const result = await db.update(users)
      .set({ 
        totpSecret: testTOTPSecret,
        isActive: true,
        lastLoginAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.email, adminEmail))
      .returning();
    
    if (result.length > 0) {
      console.log('✅ Admin TOTP secret set successfully!');
      console.log(`Admin: ${result[0].email}`);
      console.log(`TOTP Secret: ${result[0].totpSecret ? 'SET' : 'NOT SET'}`);
      console.log('');
      console.log('🔐 For testing purposes, you can use any authenticator app with this secret:');
      console.log(`Secret: ${testTOTPSecret}`);
      console.log('');
      console.log('Or use this QR code text in your authenticator app:');
      console.log(`otpauth://totp/All'Arco%20Admin?secret=${testTOTPSecret}&issuer=All'Arco`);
    } else {
      console.log('❌ Admin user not found');
    }
    
  } catch (error) {
    console.error('Error setting admin TOTP:', error);
  }
}

setAdminTOTP();