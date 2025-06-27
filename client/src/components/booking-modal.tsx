import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { X, CreditCard, MapPin, Users, Calendar, Clock, PawPrint } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingDetails: {
    checkIn: string;
    checkOut: string;
    guests: number;
    hasPet: boolean;
    pricing: {
      basePrice: number;
      totalNights: number;
      priceBeforeDiscount: number;
      lengthOfStayDiscount: number;
      lengthOfStayDiscountPercent: number;
      priceAfterDiscount: number;
      cleaningFee: number;
      serviceFee: number;
      petFee: number;
      cityTax: number;
      referralCredit: number;
      totalPrice: number;
    };
  };
}

const countries = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
  'Bahrain', 'Bangladesh', 'Belarus', 'Belgium', 'Bolivia', 'Bosnia and Herzegovina', 'Brazil', 'Bulgaria',
  'Cambodia', 'Canada', 'Chile', 'China', 'Colombia', 'Croatia', 'Czech Republic', 'Denmark', 'Ecuador',
  'Egypt', 'Estonia', 'Finland', 'France', 'Georgia', 'Germany', 'Greece', 'Hungary', 'Iceland', 'India',
  'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya',
  'Kuwait', 'Latvia', 'Lebanon', 'Lithuania', 'Luxembourg', 'Malaysia', 'Mexico', 'Morocco', 'Netherlands',
  'New Zealand', 'Norway', 'Pakistan', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania',
  'Russia', 'Saudi Arabia', 'Singapore', 'Slovakia', 'Slovenia', 'South Africa', 'South Korea', 'Spain',
  'Sri Lanka', 'Sweden', 'Switzerland', 'Thailand', 'Turkey', 'Ukraine', 'United Arab Emirates',
  'United Kingdom', 'United States', 'Uruguay', 'Venezuela', 'Vietnam'
];

