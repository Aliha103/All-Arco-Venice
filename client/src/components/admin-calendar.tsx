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

  // Handle drag start for blocking dates
  const handleDragStart = (dateStr: string, event: React.MouseEvent) => {
    event.preventDefault();
    setDragStart(dateStr);
    setDragEnd(dateStr);
    setIsDragging(true);
  };

  // Handle drag over for blocking dates
  const handleDragOver = (dateStr: string) => {
    if (isDragging && dragStart) {
      setDragEnd(dateStr);
    }
  };

  // Handle drag end for blocking dates
  const handleDragEnd = () => {
    if (dragStart && dragEnd && dragStart !== dragEnd) {
      setShowBlockDialog(true);
    }
    setIsDragging(false);
  };

  // Get drag range dates for visual feedback
  const getDragRange = () => {
    if (!dragStart || !dragEnd) return [];
    
    const start = new Date(dragStart);
    const end = new Date(dragEnd);
    const startDate = start <= end ? start : end;
    const endDate = start <= end ? end : start;
    
    const dates = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      dates.push(new Date(current).toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  // Handle blocking dates
  const handleBlockDates = () => {
    if (dragStart && dragEnd && blockReason.trim()) {
      const start = new Date(dragStart);
      const end = new Date(dragEnd);
      const startDate = start <= end ? dragStart : dragEnd;
      const endDate = start <= end ? dragEnd : dragStart;
      
      blockDatesMutation.mutate({
        startDate,
        endDate,
        reason: blockReason.trim()
      });
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'airbnb':
        return 'bg-red-500 text-white shadow-md';
      case 'booking.com':
        return 'bg-blue-500 text-white shadow-md';
      case 'direct':
        return 'bg-green-500 text-white shadow-md';
      case 'blocked':
        return 'bg-gray-200 text-gray-600 shadow-sm border border-gray-300';
      default:
        return 'bg-purple-500 text-white shadow-md';
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
          className={`relative p-2 h-20 border border-gray-200 ${
            isToday ? 'bg-gradient-to-br from-blue-50 to-blue-100 ring-1 ring-blue-300 shadow-sm' : 'bg-white'
          } ${
            getDragRange().includes(dateKey) ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-400 shadow-sm' : ''
          } hover:bg-gradient-to-br hover:from-gray-25 hover:to-gray-50 hover:shadow-md transition-all duration-200 cursor-pointer select-none group`}
          onMouseDown={(e) => handleDragStart(dateKey, e)}
          onMouseEnter={() => handleDragOver(dateKey)}
          onMouseUp={handleDragEnd}
        >
          <div className={`text-sm font-semibold mb-1 transition-all duration-200 group-hover:scale-110 ${
            isToday ? 'text-blue-700 font-bold' : 'text-gray-800'
          }`}>
            {day}
          </div>
          {bookingInfo && (
            <div className="relative h-10">
              {/* Check-in day: rounded left half only, extends to edge */}
              {bookingInfo.position === 'checkin' && bookingInfo.isSpanning && (
                <div className="absolute left-1/2 top-1 right-0 h-8 flex items-center">
                  <div className={`w-4 h-8 rounded-l-full ${getSourceColor(bookingInfo.booking.bookingSource)} flex items-center justify-center transition-all duration-200 hover:scale-105`}>
                    <span className={`text-xs font-bold ${bookingInfo.booking.bookingSource === 'blocked' ? 'text-gray-600' : 'text-white'}`}>
                      {bookingInfo.booking.bookingSource === 'airbnb' && 'A'}
                      {bookingInfo.booking.bookingSource === 'booking.com' && 'B'}
                      {bookingInfo.booking.bookingSource === 'direct' && 'D'}
                      {bookingInfo.booking.bookingSource === 'blocked' && '✕'}
                    </span>
                  </div>
                  <div className={`flex-1 h-8 ${getSourceColor(bookingInfo.booking.bookingSource)} flex items-center justify-start pl-2 transition-all duration-200`}>
                    <span className={`text-xs font-medium truncate ${bookingInfo.booking.bookingSource === 'blocked' ? 'text-gray-600' : 'text-white'}`}>
                      {bookingInfo.booking.bookingSource === 'blocked' ? 'Blocked/Unavailable' : `${bookingInfo.booking.guestFirstName} ${bookingInfo.booking.guestLastName.charAt(0)}.`}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Check-out day: extends from edge, rounded right half only */}
              {bookingInfo.position === 'checkout' && bookingInfo.isSpanning && (
                <div className="absolute left-0 top-1 right-1/2 h-8 flex items-center">
                  <div className={`flex-1 h-8 ${getSourceColor(bookingInfo.booking.bookingSource)} flex items-center justify-end pr-2 transition-all duration-200`}>
                    <span className={`text-xs font-medium truncate ${bookingInfo.booking.bookingSource === 'blocked' ? 'text-gray-600' : 'text-white'}`}>
                      {bookingInfo.booking.bookingSource === 'blocked' ? 'Blocked/Unavailable' : `${bookingInfo.booking.guestFirstName} ${bookingInfo.booking.guestLastName.charAt(0)}.`}
                    </span>
                  </div>
                  <div className={`w-4 h-8 rounded-r-full ${getSourceColor(bookingInfo.booking.bookingSource)} flex items-center justify-center transition-all duration-200 hover:scale-105`}>
                    <span className={`text-xs font-bold ${bookingInfo.booking.bookingSource === 'blocked' ? 'text-gray-600' : 'text-white'}`}>
                      {bookingInfo.booking.bookingSource === 'airbnb' && 'A'}
                      {bookingInfo.booking.bookingSource === 'booking.com' && 'B'}
                      {bookingInfo.booking.bookingSource === 'direct' && 'D'}
                      {bookingInfo.booking.bookingSource === 'blocked' && '✕'}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Middle days: full width continuous pipe */}
              {bookingInfo.position === 'middle' && (
                <div className={`absolute left-0 top-1 right-0 h-8 ${getSourceColor(bookingInfo.booking.bookingSource)} flex items-center justify-center transition-all duration-200`}>
                  <span className={`text-xs font-medium ${bookingInfo.booking.bookingSource === 'blocked' ? 'text-gray-600' : 'text-white'}`}>
                    {bookingInfo.booking.bookingSource === 'blocked' ? 'Blocked/Unavailable' : `${bookingInfo.booking.guestFirstName} ${bookingInfo.booking.guestLastName.charAt(0)}.`}
                  </span>
                </div>
              )}
              
              {/* Single day booking: fully rounded */}
              {bookingInfo.position === 'checkin' && !bookingInfo.isSpanning && (
                <div className={`absolute left-0 top-1 right-0 h-8 rounded-full ${getSourceColor(bookingInfo.booking.bookingSource)} flex items-center justify-center transition-all duration-200 hover:scale-105`}>
                  <span className={`text-xs font-medium ${bookingInfo.booking.bookingSource === 'blocked' ? 'text-gray-600' : 'text-white'}`}>
                    {bookingInfo.booking.bookingSource === 'blocked' ? 'Blocked/Unavailable' : `${bookingInfo.booking.guestFirstName} ${bookingInfo.booking.guestLastName.charAt(0)}.`}
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
    <div className={`bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-8 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth('prev')}
          className="flex items-center gap-2 hover:bg-gray-50 transition-all duration-200 hover:scale-105 hover:shadow-md"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth('next')}
          className="flex items-center gap-2 hover:bg-gray-50 transition-all duration-200 hover:scale-105 hover:shadow-md"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="min-h-[500px] bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {renderCalendar()}
      </div>

      {/* Quick Stats - Only show sources that have bookings */}
      {(() => {
        const sourceStats = [
          { source: 'airbnb', color: 'bg-red-500', label: 'Airbnb', count: calendarBookings.filter(b => b.bookingSource === 'airbnb').length },
          { source: 'booking.com', color: 'bg-blue-500', label: 'Booking.com', count: calendarBookings.filter(b => b.bookingSource === 'booking.com').length },
          { source: 'direct', color: 'bg-green-500', label: 'Direct', count: calendarBookings.filter(b => b.bookingSource === 'direct').length },
          { source: 'blocked', color: 'bg-gray-200 border border-gray-300', label: 'Blocked/Unavailable', count: calendarBookings.filter(b => b.bookingSource === 'blocked').length },
        ].filter(stat => stat.count > 0);

        return sourceStats.length > 0 ? (
          <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Booking Sources</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {sourceStats.map(stat => (
                <div key={stat.source} className="text-center p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-200 hover:scale-105 hover:shadow-md">
                  <div className={`w-6 h-6 ${stat.color} rounded-lg mx-auto mb-3 shadow-sm`}></div>
                  <div className="text-2xl font-bold text-gray-800 mb-1">{stat.count}</div>
                  <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      })()}

      {/* Block Dates Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent className="sm:max-w-md" aria-describedby="block-dates-description">
          <DialogHeader>
            <DialogTitle>Block Selected Dates</DialogTitle>
          </DialogHeader>
          <div id="block-dates-description" className="sr-only">
            Block selected calendar dates for maintenance, personal use, or other unavailable periods.
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason for blocking</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Maintenance, Personal use, Renovation..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="mt-1"
              />
            </div>
            {dragStart && dragEnd && (
              <div className="text-sm text-gray-600">
                Blocking dates: {dragStart} to {dragEnd}
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBlockDialog(false);
                  setBlockReason('');
                  setDragStart(null);
                  setDragEnd(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBlockDates}
                disabled={!blockReason.trim() || blockDatesMutation.isPending}
              >
                {blockDatesMutation.isPending ? 'Blocking...' : 'Block Dates'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}