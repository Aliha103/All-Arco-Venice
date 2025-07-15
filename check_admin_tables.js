import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

async function checkAdminTables() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('admin_roles', 'team_members', 'admin_audit_log', 'admin_sessions')
      ORDER BY table_name
    `);
    
    console.log('Existing admin schema tables:');
    result.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });
    
    const expectedTables = ['admin_roles', 'team_members', 'admin_audit_log', 'admin_sessions'];
    const existingTables = result.rows.map(row => row.table_name);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('\nMissing admin schema tables:');
      missingTables.forEach(table => {
        console.log(`  ❌ ${table}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAdminTables();