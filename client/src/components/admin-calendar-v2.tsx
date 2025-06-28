import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, X, Check, Ban, UserPlus, Home } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, addDays, isAfter, isBefore, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

interface Booking {
  id: number;
  checkInDate: string;
  checkOutDate: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guests: number;
  totalPrice: number;
  bookingSource: 'direct' | 'airbnb' | 'booking.com' | 'admin' | 'blocked';
  blockReason?: string;
  paymentMethod?: string;
}

interface CalendarProps {
  className?: string;
}

export function AdminCalendarV2({ className }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'block' | 'manual-booking' | null>(null);
  
  // Form states
  const [blockReason, setBlockReason] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guests, setGuests] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'property'>('property');
  const [customPrice, setCustomPrice] = useState('150');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
    refetchInterval: 1000
  });

  const blockDatesMutation = useMutation({
    mutationFn: async (data: { startDate: string; endDate: string; reason: string }) => {
      return apiRequest('POST', '/api/admin/block-dates', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({ title: "Dates blocked successfully" });
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error blocking dates", description: error.message, variant: "destructive" });
    }
  });

  const createManualBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/admin/manual-booking', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({ title: "Manual booking created successfully" });
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error creating booking", description: error.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setShowActionDialog(false);
    setSelectedDate(null);
    setActionType(null);
    setBlockReason('');
    setCheckOutDate('');
    setGuestFirstName('');
    setGuestLastName('');
    setGuestEmail('');
    setGuests(1);
    setPaymentMethod('property');
    setCustomPrice('150');
  };

  const handleDateClick = (dateStr: string) => {
    // Check if date already has booking
    const existingBooking = (bookings as Booking[]).find((booking: Booking) => {
      const checkIn = parseISO(booking.checkInDate);
      const checkOut = parseISO(booking.checkOutDate);
      const clickedDate = parseISO(dateStr);
      return (isSameDay(clickedDate, checkIn) || 
              (isAfter(clickedDate, checkIn) && isBefore(clickedDate, checkOut)) ||
              isSameDay(clickedDate, checkOut));
    });

    if (existingBooking) {
      toast({ 
        title: "Date unavailable", 
        description: "This date already has a booking",
        variant: "destructive" 
      });
      return;
    }

    setSelectedDate(dateStr);
    setCheckOutDate(format(addDays(parseISO(dateStr), 1), 'yyyy-MM-dd')); // Minimum next day
    setShowActionDialog(true);
  };

  const handleActionSubmit = () => {
    if (!selectedDate || !actionType) return;

    if (actionType === 'block') {
      if (!blockReason.trim()) {
        toast({ title: "Please enter a block reason", variant: "destructive" });
        return;
      }
      blockDatesMutation.mutate({
        startDate: selectedDate,
        endDate: checkOutDate,
        reason: blockReason
      });
    } else if (actionType === 'manual-booking') {
      if (!guestFirstName.trim() || !guestLastName.trim() || !guestEmail.trim()) {
        toast({ title: "Please fill all guest details", variant: "destructive" });
        return;
      }
      createManualBookingMutation.mutate({
        guestFirstName,
        guestLastName,
        guestEmail,
        guestCountry: 'Admin Entry',
        guestPhone: '000-000-0000',
        checkInDate: selectedDate,
        checkOutDate,
        guests,
        paymentMethod,
        customPrice: parseFloat(customPrice),
        createdBy: 'admin'
      });
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'direct': return 'bg-emerald-500';
      case 'airbnb': return 'bg-red-500';
      case 'booking.com': return 'bg-blue-500';
      case 'blocked': return 'bg-gray-500';
      default: return 'bg-emerald-500';
    }
  };

  const getSourceLogo = (source: string) => {
    switch (source) {
      case 'direct': return <Home className="w-3 h-3 text-white" />;
      case 'airbnb': return <span className="text-white font-bold text-xs">A</span>;
      case 'booking.com': return <span className="text-white font-bold text-xs">B</span>;
      case 'blocked': return <Ban className="w-3 h-3 text-white" />;
      default: return <Home className="w-3 h-3 text-white" />;
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayBooking = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return (bookings as Booking[]).find((booking: Booking) => {
      const checkIn = parseISO(booking.checkInDate);
      const checkOut = parseISO(booking.checkOutDate);
      return (isSameDay(day, checkIn) || 
              (isAfter(day, checkIn) && isBefore(day, checkOut)) ||
              isSameDay(day, checkOut));
    });
  };

  const getBookingPosition = (day: Date, booking: Booking) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const checkIn = parseISO(booking.checkInDate);
    const checkOut = parseISO(booking.checkOutDate);
    
    const isCheckIn = isSameDay(day, checkIn);
    const isCheckOut = isSameDay(day, checkOut);
    const isMiddle = isAfter(day, checkIn) && isBefore(day, checkOut);

    return { isCheckIn, isCheckOut, isMiddle };
  };

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold">Calendar Management</h2>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-lg font-medium min-w-[200px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-500 rounded flex items-center justify-center">
              <Home className="w-2.5 h-2.5 text-white" />
            </div>
            <span>Direct Website</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            <span>Airbnb</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">B</span>
            </div>
            <span>Booking.com</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-500 rounded flex items-center justify-center">
              <Ban className="w-2.5 h-2.5 text-white" />
            </div>
            <span>Blocked</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const booking = getDayBooking(day);
            const position = booking ? getBookingPosition(day, booking) : null;

            return (
              <div
                key={dayStr}
                className="relative aspect-square border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors"
                onClick={() => handleDateClick(dayStr)}
              >
                {/* Date Number */}
                <div className="absolute top-1 left-1 text-sm font-medium text-gray-700">
                  {format(day, 'd')}
                </div>

                {/* Enhanced Booking Display with Split Edge Support */}
                {(() => {
                  // Find bookings that touch this day
                  const todaysBookings = bookings.filter(b => {
                    const checkIn = parseISO(b.checkInDate);
                    const checkOut = parseISO(b.checkOutDate);
                    const checkOutInclusive = addDays(checkOut, -1);
                    return isWithinInterval(day, { start: checkIn, end: checkOutInclusive }) ||
                           isSameDay(day, checkIn) ||
                           isSameDay(day, checkOutInclusive);
                  });

                  // Split left/right if two bookings share the cell (checkout + checkin)
                  const leftBooking = todaysBookings.find(b => {
                    const checkOut = addDays(parseISO(b.checkOutDate), -1);
                    return isSameDay(day, checkOut) && !isSameDay(day, parseISO(b.checkInDate));
                  });
                  
                  const rightBooking = todaysBookings.find(b => {
                    return isSameDay(day, parseISO(b.checkInDate));
                  });

                  if (leftBooking && rightBooking) {
                    // Two bookings on same day - split display
                    return (
                      <div className="absolute inset-0">
                        {/* Left half - checkout */}
                        <div className={`absolute inset-y-1 left-1 right-1/2 rounded-l-full flex items-center px-1 text-[10px] font-medium ${getSourceColor(leftBooking.bookingSource)}`}>
                          {getSourceLogo(leftBooking.bookingSource)}
                        </div>
                        {/* Right half - checkin */}
                        <div className={`absolute inset-y-1 right-1 left-1/2 rounded-r-full flex items-center justify-end px-1 text-[10px] font-medium ${getSourceColor(rightBooking.bookingSource)}`}>
                          {getSourceLogo(rightBooking.bookingSource)}
                        </div>
                      </div>
                    );
                  } else if (todaysBookings.length === 1) {
                    // Single booking - full cell display
                    const singleBooking = todaysBookings[0];
                    const checkIn = parseISO(singleBooking.checkInDate);
                    const checkOut = addDays(parseISO(singleBooking.checkOutDate), -1);
                    const isStart = isSameDay(day, checkIn);
                    const isEnd = isSameDay(day, checkOut);
                    const isMiddle = !isStart && !isEnd;
                    
                    return (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`
                          h-8 flex items-center justify-center text-white text-xs font-medium
                          ${getSourceColor(singleBooking.bookingSource)}
                          ${isStart && isEnd ? 'w-full rounded-full' : ''}
                          ${isStart && !isEnd ? 'w-full rounded-l-full' : ''}
                          ${isMiddle ? 'w-full' : ''}
                          ${isEnd && !isStart ? 'w-full rounded-r-full' : ''}
                        `}>
                          {isStart && (
                            <div className="flex items-center gap-1">
                              {getSourceLogo(singleBooking.bookingSource)}
                              <span className="truncate">
                                {singleBooking.bookingSource === 'blocked' 
                                  ? 'Blocked' 
                                  : `${singleBooking.guestFirstName} ${singleBooking.guestLastName.charAt(0)}.`
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  
                  return null;
                })()}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Calendar Action</DialogTitle>
            <DialogDescription>
              Selected date: {selectedDate && format(parseISO(selectedDate), 'MMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!actionType && (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setActionType('block')}
                >
                  <Ban className="w-6 h-6" />
                  Block Dates
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setActionType('manual-booking')}
                >
                  <UserPlus className="w-6 h-6" />
                  Manual Booking
                </Button>
              </div>
            )}

            {actionType === 'block' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="checkout-date">Block Until (Check-out Date)</Label>
                  <Input
                    id="checkout-date"
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    min={selectedDate ? format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd') : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="block-reason">Block Reason</Label>
                  <Textarea
                    id="block-reason"
                    placeholder="e.g., Maintenance, Personal use, etc."
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                  />
                </div>
              </div>
            )}

            {actionType === 'manual-booking' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="checkout-date">Check-out Date</Label>
                  <Input
                    id="checkout-date"
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    min={selectedDate ? format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd') : ''}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="first-name">First Name</Label>
                    <Input
                      id="first-name"
                      value={guestFirstName}
                      onChange={(e) => setGuestFirstName(e.target.value)}
                      placeholder="Guest first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input
                      id="last-name"
                      value={guestLastName}
                      onChange={(e) => setGuestLastName(e.target.value)}
                      placeholder="Guest last name"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="guest@example.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="guests">Guests</Label>
                    <Select value={guests.toString()} onValueChange={(v) => setGuests(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map(num => (
                          <SelectItem key={num} value={num.toString()}>{num} guest{num > 1 ? 's' : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="custom-price">Price/Night (€)</Label>
                    <Input
                      id="custom-price"
                      type="number"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="property">Pay at Property</SelectItem>
                      <SelectItem value="online">Online Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {actionType && (
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={resetForm} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleActionSubmit}
                  disabled={blockDatesMutation.isPending || createManualBookingMutation.isPending}
                  className="flex-1"
                >
                  {blockDatesMutation.isPending || createManualBookingMutation.isPending ? 'Processing...' : 'Confirm'}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}