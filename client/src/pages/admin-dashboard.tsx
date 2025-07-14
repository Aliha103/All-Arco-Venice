import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/use-toast";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { useRealtimeConnection } from "@/hooks/useRealtimeConnection";
import { isUnauthorizedError } from "@/lib/authUtils";
import { sessionManager } from "@/lib/sessionManager";
import { hasPermission, canAccessTab, getAvailableTabs, getUserDisplayRole } from "@/utils/permissions";
import { AccessLevelBadge } from "@/components/PermissionWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import AdminProtected from "@/components/AdminProtected";
import AdminVerification from "@/components/AdminVerification";

import {
  BarChart3,
  Users,
  Calendar,
  DollarSign,
  Star,
  TrendingUp,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  Check,
  X,
  Reply,
  ArrowLeft,
  GripVertical,
  CreditCard,
  MapPin,
  PawPrint,
  Phone,
  Mail,
  User as UserIcon,
  Home,
  Sparkles,
  Heart,
  Link,
  Settings,
  Tag,
  RefreshCw,
  Play,
  Pause,
  Shield,
  Search,
  Bell,
  Activity,
  AlertCircle,
  UserPlus,
  LogIn,
  LogOut,
  CalendarX,
  Gift,
  Cake,
  Filter,
  Upload,
  MessageSquare
} from "lucide-react";

import SmoobuCalendar from "@/components/SmoobuCalendar";
import PricingTab from "@/components/PricingTab";
import PMSSettings from "@/components/PMSSettings";
import Overview from "@/components/Overview";
import Bookings from "@/components/Bookings";
import BookingInfo from "@/components/BookingInfo";
import ReviewsSection from "@/components/reviews-section";
import AdvancedTeamManagement from "@/components/AdvancedTeamManagement";
import { AdminChatDashboard } from "@/components/AdminChatDashboard";


interface Analytics {
  totalBookings: number;
  totalRevenue: number;
  occupancyRate: number;
  averageRating: number;
}

interface Booking {
  id: number;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestCountry: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  hasPet: boolean;
  paymentMethod: "online" | "property";
  totalPrice: number;
  status: string;
  confirmationCode: string;
  createdAt: string;
  bookingSource?: "direct" | "airbnb" | "booking.com" | "blocked" | "custom";
  blockReason?: string;
}


interface PricingSettings {
  basePrice: number;
  cleaningFee: number;
  petFee: number;
  discountWeekly: number;
  discountMonthly: number;
}

interface Promotion {
  id: number;
  name: string;
  discountPercentage: number;
  tag: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  description: string;
}

interface HeroImage {
  id: number;
  url: string;
  alt: string;
  title: string;
  position: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}



