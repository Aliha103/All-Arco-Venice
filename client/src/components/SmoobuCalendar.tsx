import React, { useState } from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth, parseISO, isToday, isWithinInterval } from 'date-fns';
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

  const getBookingForDay = (day: Date) => {
    return smoobuBookings.find((booking) =>
      isWithinInterval(day, { start: booking.checkIn, end: booking.checkOut }),
    );
  };

  const getSourceColor = (source?: string) => {
    switch (source) {
      case "airbnb": return "bg-red-500";
      case "booking": return "bg-blue-500";
      case "direct": return "bg-green-500";
      case "blocked": return "bg-gray-500";
      default: return "bg-purple-500";
    }
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
    
    const existingBooking = getBookingForDay(date);
    if (existingBooking) {
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

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {daysInMonth.map((day) => {
          const booking = getBookingForDay(day);
          const isCurrentDay = isToday(day);
          const isCurrentMonthDay = isSameMonth(day, currentMonth);

          return (
            <div
              key={day.toISOString()}
              className={`
                border rounded-lg p-2 h-24 relative cursor-pointer transition-all duration-200
                ${booking ? getSourceColor(booking.bookingSource) + ' text-white' : 'bg-green-100 hover:bg-green-200'}
                ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}
                ${!isCurrentMonthDay ? 'opacity-50' : ''}
              `}
              onClick={() => handleDateClick(day)}
            >
              <span className={`font-bold text-sm absolute top-1 right-2 ${booking ? 'text-white' : 'text-gray-700'}`}>
                {format(day, 'd')}
              </span>
              {booking && (
                <div className="text-xs mt-4 font-medium overflow-hidden">
                  <div className="truncate">{booking.guestName}</div>
                </div>
              )}
            </div>
          );
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