export default function BookingModal({ isOpen, onClose, bookingDetails }: BookingModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    guestFirstName: '',
    guestLastName: '',
    guestEmail: '',
    guestCountry: '',
    guestPhone: '',
    paymentMethod: 'online' as 'online' | 'property',
    voucherCode: '',
    referralCode: '',
    specialRequests: ''
  });

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest('POST', '/api/bookings', bookingData);
      return response.json();
    },
    onSuccess: (booking: any) => {
      toast({
        title: "Booking Confirmed!",
        description: `Your confirmation code is ${booking.confirmationCode}`,
      });
      setStep(3); // Success step
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.guestFirstName || !formData.guestLastName || !formData.guestEmail || 
        !formData.guestCountry || !formData.guestPhone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const bookingData = {
      ...formData,
      checkInDate: bookingDetails.checkIn,
      checkOutDate: bookingDetails.checkOut,
      guests: bookingDetails.guests,
      hasPet: bookingDetails.hasPet,
      createdBy: 'guest',
      bookedForSelf: true
    };

    createBookingMutation.mutate(bookingData);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const resetAndClose = () => {
    setStep(1);
    setFormData({
      guestFirstName: '',
      guestLastName: '',
      guestEmail: '',
      guestCountry: '',
      guestPhone: '',
      paymentMethod: 'online',
      voucherCode: '',
      referralCode: '',
      specialRequests: ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Booking</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Booking Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Dates */}
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <div className="text-sm">
                    <div className="font-medium">Check-in</div>
                    <div className="text-gray-600">{formatDate(bookingDetails.checkIn)}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <div className="text-sm">
                    <div className="font-medium">Check-out</div>
                    <div className="text-gray-600">{formatDate(bookingDetails.checkOut)}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <div className="text-sm">
                    <div className="font-medium">{bookingDetails.pricing?.totalNights || 0} night{(bookingDetails.pricing?.totalNights || 0) !== 1 ? 's' : ''}</div>
                  </div>
                </div>

                {/* Guests */}
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <div className="text-sm">
                    <div className="font-medium">{bookingDetails.guests} guest{bookingDetails.guests !== 1 ? 's' : ''}</div>
                  </div>
                </div>

                {bookingDetails.hasPet && (
                  <div className="flex items-center space-x-2">
                    <PawPrint className="w-4 h-4 text-blue-600" />
                    <div className="text-sm">
                      <div className="font-medium">Pet included</div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Pricing Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>€{(bookingDetails.pricing?.basePrice || 0).toFixed(2)} × {bookingDetails.pricing?.totalNights || 0} night{(bookingDetails.pricing?.totalNights || 0) !== 1 ? 's' : ''}</span>
                    <span>€{(bookingDetails.pricing?.priceBeforeDiscount || 0).toFixed(2)}</span>
                  </div>
                  
                  {(bookingDetails.pricing?.lengthOfStayDiscount || 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Length of stay discount ({bookingDetails.pricing?.lengthOfStayDiscountPercent || 0}%)</span>
                      <span>-€{(bookingDetails.pricing?.lengthOfStayDiscount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span>Cleaning fee</span>
                    <span>€{(bookingDetails.pricing?.cleaningFee || 0).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Service fee</span>
                    <span>€{(bookingDetails.pricing?.serviceFee || 0).toFixed(2)}</span>
                  </div>
                  
                  {(bookingDetails.pricing?.petFee || 0) > 0 && (
                    <div className="flex justify-between">
                      <span>Pet fee</span>
                      <span>€{(bookingDetails.pricing?.petFee || 0).toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span>City tax <span className="text-xs text-gray-500">(paid at property)</span></span>
                    <span>€{(bookingDetails.pricing?.cityTax || 0).toFixed(2)}</span>
                  </div>
                  
                  {(bookingDetails.pricing?.referralCredit || 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Referral credit</span>
                      <span>-€{(bookingDetails.pricing?.referralCredit || 0).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <Separator />
                
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>€{(bookingDetails.pricing?.totalPrice || 0).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Form Steps */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Guest Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.guestFirstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, guestFirstName: e.target.value }))}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.guestLastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, guestLastName: e.target.value }))}
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.guestEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, guestEmail: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="country">Country *</Label>
                      <Select
                        value={formData.guestCountry}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, guestCountry: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={formData.guestPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, guestPhone: e.target.value }))}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="voucherCode">Discount Voucher (Optional)</Label>
                        <Input
                          id="voucherCode"
                          value={formData.voucherCode || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, voucherCode: e.target.value }))}
                          placeholder="Enter discount code"
                        />
                      </div>
                      
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                    <Textarea
                      id="specialRequests"
                      value={formData.specialRequests}
                      onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                      placeholder="Any special requests or notes..."
                      rows={3}
                    />
                  </div>

                  <Button 
                    onClick={() => setStep(2)} 
                    className="w-full"
                    disabled={!formData.guestFirstName || !formData.guestLastName || !formData.guestEmail || 
                             !formData.guestCountry || !formData.guestPhone}
                  >
                    Continue to Payment
                  </Button>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        formData.paymentMethod === 'online' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'online' }))}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          formData.paymentMethod === 'online' 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-gray-300'
                        }`}>
                          {formData.paymentMethod === 'online' && (
                            <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                          )}
                        </div>
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium">Pay Online</div>
                          <div className="text-sm text-gray-600">Secure payment with card</div>
                        </div>
                      </div>
                      {formData.paymentMethod === 'online' && (
                        <div className="mt-3 ml-7">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Recommended - Instant confirmation
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div 
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        formData.paymentMethod === 'property' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'property' }))}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          formData.paymentMethod === 'property' 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-gray-300'
                        }`}>
                          {formData.paymentMethod === 'property' && (
                            <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                          )}
                        </div>
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium">Pay at Property</div>
                          <div className="text-sm text-gray-600">Pay when you arrive</div>
                        </div>
                      </div>
                      {formData.paymentMethod === 'property' && (
                        <div className="mt-3 ml-7">
                          <Badge variant="outline" className="border-orange-200 text-orange-800">
                            Subject to availability
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                      Back
                    </Button>
                    <Button 
                      onClick={handleSubmit} 
                      className="flex-1"
                      disabled={createBookingMutation.isPending}
                    >
                      {createBookingMutation.isPending ? 'Processing...' : 'Confirm Booking'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">Booking Confirmed!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold">Thank you for your booking!</h3>
                    <p className="text-gray-600">Your reservation has been confirmed and you'll receive a confirmation email shortly.</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Confirmation Code</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {createBookingMutation.data?.confirmationCode}
                    </div>
                  </div>

                  <Button onClick={resetAndClose} className="w-full">
                    Close
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}