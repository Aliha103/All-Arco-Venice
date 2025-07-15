import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
} from "react";
import {
  X,
  MessageCircle,
  Send,
  User,
  Phone,
  Mail,
  Minimize2,
  Maximize2,
  Paperclip,
  Smile,
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
  Search,
  MoreVertical,
  Image as ImageIcon,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useIsMobile } from "../hooks/use-mobile";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { useToast } from "../hooks/use-toast";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import DOMPurify from "dompurify";

// Types
interface ChatMessage {
  id: number;
  content: string;
  senderName: string;
  isFromAdmin: boolean;
  createdAt: string;
  isRead: boolean;
  status?: "sending" | "sent" | "delivered" | "read" | "failed";
  attachments?: Attachment[];
  replyTo?: number;
  editedAt?: string;
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnailUrl?: string;
}

interface Conversation {
  id: number;
  subject: string;
  status: string;
  messages: ChatMessage[];
  unreadCount: number;
  lastActivity: string;
  participants: Participant[];
}

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  status: "online" | "offline" | "away";
  isTyping?: boolean;
}

interface ChatWidgetProps {
  className?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  theme?: "light" | "dark" | "auto";
  enableSound?: boolean;
  enableFileUpload?: boolean;
  maxFileSize?: number; // in MB
  allowedFileTypes?: string[];
}

// Security utilities - Move outside component to prevent recreation
const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "br"],
    ALLOWED_ATTR: ["href", "target"],
  });
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024;
};

// Get CSRF token - Move outside component
const getCsrfToken = () => {
  return (
    document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content") || ""
  );
};

// Stable rate limiting hook
const useRateLimit = (limit: number = 5, windowMs: number = 60000) => {
  const attemptsRef = useRef<number[]>([]);
  const limitRef = useRef(limit);
  const windowRef = useRef(windowMs);

  // Update refs if props change
  useEffect(() => {
    limitRef.current = limit;
    windowRef.current = windowMs;
  }, [limit, windowMs]);

  const isRateLimited = useCallback(() => {
    const now = Date.now();
    const recentAttempts = attemptsRef.current.filter(
      (time) => now - time < windowRef.current
    );
    return recentAttempts.length >= limitRef.current;
  }, []);

  const recordAttempt = useCallback(() => {
    const now = Date.now();
    // Clean old attempts
    attemptsRef.current = attemptsRef.current.filter(
      (time) => now - time < windowRef.current
    );
    attemptsRef.current.push(now);
  }, []);

  return { isRateLimited, recordAttempt };
};

// Position styles constant
const POSITION_STYLES = {
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "top-right": "top-4 right-4",
  "top-left": "top-4 left-4",
};

// Memoized sub-components
const ChatButton = memo(
  ({
    onClick,
    position,
    className,
    isMobile,
    unreadCount,
  }: {
    onClick: () => void;
    position: string;
    className?: string;
    isMobile: boolean;
    unreadCount: number;
  }) => (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      className={cn("fixed z-50", position, className)}
    >
      <Button
        onClick={onClick}
        className={cn(
          "rounded-full shadow-lg relative group",
          isMobile ? "w-14 h-14" : "w-16 h-16",
          "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
          "text-white border-0"
        )}
      >
        <MessageCircle
          className={cn(
            "transition-transform group-hover:scale-110",
            isMobile ? "w-6 h-6" : "w-7 h-7"
          )}
        />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Badge className="absolute -top-2 -right-2 min-w-[24px] h-6 flex items-center justify-center text-xs bg-red-500 border-2 border-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
        {unreadCount > 0 && (
          <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20" />
        )}
      </Button>
    </motion.div>
  )
);

ChatButton.displayName = "ChatButton";

