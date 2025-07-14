import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { parse } from 'url';

interface WebSocketConnection {
  ws: WebSocket;
  userId?: string;
  isAdmin: boolean;
  lastActivity: Date;
}

export class WebSocketManager {
  private static instance: WebSocketManager;
  private wss: WebSocketServer | null = null;
  private connections: Map<string, WebSocketConnection> = new Map();
  private adminConnections: Set<string> = new Set();

  private constructor() {}

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/chat',
      verifyClient: (info) => {
        // Add any authentication logic here if needed
        return true;
      }
    });

    this.wss.on('connection', (ws, request) => {
      const { query } = parse(request.url || '', true);
      const userId = query.userId as string;
      const isAdmin = query.isAdmin === 'true';
      const connectionId = this.generateConnectionId();

      const connection: WebSocketConnection = {
        ws,
        userId,
        isAdmin,
        lastActivity: new Date()
      };

      this.connections.set(connectionId, connection);

      if (isAdmin) {
        this.adminConnections.add(connectionId);
      }

      console.log(`🔌 WebSocket connected: ${connectionId} (admin: ${isAdmin}, userId: ${userId})`);

      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'connected',
        connectionId,
        timestamp: new Date().toISOString()
      }));

      // Handle messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(connectionId, data);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        console.log(`🔌 WebSocket disconnected: ${connectionId}`);
        this.connections.delete(connectionId);
        this.adminConnections.delete(connectionId);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for ${connectionId}:`, error);
      });
    });

    // Cleanup inactive connections every 30 seconds
    setInterval(() => {
      this.cleanupInactiveConnections();
    }, 30000);

    console.log('✅ WebSocket server initialized for chat');
  }

  private generateConnectionId(): string {
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }

  private handleMessage(connectionId: string, data: any) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    connection.lastActivity = new Date();

    switch (data.type) {
      case 'ping':
        connection.ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        break;
      case 'join_conversation':
        // Handle joining a conversation room
        this.handleJoinConversation(connectionId, data.conversationId);
        break;
      case 'typing':
        // Handle typing indicators
        this.handleTyping(connectionId, data);
        break;
      default:
        console.log(`Unknown message type: ${data.type}`);
    }
  }

  private handleJoinConversation(connectionId: string, conversationId: number) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Store conversation association (you might want to extend the connection interface)
    connection.ws.send(JSON.stringify({
      type: 'joined_conversation',
      conversationId,
      timestamp: new Date().toISOString()
    }));
  }

  private handleTyping(connectionId: string, data: any) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Broadcast typing indicator to relevant participants
    // This is a simplified implementation
    this.broadcastToConversation(data.conversationId, {
      type: 'typing',
      userId: connection.userId,
      isAdmin: connection.isAdmin,
      isTyping: data.isTyping
    }, connectionId);
  }

  private broadcastToConversation(conversationId: number, message: any, excludeConnectionId?: string) {
    for (const [connId, connection] of this.connections) {
      if (connId === excludeConnectionId) continue;
      
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify({
          ...message,
          conversationId,
          timestamp: new Date().toISOString()
        }));
      }
    }
  }

  private cleanupInactiveConnections() {
    const now = new Date();
    const timeout = 5 * 60 * 1000; // 5 minutes

    for (const [connectionId, connection] of this.connections) {
      if (now.getTime() - connection.lastActivity.getTime() > timeout) {
        console.log(`🧹 Cleaning up inactive connection: ${connectionId}`);
        connection.ws.terminate();
        this.connections.delete(connectionId);
        this.adminConnections.delete(connectionId);
      }
    }
  }

  // Public methods for sending notifications
  static notifyUser(userId: string, type: string, data: any) {
    const instance = WebSocketManager.getInstance();
    
    for (const [connectionId, connection] of instance.connections) {
      if (connection.userId === userId && connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify({
          type,
          data,
          timestamp: new Date().toISOString()
        }));
      }
    }
  }

  static notifyAdmins(type: string, data: any) {
    const instance = WebSocketManager.getInstance();
    
    for (const connectionId of instance.adminConnections) {
      const connection = instance.connections.get(connectionId);
      if (connection && connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify({
          type,
          data,
          timestamp: new Date().toISOString()
        }));
      }
    }
  }

  static broadcast(type: string, data: any, excludeUserId?: string) {
    const instance = WebSocketManager.getInstance();
    
    for (const [connectionId, connection] of instance.connections) {
      if (excludeUserId && connection.userId === excludeUserId) continue;
      
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify({
          type,
          data,
          timestamp: new Date().toISOString()
        }));
      }
    }
  }

  static getConnectionStats() {
    const instance = WebSocketManager.getInstance();
    return {
      totalConnections: instance.connections.size,
      adminConnections: instance.adminConnections.size,
      userConnections: instance.connections.size - instance.adminConnections.size
    };
  }
}

export default WebSocketManager;