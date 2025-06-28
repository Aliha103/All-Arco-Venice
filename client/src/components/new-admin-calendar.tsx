import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Booking {
  id: number;
  checkInDate: string;
  checkOutDate: string;
  guestFirstName: string;
  guestLastName: string;
  bookingSource: 'direct' | 'airbnb' | 'booking.com' | 'admin' | 'blocked';
  blockReason?: string;
}

interface CalendarProps {
  className?: string;
}

export function NewAdminCalendar({ className }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch bookings
  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
    refetchInterval: 100
  });

  // Block dates mutation
  const blockDatesMutation = useMutation({
    mutationFn: async (data: { startDate: string; endDate: string; reason: string }) => {
      return apiRequest('POST', '/api/admin/block-dates', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      setShowBlockDialog(false);
      setBlockReason('');
      setDragStart(null);
      setDragEnd(null);
      toast({
        title: "Dates Blocked",
        description: "Selected dates have been blocked successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to block dates",
        variant: "destructive",
      });
    }
  });

  // Get source color and logo
  const getSourceConfig = (source: string) => {
    switch (source) {
      case 'direct':
        return { 
          color: 'bg-green-500', 
          textColor: 'text-white',
          logo: '🏠',
          name: 'Direct Website'
        };
      case 'airbnb':
        return { 
          color: 'bg-red-500', 
          textColor: 'text-white',
          logo: '🅰️',
          name: 'Airbnb'
        };
      case 'booking.com':
        return { 
          color: 'bg-blue-500', 
          textColor: 'text-white',
          logo: '🅱️',
          name: 'Booking.com'
        };
      case 'admin':
        return { 
          color: 'bg-purple-500', 
          textColor: 'text-white',
          logo: '👤',
          name: 'Admin Booking'
        };
      case 'blocked':
        return { 
          color: 'bg-gray-300 border border-gray-400', 
          textColor: 'text-gray-700',
          logo: '🚫',
          name: 'Blocked'
        };
      default:
        return { 
          color: 'bg-gray-400', 
          textColor: 'text-white',
          logo: '❓',
          name: 'Unknown'
        };
    }
  };

  // Get booking info for a specific date
  const getBookingInfo = (dateStr: string) => {
    for (const booking of bookings) {
      const checkIn = new Date(booking.checkInDate);
      const checkOut = new Date(booking.checkOutDate);
      const currentDateObj = new Date(dateStr);
      
      if (currentDateObj >= checkIn && currentDateObj <= checkOut) {
        const isCheckIn = currentDateObj.getTime() === checkIn.getTime();
        const isCheckOut = currentDateObj.getTime() === checkOut.getTime();
        const isSingleDay = checkIn.getTime() === checkOut.getTime();
        const isMiddle = !isCheckIn && !isCheckOut;
        
        return {
          booking,
          isCheckIn,
          isCheckOut,
          isMiddle,
          isSingleDay,
          isSpanning: !isSingleDay
        };
      }
    }
    return null;
  };

  // Navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Date selection for blocking
  const handleDateClick = (dateStr: string) => {
    if (!isDragging) {
      setDragStart(dateStr);
      setDragEnd(dateStr);
      setIsDragging(true);
    }
  };

  const handleDateHover = (dateStr: string) => {
    if (isDragging && dragStart) {
      setDragEnd(dateStr);
    }
  };

  const handleDateRelease = () => {
    if (isDragging && dragStart && dragEnd) {
      setIsDragging(false);
      setShowBlockDialog(true);
    }
  };

  const handleBlockDates = () => {
    if (dragStart && dragEnd && blockReason.trim()) {
      const startDate = new Date(dragStart) <= new Date(dragEnd) ? dragStart : dragEnd;
      const endDate = new Date(dragStart) <= new Date(dragEnd) ? dragEnd : dragStart;
      
      blockDatesMutation.mutate({
        startDate,
        endDate,
        reason: blockReason.trim()
      });
    }
  };

  // Render calendar
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Day headers
    days.push(
      <div key="headers" className="grid grid-cols-7 gap-1 mb-4">
        {dayNames.map(day => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>
    );
    
    // Calendar grid
    const weeks = [];
    let currentWeek = [];
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dateStr = date.toISOString().split('T')[0];
      const day = date.getDate();
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === new Date().toDateString();
      
      const bookingInfo = getBookingInfo(dateStr);
      
      // Check if date is in selection range
      const isSelected = dragStart && dragEnd && 
        date >= new Date(Math.min(new Date(dragStart).getTime(), new Date(dragEnd).getTime())) &&
        date <= new Date(Math.max(new Date(dragStart).getTime(), new Date(dragEnd).getTime()));
      
      currentWeek.push(
        <div
          key={dateStr}
          className={`relative h-24 border border-gray-200 cursor-pointer transition-all duration-200 hover:bg-blue-50 ${
            !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
          } ${isSelected ? 'bg-blue-100 border-blue-300' : ''} ${
            isToday ? 'ring-2 ring-blue-400' : ''
          }`}
          onMouseDown={() => handleDateClick(dateStr)}
          onMouseEnter={() => handleDateHover(dateStr)}
          onMouseUp={handleDateRelease}
        >
          {/* Date number */}
          <div className={`absolute top-1 left-2 text-sm font-medium ${
            isToday ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : 
            isCurrentMonth ? 'text-gray-800' : 'text-gray-400'
          }`}>
            {day}
          </div>
          
          {/* Booking display */}
          {bookingInfo && (
            <div className="absolute inset-x-0 top-8 bottom-2">
              {/* Check-in: starts from middle, goes to right edge */}
              {bookingInfo.isCheckIn && bookingInfo.isSpanning && (
                <div className="absolute left-1/2 top-0 right-0 bottom-0 flex items-center">
                  <div className={`flex-1 h-8 ${getSourceConfig(bookingInfo.booking.bookingSource).color} rounded-l-full flex items-center justify-start pl-2`}>
                    <span className="text-xs font-medium text-white">{getSourceConfig(bookingInfo.booking.bookingSource).logo}</span>
                    <span className="text-xs font-medium text-white ml-1 truncate">
                      {bookingInfo.booking.bookingSource === 'blocked' 
                        ? bookingInfo.booking.blockReason || 'Blocked'
                        : `${bookingInfo.booking.guestFirstName} ${bookingInfo.booking.guestLastName.charAt(0)}.`
                      }
                    </span>
                  </div>
                </div>
              )}
              
              {/* Check-out: starts from left edge, ends at middle */}
              {bookingInfo.isCheckOut && bookingInfo.isSpanning && (
                <div className="absolute left-0 top-0 right-1/2 bottom-0 flex items-center">
                  <div className={`flex-1 h-8 ${getSourceConfig(bookingInfo.booking.bookingSource).color} rounded-r-full flex items-center justify-end pr-2`}>
                    <span className="text-xs font-medium text-white truncate">
                      {bookingInfo.booking.bookingSource === 'blocked' 
                        ? bookingInfo.booking.blockReason || 'Blocked'
                        : `${bookingInfo.booking.guestFirstName} ${bookingInfo.booking.guestLastName.charAt(0)}.`
                      }
                    </span>
                    <span className="text-xs font-medium text-white ml-1">{getSourceConfig(bookingInfo.booking.bookingSource).logo}</span>
                  </div>
                </div>
              )}
              
              {/* Middle days: full width */}
              {bookingInfo.isMiddle && (
                <div className="absolute inset-x-0 top-0 bottom-0 flex items-center">
                  <div className={`w-full h-8 ${getSourceConfig(bookingInfo.booking.bookingSource).color} flex items-center justify-center`}>
                    <span className="text-xs font-medium text-white truncate">
                      {bookingInfo.booking.bookingSource === 'blocked' 
                        ? bookingInfo.booking.blockReason || 'Blocked'
                        : `${bookingInfo.booking.guestFirstName} ${bookingInfo.booking.guestLastName.charAt(0)}.`
                      }
                    </span>
                  </div>
                </div>
              )}
              
              {/* Single day booking: fully rounded */}
              {bookingInfo.isSingleDay && (
                <div className="absolute inset-x-2 top-0 bottom-0 flex items-center">
                  <div className={`w-full h-8 ${getSourceConfig(bookingInfo.booking.bookingSource).color} rounded-full flex items-center justify-center`}>
                    <span className="text-xs font-medium text-white mr-1">{getSourceConfig(bookingInfo.booking.bookingSource).logo}</span>
                    <span className="text-xs font-medium text-white truncate">
                      {bookingInfo.booking.bookingSource === 'blocked' 
                        ? bookingInfo.booking.blockReason || 'Blocked'
                        : `${bookingInfo.booking.guestFirstName} ${bookingInfo.booking.guestLastName.charAt(0)}.`
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
      
      if (currentWeek.length === 7) {
        weeks.push(
          <div key={`week-${weeks.length}`} className="grid grid-cols-7 gap-1">
            {currentWeek}
          </div>
        );
        currentWeek = [];
      }
    }
    
    days.push(...weeks);
    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth('prev')}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        
        <h2 className="text-2xl font-bold text-gray-800">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth('next')}
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar */}
      <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ userSelect: 'none' }}>
        {renderCalendar()}
      </div>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
        {['direct', 'airbnb', 'booking.com', 'admin', 'blocked'].map((source) => {
          const config = getSourceConfig(source);
          const count = bookings.filter((b: Booking) => b.bookingSource === source).length;
          
          if (count === 0 && source !== 'blocked') return null;
          
          return (
            <div key={source} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${config.color} flex items-center justify-center`}>
                <span className="text-xs">{config.logo}</span>
              </div>
              <span className="text-sm text-gray-600">{config.name} ({count})</span>
            </div>
          );
        })}
      </div>

      {/* Block Dates Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Block Selected Dates</DialogTitle>
          </DialogHeader>
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