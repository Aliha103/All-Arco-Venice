import { db } from './server/db.js';
import { users } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function checkAdminTOTP() {
  try {
    // Get all admin users
    const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));
    
    console.log('Admin users found:');
    adminUsers.forEach(user => {
      console.log(`- ${user.email}: TOTP Secret = ${user.totpSecret ? 'SET' : 'NOT SET'}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Active: ${user.isActive}`);
      console.log('---');
    });
    
    if (adminUsers.length === 0) {
      console.log('No admin users found');
    }
    
  } catch (error) {
    console.error('Error checking admin TOTP:', error);
  }
}

checkAdminTOTP();