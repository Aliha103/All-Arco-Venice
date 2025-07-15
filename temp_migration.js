import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// Create tables manually
await db.execute(`
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
  );
`);

await db.execute(`
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
  );
`);

await db.execute(`
  CREATE TABLE IF NOT EXISTS chat_participants (
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

await db.execute(`
  CREATE TABLE IF NOT EXISTS message_delivery (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES chat_messages(id) ON DELETE CASCADE NOT NULL,
    recipient_id VARCHAR REFERENCES users(id),
    recipient_email VARCHAR(255),
    delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    status VARCHAR DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed'))
  );
`);

console.log('✅ Chat system tables created successfully!');
