import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

interface CalendarBooking {
  id: number;
  checkInDate: string;
  checkOutDate: string;
  guestFirstName: string;
  guestLastName: string;
  source: 'airbnb' | 'booking.com' | 'direct' | 'blocked' | string;
  status: string;
}

interface AdminCalendarProps {
  className?: string;
}

export function AdminCalendar({ className = '' }: AdminCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarBookings, setCalendarBookings] = useState<CalendarBooking[]>([]);

  // Fetch bookings
  const { data: bookings } = useQuery({
    queryKey: ['/api/bookings'],
  });

  // Transform bookings data for calendar display
  useEffect(() => {
    if (bookings) {
      const transformedBookings = bookings.map((booking: any) => ({
        ...booking,
        source: booking.source || 'direct' // Default to direct if no source specified
      }));
      setCalendarBookings(transformedBookings);
    }
  }, [bookings]);

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'airbnb':
        return 'bg-red-400 text-white';
      case 'booking.com':
        return 'bg-blue-400 text-white';
      case 'direct':
        return 'bg-green-400 text-white';
      case 'blocked':
        return 'bg-gray-300 text-gray-700';
      default:
        return 'bg-purple-400 text-white'; // Custom sources
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

  const isDateInBooking = (dateKey: string, booking: CalendarBooking) => {
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);
    const currentDate = new Date(dateKey);
    
    return currentDate >= checkIn && currentDate < checkOut;
  };

  const getBookingForDate = (dateKey: string) => {
    return calendarBookings.find(booking => isDateInBooking(dateKey, booking));
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
      const booking = getBookingForDate(dateKey);
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      calendarGrid.push(
        <div 
          key={day} 
          className={`p-1 h-20 border border-gray-200 ${isToday ? 'bg-blue-50' : ''}`}
        >
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {day}
          </div>
          {booking && (
            <div className={`text-xs p-1 rounded ${getSourceColor(booking.source)} truncate`}>
              {booking.guestFirstName} {booking.guestLastName.charAt(0)}.
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
            {calendarBookings.filter(b => b.source === 'airbnb').length}
          </div>
          <div className="text-gray-600">Airbnb</div>
        </div>
        <div className="text-center">
          <div className="w-4 h-4 bg-blue-400 rounded mx-auto mb-1"></div>
          <div className="font-medium">
            {calendarBookings.filter(b => b.source === 'booking.com').length}
          </div>
          <div className="text-gray-600">Booking.com</div>
        </div>
        <div className="text-center">
          <div className="w-4 h-4 bg-green-400 rounded mx-auto mb-1"></div>
          <div className="font-medium">
            {calendarBookings.filter(b => b.source === 'direct').length}
          </div>
          <div className="text-gray-600">Direct</div>
        </div>
        <div className="text-center">
          <div className="w-4 h-4 bg-gray-300 rounded mx-auto mb-1"></div>
          <div className="font-medium">
            {calendarBookings.filter(b => b.source === 'blocked').length}
          </div>
          <div className="text-gray-600">Blocked</div>
        </div>
      </div>
    </div>
  );
}