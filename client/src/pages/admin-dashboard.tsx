import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Euro, 
  TrendingUp, 
  Star, 
  CalendarCheck,
  Plus,
  MessageSquare,
  Settings,
  Users
} from "lucide-react";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/analytics"],
    enabled: !!user && user.role === 'admin',
  });

  const { data: messages } = useQuery({
    queryKey: ["/api/messages"],
    enabled: !!user && user.role === 'admin',
  });

  const { data: unreadCount } = useQuery({
    queryKey: ["/api/messages/unread-count"],
    enabled: !!user && user.role === 'admin',
    refetchInterval: 1000, // Check every second for new messages
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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

    if (!isLoading && user && user.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin dashboard.",
        variant: "destructive",
      });
      window.location.href = "/";
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recentMessages = messages?.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your property, bookings, and guest communications</p>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {analyticsLoading ? "..." : analytics?.totalBookings || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary bg-opacity-10 rounded-full flex items-center justify-center">
                  <CalendarCheck className="text-secondary text-xl" />
                </div>
              </div>
              <p className="text-sm text-success mt-2">
                <span className="font-semibold">+12%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">
                    €{analyticsLoading ? "..." : analytics?.totalRevenue?.toLocaleString() || "0"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-success bg-opacity-10 rounded-full flex items-center justify-center">
                  <Euro className="text-success text-xl" />
                </div>
              </div>
              <p className="text-sm text-success mt-2">
                <span className="font-semibold">+8%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Occupancy Rate</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {analyticsLoading ? "..." : `${analytics?.occupancyRate || 0}%`}
                  </p>
                </div>
                <div className="w-12 h-12 bg-warning bg-opacity-10 rounded-full flex items-center justify-center">
                  <TrendingUp className="text-warning text-xl" />
                </div>
              </div>
              <p className="text-sm text-success mt-2">
                <span className="font-semibold">+5%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg. Rating</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {analyticsLoading ? "..." : analytics?.averageRating?.toFixed(1) || "0.0"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                  <Star className="text-primary text-xl" />
                </div>
              </div>
              <p className="text-sm text-success mt-2">
                <span className="font-semibold">+0.2</span> from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Messages & Communication */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Messages
                {unreadCount?.count > 0 && (
                  <span className="bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount.count}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMessages.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No messages yet</p>
                ) : (
                  recentMessages.map((message: any) => (
                    <div key={message.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold">
                          {message.senderName?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{message.senderName}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(message.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {message.content.substring(0, 60)}...
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Messages
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Response Time</span>
                  <span className="font-semibold text-success">&lt; 1 hour</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Response Rate</span>
                  <span className="font-semibold text-success">100%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Overall Rating</span>
                  <span className="font-semibold text-warning">
                    {analytics?.averageRating?.toFixed(1) || "0.0"}/5.0
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" className="h-auto p-6 justify-start">
            <div className="flex items-center space-x-3 w-full">
              <Calendar className="text-secondary text-xl" />
              <div className="text-left">
                <div className="font-semibold">Bookings</div>
                <div className="text-sm text-gray-600">View and manage all reservations</div>
              </div>
            </div>
          </Button>

          <Button variant="outline" className="h-auto p-6 justify-start">
            <div className="flex items-center space-x-3 w-full">
              <Plus className="text-success text-xl" />
              <div className="text-left">
                <div className="font-semibold">Create Booking</div>
                <div className="text-sm text-gray-600">Add new reservations manually</div>
              </div>
            </div>
          </Button>

          <Button variant="outline" className="h-auto p-6 justify-start">
            <div className="flex items-center space-x-3 w-full">
              <Calendar className="text-warning text-xl" />
              <div className="text-left">
                <div className="font-semibold">Calendar</div>
                <div className="text-sm text-gray-600">View booking calendar overview</div>
              </div>
            </div>
          </Button>

          <Button variant="outline" className="h-auto p-6 justify-start">
            <div className="flex items-center space-x-3 w-full">
              <Euro className="text-primary text-xl" />
              <div className="text-left">
                <div className="font-semibold">Pricing</div>
                <div className="text-sm text-gray-600">Manage rates and promotions</div>
              </div>
            </div>
          </Button>
        </div>
      </main>
    </div>
  );
}
