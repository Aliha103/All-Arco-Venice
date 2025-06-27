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
import { apiRequest } from '@/lib/queryClient';
import StripePaymentWrapper from '@/components/stripe-payment-wrapper';

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
  const [step, setStep] = useState(1);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState<any>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<'voucher' | 'referral' | null>(null);
  const [creditsUsed, setCreditsUsed] = useState(0);
  
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

  // Calculate dynamic pricing based on applied discounts and credits
  const calculateFinalPricing = () => {
    if (!bookingDetails?.pricing) return null;
    
    const base = bookingDetails.pricing;
    let totalPrice = base.totalPrice;
    let cityTaxAmount = base.cityTax;
    
    // Apply voucher discount (only one discount at a time)
    if (appliedDiscount === 'voucher') {
      // Example: 10% voucher discount
      const voucherDiscount = totalPrice * 0.1;
      totalPrice -= voucherDiscount;
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
      finalTotal: totalPrice,
      onlinePaymentTotal: totalPrice - cityTaxAmount, // Exclude city tax for online payment
      propertyPaymentTotal: totalPrice, // Include city tax for property payment
      cityTax: cityTaxAmount,
      appliedVoucherDiscount: appliedDiscount === 'voucher' ? totalPrice * 0.1 : 0,
      appliedReferralCredit: appliedDiscount === 'referral' ? base.referralCredit : 0,
      appliedUserCredits: creditsUsed
    };
  };

  const finalPricing = calculateFinalPricing();

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/bookings', data);
    },
    onSuccess: (data) => {
      if (formData.paymentMethod === 'online') {
        // Redirect to Stripe payment
        initiateStripePayment(data);
      } else {
        // Show card authorization for property payment
        initiateCardAuthorization(data);
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

  const initiateStripePayment = async (bookingData: any) => {
    setShowPayment({
      type: 'full_payment',
      amount: finalPricing?.onlinePaymentTotal || 0,
      bookingData
    });
  };

  const initiateCardAuthorization = async (bookingData: any) => {
    setShowPayment({
      type: 'authorization',
      amount: 100, // €100 authorization
      bookingData
    });
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="border-green-200">
            <CardHeader className="text-center bg-green-50">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">Booking Confirmed!</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {/* Confirmation Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Booking Details</h3>
                  <div className="space-y-2">
                    <div><strong>Confirmation Number:</strong> {confirmationData.confirmationCode}</div>
                    <div><strong>Guest Name:</strong> {formData.guestFirstName} {formData.guestLastName}</div>
                    <div><strong>Email:</strong> {formData.guestEmail}</div>
                    <div><strong>Phone:</strong> {formData.guestPhone}</div>
                    <div><strong>Check-in:</strong> {formatDate(bookingDetails.checkIn)} at 15:00</div>
                    <div><strong>Check-out:</strong> {formatDate(bookingDetails.checkOut)} at 10:00</div>
                    <div><strong>Guests:</strong> {bookingDetails.guests}</div>
                    {bookingDetails.hasPet && <div><strong>Pet:</strong> Yes</div>}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Payment Information</h3>
                  <div className="space-y-2">
                    {confirmationData.paymentStatus === 'paid' ? (
                      <>
                        <div><strong>Payment Status:</strong> <Badge className="bg-green-100 text-green-800">Paid Online</Badge></div>
                        <div><strong>Amount Paid:</strong> €{confirmationData.amountPaid?.toFixed(2)}</div>
                        <div><strong>City Tax (due at property):</strong> €{confirmationData.cityTaxDue?.toFixed(2)}</div>
                      </>
                    ) : (
                      <>
                        <div><strong>Payment Status:</strong> <Badge className="bg-blue-100 text-blue-800">Card Authorized</Badge></div>
                        <div><strong>Authorization:</strong> €{confirmationData.authorizationAmount}</div>
                        <div><strong>Total Due at Property:</strong> €{confirmationData.totalDue?.toFixed(2)}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Important Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Important Information</h4>
                <ul className="text-sm space-y-1">
                  <li>• Check-in time: 15:00 (3:00 PM)</li>
                  <li>• Check-out time: 10:00 (10:00 AM)</li>
                  <li>• Address: All'Arco District, Venice, Italy</li>
                  <li>• 2 minutes walk to Rialto Bridge</li>
                  <li>• WiFi password will be provided upon arrival</li>
                  <li>• City tax (€4 per adult per night, max 5 nights) is paid at property</li>
                </ul>
              </div>

              {/* QR Code */}
              <div className="text-center">
                <div className="inline-block p-4 bg-white border rounded-lg">
                  <div className="w-32 h-32 bg-gray-100 flex items-center justify-center text-gray-500 text-xs">
                    QR Code<br/>{confirmationData.confirmationCode}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">Show this QR code at check-in</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={downloadConfirmation} className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download Confirmation
                </Button>
                <Button variant="outline" onClick={() => setLocation('/')} className="flex-1">
                  Return to Home
                </Button>
              </div>
            </CardContent>
          </Card>
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
                              setAppliedDiscount('voucher');
                              toast({ title: "Voucher Applied", description: "10% discount applied" });
                            }
                          }}
                          disabled={!formData.voucherCode || appliedDiscount === 'referral'}
                        >
                          Apply
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
                              setFormData(prev => ({ ...prev, voucherCode: '' }));
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Referral Code */}
                    <div>
                      <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="referralCode"
                          value={formData.referralCode}
                          onChange={(e) => setFormData(prev => ({ ...prev, referralCode: e.target.value }))}
                          placeholder="Enter referral code"
                          disabled={appliedDiscount === 'voucher'}
                        />
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (formData.referralCode && appliedDiscount !== 'voucher') {
                              setAppliedDiscount('referral');
                              toast({ title: "Referral Applied", description: "Referral credit applied" });
                            }
                          }}
                          disabled={!formData.referralCode || appliedDiscount === 'voucher'}
                        >
                          Apply
                        </Button>
                      </div>
                      {appliedDiscount === 'referral' && (
                        <div className="flex items-center justify-between mt-2">
                          <Badge className="bg-green-100 text-green-800">Referral Applied</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setAppliedDiscount(null);
                              setFormData(prev => ({ ...prev, referralCode: '' }));
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Account Credits */}
                    <div>
                      <Label htmlFor="credits">Account Credits (Optional)</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="credits"
                          type="number"
                          min="0"
                          max={finalPricing ? (finalPricing.finalTotal * 0.5).toFixed(0) : "0"}
                          value={creditsUsed || ''}
                          onChange={(e) => setCreditsUsed(parseFloat(e.target.value) || 0)}
                          placeholder="Enter credits to use"
                          disabled={!finalPricing || finalPricing.totalNights < 2}
                        />
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (finalPricing) {
                              const maxCredits = finalPricing.finalTotal * 0.5;
                              setCreditsUsed(maxCredits);
                            }
                          }}
                          disabled={!finalPricing || finalPricing.totalNights < 2}
                        >
                          Max 50%
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {finalPricing && finalPricing.totalNights < 2 
                          ? "Credits can only be used for stays of 2+ nights"
                          : `Maximum 50% of total (€${finalPricing ? (finalPricing.finalTotal * 0.5).toFixed(2) : '0'})`
                        }
                      </p>
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
                          <div className="text-sm text-gray-600">Pay when you arrive (card authorization required)</div>
                          {finalPricing && (
                            <div className="text-sm font-medium text-gray-600 mt-1">
                              Total: €{finalPricing.propertyPaymentTotal.toFixed(2)} (including city tax)
                            </div>
                          )}
                        </div>
                      </div>
                      {formData.paymentMethod === 'property' && (
                        <div className="mt-3 ml-7">
                          <Badge variant="outline" className="border-orange-200 text-orange-800">
                            €100 card authorization required
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
                      {createBookingMutation.isPending ? 'Processing...' : 
                       formData.paymentMethod === 'online' ? 'Pay Now' : 'Authorize Card & Book'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}