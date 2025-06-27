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
  GripVertical
} from "lucide-react";

interface Analytics {
  totalBookings: number;
  totalRevenue: number;
  occupancyRate: number;
  averageRating: number;
}

interface Booking {
  id: number;
  guestName: string;
  email: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  pets: boolean;
  totalPrice: number;
  status: string;
  createdAt: string;
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

interface Message {
  id: number;
  name: string;
  email: string;
  content: string;
  isRead: boolean;
  isFromAdmin: boolean;
  createdAt: string;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
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
  
  // Drag and drop state for hero images
  const [draggedImageId, setDraggedImageId] = useState<number | null>(null);
  const [dragOverImageId, setDragOverImageId] = useState<number | null>(null);

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
      const draggedImage = heroImages.find(img => img.id === draggedImageId);
      const targetImage = heroImages.find(img => img.id === targetImageId);
      
      if (draggedImage && targetImage) {
        // Swap display orders
        reorderHeroImageMutation.mutate({
          draggedId: draggedImageId,
          targetId: targetImageId,
          draggedOrder: draggedImage.displayOrder,
          targetOrder: targetImage.displayOrder
        });
      }
    }
    
    setDraggedImageId(null);
    setDragOverImageId(null);
  };

  // Redirect if not admin
  useEffect(() => {
    if (!isAuthenticated || (user as any)?.role !== 'admin') {
      toast({
        title: "Unauthorized",
        description: "You need admin access to view this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [isAuthenticated, user, toast]);

  // Analytics query
  const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics>({
    queryKey: ["/api/analytics"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
  });

  // Bookings query
  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
  });

  // Reviews query
  const { data: reviews, isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: ["/api/reviews"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
  });

  // Pricing settings query
  const { data: pricingSettings, isLoading: pricingLoading } = useQuery<PricingSettings>({
    queryKey: ["/api/pricing-settings"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
  });

  // Promotions query
  const { data: promotions, isLoading: promotionsLoading } = useQuery<Promotion[]>({
    queryKey: ["/api/promotions"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
  });

  // Hero images query
  const { data: heroImages, isLoading: heroImagesLoading } = useQuery<HeroImage[]>({
    queryKey: ["/api/hero-images"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
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

  // Messages query
  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
  });

  // Update booking status mutation
  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PUT", `/api/bookings/${id}/status`, { status });
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

  // Mark message as read mutation
  const markMessageReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PUT", `/api/messages/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
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
    mutationFn: async ({ draggedId, targetId, draggedOrder, targetOrder }: {
      draggedId: number;
      targetId: number;
      draggedOrder: number;
      targetOrder: number;
    }) => {
      await apiRequest("PUT", `/api/hero-images/${draggedId}`, { displayOrder: targetOrder });
      await apiRequest("PUT", `/api/hero-images/${targetId}`, { displayOrder: draggedOrder });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-images"] });
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

  if (!isAuthenticated || (user as any)?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.firstName}! Manage your All'Arco property.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-fit">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="hero-images" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Hero Images
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {analyticsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                        <p className="text-3xl font-bold">{analytics?.totalBookings || 0}</p>
                      </div>
                      <Calendar className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                        <p className="text-3xl font-bold">{formatCurrency(analytics?.totalRevenue || 0)}</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
                        <p className="text-3xl font-bold">{Math.round(analytics?.occupancyRate || 0)}%</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Average Rating</p>
                        <p className="text-3xl font-bold">{analytics?.averageRating?.toFixed(1) || '0.0'}</p>
                      </div>
                      <Star className="w-8 h-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recent Bookings */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
                <CardDescription>Latest booking requests and confirmations</CardDescription>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                ) : (bookings && bookings.length > 0) ? (
                  <div className="space-y-4">
                    {bookings.slice(0, 5).map((booking: Booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{booking.guestName}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                          <span className="font-semibold">{formatCurrency(booking.totalPrice)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No bookings yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Bookings</CardTitle>
                <CardDescription>Manage all property bookings</CardDescription>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse h-20 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : (bookings && bookings.length > 0) ? (
                  <div className="space-y-4">
                    {bookings!.map((booking: Booking) => (
                      <div key={booking.id} className="border rounded-lg p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg">{booking.guestName}</h3>
                              <Badge className={getStatusColor(booking.status)}>
                                {booking.status}
                              </Badge>
                            </div>
                            <p className="text-gray-600">{booking.email}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Check-in: {formatDate(booking.checkIn)}</span>
                              <span>Check-out: {formatDate(booking.checkOut)}</span>
                              <span>{booking.guests} guests</span>
                              {booking.pets && <span>🐾 Pets allowed</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold">{formatCurrency(booking.totalPrice)}</span>
                            <Select
                              value={booking.status}
                              onValueChange={(status) => 
                                updateBookingMutation.mutate({ id: booking.id, status })
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No bookings yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Guest Messages</CardTitle>
                <CardDescription>Customer inquiries and communications</CardDescription>
              </CardHeader>
              <CardContent>
                {messagesLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse h-24 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : (messages && messages.length > 0) ? (
                  <div className="space-y-4">
                    {messages!.map((message: Message) => (
                      <div 
                        key={message.id} 
                        className={`border rounded-lg p-4 ${!message.isRead ? 'bg-blue-50 border-blue-200' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{message.name}</h4>
                            <p className="text-sm text-gray-600">{message.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {formatDate(message.createdAt)}
                            </span>
                            {!message.isRead && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markMessageReadMutation.mutate(message.id)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-700">{message.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No messages yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Guest Reviews</CardTitle>
                <CardDescription>View and manage guest reviews and ratings</CardDescription>
              </CardHeader>
              <CardContent>
                {reviewsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse h-32 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : (reviews && reviews.length > 0) ? (
                  <div className="space-y-4">
                    {reviews!.map((review: Review) => (
                      <div key={review.id} className="border rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-lg">{review.guestName}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-600">{review.rating}/5</span>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
                        </div>
                        
                        <p className="text-gray-700 mb-4">{review.content}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div className="text-center">
                            <p className="font-medium">Cleanliness</p>
                            <p className="text-gray-600">{review.cleanlinessRating}/5</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">Location</p>
                            <p className="text-gray-600">{review.locationRating}/5</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">Check-in</p>
                            <p className="text-gray-600">{review.checkinRating}/5</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">Value</p>
                            <p className="text-gray-600">{review.valueRating}/5</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">Communication</p>
                            <p className="text-gray-600">{review.communicationRating}/5</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No reviews yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hero Images Tab */}
          <TabsContent value="hero-images" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Hero Section Images</CardTitle>
                    <CardDescription>Manage images displayed in the main hero section of your landing page</CardDescription>
                  </div>
                  <Button onClick={() => setShowHeroImageForm(!showHeroImageForm)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Image
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Hero Image Form */}
                {showHeroImageForm && (
                  <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-medium mb-4">Add New Hero Image</h4>
                    
                    {/* File Upload Section */}
                    <div className="mb-6 space-y-4">
                      <div>
                        <Label htmlFor="imageFile">Upload Image File</Label>
                        <Input
                          id="imageFile"
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">Supported formats: JPG, PNG, GIF, WebP (Max 10MB)</p>
                      </div>
                      
                      {/* Preview */}
                      {uploadPreview && (
                        <div className="mt-4">
                          <Label>Preview</Label>
                          <div className="mt-2 border rounded-lg p-2">
                            <img 
                              src={uploadPreview} 
                              alt="Upload preview" 
                              className="max-w-full h-32 object-cover rounded"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div>
                        <Label htmlFor="imageTitle">Title</Label>
                        <Input
                          id="imageTitle"
                          value={heroImageForm.title}
                          onChange={(e) => setHeroImageForm({ ...heroImageForm, title: e.target.value })}
                          placeholder="Main bedroom"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="imageAlt">Alt Text</Label>
                        <Input
                          id="imageAlt"
                          value={heroImageForm.alt}
                          onChange={(e) => setHeroImageForm({ ...heroImageForm, alt: e.target.value })}
                          placeholder="Beautiful main bedroom with canal view"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="imageRoom">What is this image about?</Label>
                        <Select 
                          value={heroImageForm.position} 
                          onValueChange={(value) => setHeroImageForm({ ...heroImageForm, position: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select room/space type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="main">Main Bedroom</SelectItem>
                            <SelectItem value="top-right">Living Room</SelectItem>
                            <SelectItem value="top-left">Kitchen</SelectItem>
                            <SelectItem value="bottom-right">Bathroom</SelectItem>
                            <SelectItem value="bottom-left">Balcony/Outdoor</SelectItem>
                            <SelectItem value="other">Other Space</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 mt-4">
                      <Button 
                        onClick={() => {
                          // Validate form fields
                          if (!selectedFile || !heroImageForm.title || !heroImageForm.alt || !heroImageForm.position) {
                            toast({
                              title: "Validation Error",
                              description: "Please select an image file and fill in all fields",
                              variant: "destructive",
                            });
                            return;
                          }

                          createHeroImageMutation.mutate({
                            file: selectedFile,
                            title: heroImageForm.title,
                            alt: heroImageForm.alt,
                            position: heroImageForm.position
                          });
                        }}
                        disabled={createHeroImageMutation.isPending}
                      >
                        {createHeroImageMutation.isPending ? "Adding..." : "Add Image"}
                      </Button>
                      <Button variant="outline" onClick={() => setShowHeroImageForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Hero Images List */}
                {heroImagesLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse h-32 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : (heroImages && heroImages.length > 0) ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Drag and drop images to reorder them. The order here affects how they appear in the hero gallery.
                    </p>
                    {heroImages!
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((image: HeroImage, index) => (
                      <div 
                        key={image.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, image.id)}
                        onDragOver={(e) => handleDragOver(e, image.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, image.id)}
                        className={`border rounded-lg overflow-hidden transition-all duration-200 cursor-move ${
                          dragOverImageId === image.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        } ${draggedImageId === image.id ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center p-4 gap-4">
                          {/* Drag Handle */}
                          <div className="flex items-center gap-2 text-gray-400">
                            <GripVertical className="w-5 h-5" />
                            <span className="text-sm font-medium">#{index + 1}</span>
                          </div>
                          
                          {/* Image Preview */}
                          <div className="w-24 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            <img 
                              src={image.url} 
                              alt={image.alt}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = `
                                  <div class="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                                    Failed
                                  </div>
                                `;
                              }}
                            />
                          </div>
                          
                          {/* Image Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-lg truncate">{image.title}</h4>
                              <Badge 
                                className={`${image.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                              >
                                {image.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <p className="text-gray-600 text-sm truncate mb-2">{image.alt}</p>
                            <Badge variant="outline" className="text-xs">
                              {image.position === 'main' ? 'Main Bedroom' : 
                               image.position === 'top-right' ? 'Living Room' :
                               image.position === 'top-left' ? 'Kitchen' :
                               image.position === 'bottom-right' ? 'Bathroom' :
                               image.position === 'bottom-left' ? 'Balcony/Outdoor' :
                               'Other Space'}
                            </Badge>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant={image.isActive ? "destructive" : "default"}
                              onClick={() => updateHeroImageMutation.mutate({ 
                                id: image.id, 
                                data: { isActive: !image.isActive }
                              })}
                            >
                              {image.isActive ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
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
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">No hero images uploaded yet</p>
                    <p className="text-gray-400 text-sm">Add images to showcase your property in the hero section</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}