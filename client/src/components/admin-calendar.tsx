import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Grip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CalendarBooking {
  id: number;
  checkInDate: string;
  checkOutDate: string;
  guestFirstName: string;
  guestLastName: string;
  bookingSource: 'airbnb' | 'booking.com' | 'direct' | 'blocked' | 'custom';
  status: string;
}

interface AdminCalendarProps {
  className?: string;
}

export function AdminCalendar({ className = '' }: AdminCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarBookings, setCalendarBookings] = useState<CalendarBooking[]>([]);
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch bookings with 100ms refresh rate for real-time updates
  const { data: bookings } = useQuery({
    queryKey: ['/api/bookings'],
    refetchInterval: 100,
  });

  // Block dates mutation
  const blockDatesMutation = useMutation({
    mutationFn: async (data: { startDate: string; endDate: string; reason: string }) => {
      return apiRequest('POST', '/api/admin/block-dates', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Dates Blocked",
        description: "Selected dates have been blocked successfully.",
      });
      setShowBlockDialog(false);
      setBlockReason('');
      setDragStart(null);
      setDragEnd(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to block dates. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Transform bookings data for calendar display
  useEffect(() => {
    if (bookings && Array.isArray(bookings)) {
      const transformedBookings = bookings.map((booking: any) => ({
        ...booking,
        bookingSource: booking.bookingSource || 'direct'
      }));
      setCalendarBookings(transformedBookings);
    }
  }, [bookings]);

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'airbnb':
        return 'bg-red-400 text-white border-red-500';
      case 'booking.com':
        return 'bg-blue-400 text-white border-blue-500';
      case 'direct':
        return 'bg-green-400 text-white border-green-500';
      case 'blocked':
        return 'bg-gray-300 text-gray-700 border-gray-400';
      default:
        return 'bg-purple-400 text-white border-purple-500';
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getBookingInfoForDate = (dateKey: string) => {
    const currentDate = new Date(dateKey);
    
    for (const booking of calendarBookings) {
      const checkIn = new Date(booking.checkInDate);
      const checkOut = new Date(booking.checkOutDate);
      
      // Check if date is check-in day
      if (currentDate.toDateString() === checkIn.toDateString()) {
        return {
          booking,
          position: 'checkin',
          isSpanning: checkOut.toDateString() !== checkIn.toDateString()
        };
      }
      
      // Check if date is check-out day
      if (currentDate.toDateString() === checkOut.toDateString()) {
        return {
          booking,
          position: 'checkout',
          isSpanning: checkOut.toDateString() !== checkIn.toDateString()
        };
      }
      
      // Check if date is between check-in and check-out
      if (currentDate > checkIn && currentDate < checkOut) {
        return {
          booking,
          position: 'middle',
          isSpanning: true
        };
      }
    }
    
    return null;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    
    const days = [];
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Header with day names
    days.push(
      <div key="header" className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(dayName => (
          <div key={dayName} className="p-2 text-center text-sm font-medium text-gray-600">
            {dayName}
          </div>
        ))}
      </div>
    );

    // Calendar grid
    const calendarGrid = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      calendarGrid.push(
        <div key={`empty-${i}`} className="p-2 h-20"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(year, month, day);
      const bookingInfo = getBookingInfoForDate(dateKey);
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      calendarGrid.push(
        <div 
          key={day} 
          className={`relative p-1 h-20 border border-gray-200 ${isToday ? 'bg-blue-50' : ''}`}
        >
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {day}
          </div>
          {bookingInfo && (
            <div className="relative h-12">
              {/* Check-in day: rounded left, extends to right edge */}
              {bookingInfo.position === 'checkin' && bookingInfo.isSpanning && (
                <div className={`absolute left-0 top-2 right-0 h-6 rounded-l-full ${getSourceColor(bookingInfo.booking.bookingSource)} flex items-center justify-start pl-3 shadow-sm`}>
                  <span className="text-xs font-medium text-white">
                    {bookingInfo.booking.guestFirstName} {bookingInfo.booking.guestLastName.charAt(0)}.
                  </span>
                  <div className="ml-auto mr-2 w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-xs font-bold">
                    {bookingInfo.booking.bookingSource === 'airbnb' && 'A'}
                    {bookingInfo.booking.bookingSource === 'booking.com' && 'B'}
                    {bookingInfo.booking.bookingSource === 'direct' && 'D'}
                    {bookingInfo.booking.bookingSource === 'blocked' && 'X'}
                  </div>
                </div>
              )}
              
              {/* Check-out day: extends from left edge, rounded right */}
              {bookingInfo.position === 'checkout' && bookingInfo.isSpanning && (
                <div className={`absolute left-0 top-2 right-0 h-6 rounded-r-full ${getSourceColor(bookingInfo.booking.bookingSource)} flex items-center justify-end pr-3 shadow-sm`}>
                  <div className="mr-auto ml-2 w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-xs font-bold">
                    {bookingInfo.booking.bookingSource === 'airbnb' && 'A'}
                    {bookingInfo.booking.bookingSource === 'booking.com' && 'B'}
                    {bookingInfo.booking.bookingSource === 'direct' && 'D'}
                    {bookingInfo.booking.bookingSource === 'blocked' && 'X'}
                  </div>
                  <span className="text-xs font-medium text-white">
                    {bookingInfo.booking.guestFirstName} {bookingInfo.booking.guestLastName.charAt(0)}.
                  </span>
                </div>
              )}
              
              {/* Middle days: pipe-like connection (rectangular) */}
              {bookingInfo.position === 'middle' && (
                <div className={`absolute left-0 top-2 right-0 h-6 ${getSourceColor(bookingInfo.booking.bookingSource)} flex items-center justify-center shadow-sm`}>
                  <span className="text-xs font-medium text-white">
                    {bookingInfo.booking.guestFirstName} {bookingInfo.booking.guestLastName.charAt(0)}.
                  </span>
                </div>
              )}
              
              {/* Single day booking: fully rounded */}
              {bookingInfo.position === 'checkin' && !bookingInfo.isSpanning && (
                <div className={`absolute left-0 top-2 right-0 h-6 rounded-full ${getSourceColor(bookingInfo.booking.bookingSource)} flex items-center justify-center shadow-sm`}>
                  <span className="text-xs font-medium text-white">
                    {bookingInfo.booking.guestFirstName} {bookingInfo.booking.guestLastName.charAt(0)}.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    days.push(
      <div key="grid" className="grid grid-cols-7 gap-1">
        {calendarGrid}
      </div>
    );

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className={`bg-white ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth('prev')}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        
        <h2 className="text-xl font-semibold">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth('next')}
          className="flex items-center gap-1"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="min-h-[500px]">
        {renderCalendar()}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="text-center">
          <div className="w-4 h-4 bg-red-400 rounded mx-auto mb-1"></div>
          <div className="font-medium">
            {calendarBookings.filter(b => b.bookingSource === 'airbnb').length}
          </div>
          <div className="text-gray-600">Airbnb</div>
        </div>
        <div className="text-center">
          <div className="w-4 h-4 bg-blue-400 rounded mx-auto mb-1"></div>
          <div className="font-medium">
            {calendarBookings.filter(b => b.bookingSource === 'booking.com').length}
          </div>
          <div className="text-gray-600">Booking.com</div>
        </div>
        <div className="text-center">
          <div className="w-4 h-4 bg-green-400 rounded mx-auto mb-1"></div>
          <div className="font-medium">
            {calendarBookings.filter(b => b.bookingSource === 'direct').length}
          </div>
          <div className="text-gray-600">Direct</div>
        </div>
        <div className="text-center">
          <div className="w-4 h-4 bg-gray-300 rounded mx-auto mb-1"></div>
          <div className="font-medium">
            {calendarBookings.filter(b => b.bookingSource === 'blocked').length}
          </div>
          <div className="text-gray-600">Blocked</div>
        </div>
      </div>
    </div>
  );
}