import { 
  conversations, 
  chatMessages, 
  chatParticipants, 
  messageDelivery,
  users,
  type Conversation,
  type InsertConversation,
  type ChatMessage,
  type InsertChatMessage,
  type ChatParticipant,
  type InsertChatParticipant,
  type MessageDelivery,
  type InsertMessageDelivery,
  type StartChat,
  type SendMessage,
  type User
} from "../shared/schema";
import { db } from "./db";
import { eq, desc, and, or, gte, lte, count, sql, isNull } from "drizzle-orm";

export class ChatStorage {
  // Start a new conversation
  async startConversation(data: StartChat & { userId?: string }): Promise<{
    conversation: Conversation;
    firstMessage: ChatMessage;
  }> {
    const conversationData: InsertConversation = {
      userId: data.userId || null,
      guestName: data.guestName || null,
      guestEmail: data.guestEmail || null,
      subject: data.subject || "New Chat",
      status: "active",
      priority: "medium",
      lastMessageAt: new Date(),
    };

    const [conversation] = await db
      .insert(conversations)
      .values(conversationData)
      .returning();

    // Create the first message
    const messageData: InsertChatMessage = {
      conversationId: conversation.id,
      senderId: data.userId || null,
      senderName: data.guestName || "Guest",
      senderEmail: data.guestEmail || "guest@example.com",
      content: data.message,
      messageType: "text",
      isFromAdmin: false,
      isRead: false,
    };

    const [firstMessage] = await db
      .insert(chatMessages)
      .values(messageData)
      .returning();

    // Add participant
    if (data.userId || data.guestEmail) {
      await db.insert(chatParticipants).values({
        conversationId: conversation.id,
        userId: data.userId || null,
        guestEmail: data.guestEmail || null,
        role: "guest",
      });
    }

    return { conversation, firstMessage };
  }