function AdminDashboardContent() {
  const { user, isAuthenticated, isAdmin, isLoading } = useAdminAuth();
  const { toast } = useToast();

  // All state hooks must be called unconditionally
  const [activeTab, setActiveTab] = useState("overview");
  
  // Auto-refresh functionality
  const {
    isAutoRefreshActive,
    isUsingWebSocket,
    refreshData,
    lastRefreshTime,
    refreshCount,
    toggleAutoRefresh
  } = useAutoRefresh({
    enabled: isAuthenticated && ((user as any)?.role === 'admin' || (user as any)?.role === 'team_member')
  });

  // Initialize realtime connection for real-time updates
  useRealtimeConnection();
  
  // Debug: Log available tabs

  const [pricingForm, setPricingForm] = useState({
    basePrice: 0,
    cleaningFee: 0,
    petFee: 0,
    discountWeekly: 0,
    discountMonthly: 0,
  });

  const [promotionForm, setPromotionForm] = useState({
    name: "",
    discountPercentage: 0,
    tag: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  const [heroImageForm, setHeroImageForm] = useState({
    url: "",
    alt: "",
    title: "",
    position: "main",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>("");
  const [showPromotionForm, setShowPromotionForm] = useState(false);
  const [showHeroImageForm, setShowHeroImageForm] = useState(false);

  // Drag and drop state for hero images
  const [draggedImageId, setDraggedImageId] = useState<number | null>(null);
  const [dragOverImageId, setDragOverImageId] = useState<number | null>(null);
  
  // Booking details modal state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  
  // User details modal state
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  
  // User search and filter state
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all'); // 'all', 'registered', 'unregistered'
  
  // Global search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);
  
  // User menu dropdown state
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Tab configuration - filtered by user permissions
  const allTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3, color: 'text-blue-500' },
    { id: 'bookings', label: 'Bookings', icon: Calendar, color: 'text-green-500' },
    { id: 'timeline', label: 'Calendar', icon: Calendar, color: 'text-purple-500' },
    { id: 'pricing', label: 'Pricing', icon: DollarSign, color: 'text-yellow-500' },
    { id: 'reviews', label: 'Reviews', icon: Star, color: 'text-orange-500' },
    { id: 'hero-images', label: 'Hero Images', icon: ImageIcon, color: 'text-pink-500' },
    { id: 'users', label: 'Users', icon: UserIcon, color: 'text-indigo-500' },
    { id: 'team', label: 'Team Management', icon: Users, color: 'text-cyan-500' },
    { id: 'pms', label: 'PMS', icon: Settings, color: 'text-gray-500' },
    { id: 'messages', label: 'Messages', icon: MessageSquare, color: 'text-red-500' }
  ];
  
  // Filter tabs based on user access level
  const tabs = allTabs.filter(tab => canAccessTab(user, tab.id));
  
  // Ensure active tab is accessible, default to first available tab
  useEffect(() => {
    if (tabs.length > 0 && !tabs.find(tab => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);
  

  // All data queries (must be called unconditionally)
  const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics>({
    queryKey: ["/api/analytics"],
    enabled: isAuthenticated && isAdmin,
    retry: false,
  });

  const { data: bookings, isLoading: bookingsLoading, error: bookingsError } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    enabled: isAuthenticated && isAdmin,
    retry: false,
  });

  // Authentication state is handled by AdminProtected wrapper



  const { data: pricingSettings, isLoading: pricingLoading } = useQuery<PricingSettings>({
    queryKey: ["/api/pricing-settings"],
    enabled: isAuthenticated && isAdmin,
    retry: false,
  });

  const { data: promotions, isLoading: promotionsLoading } = useQuery<Promotion[]>({
    queryKey: ["/api/promotions"],
    enabled: isAuthenticated && isAdmin,
    retry: false,
  });

  const { data: heroImages, isLoading: heroImagesLoading } = useQuery<HeroImage[]>({
    queryKey: ["/api/hero-images"],
    enabled: isAuthenticated && isAdmin,
    retry: false,
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/users"],
    enabled: isAuthenticated && isAdmin,
    retry: false,
  });

  // Fetch activity timeline for notifications
  const { data: activityTimeline = [], isLoading: timelineLoading } = useQuery({
    queryKey: ["/api/activity-timeline"],
    enabled: isAuthenticated && isAdmin,
    retry: false,
  });

  // Fetch recent reviews for notifications
  const { data: reviews = [] } = useQuery({
    queryKey: ["/api/reviews"],
    enabled: isAuthenticated && isAdmin,
    retry: false,
  });

  // Update booking status mutation
  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/bookings/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Success",
        description: "Booking status updated successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    },
  });

  // Update pricing settings mutation
  const updatePricingMutation = useMutation({
    mutationFn: async (pricingData: PricingSettings) => {
      await apiRequest("PUT", "/api/pricing-settings", pricingData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-settings"] });
      toast({
        title: "Success",
        description: "Pricing settings updated successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update pricing settings",
        variant: "destructive",
      });
    },
  });

  // Create promotion mutation
  const createPromotionMutation = useMutation({
    mutationFn: async (promotionData: Omit<Promotion, 'id'>) => {
      await apiRequest("POST", "/api/promotions", promotionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotions"] });
      setPromotionForm({
        name: "",
        discountPercentage: 0,
        tag: "",
        startDate: "",
        endDate: "",
        description: "",
      });
      setShowPromotionForm(false);
      toast({
        title: "Success",
        description: "Promotion created successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create promotion",
        variant: "destructive",
      });
    },
  });

  // Toggle promotion status mutation
  const togglePromotionMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiRequest("PUT", `/api/promotions/${id}/status`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotions"] });
      toast({
        title: "Success",
        description: "Promotion status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update promotion status",
        variant: "destructive",
      });
    },
  });

  // Delete promotion mutation
  const deletePromotionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/promotions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotions"] });
      toast({
        title: "Success",
        description: "Promotion deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to delete promotion",
        variant: "destructive",
      });
    },
  });

  // Update pricing form when data loads
  useEffect(() => {
    if (pricingSettings) {
      setPricingForm({
        basePrice: pricingSettings.basePrice,
        cleaningFee: pricingSettings.cleaningFee,
        petFee: pricingSettings.petFee,
        discountWeekly: pricingSettings.discountWeekly,
        discountMonthly: pricingSettings.discountMonthly,
      });
    }
  }, [pricingSettings]);

  // Hero image mutations
  const createHeroImageMutation = useMutation({
    mutationFn: async (imageData: { file: File; title: string; alt: string; position: string }) => {
      const formData = new FormData();
      formData.append('image', imageData.file);
      formData.append('title', imageData.title);
      formData.append('alt', imageData.alt);
      formData.append('position', imageData.position);
      formData.append('isActive', 'true');
      formData.append('displayOrder', '0');
      const response = await fetch('/api/hero-images/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-images"] });
      setHeroImageForm({
        url: "",
        alt: "",
        title: "",
        position: "main",
      });
      setSelectedFile(null);
      setUploadPreview("");
      setShowHeroImageForm(false);
      toast({
        title: "Success",
        description: "Hero image uploaded successfully",
      });
    },
    onError: (error: Error) => {
      if (error.message.includes('401')) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to upload hero image",
        variant: "destructive",
      });
    },
  });

  const updateHeroImageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<HeroImage> }) => {
      await apiRequest("PUT", `/api/hero-images/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-images"] });
      toast({
        title: "Success",
        description: "Hero image updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update hero image",
        variant: "destructive",
      });
    },
  });

  const deleteHeroImageMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/hero-images/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-images"] });
      toast({
        title: "Success",
        description: "Hero image deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to delete hero image",
        variant: "destructive",
      });
    },
  });

  const reorderHeroImageMutation = useMutation({
    mutationFn: async ({ updates }: {
      updates: { id: number; displayOrder: number }[];
    }) => {
      await apiRequest("PUT", "/api/hero-images/reorder", { updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-images"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-images/active"] });
      toast({
        title: "Success",
        description: "Image order updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to reorder images",
        variant: "destructive",
      });
    },
  });

  // Show loading state if user data is still being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state if user is null but not loading
  if (!isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load user data</p>
          <Button onClick={() => window.location.href = "/login"}>
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  // Handle file selection and preview
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
      }
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, imageId: number) => {
    setDraggedImageId(imageId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, imageId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverImageId(imageId);
  };

  const handleDragLeave = () => {
    setDragOverImageId(null);
  };

  const handleDrop = (e: React.DragEvent, targetImageId: number) => {
    e.preventDefault();
    
    if (draggedImageId && draggedImageId !== targetImageId && heroImages) {
      const sortedImages = [...heroImages].sort((a, b) => a.displayOrder - b.displayOrder);
      const draggedIndex = sortedImages.findIndex(img => img.id === draggedImageId);
      const targetIndex = sortedImages.findIndex(img => img.id === targetImageId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Create new array with reordered items
        const reorderedImages = [...sortedImages];
        const [draggedItem] = reorderedImages.splice(draggedIndex, 1);
        reorderedImages.splice(targetIndex, 0, draggedItem);
        
        // Update display orders for all affected images
        const updates = reorderedImages.map((img, index) => ({
          id: img.id,
          displayOrder: index + 1
        }));
        
        reorderHeroImageMutation.mutate({ updates });
      }
    }
    
    setDraggedImageId(null);
    setDragOverImageId(null);
  };

  // Authentication is now handled by AdminProtected wrapper


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Activity feed helper functions
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return formatDate(date.toISOString());
  };

  const formatActivityTitle = (actionType: string) => {
    const titles: Record<string, string> = {
      'created': 'New booking created',
      'cancelled': 'Booking cancelled',
      'modified': 'Booking modified',
      'blocked': 'Dates blocked',
      'checked_in': 'Guest checked in',
      'checked_out': 'Guest checked out',
      'no_show': 'Guest no-show',
      'postponed': 'Booking postponed'
    };
    return titles[actionType] || 'Activity recorded';
  };

  const getActivityDetails = (activity: any) => {
    const parts: string[] = [];
    
    if (activity.checkInDate && activity.checkOutDate) {
      parts.push(`${formatDate(activity.checkInDate)} - ${formatDate(activity.checkOutDate)}`);
    }
    
    if (activity.totalPrice) {
      parts.push(`€${parseFloat(activity.totalPrice).toFixed(0)}`);
    }
    
    if (activity.metadata?.reason) {
      parts.push(activity.metadata.reason);
    }
    
    if (activity.bookingId && activity.actionType !== 'blocked') {
      parts.push(`#${activity.bookingId}`);
    }
    
    return parts.join(' • ') || activity.description;
  };

  // Get activity feeds for notifications
  const getActivityFeeds = () => {
    const feeds: any[] = [];
    const now = new Date();

    // Add activity timeline items (last 24 hours)
    if (Array.isArray(activityTimeline) && activityTimeline.length > 0) {
      const recentActivities = activityTimeline.filter((a: any) => {
        const activityDate = new Date(a.createdAt);
        const hoursSince = (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60);
        return hoursSince <= 24; // Last 24 hours
      });

      recentActivities.forEach((activity: any) => {
        const iconMap: Record<string, any> = {
          'created': UserPlus,
          'cancelled': XCircle,
          'modified': Edit,
          'blocked': CalendarX,
          'checked_in': LogIn,
          'checked_out': LogOut,
          'no_show': AlertCircle,
          'postponed': Clock
        };

        const colorMap: Record<string, string> = {
          'created': 'text-green-600 bg-green-50',
          'cancelled': 'text-red-600 bg-red-50',
          'modified': 'text-blue-600 bg-blue-50',
          'blocked': 'text-gray-600 bg-gray-50',
          'checked_in': 'text-purple-600 bg-purple-50',
          'checked_out': 'text-indigo-600 bg-indigo-50',
          'no_show': 'text-orange-600 bg-orange-50',
          'postponed': 'text-yellow-600 bg-yellow-50'
        };

        feeds.push({
          id: `timeline-${activity.id}`,
          type: activity.actionType,
          actor: activity.performedBy || 'system',
          actorName: activity.performedBy === 'admin' ? 'Admin' : 
                     activity.performedBy === 'system' ? 'System' : 
                     activity.guestName || 'Guest',
          message: activity.description || formatActivityTitle(activity.actionType),
          details: getActivityDetails(activity),
          timestamp: formatTimeAgo(new Date(activity.createdAt)),
          icon: iconMap[activity.actionType] || Activity,
          color: colorMap[activity.actionType] || 'text-gray-600 bg-gray-50',
          time: new Date(activity.createdAt)
        });
      });
    }

    // Add recent reviews (last 48 hours)
    if (Array.isArray(reviews) && reviews.length > 0) {
      const recentReviews = reviews.filter((r: any) => {
        const reviewDate = new Date(r.createdAt);
        const hoursSince = (now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60);
        return hoursSince <= 48; // Last 48 hours
      });

      recentReviews.forEach((review: any) => {
        feeds.push({
          id: `review-${review.id}`,
          type: 'review',
          actor: 'guest',
          actorName: review.guestName,
          message: 'New review posted',
          details: `${review.rating}/5 stars • "${review.content?.substring(0, 50)}${review.content?.length > 50 ? '...' : ''}"`,
          timestamp: formatTimeAgo(new Date(review.createdAt)),
          icon: Star,
          color: 'text-yellow-600 bg-yellow-50',
          time: new Date(review.createdAt)
        });
      });
    }

    // Sort by timestamp (most recent first)
    return feeds.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 10); // Show only last 10
  };

  const notificationFeeds = getActivityFeeds();

  // Authentication checks are now handled by AdminProtected wrapper

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
<nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:scale-105"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </button>
              
              <div className="hidden md:flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p className="text-xs text-gray-500">All'Arco Property Management</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6">


              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {notificationFeeds.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute top-full right-0 mt-2 w-96 bg-white/95 backdrop-blur-lg shadow-xl rounded-xl border border-gray-200/50 z-50 transform transition-all duration-200 ease-out">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {notificationFeeds.length} updates
                        </span>
                      </div>
                      
                      <div className="max-h-80 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-300">
                        {notificationFeeds.length === 0 ? (
                          <div className="text-center py-8">
                            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-500">No recent activities</p>
                          </div>
                        ) : (
                          notificationFeeds.map((feed) => {
                            const Icon = feed.icon;
                            return (
                              <div key={feed.id} className="group flex items-start space-x-3 p-3 hover:bg-gray-50/80 rounded-lg transition-all duration-150 cursor-pointer">
                                <div className={`p-2 rounded-lg ${feed.color} flex-shrink-0 shadow-sm`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <p className="text-sm font-medium text-gray-900 leading-5">
                                      {feed.message}
                                    </p>
                                    <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                                      {feed.timestamp}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600 mt-1 leading-4">
                                    by {feed.actorName}
                                  </p>
                                  {feed.details && (
                                    <p className="text-xs text-gray-500 mt-1 leading-4 line-clamp-2">
                                      {feed.details}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                      
                      {notificationFeeds.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <button 
                            onClick={() => {
                              setActiveTab('overview');
                              setShowNotifications(false);
                              // Optional: scroll to activity section
                              setTimeout(() => {
                                const activitySection = document.getElementById('activity-section');
                                if (activitySection) {
                                  activitySection.scrollIntoView({ behavior: 'smooth' });
                                }
                              }, 100);
                            }}
                            className="group relative w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                          >
                            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <Activity className="w-4 h-4 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                            <span className="relative z-10">View all activities</span>
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full animate-pulse shadow-sm"></div>
                            <div className="absolute inset-0 rounded-lg ring-2 ring-blue-400/30 ring-offset-2 ring-offset-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 pl-4 border-l hover:bg-gray-50 rounded-lg p-2 transition-all duration-200"
                >
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                      {user?.firstName?.charAt(0) || 'A'}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                  </div>
                </button>
                
                {/* User Menu Dropdown */}
                {showUserMenu && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white/95 backdrop-blur-lg shadow-2xl rounded-xl border border-gray-200/50 z-50 transform transition-all duration-300 ease-out">
                    <div className="p-1">
                      {/* User Profile Header */}
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              {user?.firstName?.charAt(0) || 'A'}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-base font-semibold text-gray-900">{user?.firstName || 'Admin'} {user?.lastName || 'User'}</h3>
                            <p className="text-sm text-gray-500">{user?.email || 'admin@allarco.com'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1">
                                <Shield className="w-3 h-3 text-blue-500" />
                                <span className="text-xs text-blue-600 font-medium">{getUserDisplayRole(user)}</span>
                              </div>
                              <AccessLevelBadge user={user} />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Menu Items */}
                      <div className="py-2">
                        {/* Profile */}
                        <button 
                          onClick={() => {
                            setShowUserMenu(false);
                            // Navigate to settings page
                            window.location.href = 'http://localhost:3000/settings';
                          }}
                          className="group w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-all duration-200"
                        >
                          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200 transition-colors">
                            <UserIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium">Profile Settings</p>
                            <p className="text-xs text-gray-500">Manage your account</p>
                          </div>
                        </button>
                        
                        {/* Messages */}
                        <button 
                          onClick={() => {
                            setShowUserMenu(false);
                            // Add messages functionality here
                            toast({ title: "Messages", description: "Message center coming soon!" });
                          }}
                          className="group w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-all duration-200"
                        >
                          <div className="p-2 bg-green-100 text-green-600 rounded-lg group-hover:bg-green-200 transition-colors relative">
                            <Mail className="w-4 h-4" />
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium">Messages</p>
                            <p className="text-xs text-gray-500">3 unread messages</p>
                          </div>
                        </button>
                        
                        {/* Settings */}
                        <button 
                          onClick={() => {
                            setShowUserMenu(false);
                            setActiveTab('pms');
                          }}
                          className="group w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-all duration-200"
                        >
                          <div className="p-2 bg-gray-100 text-gray-600 rounded-lg group-hover:bg-gray-200 transition-colors">
                            <Settings className="w-4 h-4" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium">Settings</p>
                            <p className="text-xs text-gray-500">System preferences</p>
                          </div>
                        </button>
                      </div>
                      
                      {/* Divider */}
                      <div className="border-t border-gray-100 my-2"></div>
                      
                      {/* Logout */}
                      <div className="px-2 pb-2">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            // Smooth logout without annoying confirmations
                            toast({ 
                              title: "Signing out...", 
                              description: "See you soon!",
                              duration: 1500
                            });
                            
                            // Use session manager for proper cleanup with minimal delay
                            setTimeout(() => {
                              sessionManager.logout();
                            }, 500);
                          }}
                          className="group w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-lg"
                        >
                          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-red-400/20 to-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="p-2 bg-red-100 text-red-600 rounded-lg group-hover:bg-white/20 group-hover:text-white transition-all relative z-10">
                            <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                          </div>
                          <div className="flex-1 text-left relative z-10">
                            <p className="font-medium">Logout</p>
                            <p className="text-xs opacity-80">Sign out of admin panel</p>
                          </div>
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full opacity-0 group-hover:opacity-100 animate-pulse shadow-sm transition-opacity duration-300"></div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pb-4 pt-2">
          <div className="flex flex-wrap lg:flex-nowrap gap-2 lg:gap-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex items-center gap-3 px-6 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-gray-900 to-gray-700 text-white shadow-lg scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : tab.color} transition-colors`} />
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="ml-1 w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

        {/* TAB CONTENT SECTIONS */}
        <div className="space-y-6 px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'overview' && (
            <Overview 
              analytics={{
                totalBookings: analytics?.totalBookings || 0,
                totalRevenue: analytics?.totalRevenue || 0,
                occupancyRate: analytics?.occupancyRate || 0,
                averageRating: analytics?.averageRating || 0,
                monthlyGrowth: {
                  bookings: 12,
                  revenue: 8
                },
                todayStats: {
                  checkIns: 2,
                  checkOuts: 1,
                  newBookings: 3,
                  cancellations: 0
                }
              }}
              isRefreshing={analyticsLoading || bookingsLoading}
              onRefresh={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
                queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
              }}
            />
          )}

          

          {activeTab === 'bookings' && (
            <Bookings
              bookings={bookings}
              isLoading={bookingsLoading}
              onStatusUpdate={(bookingId, status) => {
                updateBookingMutation.mutate({ id: bookingId, status });
              }}
              onRefresh={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
              }}
              onBookingSelect={(booking) => {
                setSelectedBooking(booking);
                setShowBookingDetails(true);
              }}
            />
          )}


          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <ReviewsSection adminMode={true} />
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Booking Calendar</CardTitle>
                <CardDescription>Professional calendar view with month/list modes, color-coded booking sources, and interactive booking management</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <div className="w-full min-w-[320px]">
                  <SmoobuCalendar />
                </div>
              </CardContent>
            </Card>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="space-y-6">
            <PricingTab
              pricingForm={pricingForm}
              setPricingForm={setPricingForm}
              pricingLoading={pricingLoading}
              formatCurrency={formatCurrency}
            />
            </div>
          )}

          {activeTab === 'hero-images' && (
            <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Hero Images Management</CardTitle>
                    <CardDescription>Upload and manage property hero images</CardDescription>
                  </div>
                  <Button 
                    onClick={() => setShowHeroImageForm(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {heroImagesLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse h-32 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : (heroImages && heroImages.length > 0) ? (
                  <div className="space-y-4">
                    {heroImages.map((image: HeroImage) => (
                      <div key={image.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <img src={image.url} alt={image.alt} className="w-16 h-16 object-cover rounded" />
                            <div>
                              <h4 className="font-medium">{image.title}</h4>
                              <p className="text-sm text-gray-600">{image.alt}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={image.isActive ? "default" : "secondary"}>
                              {image.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteHeroImageMutation.mutate(image.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">No hero images uploaded yet</p>
                    <p className="text-gray-400 text-sm mb-6">Add images to showcase your property in the hero section</p>
                    <Button 
                      onClick={() => setShowHeroImageForm(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Upload Your First Image
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            </div>
          )}

          {activeTab === 'pms' && (
            <div className="space-y-6">
              <PMSSettings />
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage user accounts and permissions</CardDescription>
              </CardHeader>
              
              {/* Search and Filter Section */}
              <div className="px-6 py-4 border-b bg-gray-50/50">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Search by name or email..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="registered">Registered Only</SelectItem>
                      <SelectItem value="unregistered">Unregistered Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* User Summary Statistics */}
              {!usersLoading && users.length > 0 && (
                <div className="px-6 py-4 border-b">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">{users.length}</p>
                      <p className="text-blue-700 text-sm">Total Users</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">{users.filter(u => u.isRegistered).length}</p>
                      <p className="text-green-700 text-sm">Registered</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-gray-600">{users.filter(u => !u.isRegistered).length}</p>
                      <p className="text-gray-700 text-sm">Unregistered</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-purple-600">{users.reduce((sum, u) => sum + u.totalReferrals, 0)}</p>
                      <p className="text-purple-700 text-sm">Total Referrals</p>
                    </div>
                  </div>
                </div>
              )}
              
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  (() => {
                    const filteredUsers = users.filter(user => {
                      const matchesSearch = userSearchTerm === '' || 
                        user.firstName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                        user.lastName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                        user.email.toLowerCase().includes(userSearchTerm.toLowerCase());
                      
                      const matchesFilter = userFilter === 'all' || 
                        (userFilter === 'registered' && user.isRegistered) ||
                        (userFilter === 'unregistered' && !user.isRegistered);
                      
                      return matchesSearch && matchesFilter;
                    });
                    
                    if (filteredUsers.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 text-lg mb-2">
                            {userSearchTerm || userFilter !== 'all' ? 'No users match your criteria' : 'No users found'}
                          </p>
                          {(userSearchTerm || userFilter !== 'all') && (
                            <p className="text-gray-400 text-sm">
                              Try adjusting your search or filter settings
                            </p>
                          )}
                        </div>
                      );
                    }
                    
                    return (
                      <div className="space-y-4">
                        {filteredUsers.map(user => (
                      <div key={user.id} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                           onClick={() => {
                             setSelectedUser(user);
                             setShowUserDetails(true);
                           }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <UserIcon className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{user.firstName} {user.lastName}</h3>
                              <p className="text-gray-600">{user.email}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.isRegistered ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {user.isRegistered ? 'Registered' : 'Not Registered'}
                                </span>
                                <span>Provider: {user.provider}</span>
                                {user.country && <span>Country: {user.country}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="text-center">
                                <p className="font-semibold text-blue-600">{user.totalBookings}</p>
                                <p className="text-gray-500">Bookings</p>
                              </div>
                              <div className="text-center">
                                <p className="font-semibold text-green-600">{formatCurrency(user.totalSpent)}</p>
                                <p className="text-gray-500">Total Spent</p>
                              </div>
                              <div className="text-center">
                                <p className="font-semibold text-purple-600">{user.totalReferrals}</p>
                                <p className="text-gray-500">Referrals</p>
                              </div>
                              <div className="text-center">
                                <p className="font-semibold text-orange-600">{formatCurrency(user.credits)}</p>
                                <p className="text-gray-500">Credits</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        {user.referrerName && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Referred by:</span> {user.referrerName}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                    );
                  })()
                )}
              </CardContent>
            </Card>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-6">
              <AdvancedTeamManagement />
            </div>
          )}

        </div>
      </div>
      
      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">User Details</h2>
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* User Basic Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedUser.firstName} {selectedUser.lastName}</h3>
                    <p className="text-gray-600">{selectedUser.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedUser.isRegistered ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedUser.isRegistered ? 'Registered User' : 'Not Registered'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Auth Provider</p>
                    <p className="text-gray-600">{selectedUser.provider}</p>
                  </div>
                  {selectedUser.country && (
                    <div>
                      <p className="font-medium text-gray-700">Country</p>
                      <p className="text-gray-600">{selectedUser.country}</p>
                    </div>
                  )}
                  {selectedUser.mobileNumber && (
                    <div>
                      <p className="font-medium text-gray-700">Mobile</p>
                      <p className="text-gray-600">{selectedUser.mobileNumber}</p>
                    </div>
                  )}
                  {selectedUser.dateOfBirth && (
                    <div>
                      <p className="font-medium text-gray-700">Date of Birth</p>
                      <p className="text-gray-600">{selectedUser.dateOfBirth}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Booking Statistics */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3">Booking Statistics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedUser.totalBookings}</p>
                    <p className="text-blue-700">Total Bookings</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedUser.totalSpent)}</p>
                    <p className="text-green-700">Total Spent</p>
                  </div>
                </div>
              </div>
              
              {/* Referral Information */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-3">Referral Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-purple-700">Referral Code</p>
                    <p className="text-purple-600 font-mono">{selectedUser.referralCode}</p>
                  </div>
                  <div>
                    <p className="font-medium text-purple-700">People Referred</p>
                    <p className="text-purple-600 font-semibold">{selectedUser.totalReferrals}</p>
                  </div>
                </div>
                {selectedUser.referrerName && (
                  <div className="mt-3 pt-3 border-t border-purple-200">
                    <p className="font-medium text-purple-700">Referred By</p>
                    <p className="text-purple-600">{selectedUser.referrerName}</p>
                  </div>
                )}
              </div>
              
              {/* Credits */}
              {selectedUser.credits > 0 && (
                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 mb-3">Account Credits</h4>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(selectedUser.credits)}</p>
                    <p className="text-orange-700">Available Credits</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {showBookingDetails && selectedBooking && (
        <BookingInfo
          booking={selectedBooking}
          onClose={() => {
            setShowBookingDetails(false);
            setSelectedBooking(null);
          }}
          onStatusUpdate={(bookingId, status) => {
            updateBookingMutation.mutate({ id: bookingId, status });
          }}
        />
      )}

      {/* Hero Image Upload Dialog */}
      {showHeroImageForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Upload Hero Image</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowHeroImageForm(false);
                  setSelectedFile(null);
                  setUploadPreview("");
                  setHeroImageForm({
                    url: "",
                    alt: "",
                    title: "",
                    position: "main",
                  });
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* File Upload */}
              <div>
                <Label htmlFor="hero-image-file">Select Image</Label>
                <Input
                  id="hero-image-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="mt-1"
                />
              </div>
              
              {/* Image Preview */}
              {uploadPreview && (
                <div className="mt-4">
                  <Label>Preview</Label>
                  <div className="mt-2 border rounded-lg overflow-hidden">
                    <img 
                      src={uploadPreview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover"
                    />
                  </div>
                </div>
              )}
              
              {/* Form Fields */}
              <div>
                <Label htmlFor="hero-title">Title</Label>
                <Input
                  id="hero-title"
                  value={heroImageForm.title}
                  onChange={(e) => setHeroImageForm({ ...heroImageForm, title: e.target.value })}
                  placeholder="Enter image title"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="hero-alt">Alt Text</Label>
                <Input
                  id="hero-alt"
                  value={heroImageForm.alt}
                  onChange={(e) => setHeroImageForm({ ...heroImageForm, alt: e.target.value })}
                  placeholder="Describe the image for accessibility"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="hero-position">Position</Label>
                <Select
                  value={heroImageForm.position}
                  onValueChange={(value) => setHeroImageForm({ ...heroImageForm, position: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main Hero</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="gallery">Gallery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-3 p-6 border-t bg-gray-50">
              <Button
                variant="outline"
                onClick={() => {
                  setShowHeroImageForm(false);
                  setSelectedFile(null);
                  setUploadPreview("");
                  setHeroImageForm({
                    url: "",
                    alt: "",
                    title: "",
                    position: "main",
                  });
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedFile && heroImageForm.title && heroImageForm.alt) {
                    createHeroImageMutation.mutate({
                      file: selectedFile,
                      title: heroImageForm.title,
                      alt: heroImageForm.alt,
                      position: heroImageForm.position,
                    });
                  }
                }}
                disabled={!selectedFile || !heroImageForm.title || !heroImageForm.alt || createHeroImageMutation.isPending}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                {createHeroImageMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// AdminProtected component is imported at the top

export default function AdminDashboard() {
  return (
    <AdminProtected>
      <AdminDashboardContent />
    </AdminProtected>
  );
}
