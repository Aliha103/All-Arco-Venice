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
  Eye
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

interface PropertyImage {
  id: number;
  url: string;
  title: string;
  order: number;
}

interface Amenity {
  id: number;
  name: string;
  icon: string;
  order: number;
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

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

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
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/analytics"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
  });

  // Bookings query
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/bookings"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
  });

  // Property images query
  const { data: propertyImages, isLoading: imagesLoading } = useQuery({
    queryKey: ["/api/property-images"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
  });

  // Amenities query
  const { data: amenities, isLoading: amenitiesLoading } = useQuery({
    queryKey: ["/api/amenities"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
    retry: false,
  });

  // Messages query
  const { data: messages, isLoading: messagesLoading } = useQuery({
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

  // Delete property image mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/property-images/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/property-images"] });
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to delete image",
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
            <TabsTrigger value="property" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Property
            </TabsTrigger>
            <TabsTrigger value="amenities" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Amenities
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
                ) : bookings?.length > 0 ? (
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
                ) : bookings?.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.map((booking: Booking) => (
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
                ) : messages?.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((message: Message) => (
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

          {/* Property Tab */}
          <TabsContent value="property" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Images</CardTitle>
                <CardDescription>Manage property photos and gallery</CardDescription>
              </CardHeader>
              <CardContent>
                {imagesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse h-48 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : propertyImages?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {propertyImages.map((image: PropertyImage) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.url}
                          alt={image.title}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteImageMutation.mutate(image.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="mt-2 text-sm font-medium">{image.title}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No images uploaded yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Amenities Tab */}
          <TabsContent value="amenities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Amenities</CardTitle>
                <CardDescription>Manage available amenities and features</CardDescription>
              </CardHeader>
              <CardContent>
                {amenitiesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : amenities?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {amenities.map((amenity: Amenity) => (
                      <div key={amenity.id} className="flex items-center gap-3 p-4 border rounded-lg">
                        <span className="text-2xl">{amenity.icon}</span>
                        <span className="font-medium">{amenity.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No amenities configured yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}