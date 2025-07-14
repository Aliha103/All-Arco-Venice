import { Router } from "express";
import { chatStorage } from "./chatStorage";
import { storage } from "./storage";
import { z } from "zod";
import { startChatSchema, sendMessageSchema } from "../shared/schema";
import { WebSocketManager } from "./webSocketManager";

const router = Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.session?.user) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
};

// Middleware to check if user is admin
const isAdmin = (req: any, res: any, next: any) => {
  if (req.session?.user?.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: "Admin access required" });
};

// Start a new conversation
router.post("/start", async (req: any, res) => {
  try {
    const validatedData = startChatSchema.parse(req.body);
    
    // If user is logged in, use their info
    if (req.session?.user) {
      validatedData.userId = req.session.user.id;
      validatedData.guestName = `${req.session.user.firstName} ${req.session.user.lastName}`;
      validatedData.guestEmail = req.session.user.email;
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

// Send message in conversation
router.post("/send", async (req: any, res) => {
  try {
    const validatedData = sendMessageSchema.parse(req.body);
    
    let senderName = "Guest";
    let senderEmail = "guest@example.com";
    let isFromAdmin = false;
    let senderId: string | undefined;

    if (req.session?.user) {
      senderId = req.session.user.id;
      senderName = `${req.session.user.firstName} ${req.session.user.lastName}`;
      senderEmail = req.session.user.email;
      isFromAdmin = req.session.user.role === 'admin';
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
          WebSocketManager.notifyUser(conversation.conversation.userId, 'new_message', notificationData);
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
    const userId = req.session?.user?.id;
    const isAdminUser = req.session?.user?.role === 'admin';

    const conversation = await chatStorage.getConversation(
      conversationId, 
      isAdminUser ? undefined : userId
    );

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Mark messages as read
    await chatStorage.markMessagesAsRead(conversationId, userId, isAdminUser);

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
    const userId = req.session.user.id;
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
    const userId = req.session?.user?.id;
    const isAdminUser = req.session?.user?.role === 'admin';

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