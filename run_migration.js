import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  try {
    console.log('🚀 Running chat system migration...');
    
    // Check if tables already exist
    const checkTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('conversations', 'chat_messages', 'chat_participants', 'message_delivery')
    `);
    
    console.log('Existing chat tables:', checkTables.rows.map(r => r.table_name));
    
    if (checkTables.rows.length === 4) {
      console.log('✅ All chat tables already exist');
      return;
    }
    
    const sql = fs.readFileSync('./migrations/0003_enhanced_chat_system.sql', 'utf8');
    await pool.query(sql);
    console.log('✅ Chat system migration completed successfully');
    
    // Verify tables were created
    const verifyTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('conversations', 'chat_messages', 'chat_participants', 'message_delivery')
    `);
    
    console.log('Created tables:', verifyTables.rows.map(r => r.table_name));
    
  } catch (error) {
    console.log('❌ Migration error:', error.message);
    if (error.message.includes('already exists')) {
      console.log('✅ Tables already exist, migration not needed');
    }
  } finally {
    await pool.end();
  }
}

runMigration();