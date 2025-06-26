import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { CreditCard, Building } from "lucide-react";
import { format, addDays, differenceInDays } from "date-fns";

export default function CalendarBooking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();
  const [formData, setFormData] = useState({
    guestFirstName: "",
    guestLastName: "",
    guestEmail: "",
    guestMobile: "",
    guestCountry: "",
    paymentMethod: "online",
  });

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Temporarily disable WebSocket to stop excessive API calls
  // useWebSocket();

  // Temporarily using static empty array to prevent excessive API calls
  const calendarBookings: any[] = [];

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      return await response.json();
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Booking Confirmed!",
        description: `Your confirmation number: ${booking.confirmationNumber}`,
      });
      
      // Redirect to payment if needed
      if (formData.paymentMethod === "online") {
        const amount = calculateTotal();
        window.location.href = `/checkout?amount=${amount}&type=online&booking=${booking.id}`;
      } else if (formData.paymentMethod === "at_property_card_auth") {
        const amount = calculateTotal();
        window.location.href = `/checkout?amount=${amount}&type=authorization&booking=${booking.id}`;
      }
      
      // Reset form
      setCheckInDate(undefined);
      setCheckOutDate(undefined);
      setFormData({
        guestFirstName: "",
        guestLastName: "",
        guestEmail: "",
        guestMobile: "",
        guestCountry: "",
        paymentMethod: "online",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    return differenceInDays(checkOutDate, checkInDate);
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    const basePrice = 120;
    const cityTax = 15;
    return nights * basePrice + cityTax;
  };

  const isDateBooked = (date: Date) => {
    return calendarBookings.some((booking: any) => {
      const bookingCheckIn = new Date(booking.checkInDate);
      const bookingCheckOut = new Date(booking.checkOutDate);
      return date >= bookingCheckIn && date < bookingCheckOut;
    });
  };

  const handleBooking = () => {
    if (user?.role === 'admin') {
      toast({
        title: "Admin Notice",
        description: "Admins cannot book from this interface. Use the Dashboard to create bookings.",
        variant: "destructive",
      });
      return;
    }

    if (!checkInDate || !checkOutDate) {
      toast({
        title: "Missing Dates",
        description: "Please select check-in and check-out dates.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.guestFirstName || !formData.guestLastName || !formData.guestEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required guest details.",
        variant: "destructive",
      });
      return;
    }

    const bookingData = {
      guestFirstName: formData.guestFirstName,
      guestLastName: formData.guestLastName,
      guestEmail: formData.guestEmail,
      guestMobile: formData.guestMobile,
      guestCountry: formData.guestCountry,
      checkInDate: format(checkInDate, "yyyy-MM-dd"),
      checkOutDate: format(checkOutDate, "yyyy-MM-dd"),
      paymentMethod: formData.paymentMethod,
      totalPrice: calculateTotal().toString(),
      cityTax: "15.00",
    };

    createBookingMutation.mutate(bookingData);
  };

  const nights = calculateNights();
  const total = calculateTotal();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Select Your Dates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-base font-medium mb-3 block">Check-in Date</Label>
                  <Calendar
                    mode="single"
                    selected={checkInDate}
                    onSelect={setCheckInDate}
                    disabled={(date) => date < new Date() || isDateBooked(date)}
                    className="rounded-md border"
                  />
                </div>
                <div>
                  <Label className="text-base font-medium mb-3 block">Check-out Date</Label>
                  <Calendar
                    mode="single"
                    selected={checkOutDate}
                    onSelect={setCheckOutDate}
                    disabled={(date) => 
                      date < new Date() || 
                      (checkInDate && date <= checkInDate) ||
                      isDateBooked(date)
                    }
                    className="rounded-md border"
                  />
                </div>
              </div>
              
              {/* Calendar Legend */}
              <div className="flex justify-center space-x-6 text-sm mt-6 pt-4 border-t">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-100 rounded mr-2"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-100 rounded mr-2"></div>
                  <span>Booked</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-primary rounded mr-2"></div>
                  <span>Selected</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Widget */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <div className="mb-6">
                <div className="text-3xl font-bold text-gray-900">
                  €120 <span className="text-lg font-normal text-gray-600">/ night</span>
                </div>
              </div>

              {/* Date Selection Summary */}
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Check-in</Label>
                  <Input
                    type="date"
                    value={checkInDate ? format(checkInDate, "yyyy-MM-dd") : ""}
                    onChange={(e) => setCheckInDate(e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Check-out</Label>
                  <Input
                    type="date"
                    value={checkOutDate ? format(checkOutDate, "yyyy-MM-dd") : ""}
                    onChange={(e) => setCheckOutDate(e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </div>
              </div>

              {/* Guest Details */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="First Name"
                    value={formData.guestFirstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, guestFirstName: e.target.value }))}
                  />
                  <Input
                    placeholder="Last Name"
                    value={formData.guestLastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, guestLastName: e.target.value }))}
                  />
                </div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.guestEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, guestEmail: e.target.value }))}
                />
                <Input
                  type="tel"
                  placeholder="Mobile Number"
                  value={formData.guestMobile}
                  onChange={(e) => setFormData(prev => ({ ...prev, guestMobile: e.target.value }))}
                />
                <Input
                  placeholder="Country"
                  value={formData.guestCountry}
                  onChange={(e) => setFormData(prev => ({ ...prev, guestCountry: e.target.value }))}
                />
              </div>

              {/* Payment Options - Only for guests */}
              {user?.role !== 'admin' && (
                <div className="mb-6">
                  <Label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</Label>
                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                  >
                    <div className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="online" id="online" />
                      <Label htmlFor="online" className="flex items-center cursor-pointer">
                        <CreditCard className="text-secondary mr-2 h-4 w-4" />
                        <span>Pay Online (Secure)</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="at_property_card_auth" id="at_property_card_auth" />
                      <Label htmlFor="at_property_card_auth" className="flex items-center cursor-pointer">
                        <Building className="text-secondary mr-2 h-4 w-4" />
                        <span>Pay at Property (Card Auth)</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Booking Summary */}
              {nights > 0 && (
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between mb-2">
                    <span>€120 × {nights} nights</span>
                    <span>€{(120 * nights).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>City Tax</span>
                    <span>€15</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                    <span>Total</span>
                    <span>€{total}</span>
                  </div>
                </div>
              )}

              {/* Booking Button */}
              <Button
                onClick={handleBooking}
                disabled={createBookingMutation.isPending || user?.role === 'admin'}
                className="w-full"
              >
                {createBookingMutation.isPending 
                  ? "Processing..." 
                  : user?.role === 'admin' 
                    ? "View Only (Admin)" 
                    : "Reserve Now"
                }
              </Button>

              {/* Admin Notice */}
              {user?.role === 'admin' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
                  <div className="flex items-center">
                    <div className="mr-2">ℹ️</div>
                    <span>Admins can view calendar but cannot book from this interface. Use the Dashboard to create bookings.</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
