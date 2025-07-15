import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function runMigration() {
  try {
    console.log('🚀 Running chat system migration...');
    
    // Check if conversations table exists
    const checkConversations = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'conversations'
      );
    `);
    
    if (checkConversations[0].exists) {
      console.log('✅ Conversations table already exists');
      return;
    }
    
    // Create conversations table
    await db.execute(sql`
      CREATE TABLE conversations (
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
      );
    `);
    
    // Create chat_messages table
    await db.execute(sql`
      CREATE TABLE chat_messages (
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
      );
    `);
    
    // Create chat_participants table
    await db.execute(sql`
      CREATE TABLE chat_participants (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
        user_id VARCHAR REFERENCES users(id),
        guest_email VARCHAR(255),
        role VARCHAR DEFAULT 'guest' CHECK (role IN ('admin', 'guest', 'moderator')),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notifications BOOLEAN DEFAULT true
      );
    `);
    
    // Create message_delivery table
    await db.execute(sql`
      CREATE TABLE message_delivery (
        id SERIAL PRIMARY KEY,
        message_id INTEGER REFERENCES chat_messages(id) ON DELETE CASCADE NOT NULL,
        recipient_id VARCHAR REFERENCES users(id),
        recipient_email VARCHAR(255),
        delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP,
        status VARCHAR DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed'))
      );
    `);
    
    // Create indexes
    await db.execute(sql`CREATE INDEX idx_conversations_user_id ON conversations(user_id);`);
    await db.execute(sql`CREATE INDEX idx_conversations_guest_email ON conversations(guest_email);`);
    await db.execute(sql`CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);`);
    await db.execute(sql`CREATE INDEX idx_chat_messages_is_read ON chat_messages(is_read);`);
    
    console.log('✅ Chat system migration completed successfully');
    
  } catch (error) {
    console.log('❌ Migration error:', error.message);
    if (error.message.includes('already exists')) {
      console.log('✅ Tables already exist, migration not needed');
    }
  }
}

runMigration();