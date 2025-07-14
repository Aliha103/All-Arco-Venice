import React, { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Send, User, Phone, Mail, Minimize2, Maximize2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useIsMobile } from '../hooks/use-mobile';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { useToast } from '../hooks/use-toast';
import { cn } from '../lib/utils';

interface ChatMessage {
  id: number;
  content: string;
  senderName: string;
  isFromAdmin: boolean;
  createdAt: string;
  isRead: boolean;
}

interface Conversation {
  id: number;
  subject: string;
  status: string;
  messages: ChatMessage[];
  unreadCount: number;
}

interface ChatWidgetProps {
  className?: string;
}

export function ChatWidget({ className }: ChatWidgetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '' });
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (isOpen && !ws) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/chat?userId=${user?.id || 'guest'}&isAdmin=false`;
      
      const websocket = new WebSocket(wsUrl);
      
      websocket.onopen = () => {
        console.log('🔌 Chat WebSocket connected');
        setWs(websocket);
      };
      
      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };
      
      websocket.onclose = () => {
        console.log('🔌 Chat WebSocket disconnected');
        setWs(null);
      };
      
      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    }
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [isOpen, user?.id]);

  // Handle WebSocket messages
  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'new_message':
        if (data.data.conversationId === conversation?.id) {
          setConversation(prev => prev ? {
            ...prev,
            messages: [...prev.messages, data.data.message]
          } : null);
          scrollToBottom();
        }
        break;
      case 'message_read':
        if (data.data.conversationId === conversation?.id) {
          setConversation(prev => prev ? {
            ...prev,
            messages: prev.messages.map(msg => 
              msg.id === data.data.messageId ? { ...msg, isRead: true } : msg
            )
          } : null);
        }
        break;
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load unread count
  useEffect(() => {
    if (user) {
      loadUnreadCount();
    }
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      const response = await fetch('/api/chat/unread-count', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  // Start new conversation
  const startConversation = async (message: string) => {
    setIsLoading(true);
    try {
      const payload = user 
        ? { message, userId: user.id }
        : { message, guestName: guestInfo.name, guestEmail: guestInfo.email };

      const response = await fetch('/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        setConversation({
          id: data.conversationId,
          subject: data.conversation.subject,
          status: data.conversation.status,
          messages: [data.message],
          unreadCount: 0
        });
        setNewMessage('');
        setShowGuestForm(false);
        toast({
          title: "Chat started",
          description: "Your message has been sent to our team."
        });
      } else {
        throw new Error(data.message || 'Failed to start conversation');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          conversationId: conversation.id,
          content: newMessage.trim()
        })
      });

      const data = await response.json();
      if (data.success) {
        setConversation(prev => prev ? {
          ...prev,
          messages: [...prev.messages, data.message]
        } : null);
        setNewMessage('');
        scrollToBottom();
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load existing conversation
  const loadConversation = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/chat/my-conversations', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success && data.conversations.length > 0) {
        const latest = data.conversations[0];
        const convResponse = await fetch(`/api/chat/conversation/${latest.id}`, {
          credentials: 'include'
        });
        const convData = await convResponse.json();
        if (convData.success) {
          setConversation({
            id: convData.conversation.id,
            subject: convData.conversation.subject,
            status: convData.conversation.status,
            messages: convData.messages,
            unreadCount: latest.unreadCount
          });
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  // Handle chat toggle
  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      if (user) {
        loadConversation();
      } else {
        setShowGuestForm(true);
      }
    }
  };

  // Handle guest form submission
  const handleGuestSubmit = () => {
    if (!guestInfo.name.trim() || !guestInfo.email.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide your name and email address.",
        variant: "destructive"
      });
      return;
    }

    if (!newMessage.trim()) {
      toast({
        title: "Missing message",
        description: "Please enter your message.",
        variant: "destructive"
      });
      return;
    }

    startConversation(newMessage);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showGuestForm) {
        handleGuestSubmit();
      } else if (conversation) {
        sendMessage();
      }
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Render mobile chat button
  if (isMobile && !isOpen) {
    return (
      <Button
        onClick={toggleChat}
        className={cn(
          "fixed bottom-4 right-4 z-50 rounded-full w-14 h-14 shadow-lg",
          "bg-blue-600 hover:bg-blue-700 text-white",
          className
        )}
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center text-xs bg-red-500">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>
    );
  }

  // Render desktop chat widget
  if (!isMobile && !isOpen) {
    return (
      <div className={cn("fixed bottom-4 right-4 z-50", className)}>
        <Button
          onClick={toggleChat}
          className="rounded-full w-14 h-14 shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
        >
          <MessageCircle className="w-6 h-6" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center text-xs bg-red-500">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  // Render chat interface
  return (
    <Card className={cn(
      "fixed z-50 shadow-xl border-0",
      isMobile 
        ? "inset-0 rounded-none" 
        : "bottom-4 right-4 w-80 h-96 rounded-lg",
      isMinimized && !isMobile ? "h-12" : "",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between p-4 bg-blue-600 text-white">
        <CardTitle className="text-sm font-medium">
          {conversation ? 'Chat Support' : 'Start Conversation'}
        </CardTitle>
        <div className="flex items-center space-x-2">
          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-blue-700 p-1"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-blue-700 p-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-full">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            {conversation ? (
              <div className="space-y-4">
                {conversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.isFromAdmin ? "justify-start" : "justify-end"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-xs rounded-lg p-3 text-sm",
                        message.isFromAdmin
                          ? "bg-gray-100 text-gray-900"
                          : "bg-blue-600 text-white"
                      )}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {message.isFromAdmin ? '👨‍💼' : '👤'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-xs">
                          {message.senderName}
                        </span>
                      </div>
                      <p>{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {formatTimestamp(message.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : showGuestForm ? (
              <div className="space-y-4">
                <div className="text-center">
                  <User className="mx-auto w-12 h-12 text-blue-600 mb-2" />
                  <h3 className="font-medium">Welcome to Our Support</h3>
                  <p className="text-sm text-gray-600">
                    Please provide your details to start a conversation
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Name</label>
                    <Input
                      value={guestInfo.name}
                      onChange={(e) => setGuestInfo(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                      className="text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <Input
                      type="email"
                      value={guestInfo.email}
                      onChange={(e) => setGuestInfo(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com"
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="mx-auto w-12 h-12 text-blue-600 mb-2" />
                  <h3 className="font-medium">No conversation yet</h3>
                  <p className="text-sm text-gray-600">
                    Start typing to begin a conversation
                  </p>
                </div>
              </div>
            )}
          </ScrollArea>

          <Separator />

          {/* Message Input */}
          <div className="p-4">
            <div className="flex space-x-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  showGuestForm 
                    ? "Type your message..." 
                    : conversation 
                    ? "Type a message..." 
                    : "How can we help you?"
                }
                className="flex-1 min-h-[40px] max-h-[120px] text-sm resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={showGuestForm ? handleGuestSubmit : sendMessage}
                disabled={isLoading || !newMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}