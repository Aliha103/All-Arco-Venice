#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runMigration() {
  try {
    console.log('🚀 Running chat system migration...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    const sql = neon(process.env.DATABASE_URL);
    
    // Check if tables already exist
    const checkTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('conversations', 'chat_messages', 'chat_participants', 'message_delivery')
    `;
    
    console.log('Existing chat tables:', checkTables.map(r => r.table_name));
    
    if (checkTables.length === 4) {
      console.log('✅ All chat tables already exist');
      return;
    }
    
    // Create conversations table
    console.log('Creating conversations table...');
    await sql`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR REFERENCES users(id),
        guest_name VARCHAR(100),
        guest_email VARCHAR(255),
        subject VARCHAR(255),
        status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'closed', 'pending')),
        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        assigned_to VARCHAR REFERENCES users(id),
        priority VARCHAR DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        tags JSONB DEFAULT '[]',
        is_archived BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create chat_messages table
    console.log('Creating chat_messages table...');
    await sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
        sender_id VARCHAR REFERENCES users(id),
        sender_name VARCHAR(100) NOT NULL,
        sender_email VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        message_type VARCHAR DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
        attachments JSONB DEFAULT '[]',
        is_from_admin BOOLEAN DEFAULT false,
        is_read BOOLEAN DEFAULT false,
        read_at TIMESTAMP,
        edited_at TIMESTAMP,
        reply_to INTEGER REFERENCES chat_messages(id),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create chat_participants table
    console.log('Creating chat_participants table...');
    await sql`
      CREATE TABLE IF NOT EXISTS chat_participants (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
        user_id VARCHAR REFERENCES users(id),
        guest_email VARCHAR(255),
        role VARCHAR DEFAULT 'guest' CHECK (role IN ('admin', 'guest', 'moderator')),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notifications BOOLEAN DEFAULT true
      )
    `;
    
    // Create message_delivery table
    console.log('Creating message_delivery table...');
    await sql`
      CREATE TABLE IF NOT EXISTS message_delivery (
        id SERIAL PRIMARY KEY,
        message_id INTEGER REFERENCES chat_messages(id) ON DELETE CASCADE NOT NULL,
        recipient_id VARCHAR REFERENCES users(id),
        recipient_email VARCHAR(255),
        delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP,
        status VARCHAR DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed'))
      )
    `;
    
    // Create indexes
    console.log('Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_conversations_guest_email ON conversations(guest_email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_is_read ON chat_messages(is_read)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_is_from_admin ON chat_messages(is_from_admin)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_chat_participants_conversation_id ON chat_participants(conversation_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_message_delivery_message_id ON message_delivery(message_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_message_delivery_recipient_id ON message_delivery(recipient_id)`;
    
    console.log('✅ Chat system migration completed successfully');
    
    // Verify tables were created
    const verifyTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('conversations', 'chat_messages', 'chat_participants', 'message_delivery')
    `;
    
    console.log('✅ Created tables:', verifyTables.map(r => r.table_name));
    
  } catch (error) {
    console.log('❌ Migration error:', error.message);
    if (error.message.includes('already exists')) {
      console.log('✅ Tables already exist, migration not needed');
    } else {
      console.error('Full error:', error);
    }
  }
}

runMigration().then(() => {
  console.log('Migration script completed');
  process.exit(0);
}).catch(error => {
  console.error('Migration script failed:', error);
  process.exit(1);
});