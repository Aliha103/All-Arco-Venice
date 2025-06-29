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
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
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

  const { data: heroImages } = useQuery<HeroImage[]>({
    queryKey: ["/api/hero-images"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
    refetchInterval: 100, // 100ms refresh for real-time image updates
  });

  const { data: messages } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
    refetchInterval: 100, // 100ms refresh for real-time messages updates
  });

  const { data: users } = useQuery<UserDetails[]>({
    queryKey: ["/api/users"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
    refetchInterval: 100, // 100ms refresh for real-time user data updates
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                  <div>
                    <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold">All Bookings</CardTitle>
                    <CardDescription className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1">
                      Manage all property bookings with real-time updates from database
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="space-y-4">
                  {bookings && bookings.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {bookings.map((booking) => (
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

          {/* Other tabs would go here */}
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

              {/* Pricing Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Pricing Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">€{selectedBooking.basePrice}</div>
                    <p className="text-sm text-blue-800">Base Price</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">€{selectedBooking.totalPrice}</div>
                    <p className="text-sm text-green-800">Total Price</p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedBooking.nights || Math.ceil((new Date(selectedBooking.checkOutDate).getTime() - new Date(selectedBooking.checkInDate).getTime()) / (1000 * 60 * 60 * 24))}
                    </div>
                    <p className="text-sm text-purple-800">Nights</p>
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
                <Button
                  onClick={() => {
                    toast({
                      title: "Feature Coming Soon",
                      description: "Booking modification will be available soon.",
                    });
                  }}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Edit Booking
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}