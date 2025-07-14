-- Migration: Enhanced Chat System
-- Description: Add conversation-based messaging system with real-time support

-- Create conversations table
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

-- Create indexes for conversations
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_guest_email ON conversations(guest_email);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_assigned_to ON conversations(assigned_to);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at);
CREATE INDEX idx_conversations_priority ON conversations(priority);

-- Create chat_messages table
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

-- Create indexes for chat_messages
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_is_read ON chat_messages(is_read);
CREATE INDEX idx_chat_messages_is_from_admin ON chat_messages(is_from_admin);
CREATE INDEX idx_chat_messages_reply_to ON chat_messages(reply_to);

-- Create chat_participants table
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

-- Create indexes for chat_participants
CREATE INDEX idx_chat_participants_conversation_id ON chat_participants(conversation_id);
CREATE INDEX idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX idx_chat_participants_guest_email ON chat_participants(guest_email);

-- Create message_delivery table
CREATE TABLE message_delivery (
  id SERIAL PRIMARY KEY,
  message_id INTEGER REFERENCES chat_messages(id) ON DELETE CASCADE NOT NULL,
  recipient_id VARCHAR REFERENCES users(id),
  recipient_email VARCHAR(255),
  delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  status VARCHAR DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed'))
);

-- Create indexes for message_delivery
CREATE INDEX idx_message_delivery_message_id ON message_delivery(message_id);
CREATE INDEX idx_message_delivery_recipient_id ON message_delivery(recipient_id);
CREATE INDEX idx_message_delivery_status ON message_delivery(status);

-- Create function to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET last_message_at = NEW.created_at, updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update conversation last_message_at
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_chat_messages_updated_at
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE conversations IS 'Conversation threads between users and admins';
COMMENT ON TABLE chat_messages IS 'Individual messages within conversations';
COMMENT ON TABLE chat_participants IS 'Participants in conversations (for future group support)';
COMMENT ON TABLE message_delivery IS 'Delivery tracking for real-time messaging';

COMMENT ON COLUMN conversations.tags IS 'JSON array of tags for categorization';
COMMENT ON COLUMN conversations.priority IS 'Priority level for admin triage';
COMMENT ON COLUMN chat_messages.attachments IS 'JSON array of file attachments';
COMMENT ON COLUMN chat_messages.metadata IS 'Additional message metadata';
COMMENT ON COLUMN chat_messages.reply_to IS 'Reference to parent message for threading';