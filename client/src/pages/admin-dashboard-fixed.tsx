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
  User,
  Home
} from "lucide-react";

import SmoobuCalendar from "@/components/SmoobuCalendar";

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

interface HeroImage {
  id: number;
  url: string;
  alt: string;
  title: string;
  displayOrder: number;
  position: string;
}

interface Message {
  id: number;
  content: string;
  isFromAdmin: boolean;
  isRead: boolean;
  createdAt: string;
}

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [activeTab, setActiveTab] = useState("overview");
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
  const [draggedImageId, setDraggedImageId] = useState<number | null>(null);
  const [dragOverImageId, setDragOverImageId] = useState<number | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);

  // Data queries
  const { data: analytics } = useQuery<Analytics>({
    queryKey: ["/api/analytics"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
  });

  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
  });

  const { data: reviews } = useQuery<Review[]>({
    queryKey: ["/api/reviews"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
  });

  const { data: pricingSettings } = useQuery<PricingSettings>({
    queryKey: ["/api/pricing-settings"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
  });

  const { data: promotions } = useQuery<Promotion[]>({
    queryKey: ["/api/promotions"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
  });

  const { data: heroImages } = useQuery<HeroImage[]>({
    queryKey: ["/api/hero-images"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
  });

  const { data: messages } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
  });

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
            <TabsList className="inline-flex w-full min-w-fit sm:grid sm:grid-cols-6 lg:grid-cols-6 h-auto bg-muted/50 p-1 rounded-lg">
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
                value="messages" 
                className="flex-shrink-0 sm:flex-1 text-xs sm:text-sm lg:text-base px-3 sm:px-4 lg:px-6 py-2 sm:py-3 whitespace-nowrap transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <span className="hidden md:inline">Messages</span>
                <span className="md:hidden">Msg</span>
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

          {/* Other tabs would go here */}
        </Tabs>
      </div>
    </div>
  );
}