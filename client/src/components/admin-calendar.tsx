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
          className={`relative p-3 h-24 border border-white/30 backdrop-blur-sm ${
            isToday 
              ? 'bg-gradient-to-br from-blue-100/80 via-blue-50/60 to-purple-50/40 ring-2 ring-blue-400/50 shadow-lg' 
              : 'bg-white/40 hover:bg-white/60'
          } ${
            getDragRange().includes(dateKey) 
              ? 'bg-gradient-to-br from-yellow-100/80 to-amber-50/60 border-yellow-400/70 shadow-lg ring-2 ring-yellow-300/50' 
              : ''
          } hover:bg-gradient-to-br hover:from-slate-50/80 hover:to-blue-50/40 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 cursor-pointer select-none group transform-gpu`}
          onMouseDown={(e) => handleDragStart(dateKey, e)}
          onMouseEnter={() => handleDragOver(dateKey)}
          onMouseUp={handleDragEnd}
        >
          <div className={`text-sm font-bold mb-2 transition-all duration-300 transform-gpu ${
            isToday 
              ? 'text-blue-800 bg-blue-100/50 rounded-full w-7 h-7 flex items-center justify-center mx-auto shadow-lg ring-2 ring-blue-300/50 group-hover:scale-110' 
              : 'text-gray-700 hover:text-blue-600 group-hover:scale-110'
          }`}
          style={{
            transformOrigin: 'center center',
            willChange: 'transform'
          }}>
            {day}
          </div>
          {bookingInfo && (
            <div className="relative h-12">
              {/* Check-in day: rounded left half only, extends to full right edge */}
              {bookingInfo.position === 'checkin' && bookingInfo.isSpanning && (
                <div className="absolute left-1/2 top-0 right-0 h-10 flex items-center">
                  <div className={`w-5 h-10 rounded-l-2xl ${getSourceColor(bookingInfo.booking.bookingSource)} flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg group-hover:animate-pulse`}>
                    <span className={`text-xs font-bold ${bookingInfo.booking.bookingSource === 'blocked' ? 'text-gray-600' : 'text-white'} drop-shadow-sm`}>
                      {bookingInfo.booking.bookingSource === 'airbnb' && 'A'}
                      {bookingInfo.booking.bookingSource === 'booking.com' && 'B'}
                      {bookingInfo.booking.bookingSource === 'direct' && 'D'}
                      {bookingInfo.booking.bookingSource === 'blocked' && '✕'}
                    </span>
                  </div>
                  <div className={`flex-1 h-10 ${getSourceColor(bookingInfo.booking.bookingSource)} flex items-center justify-start pl-3 transition-all duration-300 hover:shadow-lg backdrop-blur-sm`}>
                    <span className={`text-xs font-semibold truncate ${bookingInfo.booking.bookingSource === 'blocked' ? 'text-gray-600' : 'text-white'} drop-shadow-sm`}>
                      {bookingInfo.booking.bookingSource === 'blocked' ? 'Blocked/Unavailable' : `${bookingInfo.booking.guestFirstName} ${bookingInfo.booking.guestLastName.charAt(0)}.`}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Check-out day: extends from full left edge, rounded right half only */}
              {bookingInfo.position === 'checkout' && bookingInfo.isSpanning && (
                <div className="absolute left-0 top-0 right-1/2 h-10 flex items-center">
                  <div className={`flex-1 h-10 ${getSourceColor(bookingInfo.booking.bookingSource)} flex items-center justify-end pr-3 transition-all duration-300 hover:shadow-lg backdrop-blur-sm`}>
                    <span className={`text-xs font-semibold truncate ${bookingInfo.booking.bookingSource === 'blocked' ? 'text-gray-600' : 'text-white'} drop-shadow-sm`}>
                      {bookingInfo.booking.bookingSource === 'blocked' ? 'Blocked/Unavailable' : `${bookingInfo.booking.guestFirstName} ${bookingInfo.booking.guestLastName.charAt(0)}.`}
                    </span>
                  </div>
                  <div className={`w-5 h-10 rounded-r-2xl ${getSourceColor(bookingInfo.booking.bookingSource)} flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg group-hover:animate-pulse`}>
                    <span className={`text-xs font-bold ${bookingInfo.booking.bookingSource === 'blocked' ? 'text-gray-600' : 'text-white'} drop-shadow-sm`}>
                      {bookingInfo.booking.bookingSource === 'airbnb' && 'A'}
                      {bookingInfo.booking.bookingSource === 'booking.com' && 'B'}
                      {bookingInfo.booking.bookingSource === 'direct' && 'D'}
                      {bookingInfo.booking.bookingSource === 'blocked' && '✕'}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Middle days: full width continuous pipe from edge to edge */}
              {bookingInfo.position === 'middle' && (
                <div className={`absolute inset-x-0 top-0 h-10 ${getSourceColor(bookingInfo.booking.bookingSource)} flex items-center justify-center transition-all duration-300 hover:shadow-lg backdrop-blur-sm group-hover:animate-pulse`}>
                  <span className={`text-xs font-semibold ${bookingInfo.booking.bookingSource === 'blocked' ? 'text-gray-600' : 'text-white'} drop-shadow-sm`}>
                    {bookingInfo.booking.bookingSource === 'blocked' ? 'Blocked/Unavailable' : `${bookingInfo.booking.guestFirstName} ${bookingInfo.booking.guestLastName.charAt(0)}.`}
                  </span>
                </div>
              )}
              
              {/* Single day booking: fully rounded */}
              {bookingInfo.position === 'checkin' && !bookingInfo.isSpanning && (
                <div className={`absolute left-0 top-0 right-0 h-10 rounded-2xl ${getSourceColor(bookingInfo.booking.bookingSource)} flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-lg group-hover:animate-pulse backdrop-blur-sm`}>
                  <span className={`text-xs font-semibold ${bookingInfo.booking.bookingSource === 'blocked' ? 'text-gray-600' : 'text-white'} drop-shadow-sm`}>
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
    <div className={`relative bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-sm p-8 ${className}`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-50"></div>
      <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-4 left-4 w-24 h-24 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* Calendar Header */}
      <div className="relative flex items-center justify-between mb-10 bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/30 hover:shadow-xl transition-all duration-300">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth('prev')}
          className="flex items-center gap-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 hover:scale-110 hover:shadow-lg border-white/50 backdrop-blur-sm group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:animate-bounce group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="font-medium">Previous</span>
        </Button>
        
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth('next')}
          className="flex items-center gap-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 hover:scale-110 hover:shadow-lg border-white/50 backdrop-blur-sm group"
        >
          <span className="font-medium">Next</span>
          <ChevronRight className="w-4 h-4 group-hover:animate-bounce group-hover:translate-x-1 transition-transform duration-300" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="relative min-h-[500px] bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/40 overflow-hidden hover:shadow-2xl transition-all duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-purple-50/20 pointer-events-none"></div>
        <div className="relative z-10">
          {renderCalendar()}
        </div>
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
          <div className="relative mt-12 bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50 hover:shadow-3xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/10 rounded-3xl"></div>
            <div className="absolute top-2 right-2 w-20 h-20 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-2xl animate-pulse"></div>
            
            <div className="relative z-10">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-8 text-center">
                Booking Sources Analytics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {sourceStats.map((stat, index) => (
                  <div 
                    key={stat.source} 
                    className="group relative text-center p-6 rounded-2xl bg-gradient-to-br from-white/60 to-gray-50/40 backdrop-blur-sm border border-white/60 hover:from-white/80 hover:to-gray-50/60 transition-all duration-500 hover:scale-110 hover:shadow-2xl hover:-translate-y-2 transform-gpu cursor-pointer"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-purple-50/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative z-10">
                      <div className={`w-12 h-12 ${stat.color} rounded-2xl mx-auto mb-4 shadow-lg group-hover:shadow-xl group-hover:scale-125 transition-all duration-300 flex items-center justify-center`}>
                        <div className="w-6 h-6 bg-white/30 rounded-lg backdrop-blur-sm"></div>
                      </div>
                      
                      <div className="text-4xl font-black text-gray-800 mb-2 group-hover:text-blue-600 transition-colors duration-300 group-hover:scale-110 transform">
                        {stat.count}
                      </div>
                      
                      <div className="text-sm text-gray-600 font-semibold group-hover:text-gray-800 transition-colors duration-300">
                        {stat.label}
                      </div>
                      
                      <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-blue-300/50 transition-all duration-300"></div>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null;
      })()}

      {/* Block Dates Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl" aria-describedby="block-dates-description">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-purple-50/10 to-pink-50/5 rounded-3xl"></div>
          <div className="absolute top-2 right-2 w-16 h-16 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-2xl animate-pulse"></div>
          
          <div className="relative z-10">
            <DialogHeader className="pb-6">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-blue-600 to-purple-600 bg-clip-text text-transparent text-center">
                Block Selected Dates
              </DialogTitle>
            </DialogHeader>
            
            <div id="block-dates-description" className="sr-only">
              Block selected calendar dates for maintenance, personal use, or other unavailable periods.
            </div>
            
            <div className="space-y-6">
              <div className="group">
                <Label htmlFor="reason" className="text-sm font-semibold text-gray-700 mb-2 block group-focus-within:text-blue-600 transition-colors duration-200">
                  Reason for blocking
                </Label>
                <Textarea
                  id="reason"
                  placeholder="e.g., Maintenance, Personal use, Renovation..."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="mt-2 bg-white/70 backdrop-blur-sm border border-white/60 rounded-2xl p-4 focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all duration-300 hover:bg-white/80 resize-none"
                  rows={3}
                />
              </div>
              
              {dragStart && dragEnd && (
                <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/60 backdrop-blur-sm border border-blue-200/50 rounded-2xl p-4 text-center">
                  <div className="text-sm font-semibold text-blue-700">
                    Blocking dates: {dragStart} to {dragEnd}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBlockDialog(false);
                    setBlockReason('');
                    setDragStart(null);
                    setDragEnd(null);
                  }}
                  className="px-6 py-3 rounded-2xl border-white/60 bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBlockDates}
                  disabled={!blockReason.trim() || blockDatesMutation.isPending}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:scale-100 disabled:shadow-none"
                >
                  {blockDatesMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Blocking...
                    </span>
                  ) : (
                    'Block Dates'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}