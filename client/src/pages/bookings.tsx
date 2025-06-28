import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, PawPrint, Search, Eye, ArrowLeft, Star, Clock, CreditCard, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { QRCodeComponent } from '@/components/qr-code';

interface Booking {
  id: number;
  confirmationCode: string;
  checkInDate: string;
  checkOutDate: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestCountry: string;
  guestPhone: string;
  guests: number;
  hasPet: boolean;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalPrice: number;
  basePrice: number;
  cleaningFee: number;
  serviceFee: number;
  petFee: number;
  cityTax: number;
  createdAt: string;
  bookedForSelf: boolean;
}

export default function BookingsPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [lookupCode, setLookupCode] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupResult, setLookupResult] = useState<Booking | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Fetch user's bookings
  const { data: userBookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ['/api/user/bookings'],
    enabled: isAuthenticated,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (status === 'confirmed' && paymentStatus === 'paid') {
      return <Badge className="bg-green-100 text-green-800">Confirmed & Paid</Badge>;
    } else if (status === 'confirmed') {
      return <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>;
    } else if (status === 'pending') {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending Payment</Badge>;
    } else if (status === 'cancelled') {
      return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const handleLookup = async () => {
    if (!lookupCode || !lookupEmail) {
      toast({
        title: "Missing Information",
        description: "Please enter both confirmation code and email",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/bookings/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmationCode: lookupCode,
          email: lookupEmail
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setLookupResult(result);
        toast({
          title: "Booking Found",
          description: "Booking details retrieved successfully",
        });
      } else {
        toast({
          title: "Booking Not Found",
          description: "No booking found with that confirmation code and email combination",
          variant: "destructive",
        });
        setLookupResult(null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search for booking. Please try again.",
        variant: "destructive",
      });
      setLookupResult(null);
    }
  };

  const handleAddToMyBookings = async (booking: Booking) => {
    try {
      await apiRequest('POST', '/api/bookings/associate', {
        bookingId: booking.id
      });
      
      toast({
        title: "Success",
        description: "Booking added to your account successfully",
      });
      
      // Refresh user bookings list
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add booking to your account",
        variant: "destructive",
      });
    }
  };

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card className="group hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 ring-1 ring-gray-200/50 hover:ring-blue-300/50 hover:-translate-y-1">
      <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-t-lg">
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {booking.guestFirstName[0]}{booking.guestLastName[0]}
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900">{booking.guestFirstName} {booking.guestLastName}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="font-mono text-xs bg-gray-100 text-gray-700">
                  {booking.confirmationCode}
                </Badge>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(booking.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
          <div className="text-right space-y-2">
            {getStatusBadge(booking.status, booking.paymentStatus)}
            {!booking.bookedForSelf && (
              <Badge variant="outline" className="block text-xs bg-amber-50 text-amber-700 border-amber-200">
                For Someone Else
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {/* Date Info with Enhanced Design */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Check-in</div>
                <div className="text-sm text-gray-600">{formatDate(booking.checkInDate)}</div>
                <div className="text-xs text-gray-500">15:00 (3:00 PM)</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Check-out</div>
                <div className="text-sm text-gray-600">{formatDate(booking.checkOutDate)}</div>
                <div className="text-xs text-gray-500">10:00 (10:00 AM)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <Users className="w-4 h-4 text-blue-600" />
            <div>
              <div className="font-medium">{booking.guests}</div>
              <div className="text-xs text-gray-500">guest{booking.guests !== 1 ? 's' : ''}</div>
            </div>
          </div>

          {booking.hasPet && (
            <div className="flex items-center space-x-2 p-3 bg-amber-50 rounded-lg">
              <PawPrint className="w-4 h-4 text-amber-600" />
              <div>
                <div className="font-medium text-amber-700">Pet</div>
                <div className="text-xs text-amber-600">included</div>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <MapPin className="w-4 h-4 text-gray-600" />
            <div>
              <div className="font-medium text-xs">{booking.guestCountry}</div>
              <div className="text-xs text-gray-500">country</div>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <div className="font-semibold text-emerald-900">€{Number(booking.totalPrice).toFixed(2)}</div>
              <div className="text-xs text-emerald-600">
                {booking.paymentMethod === 'online' ? 'Paid Online' : 'Pay at Property'}
              </div>
            </div>
          </div>
          {booking.paymentStatus === 'paid' && (
            <Shield className="w-5 h-5 text-emerald-600" />
          )}
        </div>

        <div className="flex space-x-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedBooking(booking)}
            className="flex-1 group-hover:border-blue-300 group-hover:text-blue-600 transition-colors"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Enhanced Header with Back Button */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="group flex items-center space-x-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="font-medium">Back</span>
            </Button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-700 bg-clip-text text-transparent">
                My Bookings
              </h1>
              <p className="text-gray-600 text-sm">Manage your reservations and booking history</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enhanced Booking Lookup Section */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 bg-white/80 backdrop-blur-sm border-0 shadow-xl shadow-blue-100/50 ring-1 ring-gray-200/50">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg border-b border-blue-100">
                <CardTitle className="flex items-center text-gray-800">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Search className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">Find Reservation</div>
                    <div className="text-xs text-gray-600 font-normal">Quick booking lookup</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 p-6">
                <div className="space-y-2">
                  <Label htmlFor="confirmationCode" className="text-sm font-medium text-gray-700">
                    Confirmation Code
                  </Label>
                  <Input
                    id="confirmationCode"
                    placeholder="e.g. ABC123"
                    value={lookupCode}
                    onChange={(e) => setLookupCode(e.target.value)}
                    className="h-11 border-gray-200 focus:border-blue-400 focus:ring-blue-400/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="guest@example.com"
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                    className="h-11 border-gray-200 focus:border-blue-400 focus:ring-blue-400/20"
                  />
                </div>
                <Button 
                  onClick={handleLookup} 
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all duration-200"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Find Reservation
                </Button>

                {lookupResult && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="font-medium text-green-900 mb-3">✓ Booking Found!</h3>
                    <div className="text-sm space-y-2 mb-4">
                      <div><span className="text-gray-600">Guest:</span> <span className="font-medium">{lookupResult.guestFirstName} {lookupResult.guestLastName}</span></div>
                      <div><span className="text-gray-600">Dates:</span> <span className="font-medium">{formatDate(lookupResult.checkInDate)} - {formatDate(lookupResult.checkOutDate)}</span></div>
                      <div><span className="text-gray-600">Status:</span> <span className="font-medium">{getStatusBadge(lookupResult.status, lookupResult.paymentStatus)}</span></div>
                      <div><span className="text-gray-600">Total:</span> <span className="font-semibold text-green-700">€{Number(lookupResult.totalPrice).toFixed(2)}</span></div>
                    </div>
                    
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedBooking(lookupResult)}
                        className="w-full"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Full Details
                      </Button>
                      
                      {isAuthenticated && (
                        <Button
                          size="sm"
                          onClick={() => handleAddToMyBookings(lookupResult)}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          Add to My Bookings
                        </Button>
                      )}
                      
                      {!isAuthenticated && (
                        <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                          <a href="/api/login" className="text-blue-600 hover:underline font-medium">Sign in</a> to add this booking to your account
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Enhanced User Bookings List */}
          <div className="lg:col-span-2 space-y-6">
            {isAuthenticated ? (
              <>
                {/* Enhanced Header with Stats */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-0 ring-1 ring-gray-200/50 shadow-lg shadow-blue-100/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Your Reservations
                      </h2>
                      <p className="text-gray-600 text-sm mt-1">Manage and track your bookings</p>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <div className="text-sm">
                          <div className="font-semibold text-blue-900">{userBookings.length}</div>
                          <div className="text-blue-600 text-xs">booking{userBookings.length !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                      
                      {userBookings.length > 0 && (
                        <div className="flex items-center space-x-3 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
                          <Star className="w-4 h-4 text-emerald-600" />
                          <div className="text-sm">
                            <div className="font-semibold text-emerald-900">
                              €{userBookings.reduce((total, booking) => total + Number(booking.totalPrice), 0).toFixed(0)}
                            </div>
                            <div className="text-emerald-600 text-xs">total value</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/3 mb-4"></div>
                          <div className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : userBookings.length > 0 ? (
                  <div className="space-y-4">
                    {userBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                  </div>
                ) : (
                  <Card className="bg-white/80 backdrop-blur-sm border-0 ring-1 ring-gray-200/50 shadow-lg shadow-blue-100/30">
                    <CardContent className="p-12 text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Calendar className="w-10 h-10 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">No Reservations Yet</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Start your journey with All'Arco and create unforgettable memories in the heart of Venice.
                      </p>
                      <Button 
                        onClick={() => window.location.href = '/'}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 px-8 py-3"
                      >
                        <Star className="w-4 h-4 mr-2" />
                        Make Your First Booking
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm border-0 ring-1 ring-gray-200/50 shadow-lg shadow-blue-100/30">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Shield className="w-10 h-10 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Sign In to Access Your Bookings</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Create an account or sign in to view your booking history, manage reservations, and enjoy personalized features.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      onClick={() => window.location.href = '/api/login'}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25"
                    >
                      Sign In
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => window.location.href = '/signup'}
                      className="border-gray-300 hover:border-blue-300 hover:text-blue-600"
                    >
                      Create Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
                  <p className="text-gray-600 font-mono text-lg">{selectedBooking.confirmationCode}</p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </Button>
              </div>

              <div className="space-y-6">
                {/* Guest Information */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Guest Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <p className="font-medium">{selectedBooking.guestFirstName} {selectedBooking.guestLastName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-medium">{selectedBooking.guestEmail}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Country:</span>
                      <p className="font-medium">{selectedBooking.guestCountry}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <p className="font-medium">{selectedBooking.guestPhone}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Booking Details */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Booking Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Check-in:</span>
                      <p className="font-medium">{formatDate(selectedBooking.checkInDate)} at 15:00</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Check-out:</span>
                      <p className="font-medium">{formatDate(selectedBooking.checkOutDate)} at 10:00</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Guests:</span>
                      <p className="font-medium">{selectedBooking.guests} guest{selectedBooking.guests !== 1 ? 's' : ''}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Pet:</span>
                      <p className="font-medium">{selectedBooking.hasPet ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Pricing Breakdown */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Pricing Breakdown</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base Price:</span>
                      <span>€{Number(selectedBooking.basePrice).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cleaning Fee:</span>
                      <span>€{Number(selectedBooking.cleaningFee).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service Fee:</span>
                      <span>€{Number(selectedBooking.serviceFee).toFixed(2)}</span>
                    </div>
                    {Number(selectedBooking.petFee) > 0 && (
                      <div className="flex justify-between">
                        <span>Pet Fee:</span>
                        <span>€{Number(selectedBooking.petFee).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>City Tax:</span>
                      <span>€{Number(selectedBooking.cityTax).toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span>€{Number(selectedBooking.totalPrice).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-3">Check-in QR Code</h3>
                  <div className="inline-block p-4 bg-white border rounded-lg">
                    <QRCodeComponent 
                      value={`AllArco-${selectedBooking.confirmationCode}`}
                      size={128}
                      className="mx-auto"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Show this QR code at check-in</p>
                </div>

                <div className="flex space-x-3">
                  <Button 
                    onClick={() => setSelectedBooking(null)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.print()}
                    className="flex items-center gap-2"
                  >
                    Print Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}