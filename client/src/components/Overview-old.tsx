import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  Activity,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  UserPlus,
  UserCheck,
  Ban,
  CalendarX,
  CalendarCheck,
  Bell,
  LogIn,
  LogOut,
  Filter,
  Star,
  MessageCircle,
  Edit3,
  Lock
} from 'lucide-react';

// Types
interface FeedItem {
  id: string;
  type: 'booking' | 'cancellation' | 'modification' | 'block' | 'check-in' | 'check-out' | 'alert' | 'price-change';
  title: string;
  description: string;
  timestamp: Date;
  actor: {
    type: 'admin' | 'guest' | 'system';
    name: string;
    email?: string;
  };
  metadata?: {
    bookingId?: string;
    guestName?: string;
    dates?: string;
    amount?: number;
    oldAmount?: number;
    reason?: string;
  };
  severity?: 'info' | 'warning' | 'error' | 'success';
}

interface Analytics {
  totalBookings: number;
  totalRevenue: number;
  occupancyRate: number;
  averageRating: number;
  monthlyGrowth: {
    bookings: number;
    revenue: number;
  };
  todayStats: {
    checkIns: number;
    checkOuts: number;
    newBookings: number;
    cancellations: number;
  };
}

// Utility functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

const formatTimeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const getFeedIcon = (type: string) => {
  switch (type) {
    case 'booking': return Calendar;
    case 'cancellation': return X;
    case 'modification': return Edit3;
    case 'block': return Lock;
    case 'check-in': return LogIn;
    case 'check-out': return LogOut;
    case 'alert': return AlertTriangle;
    case 'price-change': return DollarSign;
    default: return Activity;
  }
};

