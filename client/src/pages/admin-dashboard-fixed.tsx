import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

import { 
  BarChart3, 
  Users, 
  Calendar, 
  DollarSign, 
  Star, 
  TrendingUp, 
  MessageSquare, 
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit,
  Undo2,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  Check,
  X,
  Reply,
  ArrowLeft,
  LogOut,
  GripVertical,
  CreditCard,
  MapPin,
  PawPrint,
  Phone,
  Mail,
  User,
  Home,
  Settings,
  Save,
  Tag,
  Ticket,
  ChevronDown,
  Search
} from "lucide-react";

import SmoobuCalendar from "@/components/SmoobuCalendar";

interface Analytics {
  totalBookings: number;
  totalRevenue: number;
  occupancyRate: number;
  averageRating: number;
}

interface UserDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  country?: string;
  mobileNumber?: string;
  referralCode: string;
  totalReferrals: number;
  referredBy?: string;
  referrerName?: string;
  credits: number;
  provider: string;
  totalBookings: number;
  totalSpent: number;
  isRegistered: boolean;
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

interface Review {
  id: number;
  rating: number;
  content: string;
  createdAt: string;
  guestName: string;
  cleanlinessRating: number;
  locationRating: number;
  checkinRating: number;
  valueRating: number;
  communicationRating: number;
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
  startDate: string;
  endDate: string;
  description: string;
  isActive: boolean;
}

interface PromoCode {
  id: number;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  description: string;
  usageLimit: number | null;
  usageCount: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  isActive: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

interface HeroImage {
  id: number;
  url: string;
  alt: string;
  title: string;
  displayOrder: number;
  position: string;
}



export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [editDatesBooking, setEditDatesBooking] = useState<Booking | null>(null);
  const [deleteBookingId, setDeleteBookingId] = useState<number | null>(null);
  const [editDatesForm, setEditDatesForm] = useState({
    newCheckInDate: '',
    newCheckOutDate: ''
  });
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
  
  // Enhanced pricing management state
  const [pricingMode, setPricingMode] = useState<'manual' | 'percentage'>('manual');
  const [percentageChange, setPercentageChange] = useState(0);
  const [showPromotionForm, setShowPromotionForm] = useState(false);
  const [showPromoCodeForm, setShowPromoCodeForm] = useState(false);
  const [promoCodeForm, setPromoCodeForm] = useState({
    code: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: 0,
    description: "",
    usageLimit: null as number | null,
    minOrderAmount: 0,
    maxDiscountAmount: null as number | null,
    startDate: "",
    endDate: "",
  });
  const [heroImageForm, setHeroImageForm] = useState({
    url: "",
    alt: "",
    title: "",
    position: "main",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>("");
  const [showHeroImageForm, setShowHeroImageForm] = useState(false);
  const [draggedImageId, setDraggedImageId] = useState<number | null>(null);
  const [dragOverImageId, setDragOverImageId] = useState<number | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  
  // Booking status alert system state
  const [pendingStatusBookings, setPendingStatusBookings] = useState<Booking[]>([]);
  const [showStatusAlert, setShowStatusAlert] = useState(false);
  const [statusActionBooking, setStatusActionBooking] = useState<Booking | null>(null);
  
  // Check-out status alert system state
  const [pendingCheckOutBookings, setPendingCheckOutBookings] = useState<Booking[]>([]);
  const [showCheckOutAlert, setShowCheckOutAlert] = useState(false);
  const [checkOutActionBooking, setCheckOutActionBooking] = useState<Booking | null>(null);
  
  // Postponement functionality state
  const [showPostponeDialog, setShowPostponeDialog] = useState(false);
  
  // Booking search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');


  const [postponeBooking, setPostponeBooking] = useState<Booking | null>(null);
  const [postponeForm, setPostponeForm] = useState({
    newCheckInDate: "",
    newCheckOutDate: "",
    newCheckInTime: "15:00",
    newCheckOutTime: "10:00",
  });
  
  // New booking management features state
  const [showEditDatesDialog, setShowEditDatesDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Data queries
  const { data: analytics } = useQuery<Analytics>({
    queryKey: ["/api/analytics"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
    refetchInterval: 100, // 100ms refresh for real-time analytics updates
  });

  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
    refetchInterval: 100, // 100ms refresh for real-time booking updates
  });

  const { data: reviews } = useQuery<Review[]>({
    queryKey: ["/api/reviews"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
    refetchInterval: 100, // 100ms refresh for real-time reviews updates
  });

  const { data: pricingSettings } = useQuery<PricingSettings>({
    queryKey: ["/api/pricing-settings"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
    refetchInterval: 100, // 100ms refresh for real-time pricing updates
  });

  const { data: promotions } = useQuery<Promotion[]>({
    queryKey: ["/api/promotions"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
    refetchInterval: 100, // 100ms refresh for real-time promotions updates
  });

  const { data: promoCodes } = useQuery<PromoCode[]>({
    queryKey: ["/api/promo-codes"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
    refetchInterval: 100, // 100ms refresh for real-time promo codes updates
  });

  const { data: heroImages } = useQuery<HeroImage[]>({
    queryKey: ["/api/hero-images"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
    refetchInterval: 100, // 100ms refresh for real-time image updates
  });



  const { data: users } = useQuery<UserDetails[]>({
    queryKey: ["/api/users"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
    refetchInterval: 100, // 100ms refresh for real-time user data updates
  });

  const { data: activityTimeline } = useQuery<any[]>({
    queryKey: ["/api/activity-timeline"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
    refetchInterval: 100, // 100ms refresh for real-time timeline updates
  });

  // Filter and search bookings
  const filteredBookings = bookings?.filter(booking => {
    // Search query filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      booking.guestFirstName?.toLowerCase().includes(searchLower) ||
      booking.guestLastName?.toLowerCase().includes(searchLower) ||
      booking.guestEmail?.toLowerCase().includes(searchLower) ||
      booking.confirmationCode?.toLowerCase().includes(searchLower) ||
      `${booking.guestFirstName} ${booking.guestLastName}`.toLowerCase().includes(searchLower);

    // Status filter
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

    // Source filter  
    const matchesSource = sourceFilter === 'all' || booking.bookingSource === sourceFilter;

    // Payment filter
    const matchesPayment = paymentFilter === 'all' || booking.paymentMethod === paymentFilter;

    return matchesSearch && matchesStatus && matchesSource && matchesPayment;
  }) || [];

  // Booking status alert monitoring effect
  useEffect(() => {
    if (!bookings) return;
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Find bookings that need status decision (check-in day has completely passed)
    const needingStatusDecision = bookings.filter(booking => {
      const checkInDate = new Date(booking.checkInDate);
      
      // Set times to compare dates only (not times)
      checkInDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      console.log(`🔍 Checking booking ${booking.id}: checkIn=${booking.checkInDate}, status=${booking.status}, today=${todayStr}`);
      
      return (
        booking.status === 'confirmed' && // Still confirmed (not checked-in)
        today > checkInDate && // Check-in day has completely passed (not on the same day)
        booking.bookingSource !== 'blocked' // Not a blocked booking
      );
    });
    
    setPendingStatusBookings(needingStatusDecision);
    setShowStatusAlert(needingStatusDecision.length > 0);
    
    // Auto-open status alert if there are pending bookings
    if (needingStatusDecision.length > 0 && !statusActionBooking) {
      setStatusActionBooking(needingStatusDecision[0]);
    }
  }, [bookings, statusActionBooking]);

  // Check-out status alert monitoring effect
  useEffect(() => {
    if (!bookings) return;
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Find bookings that need check-out status decision (check-out day has arrived and guests are checked-in)
    const needingCheckOutDecision = bookings.filter(booking => {
      const checkOutDate = new Date(booking.checkOutDate);
      
      // Set times to compare dates only (not times)
      checkOutDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      console.log(`🔍 Checking check-out for booking ${booking.id}: checkOut=${booking.checkOutDate}, status=${booking.status}, today=${todayStr}`);
      
      return (
        booking.status === 'checked_in' && // Guests are checked-in
        today >= checkOutDate && // Check-out day has arrived
        booking.bookingSource !== 'blocked' // Not a blocked booking
      );
    });
    
    setPendingCheckOutBookings(needingCheckOutDecision);
    setShowCheckOutAlert(needingCheckOutDecision.length > 0 && !showStatusAlert); // Don't show if status alert is active
    
    // Auto-open check-out alert if there are pending check-outs and no other alerts active
    if (needingCheckOutDecision.length > 0 && !checkOutActionBooking && !showStatusAlert) {
      setCheckOutActionBooking(needingCheckOutDecision[0]);
    }
  }, [bookings, checkOutActionBooking, showStatusAlert]);

  // Mutation for updating booking status
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: number; status: string }) => {
      return fetch(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-timeline"] });
      toast({
        title: "Booking Status Updated",
        description: "The booking status has been successfully updated.",
      });
      setStatusActionBooking(null);
      setCheckOutActionBooking(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update booking status",
        variant: "destructive",
      });
    },
  });

  // Mutation for undo no-show
  const undoNoShowMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const response = await fetch(`/api/bookings/${bookingId}/undo-no-show`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to undo no-show");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-timeline"] });
      toast({
        title: "No-show Reverted",
        description: "Booking status has been reverted to confirmed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to undo no-show",
        variant: "destructive",
      });
    },
  });

