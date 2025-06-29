import React, { useState } from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth, isSameDay, parseISO, isToday, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  id: number;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestCountry: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  totalPrice: number;
  status: string;
  paymentMethod: "online" | "property";
  hasPet?: boolean;
  referralCode?: string;
  createdBy?: "admin" | "guest";
  bookedForSelf?: boolean;
  userId?: string;
  blockReason?: string;
  bookingSource?: string;
  confirmationCode?: string;
  createdAt: string;
  updatedAt: string;
}

interface SmoobuBooking extends Booking {
  guestName: string;
  checkIn: Date;
  checkOut: Date;
}

interface CalendarProps {
  bookings?: Booking[];
  month?: Date;
}

const SmoobuCalendar: React.FC<CalendarProps> = ({ month: initialMonth }) => {
  const [currentMonth, setCurrentMonth] = useState(initialMonth || new Date());
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    mode: "manual" as "blocked" | "manual",
    guestName: "",
    price: 150,
    guests: 2,
    nights: 1,
    source: "direct" as "airbnb" | "booking" | "direct" | "blocked",
    paymentMethod: "property"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch bookings
  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      if (!response.ok) {
        throw new Error("Failed to create booking");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setShowBookingForm(false);
      setSelectedDate(null);
      setFormData({
        mode: "manual",
        guestName: "",
        price: 150,
        guests: 2,
        nights: 1,
        source: "direct",
        paymentMethod: "property"
      });
      toast({
        title: "Success",
        description: "Booking created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive",
      });
    },
  });

  // Convert bookings to SmoobuBooking format
  const smoobuBookings: SmoobuBooking[] = bookings.map(booking => ({
    ...booking,
    guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
    checkIn: parseISO(booking.checkInDate),
    checkOut: parseISO(booking.checkOutDate),
  }));

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getBookingsForDay = (day: Date) => {
    return smoobuBookings.filter((booking) =>
      isWithinInterval(day, { start: booking.checkIn, end: booking.checkOut }),
    );
  };

  const bookingForCheckIn = (day: Date) => {
    return smoobuBookings.find(booking => {
      const checkInDate = new Date(booking.checkInDate);
      return isSameDay(checkInDate, day);
    });
  };
  
  const bookingForCheckOut = (day: Date) => {
    return smoobuBookings.find(booking => {
      const checkOutDate = new Date(booking.checkOutDate);
      return isSameDay(checkOutDate, day);
    });
  };

  // Group consecutive booking days together for continuous rendering
  const getBookingSpans = () => {
    const spans: any[] = [];
    
    smoobuBookings.forEach(booking => {
      const checkInDate = new Date(booking.checkInDate);
      const checkOutDate = new Date(booking.checkOutDate);
      const bookingDays = eachDayOfInterval({ start: checkInDate, end: checkOutDate });
      
      // Only include days that are in the current month view
      const monthDays = bookingDays.filter(day => 
        daysInMonth.some(monthDay => isSameDay(day, monthDay))
      );
      
      if (monthDays.length > 0) {
        spans.push({
          booking,
          days: monthDays,
          startDay: monthDays[0],
          endDay: monthDays[monthDays.length - 1],
          isCheckIn: isSameDay(checkInDate, monthDays[0]),
          isCheckOut: isSameDay(checkOutDate, monthDays[monthDays.length - 1])
        });
      }
    });
    
    return spans;
  };

  const bookingSpans = getBookingSpans();

  const sourceColors = {
    airbnb: 'bg-red-200 text-red-800',
    booking: 'bg-blue-200 text-blue-800',
    direct: 'bg-green-200 text-green-800',
    blocked: 'bg-gray-200 text-gray-800',
    manual: 'bg-purple-200 text-purple-800',
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const handleDateClick = (date: Date) => {
    if (!isSameMonth(date, currentMonth)) return;
    
    const existingBookings = getBookingsForDay(date);
    if (existingBookings.length > 0) {
      toast({
        title: "Date Unavailable",
        description: "This date is already booked",
        variant: "destructive",
      });
      return;
    }

    setSelectedDate(date);
    setShowBookingForm(true);
  };

  const handleCreateBooking = () => {
    if (!selectedDate) return;

    const checkOutDate = new Date(selectedDate);
    checkOutDate.setDate(checkOutDate.getDate() + formData.nights);

    const bookingData = {
      guestFirstName: formData.guestName.split(' ')[0] || formData.guestName,
      guestLastName: formData.guestName.split(' ').slice(1).join(' ') || 'Guest',
      guestEmail: 'admin@booking.com',
      guestCountry: 'Italy',
      guestPhone: '+39 123 456 7890',
      checkInDate: format(selectedDate, 'yyyy-MM-dd'),
      checkOutDate: format(checkOutDate, 'yyyy-MM-dd'),
      guests: formData.guests,
      paymentMethod: formData.paymentMethod,
      hasPet: false,
      createdBy: "admin",
      bookedForSelf: false,
      bookingSource: formData.source,
    };

    createBookingMutation.mutate(bookingData);
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto my-6 p-6 bg-white shadow-lg rounded-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto my-6 p-6 bg-white shadow-lg rounded-lg">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-2xl font-semibold text-gray-800">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm">Airbnb</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm">Booking.com</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm">Direct</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-500 rounded"></div>
          <span className="text-sm">Blocked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 rounded"></div>
          <span className="text-sm">Manual</span>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center font-medium text-gray-600 text-sm">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid with continuous booking spans */}
      <div className="grid grid-cols-7 gap-0 border-t border-l border-gray-200 relative">
        {daysInMonth.map((day, dayIndex) => {
          const isCurrentDay = isToday(day);
          const isCurrentMonthDay = isSameMonth(day, currentMonth);
          const hasBooking = bookingSpans.some(span => 
            span.days.some((spanDay: Date) => isSameDay(spanDay, day))
          );

          return (
            <div
              key={day.toISOString()}
              className={`
                relative h-24 border-r border-b border-gray-200 cursor-pointer transition-all duration-200 text-xs
                ${hasBooking ? 'bg-gray-50' : 'bg-white hover:bg-green-50'}
                ${isCurrentDay ? 'ring-2 ring-blue-400 ring-inset' : ''}
                ${!isCurrentMonthDay ? 'opacity-50' : ''}
              `}
              onClick={() => handleDateClick(day)}
            >
              <span className="absolute top-1 left-1 text-gray-500 font-medium z-20">
                {format(day, 'd')}
              </span>
            </div>
          );
        })}
        
        {/* Render continuous booking spans on top */}
        {bookingSpans.map((span, spanIndex) => {
          const startIndex = daysInMonth.findIndex(day => isSameDay(day, span.startDay));
          const endIndex = daysInMonth.findIndex(day => isSameDay(day, span.endDay));
          
          if (startIndex === -1 || endIndex === -1) return null;
          
          const startRow = Math.floor(startIndex / 7);
          const endRow = Math.floor(endIndex / 7);
          const startCol = startIndex % 7;
          const endCol = endIndex % 7;
          
          // No vertical offset - all spans align horizontally
          const verticalOffset = 0; // All bookings at same level
          
          // Single row span
          if (startRow === endRow) {
            // Calculate positioning: booking spans from 50% of check-in cell to 50% of check-out cell
            const cellWidth = 100/7; // Each cell is 1/7 of total width
            
            let leftPos, widthPercent;
            
            if (span.isCheckIn && span.isCheckOut) {
              // Same day: center 50% of single cell
              leftPos = `${(startCol * cellWidth) + (cellWidth * 0.25)}%`;
              widthPercent = `${cellWidth * 0.5}%`;
            } else {
              // Multi-day: from 50% of check-in cell to 50% of check-out cell
              const startAtHalf = startCol * cellWidth + (cellWidth * 0.5); // 50% of check-in cell
              const endAtHalf = endCol * cellWidth + (cellWidth * 0.5); // 50% of check-out cell
              
              leftPos = `${startAtHalf}%`;
              widthPercent = `${endAtHalf - startAtHalf}%`;
            }
            
            return (
              <div
                key={`span-${span.booking.id}`}
                className="absolute z-10"
                style={{
                  top: `${startRow * 96 + 48 + verticalOffset}px`,
                  left: leftPos,
                  width: widthPercent,
                  height: '24px',
                  transform: 'translateY(-50%)'
                }}
              >
                <div className={`w-full h-full flex items-center justify-center text-xs font-medium px-2 ${
                  span.isCheckIn && span.isCheckOut ? 'rounded-full' :
                  span.isCheckIn ? 'rounded-l-full' :
                  span.isCheckOut ? 'rounded-r-full' : ''
                } ${sourceColors[span.booking.bookingSource as keyof typeof sourceColors] || sourceColors.manual}`}>
                  <span className="truncate">
                    {span.booking.guestFirstName} {span.booking.guestLastName}
                  </span>
                </div>
              </div>
            );
          }
          
          // Multi-row spans
          const rows = [];
          const cellWidth = 100/7;
          
          for (let row = startRow; row <= endRow; row++) {
            const isFirstRow = row === startRow;
            const isLastRow = row === endRow;
            const rowStartCol = isFirstRow ? startCol : 0;
            const rowEndCol = isLastRow ? endCol : 6;
            
            let leftPos, widthPercent;
            
            if (isFirstRow && span.isCheckIn) {
              // First row: start from 50% of check-in cell, go to end of row
              leftPos = `${(rowStartCol * cellWidth) + (cellWidth * 0.5)}%`;
              widthPercent = `${(rowEndCol - rowStartCol + 1) * cellWidth - (cellWidth * 0.5)}%`;
            } else if (isLastRow && span.isCheckOut) {
              // Last row: start from beginning, end at 50% of check-out cell
              leftPos = `${rowStartCol * cellWidth}%`;
              widthPercent = `${(rowEndCol - rowStartCol) * cellWidth + (cellWidth * 0.5)}%`;
            } else {
              // Middle rows: full width
              leftPos = `${rowStartCol * cellWidth}%`;
              widthPercent = `${(rowEndCol - rowStartCol + 1) * cellWidth}%`;
            }
            
            rows.push(
              <div
                key={`span-${span.booking.id}-row-${row}`}
                className="absolute z-10"
                style={{
                  top: `${row * 96 + 48 + verticalOffset}px`,
                  left: leftPos,
                  width: widthPercent,
                  height: '24px',
                  transform: 'translateY(-50%)'
                }}
              >
                <div className={`w-full h-full flex items-center justify-center text-xs font-medium px-2 ${
                  isFirstRow && span.isCheckIn ? 'rounded-l-full' :
                  isLastRow && span.isCheckOut ? 'rounded-r-full' : ''
                } ${sourceColors[span.booking.bookingSource as keyof typeof sourceColors] || sourceColors.manual}`}>
                  <span className="truncate">
                    {span.booking.guestFirstName} {span.booking.guestLastName}
                  </span>
                </div>
              </div>
            );
          }
          
          return rows;
        })}
      </div>

      {/* Booking Form Modal */}
      <Dialog open={showBookingForm} onOpenChange={setShowBookingForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Create Booking for {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="mode">Booking Type</Label>
              <Select value={formData.mode} onValueChange={(value: "blocked" | "manual") => setFormData({ ...formData, mode: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Booking</SelectItem>
                  <SelectItem value="blocked">Block Dates</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="source">Booking Source</Label>
              <Select value={formData.source} onValueChange={(value: "airbnb" | "booking" | "direct" | "blocked") => setFormData({ ...formData, source: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="airbnb">Airbnb</SelectItem>
                  <SelectItem value="booking">Booking.com</SelectItem>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.mode === "manual" && (
              <>
                <div>
                  <Label htmlFor="guestName">Guest Name</Label>
                  <Input
                    id="guestName"
                    value={formData.guestName}
                    onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="guests">Guests</Label>
                    <Input
                      id="guests"
                      type="number"
                      min="1"
                      max="5"
                      value={formData.guests}
                      onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nights">Nights</Label>
                    <Input
                      id="nights"
                      type="number"
                      min="1"
                      max="15"
                      value={formData.nights}
                      onChange={(e) => setFormData({ ...formData, nights: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3">
              <Button 
                onClick={handleCreateBooking}
                disabled={createBookingMutation.isPending || (formData.mode === "manual" && !formData.guestName)}
                className="flex-1"
              >
                {createBookingMutation.isPending ? "Creating..." : "Create Booking"}
              </Button>
              <Button variant="outline" onClick={() => setShowBookingForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SmoobuCalendar;