import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Clock, Users, PawPrint, CreditCard, MapPin, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import StripePaymentWrapper from '@/components/stripe-payment-wrapper';
import { QRCodeComponent } from '@/components/qr-code';
import { useActivePromotion } from '@/hooks/useActivePromotion';

interface BookingPageProps {
  bookingDetails: {
    checkIn: string;
    checkOut: string;
    guests: number;
    hasPet: boolean;
    pricing: any;
  };
}

interface FormData {
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestCountry: string;
  guestPhone: string;
  voucherCode: string;
  referralCode: string;
  specialRequests: string;
  paymentMethod: 'online' | 'property';
}

const countries = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 
  'Italy', 'Spain', 'Netherlands', 'Switzerland', 'Austria', 'Belgium', 'Sweden',
  'Norway', 'Denmark', 'Finland', 'Japan', 'South Korea', 'Singapore', 'Other'
];

export default function BookingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { data: activePromotion } = useActivePromotion();
  const [step, setStep] = useState(1);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState<any>(null);
  const [showPayment, setShowPayment] = useState<{
    type: 'full_payment' | 'authorization';
    amount: number;
    bookingData: any;
  } | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<'voucher' | 'referral' | null>(null);
  const [validatedPromoCode, setValidatedPromoCode] = useState<any>(null);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [isBookingForSelf, setIsBookingForSelf] = useState(true);
  
  // Get booking details from URL params or localStorage
  const [bookingDetails, setBookingDetails] = useState<BookingPageProps['bookingDetails']>(() => {
    const stored = localStorage.getItem('bookingDetails');
    return stored ? JSON.parse(stored) : null;
  });

  const [formData, setFormData] = useState<FormData>({
    guestFirstName: '',
    guestLastName: '',
    guestEmail: '',
    guestCountry: '',
    guestPhone: '',
    voucherCode: '',
    referralCode: '',
    specialRequests: '',
    paymentMethod: 'online'
  });

  // Redirect if no booking details
  useEffect(() => {
    if (!bookingDetails) {
      setLocation('/');
    }
  }, [bookingDetails, setLocation]);

  // Prefill user details if authenticated and booking for self
  useEffect(() => {
    if (isAuthenticated && user && isBookingForSelf) {
      setFormData(prev => ({
        ...prev,
        guestFirstName: user.firstName || '',
        guestLastName: user.lastName || '',
        guestEmail: user.email || '',
        guestCountry: user.country || '',
        guestPhone: user.mobileNumber || ''
      }));
    } else if (!isBookingForSelf) {
      // Clear fields when booking for someone else
      setFormData(prev => ({
        ...prev,
        guestFirstName: '',
        guestLastName: '',
        guestEmail: '',
        guestCountry: '',
        guestPhone: ''
      }));
    }
  }, [isAuthenticated, user, isBookingForSelf]);

  // Calculate dynamic pricing based on applied discounts and credits
  const calculateFinalPricing = () => {
    if (!bookingDetails?.pricing) return null;
    
    const base = bookingDetails.pricing;
    let totalPrice = base.totalPrice;
    let cityTaxAmount = base.cityTax;
    let voucherDiscountAmount = 0;
    
    // Use already calculated promotion discount from server-side if available
    let promotionDiscount = base.promotionDiscount || 0;
    let effectiveBasePrice = base.basePrice; // Keep original base price for display
    totalPrice = base.totalPrice; // Use server-calculated totalPrice including promotion discount
    
    // Apply voucher discount (only one discount at a time)
    if (appliedDiscount === 'voucher' && validatedPromoCode) {
      if (validatedPromoCode.discountType === 'percentage') {
        voucherDiscountAmount = base.totalPrice * (validatedPromoCode.discountValue / 100);
        // Apply max discount amount if specified
        if (validatedPromoCode.maxDiscountAmount) {
          voucherDiscountAmount = Math.min(voucherDiscountAmount, validatedPromoCode.maxDiscountAmount);
        }
      } else if (validatedPromoCode.discountType === 'fixed') {
        voucherDiscountAmount = validatedPromoCode.discountValue;
      }
      totalPrice -= voucherDiscountAmount;
    }
    
    // Apply referral discount (only one discount at a time)
    if (appliedDiscount === 'referral') {
      totalPrice -= base.referralCredit;
    }
    
    // Apply user credits (max 50%, min 2 nights)
    if (creditsUsed > 0 && base.totalNights >= 2) {
      const maxCredits = totalPrice * 0.5;
      const actualCredits = Math.min(creditsUsed, maxCredits);
      totalPrice -= actualCredits;
    }
    
    return {
      ...base,
      effectiveBasePrice: effectiveBasePrice,
      promotionDiscount: promotionDiscount,
      promotionName: base.activePromotion || null,
      promotionPercentage: base.promotionDiscountPercent || 0,
      finalTotal: totalPrice,
      onlinePaymentTotal: totalPrice - cityTaxAmount, // Exclude city tax for online payment
      propertyPaymentTotal: totalPrice, // Include city tax for property payment
      cityTax: cityTaxAmount,
      appliedVoucherDiscount: voucherDiscountAmount,
      appliedReferralCredit: appliedDiscount === 'referral' ? base.referralCredit : 0,
      appliedUserCredits: creditsUsed
    };
  };

  const finalPricing = calculateFinalPricing();

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Creating booking with data:', data);
      const response = await apiRequest('POST', '/api/bookings', data);
      const result = await response.json();
      console.log('API response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Booking created successfully:', data);
      if (formData.paymentMethod === 'online') {
        // Redirect to Stripe payment
        initiateStripePayment(data);
      } else {
        // Property payment - show confirmation directly (no authorization)
        console.log('Setting confirmation data:', data);
        setConfirmationData(data);
        setShowConfirmation(true);
        setStep(1); // Reset to first step for next booking
      }
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    }
  });

  // Voucher validation mutation
  const validateVoucherMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!finalPricing) throw new Error('No pricing available');
      
      const response = await apiRequest('POST', '/api/vouchers/validate', { 
        code,
        bookingAmount: bookingDetails.pricing.totalPrice, // Use original pricing without discounts
        guestEmail: formData.guestEmail,
        guestName: `${formData.guestFirstName} ${formData.guestLastName}`,
        checkInDate: bookingDetails.checkIn,
        checkOutDate: bookingDetails.checkOut
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Voucher validation failed');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.valid) {
        setValidatedPromoCode({
          id: data.voucher.id,
          discountType: data.voucher.discountType,
          discountValue: parseFloat(data.voucher.discountValue),
          maxDiscountAmount: data.voucher.maxDiscountAmount ? parseFloat(data.voucher.maxDiscountAmount) : null
        });
        setAppliedDiscount('voucher');
        toast({
          title: "Voucher Applied",
          description: `€${data.discountAmount.toFixed(2)} discount applied`,
        });
      } else {
        setValidatedPromoCode(null);
        setAppliedDiscount(null);
        toast({
          title: "Invalid Voucher",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      setValidatedPromoCode(null);
      setAppliedDiscount(null);
      toast({
        title: "Validation Failed",
        description: error.message || "Failed to validate voucher",
        variant: "destructive",
      });
    }
  });

  const initiateStripePayment = async (bookingData: any) => {
    setShowPayment({
      type: 'full_payment',
      amount: finalPricing?.onlinePaymentTotal || 0,
      bookingData
    });
  };



  const handlePaymentSuccess = async (result: any) => {
    if (!showPayment) return;

    const { bookingData } = showPayment;
    
    // For online payments, confirm the booking after payment success
    if (showPayment.type === 'full_payment') {
      try {
        await apiRequest('POST', '/api/confirm-payment', {
          paymentIntentId: result.paymentIntentId,
          bookingId: bookingData.id
        });
        
        setConfirmationData({
          ...bookingData,
          paymentStatus: 'paid',
          amountPaid: finalPricing?.onlinePaymentTotal,
          cityTaxDue: finalPricing?.cityTax,
          paymentIntentId: result.paymentIntentId
        });
      } catch (error) {
        toast({
          title: "Booking Confirmation Failed",
          description: "Payment was successful but booking confirmation failed. Please contact support.",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Authorization flow (no longer used for property payments)
      setConfirmationData({
        ...bookingData,
        paymentStatus: 'authorized',
        authorizationAmount: 100,
        totalDue: finalPricing?.propertyPaymentTotal,
        authorizationId: result.paymentIntentId
      });
    }
    
    setShowPayment(null);
    setShowConfirmation(true);
    setStep(1); // Reset to first step for next booking
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    });
    setShowPayment(null);
  };

  const handleSubmit = () => {
    if (!bookingDetails) return;
    
    const bookingData = {
      guestFirstName: formData.guestFirstName,
      guestLastName: formData.guestLastName,
      guestEmail: formData.guestEmail,
      guestCountry: formData.guestCountry,
      guestPhone: formData.guestPhone,
      checkInDate: bookingDetails.checkIn,
      checkOutDate: bookingDetails.checkOut,
      guests: bookingDetails.guests,
      hasPet: bookingDetails.hasPet,
      paymentMethod: formData.paymentMethod,
      specialRequests: formData.specialRequests,
      promoCode: appliedDiscount === 'voucher' ? '' : '',
      voucherCode: appliedDiscount === 'voucher' ? formData.voucherCode : '',
      referralCode: appliedDiscount === 'referral' ? formData.referralCode : '',
      creditsUsed: creditsUsed,
      createdBy: 'guest' as const,
      bookedForSelf: true
    };

    createBookingMutation.mutate(bookingData);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const downloadConfirmation = () => {
    // Generate PDF or print page
    window.print();
  };

  if (!bookingDetails) {
    return null;
  }

  if (showConfirmation && confirmationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 py-12">
        <div className="max-w-5xl mx-auto px-4">
          {/* Animated Success Header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg animate-pulse">
              <Check className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
              🎉 Booking Confirmed!
            </h1>
            <p className="text-gray-600 text-lg">Your reservation is all set. Get ready for an amazing stay!</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Booking Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Booking Information Card */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                    <Calendar className="w-6 h-6 mr-3 text-blue-600" />
                    Booking Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-sm">#</span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Confirmation Number</p>
                          <p className="font-bold text-lg text-gray-900">
                            {confirmationData.confirmationCode || 
                             confirmationData.confirmation_code || 
                             'ARCO-' + (confirmationData.id || 'PENDING')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Guest Name</p>
                          <p className="font-bold text-gray-900">{formData.guestFirstName} {formData.guestLastName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Contact</p>
                          <p className="font-medium text-gray-900">{formData.guestEmail}</p>
                          <p className="text-sm text-gray-700">{formData.guestPhone}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Check-in</p>
                          <p className="font-bold text-gray-900">{formatDate(bookingDetails.checkIn)}</p>
                          <p className="text-sm text-gray-700">15:00 (3:00 PM)</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Check-out</p>
                          <p className="font-bold text-gray-900">{formatDate(bookingDetails.checkOut)}</p>
                          <p className="text-sm text-gray-700">10:00 (10:00 AM)</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Guests</p>
                          <p className="font-bold text-gray-900">{bookingDetails.guests} guest{bookingDetails.guests !== 1 ? 's' : ''}</p>
                          {bookingDetails.hasPet && <p className="text-sm text-gray-700">🐾 Pet included</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information Card */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                    <CreditCard className="w-6 h-6 mr-3 text-green-600" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {confirmationData.paymentStatus === 'paid' ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Check className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-bold text-green-800">Payment Complete</p>
                            <p className="text-sm text-green-700">Paid online successfully</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800 px-3 py-1">Paid Online</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-600">Amount Paid Online</p>
                          <p className="text-2xl font-bold text-blue-600">€{confirmationData.amountPaid?.toFixed(2)}</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-lg">
                          <p className="text-sm text-gray-600">City Tax (at property)</p>
                          <p className="text-2xl font-bold text-orange-600">€{confirmationData.cityTaxDue?.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                        <p className="text-sm text-gray-700">
                          <strong>Note:</strong> Your booking is fully paid! Only the city tax of €{confirmationData.cityTaxDue?.toFixed(2)} 
                          needs to be paid at the property upon arrival.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-bold text-blue-800">Payment at Property</p>
                            <p className="text-sm text-blue-700">Pay when you arrive</p>
                          </div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 px-3 py-1">Pay at Property</Badge>
                      </div>
                      
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Total Due at Property</p>
                        <p className="text-3xl font-bold text-blue-600">€{(finalPricing?.propertyPaymentTotal || confirmationData.totalDue)?.toFixed(2)}</p>
                        <p className="text-sm text-gray-600 mt-1">(including city tax)</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* QR Code Card */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
                  <CardTitle className="text-lg font-bold text-gray-800 text-center">
                    Digital Check-in
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 text-center">
                  <div className="bg-white p-4 rounded-lg shadow-md mb-4">
                    <QRCodeComponent 
                      value={`AllArco-${confirmationData.confirmationCode || confirmationData.confirmation_code || confirmationData.id}`}
                      size={150}
                      className="mx-auto"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Show this QR code at check-in</p>
                  <p className="text-xs text-gray-500 font-mono bg-gray-100 px-3 py-1 rounded">
                    {confirmationData.confirmationCode || confirmationData.confirmation_code || 'ARCO-' + confirmationData.id}
                  </p>
                </CardContent>
              </Card>

              {/* Important Information */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-lg">
                  <CardTitle className="text-lg font-bold text-gray-800 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-amber-600" />
                    Important Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>Check-in: <strong>15:00 (3:00 PM)</strong></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span>Check-out: <strong>10:00 (10:00 AM)</strong></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-purple-600" />
                      <span>All'Arco District, Venice, Italy</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span>2 minutes walk to Rialto Bridge</span>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <p className="text-blue-800 font-medium">WiFi password will be provided upon arrival</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                      <p className="text-orange-800 font-medium">City tax: €4 per adult per night (max 5 nights)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 max-w-md mx-auto">
            <Button onClick={downloadConfirmation} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6 rounded-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-200">
              <Download className="w-5 h-5 mr-2" />
              Download Confirmation
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/')} 
              className="flex-1 border-2 border-gray-300 hover:border-blue-400 text-gray-700 hover:text-blue-600 py-3 px-6 rounded-lg font-semibold transform hover:scale-105 transition-all duration-200"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header with Back Button */}
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/')}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Complete Your Booking</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Dates */}
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <div className="text-sm">
                    <div className="font-medium">Check-in: {formatDate(bookingDetails.checkIn)}</div>
                    <div className="text-gray-600">15:00 (3:00 PM)</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <div className="text-sm">
                    <div className="font-medium">Check-out: {formatDate(bookingDetails.checkOut)}</div>
                    <div className="text-gray-600">10:00 (10:00 AM)</div>
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
                {finalPricing && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>€{finalPricing.basePrice.toFixed(2)} × {finalPricing.totalNights} night{finalPricing.totalNights !== 1 ? 's' : ''}</span>
                      <span>€{finalPricing.priceBeforeDiscount.toFixed(2)}</span>
                    </div>
                    
                    {finalPricing.promotionDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Promotion: {finalPricing.promotionName} ({finalPricing.promotionPercentage}% off)</span>
                        <span>-€{finalPricing.promotionDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {finalPricing.lengthOfStayDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Length of stay discount ({finalPricing.lengthOfStayDiscountPercent}%)</span>
                        <span>-€{finalPricing.lengthOfStayDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {finalPricing.appliedVoucherDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Voucher discount</span>
                        <span>-€{finalPricing.appliedVoucherDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {finalPricing.appliedReferralCredit > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Referral credit</span>
                        <span>-€{finalPricing.appliedReferralCredit.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {finalPricing.appliedUserCredits > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Account credits</span>
                        <span>-€{finalPricing.appliedUserCredits.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span>Cleaning fee</span>
                      <span>€{finalPricing.cleaningFee.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Service fee</span>
                      <span>€{finalPricing.serviceFee.toFixed(2)}</span>
                    </div>
                    
                    {finalPricing.petFee > 0 && (
                      <div className="flex justify-between">
                        <span>Pet fee</span>
                        <span>€{finalPricing.petFee.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span>City tax <span className="text-xs text-gray-500">(paid at property)</span></span>
                      <span>€{finalPricing.cityTax.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <Separator />
                
                {/* Payment Method Specific Total */}
                {finalPricing && (
                  <div className="space-y-2">
                    {formData.paymentMethod === 'online' ? (
                      <>
                        <div className="flex justify-between font-semibold text-lg text-blue-600">
                          <span>Online Payment</span>
                          <span>€{finalPricing.onlinePaymentTotal.toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          City tax (€{finalPricing.cityTax.toFixed(2)}) paid at property
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total (at property)</span>
                        <span>€{finalPricing.propertyPaymentTotal.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}
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
                <CardContent className="space-y-6">
                  {/* Booking for self or someone else - Only show for authenticated users */}
                  {isAuthenticated && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <Label className="text-base font-medium">Who is this booking for?</Label>
                      <div className="flex space-x-4 mt-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={isBookingForSelf}
                            onChange={() => setIsBookingForSelf(true)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span>Myself</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={!isBookingForSelf}
                            onChange={() => setIsBookingForSelf(false)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span>Someone else</span>
                        </label>
                      </div>
                      {!isBookingForSelf && (
                        <p className="text-sm text-gray-600 mt-2">
                          Please enter the guest's information below
                        </p>
                      )}
                    </div>
                  )}
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

                  {/* Discounts and Credits Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Discounts & Credits</h3>
                    
                    {/* Voucher Code */}
                    <div>
                      <Label htmlFor="voucherCode">Discount Voucher (Optional)</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="voucherCode"
                          value={formData.voucherCode}
                          onChange={(e) => setFormData(prev => ({ ...prev, voucherCode: e.target.value }))}
                          placeholder="Enter discount code"
                          disabled={appliedDiscount === 'referral'}
                        />
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (formData.voucherCode && appliedDiscount !== 'referral') {
                              validateVoucherMutation.mutate(formData.voucherCode);
                            }
                          }}
                          disabled={!formData.voucherCode || appliedDiscount === 'referral' || validateVoucherMutation.isPending}
                        >
                          {validateVoucherMutation.isPending ? 'Validating...' : 'Apply'}
                        </Button>
                      </div>
                      {appliedDiscount === 'voucher' && (
                        <div className="flex items-center justify-between mt-2">
                          <Badge className="bg-green-100 text-green-800">Voucher Applied</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setAppliedDiscount(null);
                              setValidatedPromoCode(null);
                              setFormData(prev => ({ ...prev, voucherCode: '' }));
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Account Credits - Only show for authenticated users with credits */}
                    {isAuthenticated && user?.accountCredits && parseFloat(user.accountCredits) > 0 && (
                      <div>
                        <Label htmlFor="credits">Account Credits (Optional)</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="credits"
                            type="number"
                            min="0"
                            max={finalPricing ? Math.min(parseFloat(user.accountCredits), finalPricing.finalTotal * 0.5).toFixed(2) : "0"}
                            step="0.01"
                            value={creditsUsed || ''}
                            onChange={(e) => setCreditsUsed(parseFloat(e.target.value) || 0)}
                            placeholder="Enter credits to use"
                            disabled={!finalPricing || finalPricing.totalNights < 2}
                          />
                          <Button
                            variant="outline"
                            onClick={() => {
                              if (finalPricing && user?.accountCredits) {
                                const maxCredits = Math.min(parseFloat(user.accountCredits), finalPricing.finalTotal * 0.5);
                                setCreditsUsed(maxCredits);
                              }
                            }}
                            disabled={!finalPricing || finalPricing.totalNights < 2}
                          >
                            Use Max
                          </Button>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Available: €{parseFloat(user.accountCredits).toFixed(2)}</span>
                          <span>
                            {finalPricing && finalPricing.totalNights < 2 
                              ? "Credits require minimum 2 nights"
                              : `Maximum 50% of total (€${finalPricing ? (finalPricing.finalTotal * 0.5).toFixed(2) : '0'})`
                            }
                          </span>
                        </div>
                        {creditsUsed > 0 && (
                          <div className="flex items-center justify-between mt-2">
                            <Badge className="bg-blue-100 text-blue-800">
                              €{creditsUsed.toFixed(2)} Credits Applied
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCreditsUsed(0)}
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
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
                    {/* Pay Online Option */}
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
                        <div className="flex-1">
                          <div className="font-medium">Pay Online</div>
                          <div className="text-sm text-gray-600">Secure payment with card</div>
                          {finalPricing && (
                            <div className="text-sm font-medium text-blue-600 mt-1">
                              Pay €{finalPricing.onlinePaymentTotal.toFixed(2)} now + €{finalPricing.cityTax.toFixed(2)} city tax at property
                            </div>
                          )}
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

                    {/* Pay at Property Option */}
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
                        <div className="flex-1">
                          <div className="font-medium">Pay at Property</div>
                          <div className="text-sm text-gray-600">Pay when you arrive</div>
                          {finalPricing && (
                            <div className="text-sm font-medium text-gray-600 mt-1">
                              Total: €{finalPricing.propertyPaymentTotal.toFixed(2)} (including city tax)
                            </div>
                          )}
                        </div>
                      </div>

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
                      {createBookingMutation.isPending ? 'Processing...' : 
                       formData.paymentMethod === 'online' ? 'Pay Now' : 'Book Now'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {showPayment.type === 'authorization' ? 'Card Authorization' : 'Payment'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPayment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </Button>
              </div>
              
              <StripePaymentWrapper
                amount={showPayment.amount}
                type={showPayment.type}
                bookingId={showPayment.bookingData.id}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && confirmationData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Booking Confirmed!
                </h2>
                <p className="text-gray-600">
                  Your reservation has been successfully created
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Confirmation Code</span>
                      <p className="font-mono font-bold text-lg">
                        {confirmationData.confirmationCode || confirmationData.confirmation_code || 'ARCO-' + confirmationData.id}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Check-in</span>
                      <p className="font-medium">{confirmationData.checkInDate} at 15:00</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Check-out</span>
                      <p className="font-medium">{confirmationData.checkOutDate} at 10:00</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Guests</span>
                      <p className="font-medium">{confirmationData.guests} guests</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Payment Summary</h3>
                  {confirmationData.paymentStatus === 'paid' ? (
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Amount Paid</span>
                        <span className="font-medium">€{confirmationData.amountPaid?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-orange-600">
                        <span>City Tax (due at property)</span>
                        <span className="font-medium">€{confirmationData.cityTaxDue?.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Card Authorized</span>
                        <span className="font-medium">€{confirmationData.authorizationAmount}</span>
                      </div>
                      <div className="flex justify-between text-orange-600">
                        <span>Total Due at Property</span>
                        <span className="font-medium">€{confirmationData.totalDue?.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button 
                  onClick={() => setLocation('/')}
                  className="flex-1"
                >
                  Back to Home
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.print()}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Print
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}