  // Send a message in existing conversation
  async sendMessage(data: SendMessage & { 
    senderId?: string; 
    senderName: string; 
    senderEmail: string; 
    isFromAdmin: boolean;
  }): Promise<ChatMessage> {
    const messageData: InsertChatMessage = {
      conversationId: data.conversationId,
      senderId: data.senderId || null,
      senderName: data.senderName,
      senderEmail: data.senderEmail,
      content: data.content,
      messageType: data.messageType || "text",
      attachments: data.attachments || [],
      isFromAdmin: data.isFromAdmin,
      isRead: false,
      replyTo: data.replyTo || null,
    };

    const [message] = await db
      .insert(chatMessages)
      .values(messageData)
      .returning();

    // Update conversation last message time
    await db
      .update(conversations)
      .set({ 
        lastMessageAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(conversations.id, data.conversationId));

    return message;
  }

  // Get conversation with messages
  async getConversation(conversationId: number, userId?: string): Promise<{
    conversation: Conversation;
    messages: ChatMessage[];
    participants: ChatParticipant[];
  } | null> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));

    if (!conversation) return null;

    // Check if user has access to this conversation
    if (userId && conversation.userId !== userId) {
      const [participant] = await db
        .select()
        .from(chatParticipants)
        .where(
          and(
            eq(chatParticipants.conversationId, conversationId),
            eq(chatParticipants.userId, userId)
          )
        );
      
      if (!participant) return null;
    }

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(chatMessages.createdAt);

    const participants = await db
      .select()
      .from(chatParticipants)
      .where(eq(chatParticipants.conversationId, conversationId));

    return { conversation, messages, participants };
  }

  // Get all conversations for admin
  async getAdminConversations(filters?: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    conversations: Array<Conversation & { 
      messageCount: number; 
      unreadCount: number; 
      lastMessage?: ChatMessage;
      user?: User;
    }>;
    total: number;
  }> {
    let conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(conversations.status, filters.status as any));
    }
    
    if (filters?.priority) {
      conditions.push(eq(conversations.priority, filters.priority as any));
    }
    
    if (filters?.assignedTo) {
      conditions.push(eq(conversations.assignedTo, filters.assignedTo));
    }

    if (filters?.search) {
      conditions.push(
        or(
          sql`${conversations.subject} ILIKE ${'%' + filters.search + '%'}`,
          sql`${conversations.guestName} ILIKE ${'%' + filters.search + '%'}`,
          sql`${conversations.guestEmail} ILIKE ${'%' + filters.search + '%'}`
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count: total }] = await db
      .select({ count: count() })
      .from(conversations)
      .where(whereClause);

    // Get conversations with details
    const conversationsData = await db
      .select()
      .from(conversations)
      .where(whereClause)
      .orderBy(desc(conversations.lastMessageAt))
      .limit(filters?.limit || 50)
      .offset(filters?.offset || 0);

    // Enhance with message counts and last message
    const enhancedConversations = await Promise.all(
      conversationsData.map(async (conv) => {
        const [{ count: messageCount }] = await db
          .select({ count: count() })
          .from(chatMessages)
          .where(eq(chatMessages.conversationId, conv.id));

        const [{ count: unreadCount }] = await db
          .select({ count: count() })
          .from(chatMessages)
          .where(
            and(
              eq(chatMessages.conversationId, conv.id),
              eq(chatMessages.isRead, false),
              eq(chatMessages.isFromAdmin, false)
            )
          );

        const [lastMessage] = await db
          .select()
          .from(chatMessages)
          .where(eq(chatMessages.conversationId, conv.id))
          .orderBy(desc(chatMessages.createdAt))
          .limit(1);

        let user: User | undefined;
        if (conv.userId) {
          const [foundUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, conv.userId));
          user = foundUser;
        }

        return {
          ...conv,
          messageCount,
          unreadCount,
          lastMessage,
          user,
        };
      })
    );

    return {
      conversations: enhancedConversations,
      total,
    };
  }

  // Get user conversations
  async getUserConversations(userId: string): Promise<Array<Conversation & { 
    messageCount: number; 
    unreadCount: number; 
    lastMessage?: ChatMessage;
  }>> {
    const userConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.lastMessageAt));

    const enhancedConversations = await Promise.all(
      userConversations.map(async (conv) => {
        const [{ count: messageCount }] = await db
          .select({ count: count() })
          .from(chatMessages)
          .where(eq(chatMessages.conversationId, conv.id));

        const [{ count: unreadCount }] = await db
          .select({ count: count() })
          .from(chatMessages)
          .where(
            and(
              eq(chatMessages.conversationId, conv.id),
              eq(chatMessages.isRead, false),
              eq(chatMessages.isFromAdmin, true)
            )
          );

        const [lastMessage] = await db
          .select()
          .from(chatMessages)
          .where(eq(chatMessages.conversationId, conv.id))
          .orderBy(desc(chatMessages.createdAt))
          .limit(1);

        return {
          ...conv,
          messageCount,
          unreadCount,
          lastMessage,
        };
      })
    );

    return enhancedConversations;
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId: number, userId?: string, isAdmin: boolean = false): Promise<void> {
    let conditions = [eq(chatMessages.conversationId, conversationId)];
    
    if (isAdmin) {
      conditions.push(eq(chatMessages.isFromAdmin, false));
    } else {
      conditions.push(eq(chatMessages.isFromAdmin, true));
    }

    await db
      .update(chatMessages)
      .set({ 
        isRead: true, 
        readAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(...conditions));
  }

  // Update conversation status
  async updateConversationStatus(
    conversationId: number, 
    status: "active" | "closed" | "pending",
    assignedTo?: string
  ): Promise<void> {
    const updateData: Partial<typeof conversations.$inferInsert> = {
      status,
      updatedAt: new Date(),
    };

    if (assignedTo !== undefined) {
      updateData.assignedTo = assignedTo;
    }

    await db
      .update(conversations)
      .set(updateData)
      .where(eq(conversations.id, conversationId));
  }

  // Get conversation by guest email (for guest users)
  async getGuestConversation(guestEmail: string): Promise<{
    conversation: Conversation;
    messages: ChatMessage[];
  } | null> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.guestEmail, guestEmail))
      .orderBy(desc(conversations.lastMessageAt))
      .limit(1);

    if (!conversation) return null;

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversation.id))
      .orderBy(chatMessages.createdAt);

    return { conversation, messages };
  }

  // Get unread message count for user
  async getUnreadCount(userId?: string, isAdmin: boolean = false): Promise<number> {
    if (isAdmin) {
      // For admin, count unread messages from guests
      const [{ count }] = await db
        .select({ count: count() })
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.isRead, false),
            eq(chatMessages.isFromAdmin, false)
          )
        );
      return count;
    } else if (userId) {
      // For user, count unread messages from admin in their conversations
      const [{ count }] = await db
        .select({ count: count() })
        .from(chatMessages)
        .innerJoin(conversations, eq(chatMessages.conversationId, conversations.id))
        .where(
          and(
            eq(conversations.userId, userId),
            eq(chatMessages.isRead, false),
            eq(chatMessages.isFromAdmin, true)
          )
        );
      return count;
    }
    return 0;
  }

  // Archive conversation
  async archiveConversation(conversationId: number): Promise<void> {
    await db
      .update(conversations)
      .set({ 
        isArchived: true,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversationId));
  }

  // Delete conversation and all messages
  async deleteConversation(conversationId: number): Promise<void> {
    // Delete in order due to foreign key constraints
    await db.delete(messageDelivery).where(
      sql`${messageDelivery.messageId} IN (
        SELECT ${chatMessages.id} FROM ${chatMessages} 
        WHERE ${chatMessages.conversationId} = ${conversationId}
      )`
    );
    
    await db.delete(chatMessages).where(eq(chatMessages.conversationId, conversationId));
    await db.delete(chatParticipants).where(eq(chatParticipants.conversationId, conversationId));
    await db.delete(conversations).where(eq(conversations.id, conversationId));
  }
}

export const chatStorage = new ChatStorage();