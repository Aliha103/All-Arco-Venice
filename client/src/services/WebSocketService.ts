/**
 * Professional WebSocket Service for real-time communication
 * Handles connection management, reconnection, and message routing
 */

export interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: number;
}

export interface WebSocketConfig {
  url: string;
  protocols?: string | string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export type WebSocketEventHandler = (message: WebSocketMessage) => void;
export type ConnectionStateHandler = (state: WebSocketState) => void;

export enum WebSocketState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private connectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private eventHandlers = new Map<string, WebSocketEventHandler[]>();
  private stateHandlers: ConnectionStateHandler[] = [];
  private currentState: WebSocketState = WebSocketState.DISCONNECTED;
  private isDestroyed = false;

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 2000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      ...config
    };
  }

  /**
   * Connect to WebSocket server with a delay
   */
  public connectDelayed(delay: number = 0): void {
    if (this.isDestroyed) {
      return;
    }

    if (this.connectTimer) {
      clearTimeout(this.connectTimer);
    }

    this.connectTimer = setTimeout(() => {
      this.connectImmediately();
    }, delay);
  }

  /**
   * Connect to WebSocket server immediately
   */
  public connect(): void {
    this.connectImmediately();
  }

  private connectImmediately(): void {
    if (this.isDestroyed) {
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    // If we're already connecting, don't start another connection
    if (this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    console.log('🔄 Attempting WebSocket connection to:', this.config.url);
    this.setState(WebSocketState.CONNECTING);
    
    try {
      this.ws = new WebSocket(this.config.url, this.config.protocols);
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.handleError(error);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    this.clearTimers();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.setState(WebSocketState.DISCONNECTED);
  }

  /**
   * Send message to server
   */
  public send(message: WebSocketMessage): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({
          ...message,
          timestamp: Date.now()
        }));
        return true;
      } catch (error) {
        this.handleError(error);
        return false;
      }
    }
    return false;
  }

  /**
   * Subscribe to specific message types
   */
  public on(type: string, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, []);
    }
    this.eventHandlers.get(type)!.push(handler);
  }

  /**
   * Unsubscribe from message types
   */
  public off(type: string, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Subscribe to connection state changes
   */
  public onStateChange(handler: ConnectionStateHandler): void {
    this.stateHandlers.push(handler);
  }

  /**
   * Get current connection state
   */
  public getState(): WebSocketState {
    return this.currentState;
  }

  /**
   * Check if WebSocket is connected
   */
  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.setState(WebSocketState.CONNECTED);
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('WebSocket: Failed to parse message:', error);
      }
    };

    this.ws.onclose = (event) => {
      this.clearTimers();
      
      console.log(`WebSocket closed with code: ${event.code}, reason: ${event.reason}`);
      
      if (event.code !== 1000) { // Not a normal closure
        this.setState(WebSocketState.DISCONNECTED);
        // Handle different closure codes
        if (event.code === 1006) {
          // 1006 is abnormal closure, often due to network issues
          console.warn('WebSocket closed abnormally (1006), will retry with delay');
          setTimeout(() => {
            if (!this.isDestroyed) {
              this.scheduleReconnect();
            }
          }, 2000);
        } else if (event.code !== 1001) { // 1001 is going away (page unload)
          this.scheduleReconnect();
        }
      } else {
        this.setState(WebSocketState.DISCONNECTED);
      }
    };

    this.ws.onerror = (error) => {
      this.handleError(error);
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error(`WebSocket: Error handling message type "${message.type}":`, error);
        }
      });
    }
  }

  private scheduleReconnect(): void {
    if (this.isDestroyed) {
      return;
    }

    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.setState(WebSocketState.ERROR);
      return;
    }

    this.setState(WebSocketState.RECONNECTING);
    this.reconnectAttempts++;
    
    this.reconnectTimer = setTimeout(() => {
      this.connectImmediately();
    }, this.config.reconnectInterval);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping' });
      }
    }, this.config.heartbeatInterval);
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.connectTimer) {
      clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }
  }

  private setState(state: WebSocketState): void {
    if (this.currentState !== state) {
      this.currentState = state;
      this.stateHandlers.forEach(handler => {
        try {
          handler(state);
        } catch (error) {
          console.error('WebSocket: Error in state handler:', error);
        }
      });
    }
  }

  private handleError(error: any): void {
    console.error('WebSocket error:', error);
    this.setState(WebSocketState.ERROR);
    
    // If we're not already trying to reconnect, schedule one
    if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  /**
   * Cleanup and destroy the service
   */
  public destroy(): void {
    this.isDestroyed = true;
    this.disconnect();
    this.eventHandlers.clear();
    this.stateHandlers.length = 0;
  }
}

/**
 * Create WebSocket URL based on current environment
 */
export function createWebSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const hostname = window.location.hostname;
  const port = hostname === 'localhost' || hostname === '127.0.0.1' ? '3000' : window.location.port;
  
  return `${protocol}//${hostname}:${port}/ws`;
}

/**
 * Check if the server is available before attempting WebSocket connection
 */
export async function isServerAvailable(): Promise<boolean> {
  try {
    // Try to fetch any API endpoint to check if server is available
    const response = await fetch('/api/auth/user', { 
      method: 'GET',
      timeout: 3000
    } as RequestInit);
    // Even if we get 401, it means server is available
    return response.status !== 0;
  } catch (error) {
    console.warn('Server health check failed:', error);
    return false;
  }
}
