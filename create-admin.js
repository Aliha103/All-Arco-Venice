import bcrypt from 'bcryptjs';
import { db } from './server/db.ts';
import { users } from './shared/schema.ts';

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = {
      id: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: 'admin@allarco.com',
      firstName: 'Admin',
      lastName: 'User',
      password: hashedPassword,
      referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      authProvider: 'local',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [user] = await db.insert(users).values(adminUser).returning();
    console.log('Admin user created successfully:', user);
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdmin();