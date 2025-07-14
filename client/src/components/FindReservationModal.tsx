import React, { useState } from 'react';
import { Search, Download, X, CheckCircle, Calendar, Users, CreditCard, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { useToast } from '../hooks/use-toast';
import { cn } from '../lib/utils';

interface BookingDetails {
  confirmationCode: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestCountry: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime: string;
  checkOutTime: string;
  guests: number;
  totalNights: number;
  totalPrice: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  basePrice: string;
  cleaningFee: string;
  serviceFee: string;
  petFee: string;
  cityTax: string;
  lengthOfStayDiscount: string;
  referralCredit: string;
  promotionDiscount: string;
  promoCodeDiscount: string;
  voucherDiscount: string;
  totalDiscountAmount: string;
  hasPet: boolean;
}

interface FindReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAccount?: () => void;
  onLogin?: () => void;
}

export function FindReservationModal({ 
  isOpen, 
  onClose, 
  onCreateAccount,
  onLogin 
}: FindReservationModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [email, setEmail] = useState('');
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);

  const handleFindReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!confirmationCode.trim() || !email.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both confirmation code and email address.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/booking-lookup/find', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmationCode: confirmationCode.trim(),
          email: email.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        setBooking(data.booking);
        setShowBookingDetails(true);
        toast({
          title: "Reservation Found!",
          description: "Your booking details have been loaded.",
        });
      } else {
        throw new Error(data.message || 'Reservation not found');
      }
    } catch (error) {
      console.error('Error finding reservation:', error);
      toast({
        title: "Reservation Not Found",
        description: error instanceof Error ? error.message : "Please check your confirmation code and email address.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!booking) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/booking-lookup/download-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmationCode: booking.confirmationCode,
          email: booking.guestEmail
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `booking-confirmation-${booking.confirmationCode}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Download Started",
          description: "Your booking confirmation is being downloaded.",
        });
      } else {
        throw new Error('Failed to download confirmation');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Download Error",
        description: "Failed to download confirmation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: string) => {
    return `€${parseFloat(amount).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className={cn(
        "w-full max-w-2xl max-h-[90vh] overflow-y-auto",
        "bg-white shadow-xl"
      )}>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-xl font-semibold">
            {showBookingDetails ? 'Booking Details' : 'Find Your Reservation'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {!showBookingDetails ? (
            <>
              {/* Search Form */}
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Quick Booking Lookup</h3>
                  <p className="text-sm text-gray-600">
                    Enter your confirmation code and email to view your reservation
                  </p>
                </div>
              </div>

              <form onSubmit={handleFindReservation} className="space-y-4">
                <div>
                  <label htmlFor="confirmationCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmation Code
                  </label>
                  <Input
                    id="confirmationCode"
                    value={confirmationCode}
                    onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
                    placeholder="e.g., ARCO123456"
                    className="uppercase"
                    maxLength={12}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Searching...' : 'Find Reservation'}
                </Button>
              </form>

              <Separator />

              {/* Account Creation Motivation */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  Want to manage your bookings easily?
                </h4>
                <p className="text-sm text-blue-800 mb-4">
                  Create an account to view all your reservations, track booking history, 
                  and get faster support. It's free and takes just a minute!
                </p>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCreateAccount}
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    Create Account
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onLogin}
                    className="text-blue-600 hover:bg-blue-50"
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            </>
          ) : booking && (
            <>
              {/* Booking Details */}
              <div className="space-y-6">
                {/* Header with confirmation code */}
                <div className="text-center">
                  <div className="inline-flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-full">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-900">
                      Confirmation: {booking.confirmationCode}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-center space-x-2">
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status.toUpperCase()}
                    </Badge>
                    <Badge className={getPaymentStatusColor(booking.paymentStatus)}>
                      {booking.paymentStatus.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Guest Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Guest Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <p className="font-medium">{booking.guestFirstName} {booking.guestLastName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-medium">{booking.guestEmail}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Country:</span>
                      <p className="font-medium">{booking.guestCountry}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <p className="font-medium">{booking.guestPhone}</p>
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Booking Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Check-in:</span>
                      <p className="font-medium">{formatDate(booking.checkInDate)}</p>
                      <p className="text-gray-500">at {booking.checkInTime}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Check-out:</span>
                      <p className="font-medium">{formatDate(booking.checkOutDate)}</p>
                      <p className="text-gray-500">at {booking.checkOutTime}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Guests:</span>
                      <p className="font-medium">{booking.guests}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Nights:</span>
                      <p className="font-medium">{booking.totalNights}</p>
                    </div>
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pricing Breakdown
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base Price ({formatCurrency(booking.basePrice)} × {booking.totalNights} nights)</span>
                      <span>{formatCurrency((parseFloat(booking.basePrice) * booking.totalNights).toString())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cleaning Fee</span>
                      <span>{formatCurrency(booking.cleaningFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service Fee</span>
                      <span>{formatCurrency(booking.serviceFee)}</span>
                    </div>
                    {parseFloat(booking.petFee) > 0 && (
                      <div className="flex justify-between">
                        <span>Pet Fee</span>
                        <span>{formatCurrency(booking.petFee)}</span>
                      </div>
                    )}
                    {parseFloat(booking.cityTax) > 0 && (
                      <div className="flex justify-between">
                        <span>City Tax</span>
                        <span>{formatCurrency(booking.cityTax)}</span>
                      </div>
                    )}
                    {parseFloat(booking.lengthOfStayDiscount) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Length of Stay Discount</span>
                        <span>-{formatCurrency(booking.lengthOfStayDiscount)}</span>
                      </div>
                    )}
                    {parseFloat(booking.referralCredit) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Referral Credit</span>
                        <span>-{formatCurrency(booking.referralCredit)}</span>
                      </div>
                    )}
                    {parseFloat(booking.promotionDiscount) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Promotion Discount</span>
                        <span>-{formatCurrency(booking.promotionDiscount)}</span>
                      </div>
                    )}
                    {parseFloat(booking.promoCodeDiscount) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Promo Code Discount</span>
                        <span>-{formatCurrency(booking.promoCodeDiscount)}</span>
                      </div>
                    )}
                    {parseFloat(booking.voucherDiscount) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Voucher Discount</span>
                        <span>-{formatCurrency(booking.voucherDiscount)}</span>
                      </div>
                    )}
                    
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Amount</span>
                      <span>{formatCurrency(booking.totalPrice)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button
                    onClick={handleDownloadPDF}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowBookingDetails(false)}
                    className="flex-1"
                  >
                    Search Again
                  </Button>
                </div>

                {/* Account Creation Motivation */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    Want to manage this booking easily?
                  </h4>
                  <p className="text-sm text-blue-800 mb-4">
                    Create an account to view all your reservations, make changes, 
                    and get instant support. Plus, earn rewards for future bookings!
                  </p>
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onCreateAccount}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      Create Account
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onLogin}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      Sign In
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}