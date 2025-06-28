import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, PawPrint, Search, Eye } from 'lucide-react';
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
      const result = await response.json();
      setLookupResult(result);
      toast({
        title: "Booking Found",
        description: "Booking details retrieved successfully",
      });
    } catch (error) {
      toast({
        title: "Booking Not Found",
        description: "No booking found with that confirmation code and email",
        variant: "destructive",
      });
      setLookupResult(null);
    }
  };

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{booking.guestFirstName} {booking.guestLastName}</CardTitle>
            <p className="text-sm text-gray-600 font-mono">{booking.confirmationCode}</p>
          </div>
          <div className="text-right">
            {getStatusBadge(booking.status, booking.paymentStatus)}
            {!booking.bookedForSelf && (
              <Badge variant="outline" className="ml-2">For Someone Else</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <div>
              <div className="font-medium">Check-in: {formatDate(booking.checkInDate)}</div>
              <div className="text-gray-600">15:00 (3:00 PM)</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <div>
              <div className="font-medium">Check-out: {formatDate(booking.checkOutDate)}</div>
              <div className="text-gray-600">10:00 (10:00 AM)</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>{booking.guests} guest{booking.guests !== 1 ? 's' : ''}</span>
          </div>

          {booking.hasPet && (
            <div className="flex items-center space-x-2">
              <PawPrint className="w-4 h-4 text-blue-600" />
              <span>Pet included</span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>{booking.guestCountry}</span>
          </div>

          <div className="text-right">
            <div className="font-semibold text-lg">€{Number(booking.totalPrice).toFixed(2)}</div>
            <div className="text-sm text-gray-600">{booking.paymentMethod === 'online' ? 'Paid Online' : 'Pay at Property'}</div>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedBooking(booking)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">View your booking history and look up reservations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Lookup Section */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="w-5 h-5 mr-2" />
                  Lookup Booking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="confirmationCode">Confirmation Code</Label>
                  <Input
                    id="confirmationCode"
                    placeholder="Enter confirmation code"
                    value={lookupCode}
                    onChange={(e) => setLookupCode(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter booking email"
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                  />
                </div>
                <Button onClick={handleLookup} className="w-full">
                  <Search className="w-4 h-4 mr-2" />
                  Find Booking
                </Button>

                {lookupResult && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <h3 className="font-medium text-green-900 mb-2">Booking Found!</h3>
                    <div className="text-sm space-y-1">
                      <div>Guest: {lookupResult.guestFirstName} {lookupResult.guestLastName}</div>
                      <div>Dates: {formatDate(lookupResult.checkInDate)} - {formatDate(lookupResult.checkOutDate)}</div>
                      <div>Status: {lookupResult.status}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedBooking(lookupResult)}
                      className="mt-2 w-full"
                    >
                      View Details
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* User Bookings List */}
          <div className="lg:col-span-2">
            {isAuthenticated ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Your Bookings</h2>
                  <Badge variant="secondary">{userBookings.length} booking{userBookings.length !== 1 ? 's' : ''}</Badge>
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
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Found</h3>
                      <p className="text-gray-600 mb-4">You haven't made any bookings yet.</p>
                      <Button onClick={() => window.location.href = '/'}>
                        Make Your First Booking
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Sign In to View Your Bookings</h3>
                  <p className="text-gray-600 mb-4">Please sign in to access your booking history.</p>
                  <Button onClick={() => window.location.href = '/api/login'}>
                    Sign In
                  </Button>
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