// Message component
const ChatMessageItem = memo(
  ({
    message,
    index,
    onReply,
    renderMessageStatus,
  }: {
    message: ChatMessage;
    index: number;
    onReply: (message: ChatMessage) => void;
    renderMessageStatus: (status?: string) => React.ReactNode;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "flex",
        message.isFromAdmin ? "justify-start" : "justify-end"
      )}
    >
      <div
        className={cn(
          "max-w-[75%] group",
          message.isFromAdmin ? "ml-0" : "mr-0"
        )}
      >
        {message.replyTo && (
          <div className="text-xs text-gray-500 mb-1 px-3">
            Replying to message
          </div>
        )}

        <div
          className={cn(
            "rounded-2xl px-4 py-2 relative",
            message.isFromAdmin
              ? "bg-gray-100 text-gray-900 rounded-tl-sm"
              : "bg-blue-600 text-white rounded-tr-sm"
          )}
        >
          <p
            className="text-sm whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{
              __html: message.content,
            }}
          />

          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center space-x-2 p-2 rounded",
                    message.isFromAdmin
                      ? "bg-gray-200 hover:bg-gray-300"
                      : "bg-blue-700 hover:bg-blue-800"
                  )}
                >
                  <Paperclip className="w-4 h-4" />
                  <span className="text-xs truncate">{attachment.name}</span>
                </a>
              ))}
            </div>
          )}

          <div
            className={cn(
              "flex items-center justify-between mt-1 space-x-2",
              message.isFromAdmin ? "text-gray-500" : "text-blue-100"
            )}
          >
            <span className="text-xs">
              {formatTimestamp(message.createdAt)}
              {message.editedAt && " (edited)"}
            </span>
            {!message.isFromAdmin && renderMessageStatus(message.status)}
          </div>
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 mt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReply(message)}
            className="text-xs text-gray-500 hover:text-gray-700 p-1"
          >
            Reply
          </Button>
        </div>
      </div>
    </motion.div>
  )
);

ChatMessageItem.displayName = "ChatMessageItem";