const getFeedColor = (type: string, severity?: string) => {
  if (severity === 'error') return 'text-red-600 bg-red-100';
  if (severity === 'warning') return 'text-yellow-600 bg-yellow-100';
  if (severity === 'success') return 'text-green-600 bg-green-100';
  
  switch (type) {
    case 'booking': return 'text-blue-600 bg-blue-100';
    case 'cancellation': return 'text-red-600 bg-red-100';
    case 'modification': return 'text-purple-600 bg-purple-100';
    case 'block': return 'text-gray-600 bg-gray-100';
    case 'check-in': return 'text-green-600 bg-green-100';
    case 'check-out': return 'text-orange-600 bg-orange-100';
    case 'alert': return 'text-yellow-600 bg-yellow-100';
    case 'price-change': return 'text-indigo-600 bg-indigo-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

// Main Overview Component
export default function Overview({ analytics, onRefresh }: { 
  analytics?: Analytics;
  onRefresh?: () => void;
}) {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch activity timeline from API
  const { data: activityTimeline, isLoading: timelineLoading } = useQuery<any[]>({
    queryKey: ["/api/activity-timeline"],
    refetchInterval: autoRefresh ? 30000 : false, // Auto-refresh every 30 seconds if enabled
  });

  // Fetch recent bookings
  const { data: bookings } = useQuery<any[]>({
    queryKey: ["/api/bookings"],
  });

  // Fetch recent reviews
  const { data: reviews } = useQuery<any[]>({
    queryKey: ["/api/reviews"],
  });

  // Convert activity timeline and other data to feed items
  useEffect(() => {
    const feeds: FeedItem[] = [];
    const now = new Date();

    // Add activity timeline items
    if (activityTimeline) {
      activityTimeline.forEach((activity) => {
        const feedType = mapActionTypeToFeedType(activity.actionType);
        feeds.push({
          id: `timeline-${activity.id}`,
          type: feedType,
          title: formatActivityTitle(activity.actionType, activity.guestName),
          description: activity.description,
          timestamp: new Date(activity.createdAt),
          actor: {
            type: activity.performedBy === 'admin' ? 'admin' : activity.performedBy === 'system' ? 'system' : 'guest',
            name: activity.performedBy === 'guest' ? activity.guestName : activity.performedBy || 'Unknown',
            email: activity.guestEmail
          },
          metadata: {
            bookingId: activity.bookingId ? `ALR${activity.bookingId}` : undefined,
            guestName: activity.guestName,
            dates: activity.checkInDate && activity.checkOutDate ? 
              `${formatDate(activity.checkInDate)} - ${formatDate(activity.checkOutDate)}` : undefined,
            amount: activity.totalPrice ? parseFloat(activity.totalPrice) : undefined,
            reason: activity.metadata?.reason
          },
          severity: mapActionTypeToSeverity(activity.actionType)
        });
      });
    }

    // Add recent bookings as feed items
    if (bookings) {
      const recentBookings = bookings
        .filter(b => {
          const createdDate = new Date(b.createdAt);
          const daysSinceCreation = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceCreation <= 7; // Last 7 days
        })
        .slice(0, 5);

      recentBookings.forEach((booking) => {
        feeds.push({
          id: `booking-${booking.id}`,
          type: 'booking',
          title: 'New Booking Created',
          description: `Booking for ${booking.guestFirstName} ${booking.guestLastName}`,
          timestamp: new Date(booking.createdAt),
          actor: {
            type: booking.createdBy === 'admin' ? 'admin' : 'guest',
            name: `${booking.guestFirstName} ${booking.guestLastName}`,
            email: booking.guestEmail
          },
          metadata: {
            bookingId: booking.confirmationCode,
            guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
            dates: `${formatDate(booking.checkInDate)} - ${formatDate(booking.checkOutDate)}`,
            amount: booking.totalPrice
          },
          severity: 'success'
        });
      });
    }

    // Add recent reviews as feed items
    if (reviews) {
      const recentReviews = reviews
        .filter(r => {
          const createdDate = new Date(r.createdAt);
          const daysSinceCreation = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceCreation <= 7; // Last 7 days
        })
        .slice(0, 3);

      recentReviews.forEach((review) => {
        feeds.push({
          id: `review-${review.id}`,
          type: 'modification', // Using modification as review type
          title: 'New Review Posted',
          description: `${review.guestName} rated ${review.rating}/5 stars`,
          timestamp: new Date(review.createdAt),
          actor: {
            type: 'guest',
            name: review.guestName,
            email: review.guestEmail
          },
          metadata: {
            bookingId: review.bookingId ? `BOOKING-${review.bookingId}` : undefined,
            guestName: review.guestName
          },
          severity: review.rating >= 4 ? 'success' : review.rating >= 3 ? 'info' : 'warning'
        });
      });
    }

    // Sort by timestamp (most recent first)
    feeds.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    setFeedItems(feeds);
  }, [activityTimeline, bookings, reviews]);

  // Helper functions
  const mapActionTypeToFeedType = (actionType: string): FeedItem['type'] => {
    switch (actionType) {
      case 'created': return 'booking';
      case 'cancelled': return 'cancellation';
      case 'modified': return 'modification';
      case 'checked_in': return 'check-in';
      case 'checked_out': return 'check-out';
      case 'blocked': return 'block';
      case 'no_show': return 'alert';
      default: return 'booking';
    }
  };

  const mapActionTypeToSeverity = (actionType: string): FeedItem['severity'] => {
    switch (actionType) {
      case 'created': return 'success';
      case 'cancelled': return 'error';
      case 'modified': return 'info';
      case 'checked_in': return 'success';
      case 'checked_out': return 'info';
      case 'blocked': return 'warning';
      case 'no_show': return 'error';
      default: return 'info';
    }
  };

  const formatActivityTitle = (actionType: string, guestName: string): string => {
    switch (actionType) {
      case 'created': return 'Booking Created';
      case 'cancelled': return 'Booking Cancelled';
      case 'modified': return 'Booking Modified';
      case 'checked_in': return `${guestName} Checked In`;
      case 'checked_out': return `${guestName} Checked Out`;
      case 'blocked': return 'Dates Blocked';
      case 'no_show': return 'Guest No-Show';
      default: return 'Activity Recorded';
    }
  };

  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const isLoading = timelineLoading;

  const filteredFeeds = feedItems.filter(item => 
    filter === 'all' || item.type === filter
  );

  const filterOptions = [
    { value: 'all', label: 'All Activities' },
    { value: 'booking', label: 'Bookings' },
    { value: 'cancellation', label: 'Cancellations' },
    { value: 'modification', label: 'Modifications' },
    { value: 'check-in', label: 'Check-ins' },
    { value: 'check-out', label: 'Check-outs' },
    { value: 'alert', label: 'Alerts' },
    { value: 'price-change', label: 'Price Changes' }
  ];

  // Calculate today's stats from real data
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayBookings = bookings?.filter(b => {
    const bookingDate = new Date(b.createdAt);
    bookingDate.setHours(0, 0, 0, 0);
    return bookingDate.getTime() === today.getTime();
  }) || [];

  const todayCheckIns = bookings?.filter(b => {
    const checkInDate = new Date(b.checkInDate);
    checkInDate.setHours(0, 0, 0, 0);
    return checkInDate.getTime() === today.getTime() && b.status === 'confirmed';
  }) || [];

  const todayCheckOuts = bookings?.filter(b => {
    const checkOutDate = new Date(b.checkOutDate);
    checkOutDate.setHours(0, 0, 0, 0);
    return checkOutDate.getTime() === today.getTime();
  }) || [];

  const todayCancellations = activityTimeline?.filter(a => {
    const activityDate = new Date(a.createdAt);
    activityDate.setHours(0, 0, 0, 0);
    return activityDate.getTime() === today.getTime() && a.actionType === 'cancelled';
  }) || [];

  // Analytics Cards
  const AnalyticsCards = () => {

    const cards = [
      {
        title: "Total Bookings",
        value: analytics?.totalBookings || 0,
        icon: Calendar,
        color: "from-blue-500 to-blue-600",
        change: analytics?.monthlyGrowth?.bookings || 0,
      },
      {
        title: "Total Revenue",
        value: formatCurrency(analytics?.totalRevenue || 0),
        icon: DollarSign,
        color: "from-green-500 to-green-600",
        change: analytics?.monthlyGrowth?.revenue || 0,
      },
      {
        title: "Occupancy Rate",
        value: `${Math.round(analytics?.occupancyRate || 0)}%`,
        icon: TrendingUp,
        color: "from-purple-500 to-purple-600",
        change: 5,
      },
      {
        title: "Today's Activity",
        value: `${todayCheckIns.length + todayCheckOuts.length}`,
        icon: Activity,
        color: "from-orange-500 to-orange-600",
        change: 0,
        subtitle: `${todayCheckIns.length} in, ${todayCheckOuts.length} out`
      },
    ];
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((card, index) => (
          <div
            key={card.title}
            className="bg-white rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-2 mb-1">{card.value}</p>
                  {card.subtitle && (
                    <p className="text-xs text-gray-500 mb-3">{card.subtitle}</p>
                  )}
                  <div className="flex items-center gap-2">
                    {card.change > 0 ? (
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                    ) : card.change < 0 ? (
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                    ) : null}
                    {card.change !== 0 && (
                      <span className={`text-sm font-medium ${
                        card.change > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {Math.abs(card.change)}%
                      </span>
                    )}
                    <span className="text-xs text-gray-500">vs last month</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg bg-gradient-to-br ${card.color} bg-opacity-10`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Feed Item Component
  const FeedItem = ({ item }: { item: FeedItem }) => {
    const Icon = getFeedIcon(item.type);
    const colorClass = getFeedColor(item.type, item.severity);
    
    return (
      <div className="flex gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer rounded-lg">
        <div className={`p-2 rounded-lg ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900">{item.title}</h4>
              <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
              
              {item.metadata && (
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                  {item.metadata.bookingId && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.metadata.bookingId}
                    </span>
                  )}
                  {item.metadata.amount && (
                    <span className="inline-flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(item.metadata.amount)}
                    </span>
                  )}
                  {item.metadata.dates && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.metadata.dates}
                    </span>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-gray-500">
                  by {item.actor.name} ({item.actor.type})
                </span>
                <span className="text-xs text-gray-400">
                  {formatTimeAgo(item.timestamp)}
                </span>
              </div>
            </div>
            
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <AnalyticsCards />
      
      {/* Activity Feed */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Activity Feed</h3>
              <p className="text-sm text-gray-600 mt-1">Real-time property activity</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded-lg transition-colors ${
                  autoRefresh 
                    ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                    : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={onRefresh}
                className="p-2 text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="px-6 py-3 border-b bg-gray-50/50">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {filterOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all ${
                  filter === option.value
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {option.label}
                {option.value !== 'all' && (
                  <span className="ml-1.5 text-xs">
                    ({feedItems.filter(item => item.type === option.value).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Feed Items */}
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredFeeds.length > 0 ? (
            <>
              {filteredFeeds.map(item => (
                <FeedItem key={item.id} item={item} />
              ))}
              
              {filteredFeeds.length > 10 && (
                <div className="p-4 text-center">
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View all activities →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No activities found</p>
              <p className="text-sm text-gray-400 mt-1">
                Activities will appear here as they happen
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h4 className="font-medium text-gray-900 mb-4">Today's Summary</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Check-ins</span>
              <span className="font-medium">{todayCheckIns?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Check-outs</span>
              <span className="font-medium">{todayCheckOuts?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">New Bookings</span>
              <span className="font-medium">{todayBookings?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cancellations</span>
              <span className="font-medium text-red-600">{todayCancellations?.length || 0}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h4 className="font-medium text-gray-900 mb-4">Alerts & Warnings</h4>
          <div className="space-y-3">
            {feedItems
              .filter(item => item.type === 'alert' && item.severity === 'warning')
              .slice(0, 3)
              .map(alert => (
                <div key={alert.id} className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-medium">{alert.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatTimeAgo(alert.timestamp)}</p>
                  </div>
                </div>
              ))}
            {feedItems.filter(item => item.type === 'alert').length === 0 && (
              <p className="text-sm text-gray-500">No active alerts</p>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h4 className="font-medium text-gray-900 mb-4">Recent Actions</h4>
          <div className="space-y-3">
            {feedItems
              .filter(item => item.actor.type === 'admin')
              .slice(0, 4)
              .map(action => (
                <div key={action.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{action.title}</span>
                  </div>
                  <span className="text-xs text-gray-400">{formatTimeAgo(action.timestamp)}</span>
                </div>
              ))}
            {feedItems.filter(item => item.actor.type === 'admin').length === 0 && (
              <p className="text-sm text-gray-500">No recent admin actions</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
