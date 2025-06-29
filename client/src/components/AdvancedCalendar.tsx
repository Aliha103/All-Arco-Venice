import React, { useState, useEffect } from "react";
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
  addDays,
  isWithinInterval,
  parseISO,
  differenceInDays,
} from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Euro,
  Plus,
  Eye,
  Edit,
  Trash2,
  MapPin
} from "lucide-react";

interface CalendarBooking {
  id: string;
  guestName: string;
  checkIn: Date;
  checkOut: Date;
  status: string;
  source: "airbnb" | "booking" | "direct" | "blocked" | "manual";
  price: number;
  guests: number;
  nights: number;
}

interface FormState {
  mode: "blocked" | "manual";
  guestName: string;
  price: number;
  guests: number;
  nights: number;
  source: "airbnb" | "booking" | "direct" | "blocked";
  paymentMethod: string;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AdvancedCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "list">("month");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing bookings
  const { data: bookingsData = [] } = useQuery({
    queryKey: ["/api/bookings"],
  });

  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [formState, setFormState] = useState<FormState>({
    mode: "manual",
    guestName: "",
    price: 150,
    guests: 2,
    nights: 1,
    source: "direct",
    paymentMethod: "card",
  });

  useEffect(() => {
    const transformedBookings = (bookingsData as any[]).map((booking: any) => {
      const checkIn = parseISO(booking.checkInDate);
      const checkOut = parseISO(booking.checkOutDate);
      const nights = differenceInDays(checkOut, checkIn);
      
      return {
        id: booking.id.toString(),
        guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
        checkIn,
        checkOut,
        status: booking.status || "confirmed",
        source: booking.bookingSource || "direct" as const,
        price: booking.totalPrice || 0,
        guests: booking.guests || 1,
        nights,
      };
    });
    setBookings(transformedBookings);
  }, [bookingsData]);

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      return apiRequest("POST", "/api/bookings", bookingData);
    },
    onSuccess: () => {
      // Invalidate all booking-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/dates"] });
      
      toast({
        title: "Success",
        description: "Booking created successfully",
      });
      setShowBookingModal(false);
      
      // Reset form state
      setFormState({
        mode: "manual",
        guestName: "",
        price: 150,
        guests: 2,
        nights: 1,
        source: "direct",
        paymentMethod: "card",
      });
      setSelectedDate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    },
  });

  // Generate calendar days
  const getCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    });
  };

  // Navigation functions
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  // Get bookings for a specific date with position info
  const getBookingsForDate = (date: Date) => {
    return bookings.map(booking => {
      const isCheckIn = isSameDay(booking.checkIn, date);
      const isCheckOut = isSameDay(booking.checkOut, date);
      const isMiddle = isWithinInterval(date, { start: addDays(booking.checkIn, 1), end: addDays(booking.checkOut, -1) });
      
      if (isCheckIn || isCheckOut || isMiddle) {
        return {
          ...booking,
          position: isCheckIn ? 'checkin' : isCheckOut ? 'checkout' : 'middle'
        } as CalendarBooking & { position: string };
      }
      return null;
    }).filter((item): item is CalendarBooking & { position: string } => item !== null);
  };

  // Get booking source color
  const getSourceColor = (source: string) => {
    switch (source) {
      case "airbnb": return "bg-red-500 text-white";
      case "booking": return "bg-blue-500 text-white";
      case "direct": return "bg-green-500 text-white";
      case "blocked": return "bg-gray-500 text-white";
      case "manual": return "bg-purple-500 text-white";
      default: return "bg-gray-400 text-white";
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "airbnb": return "Airbnb";
      case "booking": return "Booking.com";
      case "direct": return "Direct";
      case "blocked": return "Blocked";
      case "manual": return "Manual";
      default: return "Unknown";
    }
  };

  const handleDateClick = (date: Date) => {
    if (!isSameMonth(date, currentMonth)) return;
    
    const existingBookings = getBookingsForDate(date);
    if (existingBookings.length > 0) {
      setSelectedBooking(existingBookings[0]);
    } else {
      setSelectedDate(date);
      setSelectedBooking(null);
      setFormState(prev => ({ 
        ...prev, 
        mode: "manual",
        guestName: "",
        price: 150,
        guests: 2,
        nights: 1 
      }));
    }
    setShowBookingModal(true);
  };

  const handleCreateBooking = () => {
    if (!selectedDate) return;

    const checkOutDate = addDays(selectedDate, formState.nights);
    
    if (formState.mode === "blocked") {
      const blockData = {
        guestFirstName: "Blocked",
        guestLastName: "Date",
        guestEmail: "blocked@system.com",
        guestCountry: "System",
        guestPhone: "000-000-0000",
        checkInDate: format(selectedDate, "yyyy-MM-dd"),
        checkOutDate: format(checkOutDate, "yyyy-MM-dd"),
        guests: 1,
        paymentMethod: "property",
        createdBy: "admin",
        blockReason: "Manual block",
        bookingSource: "blocked",
      };
      createBookingMutation.mutate(blockData);
    } else {
      const bookingData = {
        guestFirstName: formState.guestName.split(" ")[0] || "Manual",
        guestLastName: formState.guestName.split(" ").slice(1).join(" ") || "Booking",
        guestEmail: "manual@booking.com",
        guestCountry: "Manual Entry",
        guestPhone: "000-000-0000",
        checkInDate: format(selectedDate, "yyyy-MM-dd"),
        checkOutDate: format(checkOutDate, "yyyy-MM-dd"),
        guests: formState.guests,
        paymentMethod: formState.paymentMethod,
        createdBy: "admin",
        bookingSource: formState.source,
      };
      createBookingMutation.mutate(bookingData);
    }
  };

  const calendarDays = getCalendarDays();

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header with navigation and controls */}
      <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-lg shadow-sm border">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold text-gray-900">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          
          <Select value={viewMode} onValueChange={(value: "month" | "list") => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month View</SelectItem>
              <SelectItem value="list">List View</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <span className="text-sm font-medium text-gray-700">Legend:</span>
        <Badge className="bg-red-500 text-white">Airbnb</Badge>
        <Badge className="bg-blue-500 text-white">Booking.com</Badge>
        <Badge className="bg-green-500 text-white">Direct</Badge>
        <Badge className="bg-gray-500 text-white">Blocked</Badge>
        <Badge className="bg-purple-500 text-white">Manual</Badge>
      </div>

      {viewMode === "month" ? (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Calendar Header */}
          <div className="grid grid-cols-7 border-b bg-gray-50">
            {WEEKDAYS.map((day) => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid with Cross-Date Connecting Pipes */}
          <div className="grid grid-cols-7 relative">
            {calendarDays.map((day, index) => {
              const dayBookings = getBookingsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isDayToday = isToday(day);
              const isLastColumnOfRow = (index + 1) % 7 === 0;
              const isFirstColumnOfRow = index % 7 === 0;

              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(day)}
                  className={`
                    min-h-[160px] p-2 border-r border-b cursor-pointer transition-colors relative
                    ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white hover:bg-gray-50'}
                    ${isDayToday ? 'bg-blue-50 border-blue-200' : ''}
                  `}
                >
                  <div className={`
                    text-sm font-medium mb-1
                    ${isDayToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                  `}>
                    {format(day, "d")}
                  </div>
                  
                  {/* Enhanced continuous booking display with seamless pipes */}
                  <div className="relative flex-1 mt-2 overflow-visible">
                    {dayBookings.slice(0, 3).map((booking, bookingIndex) => {
                      const position = booking.position;
                      const topOffset = bookingIndex * 32; // Increased spacing
                      
                      return (
                        <div 
                          key={booking.id} 
                          className="absolute left-0 right-0 overflow-visible"
                          style={{ 
                            top: `${topOffset}px`,
                            height: '28px',
                            zIndex: 20 + bookingIndex
                          }}
                        >
                          {/* Continuous booking bar matching screenshot */}
                          <div className="relative w-full h-full overflow-visible">
                            <div 
                              className={`
                                h-full w-full ${getSourceColor(booking.source)} 
                                flex items-center justify-center text-xs font-medium relative
                                ${position === 'checkin' ? 'rounded-l-lg' : ''}
                                ${position === 'checkout' ? 'rounded-r-lg' : ''}
                                ${position === 'middle' ? '' : ''}
                              `}
                              title={`${booking.guestName} - ${getSourceLabel(booking.source)}`}
                            >
                              {/* Check-in indicator */}
                              {position === 'checkin' && (
                                <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                                  <span className="text-white text-xs font-bold">↓</span>
                                </div>
                              )}
                              
                              {/* Check-out indicator */}
                              {position === 'checkout' && (
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                  <span className="text-white text-xs font-bold">↑</span>
                                </div>
                              )}
                              
                              {/* Guest name display */}
                              <span className="text-white text-sm font-bold truncate px-2">
                                {position === 'checkin' ? booking.guestName.split(' ')[0] : 
                                 position === 'checkout' ? booking.guestName.split(' ')[1] || booking.guestName.split(' ')[0] :
                                 booking.guestName.split(' ')[0]}
                              </span>
                            </div>
                            
                            {/* Seamless connecting bridges - extend beyond cell boundaries */}
                            {(position === 'checkin' || position === 'middle') && !isLastColumnOfRow && (
                              <div 
                                className={`absolute top-0 h-full ${getSourceColor(booking.source)}`}
                                style={{ 
                                  right: '-1px',
                                  width: '2px',
                                  zIndex: 35
                                }}
                              />
                            )}
                            
                            {(position === 'checkout' || position === 'middle') && !isFirstColumnOfRow && (
                              <div 
                                className={`absolute top-0 h-full ${getSourceColor(booking.source)}`}
                                style={{ 
                                  left: '-1px',
                                  width: '2px',
                                  zIndex: 35
                                }}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Overflow indicator */}
                    {dayBookings.length > 3 && (
                      <div 
                        className="absolute text-xs text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded border"
                        style={{ 
                          top: `${3 * 32}px`,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          zIndex: 30
                        }}
                      >
                        +{dayBookings.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // List View
        <div className="space-y-4">
          {bookings
            .filter(booking => isSameMonth(booking.checkIn, currentMonth))
            .sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime())
            .map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge className={getSourceColor(booking.source)}>
                        {getSourceLabel(booking.source)}
                      </Badge>
                      <div>
                        <h4 className="font-medium text-gray-900">{booking.guestName}</h4>
                        <p className="text-sm text-gray-600">
                          {format(booking.checkIn, "MMM d")} - {format(booking.checkOut, "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {booking.guests}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {booking.nights}n
                      </div>
                      <div className="flex items-center gap-1">
                        <Euro className="w-4 h-4" />
                        {booking.price}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowBookingModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              {selectedBooking ? "Booking Details" : "Create New Booking"}
            </DialogTitle>

          </DialogHeader>

          {selectedBooking ? (
            // View existing booking
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Guest Name</Label>
                  <p className="font-medium">{selectedBooking.guestName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Source</Label>
                  <Badge className={getSourceColor(selectedBooking.source)}>
                    {getSourceLabel(selectedBooking.source)}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Check-in</Label>
                  <p className="font-medium">{format(selectedBooking.checkIn, "PPP")}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Check-out</Label>
                  <p className="font-medium">{format(selectedBooking.checkOut, "PPP")}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Guests</Label>
                  <p className="font-medium">{selectedBooking.guests}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Nights</Label>
                  <p className="font-medium">{selectedBooking.nights}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Total Price</Label>
                  <p className="font-medium text-green-600">€{selectedBooking.price}</p>
                </div>
              </div>
            </div>
          ) : (
            // Create new booking form
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Creating booking for: <strong>{selectedDate && format(selectedDate, "PPP")}</strong>
              </div>

              <RadioGroup
                value={formState.mode}
                onValueChange={(val: "blocked" | "manual") => setFormState(prev => ({ ...prev, mode: val }))}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="blocked" id="mode-blocked" />
                  <Label htmlFor="mode-blocked">Block Date</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="manual" id="mode-manual" />
                  <Label htmlFor="mode-manual">Manual Booking</Label>
                </div>
              </RadioGroup>

              {formState.mode === "manual" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="guestName">Guest Name</Label>
                    <Input
                      id="guestName"
                      value={formState.guestName}
                      onChange={(e) => setFormState(prev => ({ ...prev, guestName: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="source">Booking Source</Label>
                    <Select
                      value={formState.source}
                      onValueChange={(val: any) => setFormState(prev => ({ ...prev, source: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="airbnb">Airbnb</SelectItem>
                        <SelectItem value="booking">Booking.com</SelectItem>
                        <SelectItem value="direct">Direct Booking</SelectItem>
                        <SelectItem value="manual">Manual Entry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="guests">Number of Guests</Label>
                    <Input
                      id="guests"
                      type="number"
                      min="1"
                      max="5"
                      value={formState.guests}
                      onChange={(e) => setFormState(prev => ({ ...prev, guests: Number(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="nights">Number of Nights</Label>
                    <Input
                      id="nights"
                      type="number"
                      min="1"
                      max="30"
                      value={formState.nights}
                      onChange={(e) => setFormState(prev => ({ ...prev, nights: Number(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="price">Total Price (€)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      value={formState.price}
                      onChange={(e) => setFormState(prev => ({ ...prev, price: Number(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select
                      value={formState.paymentMethod}
                      onValueChange={(val) => setFormState(prev => ({ ...prev, paymentMethod: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="card">Credit Card</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                        <SelectItem value="property">Pay at Property</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingModal(false)}>
              {selectedBooking ? "Close" : "Cancel"}
            </Button>
            {!selectedBooking && (
              <Button 
                onClick={handleCreateBooking}
                disabled={createBookingMutation.isPending}
              >
                {createBookingMutation.isPending ? "Creating..." : "Create Booking"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}