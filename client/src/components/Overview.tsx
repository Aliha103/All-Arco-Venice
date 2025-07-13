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
  Lock,
  Gift,
  Cake
} from 'lucide-react';

interface OverviewProps {
  analytics: any;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

const Overview: React.FC<OverviewProps> = ({ analytics, onRefresh, isRefreshing = false }) => {
  const [activeFilter, setActiveFilter] = useState('all');

  // Fetch activity timeline from API
  const { data: activityTimeline = [], isLoading: timelineLoading } = useQuery({
    queryKey: ["/api/activity-timeline"],
    refetchInterval: false, // Disable auto-refresh
  });

  // Fetch recent bookings
  const { data: bookings = [] } = useQuery({
    queryKey: ["/api/bookings"],
  });

  // Fetch recent reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ["/api/reviews"],
  });

  // Helper functions - defined first before usage
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return formatDate(date.toISOString());
  };

  const parseTimeAgo = (timeStr: string | undefined | null) => {
    if (!timeStr || timeStr === 'just now' || timeStr === 'Today') return 0;
    const match = String(timeStr).match(/(\d+)\s+(minute|hour|day)/);
    if (!match) return Infinity;
    
    const [, num, unit] = match;
    const multipliers: Record<string, number> = { minute: 60, hour: 3600, day: 86400 };
    return parseInt(num) * (multipliers[unit] || 0);
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
      parts.push(`Confirmation #${activity.bookingId}`);
    }
    
    return parts.join(' • ') || activity.description;
  };

  // Transform database data into activity feed items
  const getActivityFeeds = () => {
    const feeds: any[] = [];
    const now = new Date();

    // Add activity timeline items
    if (Array.isArray(activityTimeline) && activityTimeline.length > 0) {
      activityTimeline.forEach((activity: any) => {
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
          'created': 'text-green-600 bg-green-100',
          'cancelled': 'text-red-600 bg-red-100',
          'modified': 'text-blue-600 bg-blue-100',
          'blocked': 'text-gray-600 bg-gray-100',
          'checked_in': 'text-purple-600 bg-purple-100',
          'checked_out': 'text-indigo-600 bg-indigo-100',
          'no_show': 'text-orange-600 bg-orange-100',
          'postponed': 'text-yellow-600 bg-yellow-100'
        };

        const typeMap: Record<string, string> = {
          'created': 'new_booking',
          'cancelled': 'cancel_booking',
          'modified': 'modify_booking',
          'blocked': 'blocked_date',
          'checked_in': 'check_in',
          'checked_out': 'check_out',
          'no_show': 'alert',
          'postponed': 'modify_booking'
        };

        feeds.push({
          id: `timeline-${activity.id}`,
          type: typeMap[activity.actionType] || 'new_booking',
          actor: activity.performedBy || 'system',
          actorName: activity.performedBy === 'admin' ? 'Admin' : 
                     activity.performedBy === 'system' ? 'System' : 
                     activity.guestName || 'Guest',
          message: activity.description || formatActivityTitle(activity.actionType),
          details: getActivityDetails(activity),
          timestamp: formatTimeAgo(new Date(activity.createdAt)),
          icon: iconMap[activity.actionType] || Activity,
          color: colorMap[activity.actionType] || 'text-gray-600 bg-gray-100'
        });
      });
    }

    // Add detailed booking status activities (last 7 days)
    if (Array.isArray(bookings) && bookings.length > 0) {
      const recentBookings = bookings.filter((b: any) => {
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const createdDate = new Date(b.createdAt);
        const updatedDate = new Date(b.updatedAt || b.createdAt);
        return updatedDate >= lastWeek || createdDate >= lastWeek;
      });

      recentBookings.forEach((booking: any) => {
        const checkInDate = new Date(booking.checkInDate);
        const checkOutDate = new Date(booking.checkOutDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Check for today's check-ins
        if (checkInDate.toDateString() === today.toDateString() && 
            (booking.status === 'confirmed' || booking.status === 'checked_in')) {
          if (!feeds.find(f => f.id === `checkin-${booking.id}`)) {
            feeds.push({
              id: `checkin-${booking.id}`,
              type: 'check_in',
              actor: 'guest',
              actorName: `${booking.guestFirstName} ${booking.guestLastName}`,
              message: booking.status === 'checked_in' ? 'Guest checked in' : 'Guest scheduled to check in today',
              details: `Check-in today • ${formatDate(booking.checkInDate)} - ${formatDate(booking.checkOutDate)} • €${booking.totalPrice}`,
              timestamp: booking.status === 'checked_in' ? formatTimeAgo(new Date(booking.updatedAt)) : 'Today',
              icon: LogIn,
              color: 'text-purple-600 bg-purple-100'
            });
          }
        }

        // Check for today's check-outs
        if (checkOutDate.toDateString() === today.toDateString() && 
            (booking.status === 'checked_in' || booking.status === 'checked_out')) {
          if (!feeds.find(f => f.id === `checkout-${booking.id}`)) {
            feeds.push({
              id: `checkout-${booking.id}`,
              type: 'check_out',
              actor: 'guest',
              actorName: `${booking.guestFirstName} ${booking.guestLastName}`,
              message: booking.status === 'checked_out' ? 'Guest checked out' : 'Guest scheduled to check out today',
              details: `Check-out today • ${formatDate(booking.checkInDate)} - ${formatDate(booking.checkOutDate)} • €${booking.totalPrice}`,
              timestamp: booking.status === 'checked_out' ? formatTimeAgo(new Date(booking.updatedAt)) : 'Today',
              icon: LogOut,
              color: 'text-indigo-600 bg-indigo-100'
            });
          }
        }

        // Check for cancellations (last 7 days)
        if (booking.status === 'cancelled') {
          const cancelDate = new Date(booking.updatedAt || booking.createdAt);
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (cancelDate >= weekAgo && !feeds.find(f => f.id === `cancel-${booking.id}`)) {
            feeds.push({
              id: `cancel-${booking.id}`,
              type: 'cancel_booking',
              actor: 'guest',
              actorName: `${booking.guestFirstName} ${booking.guestLastName}`,
              message: 'Booking cancelled',
              details: `${formatDate(booking.checkInDate)} - ${formatDate(booking.checkOutDate)} • €${booking.totalPrice} • Confirmation #${booking.confirmationCode}`,
              timestamp: formatTimeAgo(cancelDate),
              icon: XCircle,
              color: 'text-red-600 bg-red-100'
            });
          }
        }

        // Check for guest birthdays during stay
        if (booking.guestDateOfBirth && 
            (booking.status === 'confirmed' || booking.status === 'checked_in')) {
          const birthday = new Date(booking.guestDateOfBirth);
          const currentYear = new Date().getFullYear();
          const thisYearBirthday = new Date(currentYear, birthday.getMonth(), birthday.getDate());
          
          // Check if birthday falls during the stay
          if (thisYearBirthday >= checkInDate && thisYearBirthday <= checkOutDate) {
            if (!feeds.find(f => f.id === `birthday-${booking.id}`)) {
              const isToday = thisYearBirthday.toDateString() === today.toDateString();
              feeds.push({
                id: `birthday-${booking.id}`,
                type: 'special_event',
                actor: 'system',
                actorName: 'System',
                message: isToday ? `🎉 Guest birthday today!` : `🎂 Upcoming guest birthday`,
                details: `${booking.guestFirstName} ${booking.guestLastName} • Birthday: ${formatDate(thisYearBirthday.toISOString())} • Currently staying with us`,
                timestamp: isToday ? 'Today' : formatTimeAgo(thisYearBirthday),
                icon: isToday ? Cake : Gift,
                color: isToday ? 'text-pink-600 bg-pink-100' : 'text-purple-600 bg-purple-100'
              });
            }
          }
        }
      });
    }

    // Add recent bookings as feed items (last 24 hours)
    if (Array.isArray(bookings) && bookings.length > 0) {
      const recentBookings = bookings.filter((b: any) => {
        const createdDate = new Date(b.createdAt);
        const hoursSinceCreation = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
        return hoursSinceCreation <= 24;
      });

      recentBookings.forEach((booking: any) => {
        if (!feeds.find(f => f.details?.includes(booking.confirmationCode))) {
          feeds.push({
            id: `booking-${booking.id}`,
            type: 'new_booking',
            actor: booking.createdBy === 'admin' ? 'admin' : 'guest',
            actorName: booking.createdBy === 'admin' ? 'Admin' : `${booking.guestFirstName} ${booking.guestLastName}`,
            message: 'New booking created',
            details: `${formatDate(booking.checkInDate)} - ${formatDate(booking.checkOutDate)} • €${booking.totalPrice}`,
            timestamp: formatTimeAgo(new Date(booking.createdAt)),
            icon: UserPlus,
            color: 'text-green-600 bg-green-100'
          });
        }
      });
    }

    // Add recent reviews as feed items
    if (Array.isArray(reviews) && reviews.length > 0) {
      const recentReviews = reviews.filter((r: any) => {
        const createdDate = new Date(r.createdAt);
        const hoursSinceCreation = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
        return hoursSinceCreation <= 48; // Last 48 hours
      });

      recentReviews.forEach((review: any) => {
        feeds.push({
          id: `review-${review.id}`,
          type: 'new_booking', // Using booking type for reviews
          actor: 'guest',
          actorName: review.guestName,
          message: 'New review posted',
          details: `Rated ${review.rating}/5 stars • "${review.content?.substring(0, 50)}${review.content?.length > 50 ? '...' : ''}"`,
          timestamp: formatTimeAgo(new Date(review.createdAt)),
          icon: Star,
          color: 'text-yellow-600 bg-yellow-100'
        });
      });
    }

    // Sort by timestamp (most recent first)
    return feeds.sort((a, b) => {
      const timeA = parseTimeAgo(a.timestamp);
      const timeB = parseTimeAgo(b.timestamp);
      return timeA - timeB;
    });
  };

  const activityFeeds = getActivityFeeds();

  const filterOptions = [
    { value: 'all', label: 'All Activities' },
    { value: 'bookings', label: 'Bookings' },
    { value: 'modifications', label: 'Modifications' },
    { value: 'check_ins', label: 'Check-ins/outs' },
    { value: 'alerts', label: 'Alerts' },
    { value: 'special_events', label: 'Special Events' },
    { value: 'admin', label: 'Admin Actions' }
  ];

  const getFilteredFeeds = () => {
    if (activeFilter === 'all') return activityFeeds;
    
    const filterMap: Record<string, string[]> = {
      bookings: ['new_booking', 'cancel_booking'],
      modifications: ['modify_booking', 'price_change'],
      check_ins: ['check_in', 'check_out'],
      alerts: ['alert'],
      special_events: ['special_event'],
      admin: activityFeeds.filter((f: any) => f.actor === 'admin').map((f: any) => f.type)
    };
    
    return activityFeeds.filter((feed: any) => filterMap[activeFilter]?.includes(feed.type));
  };

  const filteredFeeds = getFilteredFeeds();

  // Calculate today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayCheckIns = Array.isArray(bookings) ? bookings.filter((b: any) => {
    const checkInDate = new Date(b.checkInDate);
    checkInDate.setHours(0, 0, 0, 0);
    return checkInDate.getTime() === today.getTime() && (b.status === 'confirmed' || b.status === 'checked_in');
  }) : [];

  const todayCheckOuts = Array.isArray(bookings) ? bookings.filter((b: any) => {
    const checkOutDate = new Date(b.checkOutDate);
    checkOutDate.setHours(0, 0, 0, 0);
    return checkOutDate.getTime() === today.getTime() && (b.status === 'checked_in' || b.status === 'checked_out');
  }) : [];

  const todayNewBookings = Array.isArray(bookings) ? bookings.filter((b: any) => {
    const createdDate = new Date(b.createdAt);
    createdDate.setHours(0, 0, 0, 0);
    return createdDate.getTime() === today.getTime();
  }) : [];

  const todayCancellations = Array.isArray(activityTimeline) ? activityTimeline.filter((a: any) => {
    const activityDate = new Date(a.createdAt);
    activityDate.setHours(0, 0, 0, 0);
    return activityDate.getTime() === today.getTime() && a.actionType === 'cancelled';
  }) : [];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium text-gray-600 flex items-center gap-2">
                Total Bookings
                {isRefreshing && (
                  <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </CardTitle>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold">{analytics?.totalBookings || 0}</p>
              <div className="flex items-center text-green-600 text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>{analytics?.monthlyGrowth?.bookings || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium text-gray-600 flex items-center gap-2">
                Total Revenue
                {isRefreshing && (
                  <div className="w-3 h-3 border border-green-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </CardTitle>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold">€{analytics?.totalRevenue?.toLocaleString() || 0}</p>
              <div className="flex items-center text-green-600 text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>{analytics?.monthlyGrowth?.revenue || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium text-gray-600 flex items-center gap-2">
                Occupancy Rate
                {isRefreshing && (
                  <div className="w-3 h-3 border border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </CardTitle>
              <Calendar className="w-5 h-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold">{analytics?.occupancyRate || 0}%</p>
              <Badge variant="secondary" className="text-xs">This month</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium text-gray-600 flex items-center gap-2">
                Avg. Rating
                {isRefreshing && (
                  <div className="w-3 h-3 border border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </CardTitle>
              <Activity className="w-5 h-5 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold">{analytics?.averageRating?.toFixed(1) || 0}</p>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${i < Math.floor(analytics?.averageRating || 0) ? 'text-orange-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Summary */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Today's Summary</CardTitle>
              <CardDescription>Quick overview of today's activities</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <LogIn className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{todayCheckIns.length}</p>
              <p className="text-sm text-blue-700">Check-ins</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <LogOut className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{todayCheckOuts.length}</p>
              <p className="text-sm text-purple-700">Check-outs</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <UserPlus className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{todayNewBookings.length}</p>
              <p className="text-sm text-green-700">New Bookings</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">{todayCancellations.length}</p>
              <p className="text-sm text-red-700">Cancellations</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card id="activity-section" className="h-[600px] flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                Activity Feed
                {timelineLoading && (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                )}
              </CardTitle>
              <CardDescription>Real-time updates of all property activities</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRefresh}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {/* Filter Tabs */}
        <div className="px-6 pb-4">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map(option => (
              <Button
                key={option.value}
                variant={activeFilter === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(option.value)}
                className="text-xs"
              >
                {option.label}
                {option.value !== 'all' && (
                  <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                    {activityFeeds.filter(f => 
                      option.value === 'bookings' ? ['new_booking', 'cancel_booking'].includes(f.type) :
                      option.value === 'modifications' ? ['modify_booking', 'price_change'].includes(f.type) :
                      option.value === 'check_ins' ? ['check_in', 'check_out'].includes(f.type) :
                      option.value === 'alerts' ? f.type === 'alert' :
                      option.value === 'special_events' ? f.type === 'special_event' :
                      option.value === 'admin' ? f.actor === 'admin' : false
                    ).length}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
        
        <CardContent className="flex-1 overflow-hidden p-0">
          <div className="h-full overflow-y-auto px-6">
            <div className="space-y-4 pb-6">
              {timelineLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-3 animate-spin" />
                  <p className="text-gray-500">Loading activities...</p>
                </div>
              ) : filteredFeeds.length === 0 ? (
                <div className="text-center py-12">
                  <Filter className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No activities match the selected filter</p>
                </div>
              ) : (
                filteredFeeds.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
                    >
                      <div className={`p-2 rounded-full ${activity.color} flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {activity.message}
                              {activity.actor !== 'system' && (
                                <span className="text-sm text-gray-600 font-normal ml-2">
                                  by {activity.actorName}
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
                          </div>
                          <p className="text-xs text-gray-500 whitespace-nowrap">{activity.timestamp}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Overview;
