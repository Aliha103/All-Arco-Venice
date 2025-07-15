import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Search, 
  Filter, 
  Archive,
  Trash2,
  User,
  Clock,
  CheckCircle,
  Circle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
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

interface ConversationDetails {
  id: number;
  subject: string;
  status: 'active' | 'closed' | 'pending';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  guestName?: string;
  guestEmail?: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  messageCount: number;
  unreadCount: number;
  lastMessage?: ChatMessage;
  lastMessageAt: string;
  createdAt: string;
}

interface AdminChatDashboardProps {
  className?: string;
}

export function AdminChatDashboard({ className }: AdminChatDashboardProps) {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ConversationDetails[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetails | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/chat?isAdmin=true`;
    
    console.log('🔌 Admin connecting to WebSocket:', wsUrl);
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      console.log('✅ Admin Chat WebSocket connected');
      setWs(websocket);
    };
    
    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Admin received WebSocket message:', data.type, data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    websocket.onclose = () => {
      console.log('🔌 Admin Chat WebSocket disconnected');
      setWs(null);
    };
    
    websocket.onerror = (error) => {
      console.error('❌ Admin WebSocket error:', error);
    };
    
    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, []);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [searchQuery, statusFilter, priorityFilter]);

  // Handle WebSocket messages
  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'new_conversation':
        loadConversations();
        toast({
          title: "New Conversation",
          description: `New message from ${data.data.conversation.guestName || 'Guest'}`,
        });
        break;
      case 'new_message':
        if (data.data.conversationId === selectedConversation?.id) {
          setMessages(prev => [...prev, data.data.message]);
          scrollToBottom();
        }
        loadConversations();
        break;
    }
  };

  // Load conversations
  const loadConversations = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      
      const response = await fetch(`/api/chat/admin/conversations?${params}`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  // Load conversation details
  const loadConversationDetails = async (conversationId: number) => {
    try {
      const response = await fetch(`/api/chat/conversation/${conversationId}`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error loading conversation details:', error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          content: newMessage.trim()
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        scrollToBottom();
        loadConversations(); // Refresh conversation list
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

  // Update conversation status
  const updateConversationStatus = async (conversationId: number, status: string) => {
    try {
      const response = await fetch(`/api/chat/admin/conversation/${conversationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status })
      });

      const data = await response.json();
      if (data.success) {
        loadConversations();
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(prev => prev ? { ...prev, status: status as any } : null);
        }
        toast({
          title: "Status Updated",
          description: `Conversation marked as ${status}`,
        });
      }
    } catch (error) {
      console.error('Error updating conversation status:', error);
    }
  };

  // Archive conversation
  const archiveConversation = async (conversationId: number) => {
    try {
      const response = await fetch(`/api/chat/admin/conversation/${conversationId}/archive`, {
        method: 'PATCH',
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        loadConversations();
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(null);
          setMessages([]);
        }
        toast({
          title: "Conversation Archived",
          description: "Conversation has been archived",
        });
      }
    } catch (error) {
      console.error('Error archiving conversation:', error);
    }
  };

  // Select conversation
  const selectConversation = (conversation: ConversationDetails) => {
    setSelectedConversation(conversation);
    loadConversationDetails(conversation.id);
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={cn("h-full flex", className)}>
      {/* Conversation List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Chat Support</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadConversations}
              className="p-2"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Search and Filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="pl-10"
              />
            </div>
            
            <div className="flex space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
              </select>
              
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Conversation List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.map((conversation) => (
              <Card
                key={conversation.id}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-gray-50",
                  selectedConversation?.id === conversation.id && "bg-blue-50 border-blue-200"
                )}
                onClick={() => selectConversation(conversation)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          {conversation.user 
                            ? conversation.user.firstName[0] + conversation.user.lastName[0]
                            : conversation.guestName?.[0] || '?'
                          }
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium truncate">
                            {conversation.user 
                              ? `${conversation.user.firstName} ${conversation.user.lastName}`
                              : conversation.guestName || 'Guest'
                            }
                          </p>
                          <Badge 
                            variant={conversation.user ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {conversation.user ? "Registered" : "Guest"}
                          </Badge>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {conversation.user?.email || conversation.guestEmail}
                        </p>
                        <p className="text-xs text-gray-600 truncate mt-1">
                          {conversation.lastMessage?.content || conversation.subject}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <div className="flex space-x-1">
                        <Badge className={getStatusColor(conversation.status)}>
                          {conversation.status}
                        </Badge>
                        <Badge className={getPriorityColor(conversation.priority)}>
                          {conversation.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatTimestamp(conversation.lastMessageAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {selectedConversation.user 
                        ? selectedConversation.user.firstName[0] + selectedConversation.user.lastName[0]
                        : selectedConversation.guestName?.[0] || '?'
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">
                        {selectedConversation.user 
                          ? `${selectedConversation.user.firstName} ${selectedConversation.user.lastName}`
                          : selectedConversation.guestName || 'Guest'
                        }
                      </h3>
                      <Badge 
                        variant={selectedConversation.user ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {selectedConversation.user ? "Registered" : "Guest"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.user?.email || selectedConversation.guestEmail}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(selectedConversation.status)}>
                    {selectedConversation.status}
                  </Badge>
                  <Badge className={getPriorityColor(selectedConversation.priority)}>
                    {selectedConversation.priority}
                  </Badge>
                  
                  {selectedConversation.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateConversationStatus(selectedConversation.id, 'closed')}
                    >
                      Close
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => archiveConversation(selectedConversation.id)}
                  >
                    <Archive className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.isFromAdmin ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-xs rounded-lg p-3 text-sm",
                        message.isFromAdmin
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      )}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-xs">
                          {message.senderName}
                        </span>
                        {message.isRead && (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        )}
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
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your reply..."
                  className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="mx-auto w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500">
                Choose a conversation from the list to start responding
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}