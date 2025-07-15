import { Router } from "express";
import { chatStorage } from "./chatStorage";
import { storage } from "./storage";
import { z } from "zod";
import { startChatSchema, sendMessageSchema } from "../shared/schema";
import { WebSocketManager } from "./webSocketManager";

const router = Router();

// Development route to simulate admin authentication
if (process.env.NODE_ENV === 'development') {
  router.post('/dev/admin-auth', async (req: any, res) => {
    try {
      const { storage } = await import('./storage');
      const adminUser = await storage.getUserByEmail('admin@allarco.com');
      
      if (adminUser && adminUser.role === 'admin') {
        // Set admin session
        (req.session as any).userId = adminUser.id;
        (req.session as any).adminUserId = adminUser.id;
        (req.session as any).user = adminUser;
        (req.session as any).isAdmin = true;
        (req.session as any).adminAuthenticated = true;
        (req.session as any).totpVerified = true;
        (req.session as any).mfaVerifiedAt = new Date();
        (req.session as any).accessLevel = 'full';
        (req.session as any).isOriginalAdmin = true;
        
        // Also set req.user for immediate use
        req.user = adminUser;
        
        res.json({ 
          success: true, 
          message: 'Admin authenticated for development',
          user: { ...adminUser, password: undefined }
        });
      } else {
        res.status(404).json({ message: 'Admin user not found' });
      }
    } catch (error) {
      console.error('Error in dev admin auth:', error);
      res.status(500).json({ message: 'Error authenticating admin' });
    }
  });
}

// Middleware to check if user is authenticated
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.user) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
};

// Middleware to check if user is admin
const isAdmin = async (req: any, res: any, next: any) => {
  // Development bypass - allow admin access without full authentication
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Development mode - bypassing admin authentication');
    
    // Set up a mock admin user for development
    if (!req.user) {
      const { storage } = await import('./storage');
      const adminUser = await storage.getUserByEmail('admin@allarco.com');
      if (adminUser) {
        req.user = adminUser;
      }
    }
    
    return next();
  }
  
  if (req.user?.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: "Admin access required" });
};

// Start a new conversation
router.post("/start", async (req: any, res) => {
  try {
    const validatedData = startChatSchema.parse(req.body);
    
    // If user is logged in, use their info
    if (req.user) {
      validatedData.userId = req.user.id;
      validatedData.guestName = `${req.user.firstName} ${req.user.lastName}`;
      validatedData.guestEmail = req.user.email;
    }

    const result = await chatStorage.startConversation(validatedData);
    
    // Notify admins via WebSocket
    WebSocketManager.notifyAdmins('new_conversation', {
      conversation: result.conversation,
      message: result.firstMessage
    });

    res.json({
      success: true,
      conversationId: result.conversation.id,
      conversation: result.conversation,
      message: result.firstMessage
    });
  } catch (error) {
    console.error("Error starting conversation:", error);
    res.status(400).json({ 
      success: false,
      message: error instanceof z.ZodError ? error.errors : "Failed to start conversation"
    });
  }
});

// Middleware to optionally authenticate (don't fail if not authenticated)
const optionalAuth = async (req: any, res: any, next: any) => {
  const session = req.session as any;
  
  console.log('🔍 Session check:', { 
    adminAuthenticated: session.adminAuthenticated, 
    userId: session.userId,
    hasSession: !!session 
  });
  
  // Check for admin session authentication
  if (session.adminAuthenticated && session.userId) {
    const { storage } = await import('./storage');
    try {
      const adminUser = await storage.getUser(session.userId);
      if (adminUser && (adminUser.role === 'admin' || adminUser.role === 'team_member')) {
        console.log('✅ Setting admin user:', adminUser.email, adminUser.role);
        req.user = {
          ...adminUser,
          claims: { sub: adminUser.id },
          access_token: 'admin_session',
          expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
        };
      }
    } catch (error) {
      console.error('Error verifying admin user:', error);
    }
  } else {
    console.log('❌ No admin session found');
  }
  
  next();
};

