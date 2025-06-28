import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, PawPrint, Search, Eye, ArrowLeft, Star, Clock, CreditCard, Shield, Sparkles, CheckCircle, TrendingUp } from 'lucide-react';
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
  const [isSearching, setIsSearching] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    setPageLoaded(true);
  }, []);

  const { data: userBookings = [], isLoading } = useQuery({
    queryKey: ['/api/user/bookings'],
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (status === 'confirmed' && paymentStatus === 'paid') {
      return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
    } else if (status === 'pending') {
      return <Badge variant="secondary">Pending Payment</Badge>;
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

    setIsSearching(true);
    setShowResult(false);
    setLookupResult(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
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
        setTimeout(() => setShowResult(true), 100);
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
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToMyBookings = async (booking: Booking) => {
    try {
      await apiRequest('POST', '/api/user/add-booking', {
        bookingId: booking.id
      });
      
      toast({
        title: "Success",
        description: "Booking added to your account successfully",
      });
      
      setLookupResult(null);
      setLookupCode('');
      setLookupEmail('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add booking to your account",
        variant: "destructive",
      });
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  };

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card className="group bg-white/90 backdrop-blur-sm border-0 ring-1 ring-gray-200/50 shadow-lg shadow-blue-100/30 hover:shadow-xl hover:shadow-blue-200/40 transition-all duration-300 hover:scale-[1.02] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-violet-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <CardContent className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
              {getInitials(booking.guestFirstName, booking.guestLastName)}
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                {booking.guestFirstName} {booking.guestLastName}
              </h3>
              <p className="text-sm text-gray-600 font-mono">{booking.confirmationCode}</p>
            </div>
          </div>
          <div className="text-right">
            {getStatusBadge(booking.status, booking.paymentStatus)}
            <p className="text-lg font-bold text-gray-900 mt-1">€{Number(booking.totalPrice).toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-blue-600" />
            <span>{formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Users className="w-4 h-4 mr-2 text-green-600" />
            <span>{booking.guests} guest{booking.guests !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-2 text-purple-600" />
            <span>{booking.guestCountry}</span>
          </div>
          {booking.hasPet && (
            <div className="flex items-center text-gray-600">
              <PawPrint className="w-4 h-4 mr-2 text-orange-600" />
              <span>Pet friendly</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Payment: {booking.paymentMethod === 'online' ? 'Online' : 'At Property'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedBooking(booking)}
            className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors duration-200"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 transition-all duration-1000 ${pageLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Enhanced Header with Back Button */}
      <div className={`bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40 transform transition-all duration-700 ${pageLoaded ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="group flex items-center space-x-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50/80 hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium">Back</span>
            </Button>
            <div className="h-6 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-700 bg-clip-text text-transparent animate-pulse-slow">
                  My Bookings
                </h1>
                <p className="text-gray-600 text-sm">Manage your reservations and booking history</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`max-w-6xl mx-auto px-4 py-8 transform transition-all duration-1000 ${pageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ultra-Enhanced Booking Lookup Section */}
          <div className={`lg:col-span-1 transform transition-all duration-700 delay-200 ${pageLoaded ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}>
            <Card className="sticky top-24 bg-white/90 backdrop-blur-md border-0 shadow-2xl shadow-blue-200/40 ring-1 ring-blue-200/30 hover:shadow-3xl hover:shadow-blue-300/50 transition-all duration-500 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-violet-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <CardHeader className="relative bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-t-lg border-b border-blue-100/50 backdrop-blur-sm">
                <CardTitle className="flex items-center text-gray-800">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-blue-200/30 group-hover:scale-110 transition-transform duration-300">
                    <Search className="w-6 h-6 text-blue-600 group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-blue-700 bg-clip-text text-transparent">
                      Find Reservation
                    </div>
                    <div className="text-xs text-gray-600 font-normal flex items-center">
                      <Sparkles className="w-3 h-3 mr-1 text-blue-500" />
                      Quick booking lookup
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative space-y-6 p-6">
                <div className="space-y-3 group/input">
                  <Label htmlFor="confirmationCode" className="text-sm font-medium text-gray-700 flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 opacity-60"></div>
                    Confirmation Code
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmationCode"
                      placeholder="e.g. ABC123"
                      value={lookupCode}
                      onChange={(e) => setLookupCode(e.target.value)}
                      className="h-12 border-gray-200/80 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-300 hover:border-blue-300 bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md focus:shadow-lg group-hover/input:bg-white/80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-md opacity-0 group-hover/input:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>
                <div className="space-y-3 group/input">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 opacity-60"></div>
                    Email Address
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="guest@example.com"
                      value={lookupEmail}
                      onChange={(e) => setLookupEmail(e.target.value)}
                      className="h-12 border-gray-200/80 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-300 hover:border-blue-300 bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md focus:shadow-lg group-hover/input:bg-white/80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 rounded-md opacity-0 group-hover/input:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleLookup} 
                  disabled={isSearching}
                  className="relative w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  {isSearching ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                      Find Reservation
                    </>
                  )}
                </Button>

                {lookupResult && (
                  <div className={`mt-6 relative overflow-hidden rounded-xl border-0 bg-gradient-to-br from-emerald-50/80 via-green-50/60 to-blue-50/40 backdrop-blur-sm shadow-xl shadow-emerald-200/30 transform transition-all duration-700 ${showResult ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-200/30 to-blue-200/30 rounded-full blur-2xl -translate-y-16 translate-x-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-200/30 to-emerald-200/30 rounded-full blur-xl translate-y-12 -translate-x-12"></div>
                    
                    <div className="relative p-6">
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mr-3 shadow-lg shadow-emerald-500/30">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent">
                          Booking Found!
                        </h3>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-white/40 hover:bg-white/80 transition-colors duration-200">
                          <span className="text-sm text-gray-600 flex items-center">
                            <Users className="w-4 h-4 mr-2 text-emerald-600" />
                            Guest
                          </span>
                          <span className="font-medium text-gray-900">{lookupResult.guestFirstName} {lookupResult.guestLastName}</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-white/40 hover:bg-white/80 transition-colors duration-200">
                          <span className="text-sm text-gray-600 flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                            Dates
                          </span>
                          <span className="font-medium text-gray-900">{formatDate(lookupResult.checkInDate)} - {formatDate(lookupResult.checkOutDate)}</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-white/40 hover:bg-white/80 transition-colors duration-200">
                          <span className="text-sm text-gray-600 flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-purple-600" />
                            Status
                          </span>
                          <div>{getStatusBadge(lookupResult.status, lookupResult.paymentStatus)}</div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200/50 shadow-sm">
                          <span className="text-sm text-gray-700 font-medium flex items-center">
                            <TrendingUp className="w-4 h-4 mr-2 text-emerald-600" />
                            Total
                          </span>
                          <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                            €{Number(lookupResult.totalPrice).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedBooking(lookupResult)}
                          className="w-full h-11 border-white/60 bg-white/40 hover:bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] group"
                        >
                          <Eye className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                          View Full Details
                        </Button>
                        
                        {isAuthenticated && (
                          <Button
                            size="sm"
                            onClick={() => handleAddToMyBookings(lookupResult)}
                            className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-[1.02] group overflow-hidden relative"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                            <Star className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                            Add to My Bookings
                          </Button>
                        )}
                        
                        {!isAuthenticated && (
                          <div className="p-3 bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-lg">
                            <p className="text-sm text-gray-700 text-center">
                              <a href="/api/login" className="text-blue-600 hover:text-blue-800 font-medium underline decoration-blue-300 hover:decoration-blue-500 transition-colors duration-200">
                                Sign in
                              </a> to add this booking to your account
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Ultra-Enhanced User Bookings List */}
          <div className={`lg:col-span-2 space-y-6 transform transition-all duration-700 delay-300 ${pageLoaded ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}>
            {isAuthenticated ? (
              <>
                {/* Ultra-Enhanced Header with Advanced Stats */}
                <div className="relative overflow-hidden bg-white/90 backdrop-blur-md rounded-2xl p-6 border-0 ring-1 ring-blue-200/30 shadow-2xl shadow-blue-200/40 hover:shadow-3xl hover:shadow-blue-300/50 transition-all duration-500 group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-violet-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-tr from-indigo-200/20 to-violet-200/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-1000"></div>
                  
                  <div className="relative flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                    <div className="relative">
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-700 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                        Your Reservations
                      </h2>
                      <p className="text-gray-600 text-sm mt-1 flex items-center">
                        <Sparkles className="w-3 h-3 mr-1 text-blue-500" />
                        Manage and track your bookings
                      </p>
                      
                      <div className="absolute -bottom-1 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 w-0 group-hover:w-full"></div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="relative group/stat overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative flex items-center space-x-3 bg-blue-50/80 backdrop-blur-sm px-5 py-3 rounded-xl border border-blue-100/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 group-hover/stat:bg-blue-50/90">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover/stat:rotate-12 transition-transform duration-300">
                            <Calendar className="w-5 h-5 text-white" />
                          </div>
                          <div className="text-sm">
                            <div className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                              {userBookings.length}
                            </div>
                            <div className="text-blue-600 text-xs font-medium">
                              booking{userBookings.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {userBookings.length > 0 && (
                        <div className="relative group/stat overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative flex items-center space-x-3 bg-emerald-50/80 backdrop-blur-sm px-5 py-3 rounded-xl border border-emerald-100/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 group-hover/stat:bg-emerald-50/90">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover/stat:rotate-12 transition-transform duration-300">
                              <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-sm">
                              <div className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent">
                                €{userBookings.reduce((total, booking) => total + Number(booking.totalPrice), 0).toFixed(0)}
                              </div>
                              <div className="text-emerald-600 text-xs font-medium">total value</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {isLoading ? (
                  <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className={`bg-white/80 backdrop-blur-sm border-0 ring-1 ring-gray-200/50 shadow-lg shadow-blue-100/30 transform transition-all duration-700 ${pageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} 
                            style={{ animationDelay: `${i * 150}ms` }}>
                        <CardContent className="p-6">
                          <div className="animate-pulse space-y-4">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl"></div>
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg w-2/3 animate-shimmer"></div>
                                <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg w-1/2 animate-shimmer"></div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg w-full animate-shimmer"></div>
                              <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg w-4/5 animate-shimmer"></div>
                              <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg w-3/5 animate-shimmer"></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : userBookings.length > 0 ? (
                  <div className="space-y-6">
                    {userBookings.map((booking, index) => (
                      <div 
                        key={booking.id}
                        className={`transform transition-all duration-700 ${pageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                        style={{ animationDelay: `${(index + 1) * 100}ms` }}
                      >
                        <BookingCard booking={booking} />
                      </div>
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

      {/* Ultra-Enhanced Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-3xl shadow-black/20 max-w-3xl w-full max-h-[95vh] overflow-y-auto border-0 ring-1 ring-gray-200/30 transform transition-all duration-500 animate-slideInUp">
            <div className="relative bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-violet-50/80 backdrop-blur-sm border-b border-gray-200/30 rounded-t-2xl p-6">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 to-indigo-100/30 rounded-t-2xl"></div>
              <div className="relative flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-700 bg-clip-text text-transparent">
                      Booking Details
                    </h2>
                    <p className="text-gray-600 font-mono text-lg font-medium bg-gray-100 px-3 py-1 rounded-full mt-1">
                      {selectedBooking.confirmationCode}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 w-10 h-10 rounded-xl transition-all duration-200 hover:scale-110"
                >
                  <span className="text-2xl">×</span>
                </Button>
              </div>
            </div>

            <div className="p-8 space-y-8">
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
      )}
    </div>
  );
}