// Format timestamp - Move outside component
const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Main component
const ChatWidgetComponent = ({
  className,
  position = "bottom-right",
  theme = "auto",
  enableSound = true,
  enableFileUpload = true,
  maxFileSize = 10,
  allowedFileTypes = ["image/*", "application/pdf", ".doc", ".docx"],
}: ChatWidgetProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { isRateLimited, recordAttempt } = useRateLimit();

  // Stable toast implementation
  const { toast: originalToast } = useToast();
  const toast = useCallback(
    (options: any) => {
      if (originalToast) {
        originalToast(options);
      } else {
        console.log("Toast:", options);
      }
    },
    [originalToast]
  );

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [guestInfo, setGuestInfo] = useState(() => {
    // Load guest info from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chat-guest-info');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (error) {
          console.error('Error parsing guest info:', error);
        }
      }
    }
    return { name: "", email: "" };
  });
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(enableSound);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // Save guest info to localStorage
  useEffect(() => {
    if (guestInfo.name || guestInfo.email) {
      localStorage.setItem('chat-guest-info', JSON.stringify(guestInfo));
    }
  }, [guestInfo]);

  // Save conversation to localStorage for guest users
  useEffect(() => {
    if (conversation && !user) {
      localStorage.setItem('chat-guest-conversation', JSON.stringify(conversation));
    }
  }, [conversation, user]);

  // Load guest conversation on mount
  useEffect(() => {
    if (!user && !conversation) {
      const savedConversation = localStorage.getItem('chat-guest-conversation');
      if (savedConversation) {
        try {
          const parsedConversation = JSON.parse(savedConversation);
          setConversation(parsedConversation);
          console.log('📋 Restored guest conversation from localStorage');
        } catch (error) {
          console.error('Error parsing saved conversation:', error);
        }
      }
    }
  }, [user, conversation]);

  // Clear guest conversation when tab/window closes
  useEffect(() => {
    if (!user) {
      const handleBeforeUnload = () => {
        localStorage.removeItem('chat-guest-conversation');
        localStorage.removeItem('chat-guest-info');
        console.log('🧹 Cleared guest conversation on tab close');
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [user]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageSound = useRef<HTMLAudioElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const pingIntervalRef = useRef<NodeJS.Timeout>();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize sound
  useEffect(() => {
    if (enableSound && !messageSound.current) {
      messageSound.current = new Audio("/sounds/message.mp3");
      messageSound.current.volume = 0.5;
    }
  }, [enableSound]);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (!isOpen) return;
    
    // For guest users, ensure email is provided before connecting
    if (!user?.id && !guestInfo.email) {
      console.log("⚠️ WebSocket connection skipped - guest email required");
      return;
    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const userId = user?.id || `guest_${guestInfo.email}`;
      const wsUrl = `${protocol}//${window.location.host}/ws/chat?userId=${userId}&isAdmin=false`;
      
      console.log("🔌 Connecting to WebSocket:", wsUrl);
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log("✅ WebSocket connected");
        wsRef.current = ws;
        
        // Start heartbeat
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        console.log("❌ WebSocket disconnected");
        wsRef.current = null;
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        
        // Attempt to reconnect if still open
        if (isOpen && !reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = undefined;
            connectWebSocket();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

    } catch (error) {
      console.error("Failed to create WebSocket:", error);
    }
  }, [isOpen, user?.id, guestInfo.email]);

  // Stable callbacks
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const playMessageSound = useCallback(() => {
    if (enableSound) {
      // Create a brief notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    }
  }, [enableSound]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'new_message':
        if (data.conversationId === conversation?.id) {
          setConversation(prev => prev ? {
            ...prev,
            messages: [...prev.messages, data.message]
          } : null);
          scrollToBottom();
          playMessageSound();
        }
        break;
      case 'message_status':
        // Update message status
        setConversation(prev => prev ? {
          ...prev,
          messages: prev.messages.map(msg => 
            msg.id === data.messageId ? { ...msg, status: data.status } : msg
          )
        } : null);
        break;
      case 'typing':
        if (data.conversationId === conversation?.id) {
          setTypingUsers(prev => {
            if (data.isTyping) {
              return [...prev.filter(u => u !== data.userName), data.userName];
            } else {
              return prev.filter(u => u !== data.userName);
            }
          });
        }
        break;
      case 'conversation_ended':
        if (data.conversationId === conversation?.id) {
          setConversation(prev => prev ? {
            ...prev,
            status: 'closed'
          } : null);
          toast({
            title: "Conversation ended",
            description: "This conversation has been ended by the admin.",
          });
        }
        break;
    }
  }, [conversation?.id, scrollToBottom, playMessageSound, toast]);

  // Connect WebSocket when chat opens AND when guest info changes
  useEffect(() => {
    if (isOpen) {
      // Close existing connection if guest info changes
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      connectWebSocket();
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isOpen, connectWebSocket, guestInfo.email]);


  const handleMessageChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setNewMessage(e.target.value);
      
      // Send typing indicator
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && conversation) {
        wsRef.current.send(JSON.stringify({
          type: 'typing',
          conversationId: conversation.id,
          isTyping: true,
          userName: user ? `${user.firstName} ${user.lastName}` : guestInfo.name || 'Guest'
        }));
        
        // Clear previous timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Stop typing after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && conversation) {
            wsRef.current.send(JSON.stringify({
              type: 'typing',
              conversationId: conversation.id,
              isTyping: false,
              userName: user ? `${user.firstName} ${user.lastName}` : guestInfo.name || 'Guest'
            }));
          }
        }, 2000);
      }
    },
    [conversation, user, guestInfo.name]
  );

  const handleGuestNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setGuestInfo((prev: typeof guestInfo) => ({ ...prev, name: e.target.value }));
    },
    []
  );

  const handleGuestEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setGuestInfo((prev: typeof guestInfo) => ({ ...prev, email: e.target.value }));
    },
    []
  );

  const handleReplyClick = useCallback((message: ChatMessage) => {
    setReplyingTo(message);
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);

  const clearReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // Load unread count and conversations
  useEffect(() => {
    if (user) {
      loadUnreadCount();
      loadUserConversations();
    }
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      const response = await fetch("/api/chat/unread-count", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };

  const loadUserConversations = async () => {
    try {
      const response = await fetch("/api/chat/my-conversations", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success && data.conversations.length > 0) {
        // Load the most recent active conversation
        const activeConversation = data.conversations.find((c: any) => c.status === 'active') || data.conversations[0];
        if (activeConversation) {
          loadConversationDetails(activeConversation.id);
        }
      }
    } catch (error) {
      console.error("Error loading user conversations:", error);
    }
  };

  const loadConversationDetails = async (conversationId: number) => {
    try {
      const response = await fetch(`/api/chat/conversation/${conversationId}`, {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setConversation({
          id: data.conversation.id,
          subject: data.conversation.subject,
          status: data.conversation.status,
          messages: data.messages || [],
          unreadCount: 0,
          lastActivity: data.conversation.lastMessageAt,
          participants: data.participants || [],
        });
        setShowGuestForm(false);
        scrollToBottom();
      }
    } catch (error) {
      console.error("Error loading conversation details:", error);
    }
  };

  // Handle guest form display and load guest conversations
  useEffect(() => {
    if (isOpen && !user && !conversation) {
      // Try to load guest conversation if email is available
      if (guestInfo.email) {
        loadGuestConversation(guestInfo.email);
      } else {
        setShowGuestForm(true);
      }
    } else if (!isOpen) {
      setShowGuestForm(false);
    }
  }, [isOpen, user, conversation, guestInfo.email]);

  const loadGuestConversation = async (email: string) => {
    try {
      const response = await fetch('/api/chat/guest-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      if (data.success) {
        setConversation({
          id: data.conversation.id,
          subject: data.conversation.subject,
          status: data.conversation.status,
          messages: data.messages || [],
          unreadCount: 0,
          lastActivity: data.conversation.lastMessageAt,
          participants: data.participants || [],
        });
        setShowGuestForm(false);
        scrollToBottom();
      } else {
        // No conversation found, show guest form
        setShowGuestForm(true);
      }
    } catch (error) {
      console.error("Error loading guest conversation:", error);
      setShowGuestForm(true);
    }
  };

  // File handling
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const validFiles = files.filter((file) => {
        if (!validateFileSize(file, maxFileSize)) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds ${maxFileSize}MB limit`,
            variant: "destructive",
          });
          return false;
        }
        return true;
      });

      setSelectedFiles((prev) => [...prev, ...validFiles]);
    },
    [maxFileSize, toast]
  );

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleFileButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Upload files
  const uploadFiles = useCallback(
    async (files: File[]): Promise<Attachment[]> => {
      const attachments: Attachment[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("conversationId", conversation?.id.toString() || "");

        try {
          const xhr = new XMLHttpRequest();

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const progress = (e.loaded / e.total) * 100;
              setUploadProgress((prev) => ({ ...prev, [file.name]: progress }));
            }
          };

          const response = await new Promise<any>((resolve, reject) => {
            xhr.onload = () => {
              if (xhr.status === 200) {
                resolve(JSON.parse(xhr.responseText));
              } else {
                reject(new Error("Upload failed"));
              }
            };
            xhr.onerror = reject;

            xhr.open("POST", "/api/chat/upload");
            xhr.withCredentials = true;
            xhr.send(formData);
          });

          if (response.success) {
            attachments.push(response.attachment);
          }
        } catch (error) {
          console.error("File upload error:", error);
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}`,
            variant: "destructive",
          });
        } finally {
          setUploadProgress((prev) => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
        }
      }

      return attachments;
    },
    [conversation?.id, toast]
  );

  // Start conversation
  const startConversation = useCallback(
    async (message: string) => {
      if (isRateLimited()) {
        toast({
          title: "Too many requests",
          description: "Please wait a moment before sending another message.",
          variant: "destructive",
        });
        return;
      }

      recordAttempt();
      setIsLoading(true);

      try {
        if (
          !user &&
          (!guestInfo.name.trim() || !validateEmail(guestInfo.email))
        ) {
          throw new Error("Invalid guest information");
        }

        let attachments: Attachment[] = [];
        if (selectedFiles.length > 0) {
          attachments = await uploadFiles(selectedFiles);
        }

        const sanitizedMessage = sanitizeInput(message);
        const payload = user
          ? {
              message: sanitizedMessage,
              userId: user.id,
              attachments,
            }
          : {
              message: sanitizedMessage,
              guestName: sanitizeInput(guestInfo.name),
              guestEmail: guestInfo.email,
              attachments,
            };

        const response = await fetch("/api/chat/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": getCsrfToken(),
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (data.success) {
          setConversation({
            id: data.conversationId,
            subject: data.conversation.subject,
            status: data.conversation.status,
            messages: [data.message],
            unreadCount: 0,
            lastActivity: new Date().toISOString(),
            participants: data.participants || [],
          });
          setNewMessage("");
          setSelectedFiles([]);
          setShowGuestForm(false);
          toast({
            title: "Chat started",
            description: "Your message has been sent to our team.",
          });
        } else {
          throw new Error(data.message || "Failed to start conversation");
        }
      } catch (error) {
        console.error("Error starting conversation:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to start conversation",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [
      isRateLimited,
      recordAttempt,
      user,
      guestInfo,
      selectedFiles,
      uploadFiles,
      toast,
    ]
  );

  // Send message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !conversation || isRateLimited()) {
      if (isRateLimited()) {
        toast({
          title: "Too many messages",
          description: "Please wait before sending another message.",
          variant: "destructive",
        });
      }
      return;
    }

    if (!user && !guestInfo.name.trim()) {
      setShowGuestForm(true);
      toast({
        title: "Please provide your information",
        description: "We need your name and email to assist you.",
        variant: "destructive",
      });
      return;
    }

    recordAttempt();
    const tempId = Date.now();
    const sanitizedMessage = sanitizeInput(newMessage.trim());

    const optimisticMessage: ChatMessage = {
      id: tempId,
      content: sanitizedMessage,
      senderName: user
        ? `${user.firstName} ${user.lastName}`
        : guestInfo.name || "You",
      isFromAdmin: false,
      createdAt: new Date().toISOString(),
      isRead: false,
      status: "sending",
      attachments: [],
      replyTo: replyingTo?.id,
    };

    setConversation((prev: Conversation | null) =>
      prev
        ? {
            ...prev,
            messages: [...prev.messages, optimisticMessage],
          }
        : null
    );
    setNewMessage("");
    setReplyingTo(null);
    scrollToBottom();

    try {
      let attachments: Attachment[] = [];
      if (selectedFiles.length > 0) {
        attachments = await uploadFiles(selectedFiles);
      }

      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken(),
        },
        credentials: "include",
        body: JSON.stringify({
          conversationId: conversation.id,
          content: sanitizedMessage,
          attachments,
          replyTo: replyingTo?.id,
          senderName: user ? `${user.firstName} ${user.lastName}` : guestInfo.name,
          senderEmail: user ? user.email : guestInfo.email,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setConversation((prev: Conversation | null) =>
          prev
            ? {
                ...prev,
                messages: prev.messages.map((msg) =>
                  msg.id === tempId ? { ...data.message, status: "sent" } : msg
                ),
              }
            : null
        );
        setSelectedFiles([]);
      } else {
        throw new Error(data.message || "Failed to send message");
      }
    } catch (error) {
      setConversation((prev: Conversation | null) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.map((msg) =>
                msg.id === tempId ? { ...msg, status: "failed" } : msg
              ),
            }
          : null
      );

      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Click to retry.",
        variant: "destructive",
        action: (
          <Button variant="outline" onClick={() => sendMessage()}>
            Retry
          </Button>
        ),
      });
    }
  }, [
    newMessage,
    conversation,
    isRateLimited,
    user,
    guestInfo.name,
    recordAttempt,
    replyingTo,
    selectedFiles,
    scrollToBottom,
    uploadFiles,
    toast,
  ]);

  // Handle key press
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (showGuestForm) {
          handleGuestSubmit();
        } else if (conversation) {
          sendMessage();
        } else if (!user && !showGuestForm) {
          setShowGuestForm(true);
        }
      }
    },
    [showGuestForm, conversation, sendMessage, user]
  );

  // Handle guest form submission
  const handleGuestSubmit = useCallback(() => {
    if (!guestInfo.name.trim() || !validateEmail(guestInfo.email)) {
      toast({
        title: "Invalid information",
        description: "Please provide a valid name and email address.",
        variant: "destructive",
      });
      return;
    }

    if (!newMessage.trim()) {
      toast({
        title: "Missing message",
        description: "Please enter your message.",
        variant: "destructive",
      });
      return;
    }

    startConversation(newMessage);
  }, [guestInfo, newMessage, startConversation, toast]);

  // Filter messages by search
  const filteredMessages = useMemo(() => {
    if (!conversation || !searchQuery) return conversation?.messages || [];

    return conversation.messages.filter(
      (msg) =>
        msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.senderName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversation, searchQuery]);

  // Render message status icon
  const renderMessageStatus = useCallback((status?: string) => {
    switch (status) {
      case "sending":
        return <Loader2 className="w-3 h-3 animate-spin text-gray-400" />;
      case "sent":
        return <Circle className="w-3 h-3 text-gray-400" />;
      case "delivered":
        return <CheckCircle2 className="w-3 h-3 text-gray-400" />;
      case "read":
        return <CheckCircle2 className="w-3 h-3 text-blue-500" />;
      case "failed":
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  }, []);

  // Show emoji picker placeholder
  const showEmojiPicker = useCallback(() => {
    toast({
      title: "Coming soon",
      description: "Emoji picker will be available soon!",
    });
  }, [toast]);

  // End conversation
  const endConversation = useCallback(async () => {
    if (!conversation) return;
    
    try {
      const response = await fetch(`/api/chat/admin/conversation/${conversation.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'closed' }),
      });
      
      const data = await response.json();
      if (data.success) {
        setConversation(prev => prev ? {
          ...prev,
          status: 'closed'
        } : null);
        toast({
          title: "Conversation ended",
          description: "This conversation has been ended.",
        });
      }
    } catch (error) {
      console.error("Error ending conversation:", error);
      toast({
        title: "Error",
        description: "Failed to end conversation.",
        variant: "destructive",
      });
    }
  }, [conversation, toast]);

  // Position style
  const positionStyle = POSITION_STYLES[position];

  // Render
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="chat"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={cn(
            "fixed z-50",
            isMobile
              ? "inset-0"
              : cn(positionStyle, "w-[380px] max-w-[calc(100vw-2rem)]"),
            className
          )}
        >
          <Card
            className={cn(
              "shadow-2xl border-0 overflow-hidden flex flex-col",
              isMobile
                ? "h-full rounded-none"
                : "h-[600px] max-h-[calc(100vh-2rem)] rounded-xl",
              isMinimized && !isMobile ? "h-14" : ""
            )}
          >
            {/* Header */}
            <CardHeader
              className={cn(
                "flex flex-row items-center justify-between p-4",
                "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
              )}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="w-10 h-10 border-2 border-white/20">
                    <AvatarFallback className="bg-white/20 text-white">
                      {conversation ? "👨‍💼" : "🤖"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    {conversation ? "Support Team" : "Start Conversation"}
                  </CardTitle>
                  <p className="text-xs text-white/80">
                    Online
                    {typingUsers.length > 0 &&
                      ` • ${typingUsers.join(", ")} typing...`}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSound}
                  className="text-white hover:bg-white/20 p-2"
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                </Button>

                {conversation && conversation.status !== 'closed' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={endConversation}
                    className="text-white hover:bg-white/20 p-2"
                    title="End conversation"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}

                {!isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMinimize}
                    className="text-white hover:bg-white/20 p-2"
                  >
                    {isMinimized ? (
                      <Maximize2 className="w-4 h-4" />
                    ) : (
                      <Minimize2 className="w-4 h-4" />
                    )}
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeChat}
                  className="text-white hover:bg-white/20 p-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            {!isMinimized && (
              <>
                {/* Search bar */}
                {conversation && (
                  <div className="px-4 py-2 bg-gray-50 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search messages..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pl-9 pr-3 py-1 text-sm bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Messages area */}
                <ScrollArea className="flex-1 px-4 py-4">
                  {conversation && conversation.status !== 'closed' ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center">
                        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          Today
                        </span>
                      </div>

                      {filteredMessages.map((message, index) => (
                        <ChatMessageItem
                          key={message.id}
                          message={message}
                          index={index}
                          onReply={handleReplyClick}
                          renderMessageStatus={renderMessageStatus}
                        />
                      ))}

                      {typingUsers.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex justify-start"
                        >
                          <div className="bg-gray-100 rounded-2xl px-4 py-2 rounded-tl-sm">
                            <div className="flex space-x-1">
                              <span
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0ms" }}
                              />
                              <span
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "150ms" }}
                              />
                              <span
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "300ms" }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  ) : conversation && conversation.status === 'closed' ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MessageCircle className="w-10 h-10 text-gray-600" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                          Conversation Ended
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          This conversation has been closed.
                        </p>
                        <Button
                          onClick={() => {
                            setConversation(null);
                            setNewMessage("");
                            if (!user) {
                              setShowGuestForm(true);
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Start New Conversation
                        </Button>
                      </div>
                    </div>
                  ) : showGuestForm ? (
                    <div
                      key="guest-form"
                      className="flex items-center justify-center h-full"
                    >
                      <div className="w-full max-w-sm space-y-4">
                        <div className="text-center">
                          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="w-10 h-10 text-blue-600" />
                          </div>
                          <h3 className="text-lg font-semibold">Welcome! 👋</h3>
                          <p className="text-sm text-gray-600 mt-2">
                            Please provide your details to start chatting with
                            our support team
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-700">
                              Your Name
                            </label>
                            <Input
                              value={guestInfo.name}
                              onChange={handleGuestNameChange}
                              placeholder="John Doe"
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-700">
                              Email Address
                            </label>
                            <Input
                              type="email"
                              value={guestInfo.email}
                              onChange={handleGuestEmailChange}
                              placeholder="john@example.com"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MessageCircle className="w-10 h-10 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold">
                          Start a Conversation
                        </h3>
                        <p className="text-sm text-gray-600 mt-2">
                          We're here to help! Send us a message.
                        </p>
                      </div>
                    </div>
                  )}
                </ScrollArea>

                <Separator />

                {/* Input area */}
                <div className="p-4 bg-white">
                  {/* Reply indicator */}
                  {replyingTo && (
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-1 h-8 bg-blue-600 rounded" />
                        <div>
                          <p className="text-xs text-gray-500">
                            Replying to {replyingTo.senderName}
                          </p>
                          <p className="text-sm text-gray-700 truncate">
                            {replyingTo.content.substring(0, 50)}...
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearReply}
                        className="p-1"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {/* File preview */}
                  {selectedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="relative group">
                          <div className="bg-gray-100 rounded-lg p-2 pr-8 flex items-center space-x-2">
                            {file.type.startsWith("image/") ? (
                              <ImageIcon className="w-4 h-4 text-gray-600" />
                            ) : (
                              <Paperclip className="w-4 h-4 text-gray-600" />
                            )}
                            <span className="text-xs text-gray-700 truncate max-w-[100px]">
                              {file.name}
                            </span>
                            {uploadProgress[file.name] !== undefined && (
                              <div
                                className="absolute inset-0 bg-blue-600 opacity-20 rounded-lg"
                                style={{
                                  width: `${uploadProgress[file.name]}%`,
                                }}
                              />
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="absolute -top-1 -right-1 w-5 h-5 p-0 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Input controls */}
                  <div className="flex items-end space-x-2">
                    <div className="flex-1 relative">
                      <Textarea
                        value={newMessage}
                        onChange={handleMessageChange}
                        onKeyDown={handleKeyPress}
                        placeholder={
                          showGuestForm
                            ? "Type your message..."
                            : conversation
                            ? "Type a message..."
                            : "How can we help you today?"
                        }
                        className="min-h-[44px] max-h-[120px] resize-none pr-10"
                        disabled={isLoading || conversation?.status === 'closed'}
                      />

                      {/* Emoji picker placeholder */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute bottom-2 right-2 p-1 text-gray-400 hover:text-gray-600"
                        onClick={showEmojiPicker}
                      >
                        <Smile className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-1">
                      {enableFileUpload && (
                        <>
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept={allowedFileTypes.join(",")}
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleFileButtonClick}
                            disabled={isLoading}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <Paperclip className="w-5 h-5" />
                          </Button>
                        </>
                      )}

                      <Button
                        onClick={
                          showGuestForm
                            ? handleGuestSubmit
                            : conversation
                            ? sendMessage
                            : !user
                            ? () => setShowGuestForm(true)
                            : sendMessage
                        }
                        disabled={
                          isLoading ||
                          (!newMessage.trim() && selectedFiles.length === 0) ||
                          conversation?.status === 'closed'
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </Card>
        </motion.div>
      ) : (
        <ChatButton
          key="button"
          onClick={openChat}
          position={positionStyle}
          className={className}
          isMobile={isMobile}
          unreadCount={unreadCount}
        />
      )}
    </AnimatePresence>
  );
};

// Export with memo to prevent unnecessary re-renders
export const ChatWidget = memo(ChatWidgetComponent);