// Send message in conversation  
router.post("/send", optionalAuth, async (req: any, res) => {
  try {
    const validatedData = sendMessageSchema.parse(req.body);
    
    let senderName = "Guest";
    let senderEmail = "guest@example.com";
    let isFromAdmin = false;
    let senderId: string | undefined;

    if (req.user) {
      senderId = req.user.id;
      senderName = `${req.user.firstName} ${req.user.lastName}`;
      senderEmail = req.user.email;
      isFromAdmin = req.user.role === 'admin';
      console.log('👤 Using authenticated user:', { senderName, senderEmail, isFromAdmin });
    } else if (validatedData.senderName && validatedData.senderEmail) {
      // Guest user with provided name and email
      senderName = validatedData.senderName;
      senderEmail = validatedData.senderEmail;
      isFromAdmin = false;
      console.log('👤 Using guest user:', { senderName, senderEmail, isFromAdmin });
    } else if (process.env.NODE_ENV === 'development') {
      // No sender info and no auth - likely AdminChatDashboard in development
      senderId = "admin_1751844816911_5b1tm5hvo";
      senderName = "Hassan Cheema";
      senderEmail = "admin@allarco.com";
      isFromAdmin = true;
      console.log('🔧 Development: Forcing admin user for AdminChatDashboard');
    } else {
      // Fallback to guest
      senderName = "Guest";
      senderEmail = "guest@example.com";
      isFromAdmin = false;
      console.log('👤 Using fallback guest user');
    }

    const message = await chatStorage.sendMessage({
      ...validatedData,
      senderId,
      senderName,
      senderEmail,
      isFromAdmin
    });

    // Get conversation details for WebSocket notification
    const conversation = await chatStorage.getConversation(validatedData.conversationId);
    
    if (conversation) {
      // Notify participants via WebSocket
      const notificationData = {
        conversationId: validatedData.conversationId,
        message,
        conversation: conversation.conversation
      };

      if (isFromAdmin) {
        // Admin sent message, notify user
        if (conversation.conversation.userId) {
          // Notify logged-in user
          WebSocketManager.notifyUser(conversation.conversation.userId, 'new_message', notificationData);
        } else if (conversation.conversation.guestEmail) {
          // Notify guest user using their email-based WebSocket connection
          const guestUserId = `guest_${conversation.conversation.guestEmail}`;
          console.log(`🔔 Attempting to notify guest user with ID: ${guestUserId}`);
          WebSocketManager.notifyUser(guestUserId, 'new_message', notificationData);
        }
      } else {
        // User sent message, notify admins
        WebSocketManager.notifyAdmins('new_message', notificationData);
      }
    }

    res.json({
      success: true,
      message
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(400).json({ 
      success: false,
      message: error instanceof z.ZodError ? error.errors : "Failed to send message"
    });
  }
});

// Get conversation (user or admin)
router.get("/conversation/:id", async (req: any, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    const userId = req.user?.id;
    const isAdminUser = req.user?.role === 'admin';

    const conversation = await chatStorage.getConversation(
      conversationId, 
      isAdminUser ? undefined : userId
    );

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Mark messages as read
    await chatStorage.markMessagesAsRead(conversationId, userId, isAdminUser);
    
    // Notify about read status via WebSocket
    if (conversation.messages.length > 0) {
      const unreadMessages = conversation.messages.filter(msg => 
        isAdminUser ? !msg.isFromAdmin && !msg.isRead : msg.isFromAdmin && !msg.isRead
      );
      
      unreadMessages.forEach(msg => {
        setTimeout(() => {
          WebSocketManager.broadcast('message_status', {
            messageId: msg.id,
            status: 'read'
          });
        }, 200);
      });
    }

    res.json({
      success: true,
      ...conversation
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ message: "Failed to fetch conversation" });
  }
});

// Get user's conversations
router.get("/my-conversations", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const conversations = await chatStorage.getUserConversations(userId);

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error("Error fetching user conversations:", error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
});

// Get guest conversation by email
router.post("/guest-conversation", async (req: any, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const conversation = await chatStorage.getGuestConversation(email);
    
    if (!conversation) {
      return res.status(404).json({ message: "No conversation found" });
    }

    res.json({
      success: true,
      ...conversation
    });
  } catch (error) {
    console.error("Error fetching guest conversation:", error);
    res.status(500).json({ message: "Failed to fetch conversation" });
  }
});

// Get unread count
router.get("/unread-count", async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const isAdminUser = req.user?.role === 'admin';

    const count = await chatStorage.getUnreadCount(userId, isAdminUser);

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ message: "Failed to fetch unread count" });
  }
});

// ADMIN ROUTES

// Get all conversations (admin only)
router.get("/admin/conversations", isAdmin, async (req: any, res) => {
  try {
    const {
      status,
      priority,
      assignedTo,
      search,
      limit = 50,
      offset = 0
    } = req.query;

    const result = await chatStorage.getAdminConversations({
      status,
      priority,
      assignedTo,
      search,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("Error fetching admin conversations:", error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
});

// Update conversation status (admin only)
router.patch("/admin/conversation/:id/status", isAdmin, async (req: any, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    const { status, assignedTo } = req.body;

    await chatStorage.updateConversationStatus(conversationId, status, assignedTo);

    // If conversation is being closed, notify via WebSocket
    if (status === 'closed') {
      WebSocketManager.broadcast('conversation_ended', {
        conversationId,
        status: 'closed'
      });
    }

    res.json({
      success: true,
      message: "Conversation status updated"
    });
  } catch (error) {
    console.error("Error updating conversation status:", error);
    res.status(500).json({ message: "Failed to update conversation status" });
  }
});

// Archive conversation (admin only)
router.patch("/admin/conversation/:id/archive", isAdmin, async (req: any, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    await chatStorage.archiveConversation(conversationId);

    res.json({
      success: true,
      message: "Conversation archived"
    });
  } catch (error) {
    console.error("Error archiving conversation:", error);
    res.status(500).json({ message: "Failed to archive conversation" });
  }
});

// Delete conversation (admin only)
router.delete("/admin/conversation/:id", isAdmin, async (req: any, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    await chatStorage.deleteConversation(conversationId);

    res.json({
      success: true,
      message: "Conversation deleted"
    });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    res.status(500).json({ message: "Failed to delete conversation" });
  }
});

export { router as chatRoutes };