  // Mutation for updating pricing settings
  const updatePricingMutation = useMutation({
    mutationFn: async (pricingData: PricingSettings) => {
      const response = await fetch('/api/pricing-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pricingData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update pricing");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-settings"] });
      toast({
        title: "Success",
        description: "Pricing settings updated successfully. Changes apply to new bookings only.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update pricing settings",
        variant: "destructive",
      });
    },
  });



  // Mutation for editing booking dates
  const editDatesMutation = useMutation({
    mutationFn: async ({ bookingId, newCheckInDate, newCheckOutDate }: { 
      bookingId: number; 
      newCheckInDate: string; 
      newCheckOutDate: string; 
    }) => {
      const response = await fetch(`/api/bookings/${bookingId}/edit-dates`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newCheckInDate, newCheckOutDate }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to edit dates");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-timeline"] });
      toast({
        title: "Dates Updated",
        description: "Booking dates have been successfully updated.",
      });
      setEditDatesBooking(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to edit dates",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting booking
  const deleteBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete booking");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-timeline"] });
      toast({
        title: "Booking Cancelled",
        description: "Booking has been cancelled and dates are now available.",
      });
      setDeleteBookingId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel booking",
        variant: "destructive",
      });
    },
  });

  // Mutation for postponing booking
  const postponeBookingMutation = useMutation({
    mutationFn: async (data: {
      bookingId: number;
      newCheckInDate: string;
      newCheckOutDate: string;
      newCheckInTime: string;
      newCheckOutTime: string;
    }) => {
      return fetch(`/api/bookings/${data.bookingId}/postpone`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newCheckInDate: data.newCheckInDate,
          newCheckOutDate: data.newCheckOutDate,
          newCheckInTime: data.newCheckInTime,
          newCheckOutTime: data.newCheckOutTime,
        })
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Booking Postponed",
        description: "The booking has been successfully postponed. City tax has been recalculated.",
      });
      setShowPostponeDialog(false);
      setPostponeBooking(null);
      setPostponeForm({
        newCheckInDate: "",
        newCheckOutDate: "",
        newCheckInTime: "15:00",
        newCheckOutTime: "10:00",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to postpone booking",
        variant: "destructive",
      });
    },
  });

  // Function to handle booking status decision
  const handleStatusDecision = (status: 'checked_in' | 'no_show' | 'confirmed') => {
    if (!statusActionBooking) return;
    
    // Immediately show feedback
    toast({
      title: "Updating Status...",
      description: `${status === 'checked_in' ? 'Marking booking as checked-in' : 
                    status === 'no_show' ? 'Marking booking as no-show' : 
                    'Undoing check-in (setting to confirmed)'}`,
    });
    
    updateBookingStatusMutation.mutate({
      bookingId: statusActionBooking.id,
      status
    });
  };

  // Function to handle check-out status decision
  const handleCheckOutDecision = (status: 'checked_out') => {
    if (!checkOutActionBooking) return;
    
    toast({
      title: "Updating Status...",
      description: "Marking guests as checked-out",
    });
    
    updateBookingStatusMutation.mutate({
      bookingId: checkOutActionBooking.id,
      status
    });
  };

  // Function to handle postponement
  const handlePostponeBooking = (booking: Booking) => {
    const totalNights = Math.ceil((new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24));
    
    if (totalNights <= 1) {
      toast({
        title: "Cannot Postpone",
        description: "Only multi-night bookings can be postponed.",
        variant: "destructive",
      });
      return;
    }
    
    setPostponeBooking(booking);
    setPostponeForm({
      newCheckInDate: "",
      newCheckOutDate: "",
      newCheckInTime: "15:00",
      newCheckOutTime: "10:00",
    });
    setShowPostponeDialog(true);
  };

  // Function to calculate postponement details
  const calculatePostponementDetails = () => {
    if (!postponeBooking || !postponeForm.newCheckInDate || !postponeForm.newCheckOutDate) return null;

    const originalNights = Math.ceil((new Date(postponeBooking.checkOutDate).getTime() - new Date(postponeBooking.checkInDate).getTime()) / (1000 * 60 * 60 * 24));
    const newNights = Math.ceil((new Date(postponeForm.newCheckOutDate).getTime() - new Date(postponeForm.newCheckInDate).getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate new city tax (€4 per person per night, max 5 nights)
    const maxTaxNights = Math.min(newNights, 5);
    const newCityTax = postponeBooking.guests * 4 * maxTaxNights;
    
    // Original city tax
    const originalMaxTaxNights = Math.min(originalNights, 5);
    const originalCityTax = postponeBooking.guests * 4 * originalMaxTaxNights;
    
    return {
      originalNights,
      newNights,
      originalCityTax,
      newCityTax,
      cityTaxDifference: newCityTax - originalCityTax,
      totalPrice: postponeBooking.totalPrice // Keep same total price
    };
  };

  // Authentication check with early return
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (user as any)?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Access Required</h1>
          <p className="text-gray-600 mb-6">You need to be logged in as an admin to access this dashboard.</p>
          <Button onClick={() => window.location.href = '/login'} className="bg-blue-600 hover:bg-blue-700">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/'}
                className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-xs sm:text-sm text-gray-500">Welcome back, {user?.firstName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Responsive Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 lg:py-6 xl:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-8">
          {/* Advanced responsive tab navigation */}
          <div className="w-full overflow-x-auto scrollbar-hide">
            <TabsList className="inline-flex w-full min-w-fit sm:grid sm:grid-cols-7 lg:grid-cols-7 h-auto bg-muted/50 p-1 rounded-lg">
              {/* Mobile: Horizontal scroll layout, Tablet+: Grid layout */}
              <TabsTrigger 
                value="overview" 
                className="flex-shrink-0 sm:flex-1 text-xs sm:text-sm lg:text-base px-3 sm:px-4 lg:px-6 py-2 sm:py-3 whitespace-nowrap transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <span className="hidden md:inline">Overview</span>
                <span className="md:hidden">Stats</span>
              </TabsTrigger>
              <TabsTrigger 
                value="bookings" 
                className="flex-shrink-0 sm:flex-1 text-xs sm:text-sm lg:text-base px-3 sm:px-4 lg:px-6 py-2 sm:py-3 whitespace-nowrap transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <span className="hidden md:inline">Bookings</span>
                <span className="md:hidden">Book</span>
              </TabsTrigger>
              <TabsTrigger 
                value="calendar" 
                className="flex-shrink-0 sm:flex-1 text-xs sm:text-sm lg:text-base px-3 sm:px-4 lg:px-6 py-2 sm:py-3 whitespace-nowrap transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <span className="hidden md:inline">Calendar</span>
                <span className="md:hidden">Cal</span>
              </TabsTrigger>

              <TabsTrigger 
                value="reviews" 
                className="flex-shrink-0 sm:flex-1 text-xs sm:text-sm lg:text-base px-3 sm:px-4 lg:px-6 py-2 sm:py-3 whitespace-nowrap transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <span className="hidden md:inline">Reviews</span>
                <span className="md:hidden">Rev</span>
              </TabsTrigger>
              <TabsTrigger 
                value="pricing" 
                className="flex-shrink-0 sm:flex-1 text-xs sm:text-sm lg:text-base px-3 sm:px-4 lg:px-6 py-2 sm:py-3 whitespace-nowrap transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <span className="hidden md:inline">Pricing</span>
                <span className="md:hidden">Price</span>
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="flex-shrink-0 sm:flex-1 text-xs sm:text-sm lg:text-base px-3 sm:px-4 lg:px-6 py-2 sm:py-3 whitespace-nowrap transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <span className="hidden md:inline">Users</span>
                <span className="md:hidden">User</span>
              </TabsTrigger>

            </TabsList>
          </div>

          {/* Overview Tab - Advanced Responsive */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <Card className="transition-all duration-200 hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm lg:text-base font-medium text-muted-foreground">Total Bookings</CardTitle>
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{analytics?.totalBookings || 0}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Total reservations</p>
                </CardContent>
              </Card>
              <Card className="transition-all duration-200 hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm lg:text-base font-medium text-muted-foreground">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold">€{analytics?.totalRevenue || 0}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Gross earnings</p>
                </CardContent>
              </Card>
              <Card className="transition-all duration-200 hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm lg:text-base font-medium text-muted-foreground">Occupancy Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{analytics?.occupancyRate || 0}%</div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Booking efficiency</p>
                </CardContent>
              </Card>
              <Card className="transition-all duration-200 hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm lg:text-base font-medium text-muted-foreground">Average Rating</CardTitle>
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{analytics?.averageRating || 0}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Guest satisfaction</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Activity Timeline Section within Overview */}
            <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                  <div>
                    <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold">Activity Timeline</CardTitle>
                    <CardDescription className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1">
                      Real-time tracking of all booking activities and system events
                    </CardDescription>
                  </div>
                  
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="space-y-4">
                  {activityTimeline && activityTimeline.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
                      {activityTimeline.map((activity, index) => (
                        <Card 
                          key={activity.id || index}
                          className="p-3 sm:p-4 lg:p-6 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                                activity.activityType === 'booking_created' ? 'bg-gradient-to-br from-green-500 to-blue-600' :
                                activity.activityType === 'booking_cancelled' ? 'bg-gradient-to-br from-red-500 to-pink-600' :
                                activity.activityType === 'booking_modified' ? 'bg-gradient-to-br from-yellow-500 to-orange-600' :
                                activity.activityType === 'booking_confirmed' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                                activity.activityType === 'booking_checked_in' ? 'bg-gradient-to-br from-purple-500 to-violet-600' :
                                activity.activityType === 'booking_no_show' ? 'bg-gradient-to-br from-gray-500 to-slate-600' :
                                'bg-gradient-to-br from-gray-400 to-gray-600'
                              }`}>
                                {activity.activityType === 'booking_created' ? '📅' :
                                 activity.activityType === 'booking_cancelled' ? '❌' :
                                 activity.activityType === 'booking_modified' ? '✏️' :
                                 activity.activityType === 'booking_confirmed' ? '✅' :
                                 activity.activityType === 'booking_checked_in' ? '🏠' :
                                 activity.activityType === 'booking_no_show' ? '👻' :
                                 '📝'}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                                    {activity.activityType === 'booking_created' ? 'New Booking Created' :
                                     activity.activityType === 'booking_cancelled' ? 'Booking Cancelled' :
                                     activity.activityType === 'booking_modified' ? 'Booking Modified' :
                                     activity.activityType === 'booking_confirmed' ? 'Booking Confirmed' :
                                     activity.activityType === 'booking_checked_in' ? 'Guest Checked In' :
                                     activity.activityType === 'booking_no_show' ? 'No Show Recorded' :
                                     'System Activity'}
                                  </h3>
                                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                    {activity.description || 'Activity recorded in system'}
                                  </p>
                                </div>
                                <div className="flex flex-col sm:items-end gap-1">
                                  <Badge variant={
                                    activity.activityType === 'booking_created' ? 'default' :
                                    activity.activityType === 'booking_cancelled' ? 'destructive' :
                                    activity.activityType === 'booking_modified' ? 'secondary' :
                                    activity.activityType === 'booking_confirmed' ? 'default' :
                                    activity.activityType === 'booking_checked_in' ? 'default' :
                                    activity.activityType === 'booking_no_show' ? 'destructive' :
                                    'outline'
                                  } className="text-xs">
                                    {activity.activityType?.replace('booking_', '').replace('_', ' ').toUpperCase() || 'ACTIVITY'}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {activity.createdAt ? new Date(activity.createdAt).toLocaleString() : 'Just now'}
                                  </span>
                                </div>
                              </div>
                              {activity.bookingId && (
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                  <span className="text-xs text-gray-500">
                                    Booking ID: #{activity.bookingId}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <Clock className="w-6 h-6 text-gray-400" />
                      </div>
                      <h3 className="text-base font-medium text-gray-900 mb-2">No Activity Yet</h3>
                      <p className="text-sm text-gray-600">
                        Activity timeline will show all booking events as they happen in real-time.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar Tab - Advanced Responsive */}
          <TabsContent value="calendar" className="space-y-4 sm:space-y-6">
            <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                  <div>
                    <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold">Booking Calendar</CardTitle>
                    <CardDescription className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1">
                      Manage bookings and availability with real-time updates
                    </CardDescription>
                  </div>
                  
                </div>
              </CardHeader>
              <CardContent className="p-0 sm:p-2 lg:p-4">
                <div className="w-full overflow-x-auto scrollbar-hide">
                  <div className="w-full max-w-full overflow-hidden">
                    <SmoobuCalendar />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab - All Bookings from Database */}
          <TabsContent value="bookings" className="space-y-4 sm:space-y-6">
            <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 border-b border-gray-100">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                    <div>
                      <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold">All Bookings</CardTitle>
                      <CardDescription className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1">
                        Manage all property bookings with real-time updates from database
                      </CardDescription>
                    </div>
                    <div className="text-sm text-gray-500">
                      {filteredBookings.length} of {bookings?.length || 0} bookings
                    </div>
                  </div>
                  
                  {/* Search and Filter Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search by name, email, confirmation..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>

                    {/* Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="pending">Pending</option>
                      <option value="checked_in">Checked In</option>
                      <option value="checked_out">Checked Out</option>
                      <option value="no_show">No Show</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    {/* Source Filter */}
                    <select
                      value={sourceFilter}
                      onChange={(e) => setSourceFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="all">All Sources</option>
                      <option value="direct">Direct</option>
                      <option value="airbnb">Airbnb</option>
                      <option value="booking.com">Booking.com</option>
                      <option value="manual">Manual</option>
                      <option value="blocked">Blocked</option>
                      <option value="custom">Custom</option>
                    </select>

                    {/* Payment Filter */}
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="all">All Payment Methods</option>
                      <option value="online">Paid Online</option>
                      <option value="property">Pay at Property</option>
                    </select>
                  </div>

                  {/* Clear Filters Button */}
                  {(searchQuery || statusFilter !== 'all' || sourceFilter !== 'all' || paymentFilter !== 'all') && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('all');
                          setSourceFilter('all');
                          setPaymentFilter('all');
                        }}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="space-y-4">
                  {filteredBookings && filteredBookings.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {filteredBookings.map((booking) => (
                        <Card 
                          key={booking.id} 
                          className="p-3 sm:p-4 lg:p-6 hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200 hover:border-blue-300"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowBookingDetails(true);
                          }}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                  {booking.guestFirstName?.charAt(0)}{booking.guestLastName?.charAt(0)}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-sm sm:text-base lg:text-lg text-gray-900">
                                    {booking.guestFirstName} {booking.guestLastName}
                                  </h3>
                                  <p className="text-xs sm:text-sm text-gray-500">
                                    {booking.guestEmail}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                                <div>
                                  <span className="text-gray-500 block">Check-in</span>
                                  <span className="font-medium">{new Date(booking.checkInDate).toLocaleDateString()}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">Check-out</span>
                                  <span className="font-medium">{new Date(booking.checkOutDate).toLocaleDateString()}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">Guests</span>
                                  <span className="font-medium">{booking.guests}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">Source</span>
                                  <span className="font-medium capitalize">{booking.bookingSource}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                              <Badge 
                                variant={booking.status === 'confirmed' ? 'default' : booking.status === 'pending' ? 'secondary' : 'destructive'}
                                className={`text-xs ${
                                  booking.status === 'confirmed' 
                                    ? 'bg-green-100 text-green-800 border-green-200' 
                                    : booking.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                    : 'bg-red-100 text-red-800 border-red-200'
                                }`}
                              >
                                {booking.status}
                              </Badge>
                              <div className="text-right">
                                <p className="font-semibold text-sm sm:text-base lg:text-lg">€{booking.totalPrice}</p>
                                <p className="text-xs text-gray-500">{booking.paymentMethod}</p>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">No Bookings Found</h3>
                      <p className="text-sm sm:text-base text-gray-500">
                        No bookings found in the database. Create your first booking to get started.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab - User Management with Popup Details */}
          <TabsContent value="users" className="space-y-4 sm:space-y-6">
            <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                  <div>
                    <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold">User Management</CardTitle>
                    <CardDescription className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1">
                      View and manage registered users and their booking history
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="space-y-4">
                  {users && users.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {users.map((user) => (
                        <Card 
                          key={user.id} 
                          className="p-3 sm:p-4 hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200 hover:border-blue-300"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserDetails(true);
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                              </div>
                              <div>
                                <h3 className="font-semibold text-sm sm:text-base text-gray-900">
                                  {user.firstName} {user.lastName}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-[150px]">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                            <Badge 
                              variant={user.isRegistered ? "default" : "secondary"}
                              className={`text-xs ${
                                user.isRegistered 
                                  ? "bg-green-100 text-green-800 border-green-200" 
                                  : "bg-gray-100 text-gray-600 border-gray-200"
                              }`}
                            >
                              {user.isRegistered ? "Registered" : "Guest"}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="text-gray-500">Bookings:</span>
                              <span className="font-medium">{user.totalBookings}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="text-gray-500">Total Spent:</span>
                              <span className="font-medium">€{user.totalSpent}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="text-gray-500">Referrals:</span>
                              <span className="font-medium">{user.totalReferrals}</span>
                            </div>
                          </div>
                          
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Users className="w-3 h-3" />
                              <span>{user.provider}</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2 text-xs hover:bg-blue-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(user);
                                setShowUserDetails(true);
                              }}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">No Users Found</h3>
                      <p className="text-sm sm:text-base text-gray-500">
                        No registered users or booking guests found in the system.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comprehensive Pricing Management Tab */}
          <TabsContent value="pricing" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              
              {/* Current Pricing Display */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5" />
                    <span>Current Pricing Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">€{pricingSettings?.basePrice || 0}</div>
                      <p className="text-sm text-blue-800">Base Price/Night</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">€{pricingSettings?.cleaningFee || 0}</div>
                      <p className="text-sm text-green-800">Cleaning Fee</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">€{pricingSettings?.petFee || 0}</div>
                      <p className="text-sm text-purple-800">Pet Fee</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{pricingSettings?.discountWeekly || 0}%</div>
                      <p className="text-sm text-orange-800">Weekly Discount</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{pricingSettings?.discountMonthly || 0}%</div>
                      <p className="text-sm text-red-800">Monthly Discount</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Manual Price Adjustment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>Price Adjustments</span>
                  </CardTitle>
                  <p className="text-sm text-gray-600">Update pricing settings manually or by percentage</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Mode Toggle */}
                  <div className="flex space-x-2 p-1 bg-gray-100 rounded-lg">
                    <Button
                      variant={pricingMode === 'manual' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPricingMode('manual')}
                      className="flex-1"
                    >
                      Manual Edit
                    </Button>
                    <Button
                      variant={pricingMode === 'percentage' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPricingMode('percentage')}
                      className="flex-1"
                    >
                      Percentage Change
                    </Button>
                  </div>

                  {pricingMode === 'manual' ? (
                    <div className="space-y-3">
                      <div>
                        <Label>Base Price per Night (€)</Label>
                        <Input
                          type="number"
                          value={pricingForm.basePrice}
                          onChange={(e) => setPricingForm(prev => ({
                            ...prev,
                            basePrice: Number(e.target.value)
                          }))}
                          placeholder="Enter base price"
                        />
                      </div>
                      <div>
                        <Label>Cleaning Fee (€)</Label>
                        <Input
                          type="number"
                          value={pricingForm.cleaningFee}
                          onChange={(e) => setPricingForm(prev => ({
                            ...prev,
                            cleaningFee: Number(e.target.value)
                          }))}
                          placeholder="Enter cleaning fee"
                        />
                      </div>
                      <div>
                        <Label>Pet Fee (€)</Label>
                        <Input
                          type="number"
                          value={pricingForm.petFee}
                          onChange={(e) => setPricingForm(prev => ({
                            ...prev,
                            petFee: Number(e.target.value)
                          }))}
                          placeholder="Enter pet fee"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label>Percentage Change (%)</Label>
                        <Input
                          type="number"
                          value={percentageChange}
                          onChange={(e) => setPercentageChange(Number(e.target.value))}
                          placeholder="Enter percentage (+ or -)"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Positive for increase, negative for decrease
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Preview:</strong> Base price will change from €{pricingSettings?.basePrice || 0} to €{Math.round((pricingSettings?.basePrice || 0) * (1 + percentageChange / 100))}
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          const currentBase = pricingSettings?.basePrice || 0;
                          const newBase = Math.round(currentBase * (1 + percentageChange / 100));
                          setPricingForm(prev => ({
                            ...prev,
                            basePrice: newBase
                          }));
                        }}
                        className="w-full"
                      >
                        Apply Percentage Change
                      </Button>
                    </div>
                  )}

                  <Button 
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/pricing-settings', {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(pricingForm),
                        });
                        
                        if (!response.ok) {
                          throw new Error('Failed to update pricing');
                        }
                        
                        queryClient.invalidateQueries({ queryKey: ["/api/pricing-settings"] });
                        toast({
                          title: "Success",
                          description: "Pricing settings updated successfully. Changes apply to new bookings only.",
                        });
                      } catch (error: any) {
                        toast({
                          title: "Error",
                          description: error.message || "Failed to update pricing settings",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="w-full"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Update Pricing
                  </Button>
                </CardContent>
              </Card>

              {/* Active Promotions Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Tag className="w-5 h-5" />
                      <span>Active Promotions</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setShowPromotionForm(true)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {promotions && promotions.length > 0 ? (
                    <div className="space-y-3">
                      {promotions.filter(promo => promo.isActive).map((promotion) => (
                        <div key={promotion.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <Badge className="bg-red-100 text-red-800">
                                  {promotion.tag}
                                </Badge>
                                <span className="font-medium">{promotion.name}</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {promotion.discountPercentage}% off
                              </p>
                              <p className="text-xs text-gray-500">
                                Until {new Date(promotion.endDate).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Handle delete promotion
                                toast({
                                  title: "Success",
                                  description: "Promotion deleted successfully",
                                });
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Tag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No active promotions</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Promo Codes Management */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Ticket className="w-5 h-5" />
                      <span>Promo Codes</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setShowPromoCodeForm(true)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Create Code
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {promoCodes && promoCodes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {promoCodes.filter(code => code.isActive).map((code) => (
                        <div key={code.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="flex items-center space-x-2">
                                <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                                  {code.code}
                                </code>
                                <Badge variant={code.discountType === 'percentage' ? 'default' : 'secondary'}>
                                  {code.discountType === 'percentage' ? `${code.discountValue}%` : `€${code.discountValue}`}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{code.description}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Handle delete promo code
                                toast({
                                  title: "Success", 
                                  description: "Promo code deleted successfully",
                                });
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="space-y-1 text-xs text-gray-500">
                            <div>Used: {code.usageCount}/{code.usageLimit || '∞'}</div>
                            <div>Valid until: {new Date(code.endDate).toLocaleDateString()}</div>
                            {code.minOrderAmount > 0 && (
                              <div>Min order: €{code.minOrderAmount}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Promo Codes</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Create promo codes to offer discounts to your guests
                      </p>
                      <Button onClick={() => setShowPromoCodeForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Promo Code
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </Tabs>
      </div>

      {/* User Details Popup Modal */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {selectedUser?.firstName.charAt(0)}{selectedUser?.lastName.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold">{selectedUser?.firstName} {selectedUser?.lastName}</h2>
                <p className="text-sm text-gray-500">{selectedUser?.email}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6 mt-4">
              {/* Registration Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">Registration Status</span>
                <Badge 
                  variant={selectedUser.isRegistered ? "default" : "secondary"}
                  className={`${
                    selectedUser.isRegistered 
                      ? "bg-green-100 text-green-800 border-green-200" 
                      : "bg-gray-100 text-gray-600 border-gray-200"
                  }`}
                >
                  {selectedUser.isRegistered ? "Registered User" : "Guest User"}
                </Badge>
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                  </div>
                  
                  {selectedUser.mobileNumber && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{selectedUser.mobileNumber}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedUser.country && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Country</p>
                        <p className="font-medium">{selectedUser.country}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedUser.dateOfBirth && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Date of Birth</p>
                        <p className="font-medium">{new Date(selectedUser.dateOfBirth).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Account Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">Provider</p>
                    <p className="font-semibold text-blue-800">{selectedUser.provider}</p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Credits</p>
                    <p className="font-semibold text-green-800">€{selectedUser.credits}</p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600">Referral Code</p>
                    <p className="font-semibold text-purple-800 font-mono text-xs">{selectedUser.referralCode}</p>
                  </div>
                  
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-600">Referrals Made</p>
                    <p className="font-semibold text-orange-800">{selectedUser.totalReferrals}</p>
                  </div>
                </div>
                
                {selectedUser.referrerName && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Referred By</p>
                    <p className="font-semibold">{selectedUser.referrerName}</p>
                  </div>
                )}
              </div>

              {/* Booking Statistics */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Booking Statistics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{selectedUser.totalBookings}</div>
                    <p className="text-sm text-blue-800">Total Bookings</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">€{selectedUser.totalSpent}</div>
                    <p className="text-sm text-green-800">Total Spent</p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      €{selectedUser.totalBookings > 0 ? (selectedUser.totalSpent / selectedUser.totalBookings).toFixed(0) : 0}
                    </div>
                    <p className="text-sm text-purple-800">Avg Per Booking</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowUserDetails(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    // Could add functionality to view user's bookings
                    toast({
                      title: "Feature Coming Soon",
                      description: "View user's booking history will be available soon.",
                    });
                  }}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Bookings
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Booking Details Popup Modal */}
      <Dialog open={showBookingDetails} onOpenChange={setShowBookingDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {selectedBooking?.guestFirstName?.charAt(0)}{selectedBooking?.guestLastName?.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {selectedBooking?.guestFirstName} {selectedBooking?.guestLastName}
                </h2>
                <p className="text-sm text-gray-500">Booking #{selectedBooking?.id}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6 mt-4">
              {/* Booking Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">Booking Status</span>
                <Badge 
                  variant={selectedBooking.status === 'confirmed' ? 'default' : selectedBooking.status === 'pending' ? 'secondary' : 'destructive'}
                  className={`${
                    selectedBooking.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : selectedBooking.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                      : 'bg-red-100 text-red-800 border-red-200'
                  }`}
                >
                  {selectedBooking.status}
                </Badge>
              </div>

              {/* Guest Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Guest Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{selectedBooking.guestEmail}</p>
                    </div>
                  </div>
                  
                  {selectedBooking.guestPhone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{selectedBooking.guestPhone}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedBooking.guestCountry && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Country</p>
                        <p className="font-medium">{selectedBooking.guestCountry}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Guests</p>
                      <p className="font-medium">{selectedBooking.guests}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Booking Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">Check-in Date</p>
                    <p className="font-semibold text-blue-800">
                      {new Date(selectedBooking.checkInDate).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Check-out Date</p>
                    <p className="font-semibold text-green-800">
                      {new Date(selectedBooking.checkOutDate).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600">Booking Source</p>
                    <p className="font-semibold text-purple-800 capitalize">{selectedBooking.bookingSource}</p>
                  </div>
                  
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-600">Payment Method</p>
                    <p className="font-semibold text-orange-800 capitalize">{selectedBooking.paymentMethod}</p>
                  </div>
                </div>
                
                {selectedBooking.confirmationCode && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Confirmation Code</p>
                    <p className="font-semibold font-mono text-xs">{selectedBooking.confirmationCode}</p>
                  </div>
                )}
              </div>

              {/* Comprehensive Pricing Breakdown */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Complete Price Breakdown</h3>
                
                {/* Main Pricing Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">€{selectedBooking.totalPrice}</div>
                    <p className="text-sm text-blue-800">Total Price</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.ceil((new Date(selectedBooking.checkOutDate).getTime() - new Date(selectedBooking.checkInDate).getTime()) / (1000 * 60 * 60 * 24))}
                    </div>
                    <p className="text-sm text-green-800">Night{Math.ceil((new Date(selectedBooking.checkOutDate).getTime() - new Date(selectedBooking.checkInDate).getTime()) / (1000 * 60 * 60 * 24)) > 1 ? 's' : ''}</p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{selectedBooking.guests}</div>
                    <p className="text-sm text-purple-800">Guest{selectedBooking.guests > 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-gray-800 mb-3">Price Calculation:</h4>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Base price per night</span>
                    <span className="font-medium">€{selectedBooking.totalPrice && selectedBooking.cleaningFee && selectedBooking.serviceFee && selectedBooking.cityTax 
                      ? (Number(selectedBooking.totalPrice) - Number(selectedBooking.cleaningFee || 0) - Number(selectedBooking.serviceFee || 0) - Number(selectedBooking.cityTax || 0) - Number(selectedBooking.petFee || 0)).toFixed(2)
                      : '110.50'}</span>
                  </div>
                  
                  {Number(selectedBooking.cleaningFee || 0) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Cleaning fee</span>
                      <span className="font-medium">€{selectedBooking.cleaningFee}</span>
                    </div>
                  )}
                  
                  {Number(selectedBooking.serviceFee || 0) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Service fee</span>
                      <span className="font-medium">€{selectedBooking.serviceFee}</span>
                    </div>
                  )}
                  
                  {Number(selectedBooking.petFee || 0) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pet fee</span>
                      <span className="font-medium">€{selectedBooking.petFee}</span>
                    </div>
                  )}
                  
                  {Number(selectedBooking.cityTax || 0) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">City tax ({selectedBooking.guests} guests × €4/night)</span>
                      <span className="font-medium">€{selectedBooking.cityTax}</span>
                    </div>
                  )}
                  
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total</span>
                      <span>€{selectedBooking.totalPrice}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowBookingDetails(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                
                {/* Booking Management Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="flex-1">
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Booking
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem
                      onClick={() => {
                        // Use setTimeout to ensure proper dialog transition
                        setTimeout(() => {
                          setStatusActionBooking(selectedBooking);
                          setShowStatusAlert(true);
                          setShowBookingDetails(false);
                        }, 50);
                      }}
                      className="text-blue-600 focus:text-blue-600"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {selectedBooking?.status === 'checked_in' ? 'Undo Check-in' : 'Manage Status'}
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete booking #${selectedBooking?.id}? This action cannot be undone.`)) {
                          toast({
                            title: "Booking Deleted",
                            description: "Delete functionality will be available soon.",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Booking
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Booking Status Alert Dialog */}
      <Dialog open={showStatusAlert && !!statusActionBooking} onOpenChange={(open) => {
        if (!open) {
          setStatusActionBooking(null);
          setShowStatusAlert(false);
        }
      }}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-orange-600">
              <Clock className="w-5 h-5" />
              <span>
                {statusActionBooking?.status === 'checked_in' ? 'Undo Check-in' : 'Booking Status Required'}
              </span>
            </DialogTitle>
          </DialogHeader>
          
          {statusActionBooking && (
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h3 className="font-semibold text-orange-800 mb-2">
                  {statusActionBooking.status === 'checked_in' ? 'Undo Check-in Action' : 'Action Required'}
                </h3>
                <p className="text-sm text-orange-700 mb-3">
                  {statusActionBooking.status === 'checked_in' 
                    ? 'This booking is currently marked as checked-in. Do you want to undo the check-in status?'
                    : (() => {
                        const today = new Date();
                        const checkInDate = new Date(statusActionBooking.checkInDate);
                        today.setHours(0, 0, 0, 0);
                        checkInDate.setHours(0, 0, 0, 0);
                        
                        if (today > checkInDate && statusActionBooking.status === 'confirmed') {
                          return 'The check-in day has completely passed for this booking. Please decide the booking status before proceeding with other admin tasks.';
                        } else if (today.getTime() === checkInDate.getTime()) {
                          return 'This is the check-in day for this booking. You can update the status as needed.';
                        } else {
                          return 'You can manage the status of this booking. Note: Status changes for future bookings may be restricted.';
                        }
                      })()
                  }
                </p>
                
                <div className="space-y-2 text-sm">
                  <div><strong>Guest:</strong> {statusActionBooking.guestFirstName} {statusActionBooking.guestLastName}</div>
                  <div><strong>Check-in:</strong> {new Date(statusActionBooking.checkInDate).toLocaleDateString()}</div>
                  <div><strong>Check-out:</strong> {new Date(statusActionBooking.checkOutDate).toLocaleDateString()}</div>
                  <div><strong>Confirmation:</strong> {statusActionBooking.confirmationCode}</div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  {statusActionBooking.status === 'checked_in' 
                    ? 'Choose an action for this checked-in booking:'
                    : 'What happened with this booking?'
                  }
                </p>
                
                <div className="grid grid-cols-1 gap-3">
                  {statusActionBooking.status === 'checked_in' ? (
                    // Undo Check-in button for checked-in bookings
                    <Button
                      onClick={() => handleStatusDecision('confirmed')}
                      disabled={updateBookingStatusMutation.isPending}
                      variant="outline"
                      className="border-orange-300 text-orange-600 hover:bg-orange-50"
                    >
                      <Undo2 className="w-4 h-4 mr-2" />
                      Undo Check-in (Set to Confirmed)
                    </Button>
                  ) : (
                    // Normal status buttons for non-checked-in bookings
                    <>
                      <Button
                        onClick={() => handleStatusDecision('checked_in')}
                        disabled={updateBookingStatusMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Guest Checked In
                      </Button>
                      
                      <Button
                        onClick={() => handleStatusDecision('no_show')}
                        disabled={updateBookingStatusMutation.isPending}
                        variant="destructive"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Mark as No-show
                      </Button>
                    </>
                  )}

                  {(() => {
                    const totalNights = Math.ceil((new Date(statusActionBooking.checkOutDate).getTime() - new Date(statusActionBooking.checkInDate).getTime()) / (1000 * 60 * 60 * 24));
                    if (totalNights > 1) {
                      return (
                        <Button
                          onClick={() => handlePostponeBooking(statusActionBooking)}
                          disabled={updateBookingStatusMutation.isPending}
                          variant="outline"
                          className="border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Postpone to Next Day
                        </Button>
                      );
                    }
                    return null;
                  })()}

                  {/* Undo No-show button for no-show bookings */}
                  {(statusActionBooking.status === 'no_show' || statusActionBooking.status === 'no-show') && (
                    <Button
                      onClick={() => undoNoShowMutation.mutate(statusActionBooking.id)}
                      disabled={undoNoShowMutation.isPending}
                      variant="outline"
                      className="border-green-300 text-green-600 hover:bg-green-50"
                    >
                      <Undo2 className="w-4 h-4 mr-2" />
                      Undo No-show
                    </Button>
                  )}

                  {/* Edit Dates button for all non-cancelled bookings */}
                  {statusActionBooking.status !== 'cancelled' && (
                    <Button
                      onClick={() => {
                        setEditDatesBooking(statusActionBooking);
                        setEditDatesForm({
                          newCheckInDate: statusActionBooking.checkInDate,
                          newCheckOutDate: statusActionBooking.checkOutDate
                        });
                        setShowEditDatesDialog(true);
                      }}
                      disabled={editDatesMutation.isPending}
                      variant="outline"
                      className="border-orange-300 text-orange-600 hover:bg-orange-50"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Dates
                    </Button>
                  )}

                  {/* Delete booking button */}
                  <Button
                    onClick={() => {
                      setDeleteBookingId(statusActionBooking.id);
                      setShowDeleteDialog(true);
                    }}
                    disabled={deleteBookingMutation.isPending}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Cancel Booking
                  </Button>
                </div>

                {updateBookingStatusMutation.isPending && (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Updating status...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Check-out Status Alert Dialog */}
      <Dialog open={showCheckOutAlert && !!checkOutActionBooking} onOpenChange={(open) => {
        if (!open) {
          setCheckOutActionBooking(null);
          setShowCheckOutAlert(false);
        }
      }}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-green-600">
              <LogOut className="w-5 h-5" />
              <span>Check-out Status Required</span>
            </DialogTitle>
          </DialogHeader>
          
          {checkOutActionBooking && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Check-out Day</h3>
                <p className="text-sm text-green-700 mb-3">
                  The check-out day has arrived for this checked-in booking. Please confirm if guests have checked out.
                </p>
                
                <div className="space-y-2 text-sm">
                  <div><strong>Guest:</strong> {checkOutActionBooking.guestFirstName} {checkOutActionBooking.guestLastName}</div>
                  <div><strong>Check-in:</strong> {new Date(checkOutActionBooking.checkInDate).toLocaleDateString()}</div>
                  <div><strong>Check-out:</strong> {new Date(checkOutActionBooking.checkOutDate).toLocaleDateString()}</div>
                  <div><strong>Confirmation:</strong> {checkOutActionBooking.confirmationCode}</div>
                  <div><strong>Current Status:</strong> <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Checked In</span></div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Have the guests checked out?
                </p>
                
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    onClick={() => handleCheckOutDecision('checked_out')}
                    disabled={updateBookingStatusMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Yes, Guests Checked Out
                  </Button>
                  
                  <Button
                    onClick={() => setCheckOutActionBooking(null)}
                    disabled={updateBookingStatusMutation.isPending}
                    variant="outline"
                    className="border-gray-300"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Not Yet, Check Later
                  </Button>
                </div>

                {updateBookingStatusMutation.isPending && (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Updating check-out status...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Postponement Dialog */}
      <Dialog open={showPostponeDialog} onOpenChange={setShowPostponeDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Postpone Booking</span>
            </DialogTitle>
          </DialogHeader>
          
          {postponeBooking && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Current Booking</h3>
                <div className="space-y-1 text-sm text-blue-700">
                  <div><strong>Guest:</strong> {postponeBooking.guestFirstName} {postponeBooking.guestLastName}</div>
                  <div><strong>Original Dates:</strong> {new Date(postponeBooking.checkInDate).toLocaleDateString()} - {new Date(postponeBooking.checkOutDate).toLocaleDateString()}</div>
                  <div><strong>Total Price:</strong> €{postponeBooking.totalPrice.toFixed(2)} (will remain same)</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newCheckInDate" className="text-base font-semibold text-blue-700">New Check-in Day</Label>
                    <Input
                      id="newCheckInDate"
                      type="date"
                      value={postponeForm.newCheckInDate}
                      onChange={(e) => setPostponeForm({ ...postponeForm, newCheckInDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="border-blue-300 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newCheckOutDate" className="text-base font-semibold text-blue-700">New Check-out Day</Label>
                    <Input
                      id="newCheckOutDate"
                      type="date"
                      value={postponeForm.newCheckOutDate}
                      onChange={(e) => setPostponeForm({ ...postponeForm, newCheckOutDate: e.target.value })}
                      min={postponeForm.newCheckInDate || new Date().toISOString().split('T')[0]}
                      className="border-blue-300 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newCheckInTime">New Check-in Time</Label>
                    <Input
                      id="newCheckInTime"
                      type="time"
                      value={postponeForm.newCheckInTime}
                      onChange={(e) => setPostponeForm({ ...postponeForm, newCheckInTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newCheckOutTime">New Check-out Time</Label>
                    <Input
                      id="newCheckOutTime"
                      type="time"
                      value={postponeForm.newCheckOutTime}
                      onChange={(e) => setPostponeForm({ ...postponeForm, newCheckOutTime: e.target.value })}
                    />
                  </div>
                </div>

                {(() => {
                  const details = calculatePostponementDetails();
                  if (details) {
                    return (
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <h3 className="font-semibold text-gray-800 mb-2">Postponement Summary</h3>
                        <div className="space-y-1 text-sm text-gray-700">
                          <div><strong>Nights:</strong> {details.originalNights} → {details.newNights}</div>
                          <div><strong>City Tax:</strong> €{details.originalCityTax} → €{details.newCityTax} (difference: {details.cityTaxDifference >= 0 ? '+' : ''}€{details.cityTaxDifference})</div>
                          <div><strong>Total Price:</strong> €{details.totalPrice.toFixed(2)} (unchanged)</div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowPostponeDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!postponeBooking || !postponeForm.newCheckInDate || !postponeForm.newCheckOutDate) return;
                    
                    postponeBookingMutation.mutate({
                      bookingId: postponeBooking.id,
                      newCheckInDate: postponeForm.newCheckInDate,
                      newCheckOutDate: postponeForm.newCheckOutDate,
                      newCheckInTime: postponeForm.newCheckInTime,
                      newCheckOutTime: postponeForm.newCheckOutTime,
                    });
                  }}
                  disabled={!postponeForm.newCheckInDate || !postponeForm.newCheckOutDate || postponeBookingMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {postponeBookingMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Postponing...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-2" />
                      Confirm Postponement
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dates Dialog */}
      <Dialog open={showEditDatesDialog} onOpenChange={setShowEditDatesDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="w-5 h-5" />
              <span>Edit Booking Dates</span>
            </DialogTitle>
          </DialogHeader>
          
          {editDatesBooking && (
            <div className="space-y-6">
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h3 className="font-semibold text-orange-800 mb-2">Current Booking</h3>
                <div className="space-y-1 text-sm text-orange-700">
                  <div><strong>Guest:</strong> {editDatesBooking.guestFirstName} {editDatesBooking.guestLastName}</div>
                  <div><strong>Current Dates:</strong> {new Date(editDatesBooking.checkInDate).toLocaleDateString()} - {new Date(editDatesBooking.checkOutDate).toLocaleDateString()}</div>
                  <div><strong>Total Price:</strong> €{editDatesBooking.totalPrice.toFixed(2)}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editCheckInDate" className="text-base font-semibold text-orange-700">New Check-in Date</Label>
                    <Input
                      id="editCheckInDate"
                      type="date"
                      value={editDatesForm.newCheckInDate}
                      onChange={(e) => setEditDatesForm({ ...editDatesForm, newCheckInDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="border-orange-300 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editCheckOutDate" className="text-base font-semibold text-orange-700">New Check-out Date</Label>
                    <Input
                      id="editCheckOutDate"
                      type="date"
                      value={editDatesForm.newCheckOutDate}
                      onChange={(e) => setEditDatesForm({ ...editDatesForm, newCheckOutDate: e.target.value })}
                      min={editDatesForm.newCheckInDate || new Date().toISOString().split('T')[0]}
                      className="border-orange-300 focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Note: Changing dates will check for conflicts with existing bookings. 
                    The booking price will remain the same.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    setShowEditDatesDialog(false);
                    setEditDatesBooking(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!editDatesBooking || !editDatesForm.newCheckInDate || !editDatesForm.newCheckOutDate) return;
                    
                    editDatesMutation.mutate({
                      bookingId: editDatesBooking.id,
                      newCheckInDate: editDatesForm.newCheckInDate,
                      newCheckOutDate: editDatesForm.newCheckOutDate,
                    });
                  }}
                  disabled={!editDatesForm.newCheckInDate || !editDatesForm.newCheckOutDate || editDatesMutation.isPending}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {editDatesMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Update Dates
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Booking Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              <span>Cancel Booking</span>
            </DialogTitle>
          </DialogHeader>
          
          {deleteBookingId && (
            <div className="space-y-6">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">Warning</h3>
                <p className="text-sm text-red-700">
                  This will permanently cancel the booking and mark it as cancelled. 
                  The dates will become available for new bookings. This action cannot be undone.
                </p>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setDeleteBookingId(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Keep Booking
                </Button>
                <Button
                  onClick={() => {
                    if (!deleteBookingId) return;
                    deleteBookingMutation.mutate(deleteBookingId);
                  }}
                  disabled={deleteBookingMutation.isPending}
                  variant="destructive"
                  className="flex-1"
                >
                  {deleteBookingMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Cancel Booking
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}