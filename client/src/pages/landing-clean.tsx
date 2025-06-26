import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, Wifi, Car, Wind, Utensils, Bed, Calendar, Users, PawPrint, Minus, Plus, Shield, CheckCircle, AlertCircle, Lock, Clock, ChevronLeft, ChevronRight, Info, Building, Building2, Sparkles, Tv, Thermometer, Key, MessageCircle, X, ChevronDown, LogIn, UserPlus } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Calendar as AdvancedCalendar,
  validateStayRange,
} from "@/components/advanced-calendar";
import { DateRange } from "react-day-picker";
import { format, addMonths } from "date-fns";

export default function Landing() {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [hasPet, setHasPet] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [lastAvailabilityCheck, setLastAvailabilityCheck] = useState<number>(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatName, setChatName] = useState("");
  const [chatEmail, setChatEmail] = useState("");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const basePrice = 110.50;
  const cleaningFee = 25.00;
  const petFee = hasPet ? 20.00 : 0;
  const serviceFee = 15.00;

  // Rate limiting for availability checks (max 1 per 2 seconds)
  const RATE_LIMIT_MS = 2000;

  // Mock booked dates with detailed booking information
  const existingBookings = [
    { checkIn: "2025-06-15", checkOut: "2025-06-17" }, // 15-16 booked, 17 checkout only
    { checkIn: "2025-06-22", checkOut: "2025-06-25" }, // 22-24 booked, 25 checkout only
    { checkIn: "2025-07-01", checkOut: "2025-07-04" }, // 1-3 booked, 4 checkout only
    { checkIn: "2025-07-10", checkOut: "2025-07-12" }, // 10-11 booked, 12 checkout only
    { checkIn: "2025-07-20", checkOut: "2025-07-22" }, // 20-21 booked, 22 checkout only
  ];

  // Single source-of-truth for booked check-ins
  const bookedCheckInDates = existingBookings.map(booking => new Date(booking.checkIn));

  // Helper function to safely format dates without timezone issues
  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Handler for the advanced calendar valid range selection
  const handleValidRangeSelect = (range: DateRange) => {
    if (range.from) {
      setCheckIn(format(range.from, 'yyyy-MM-dd'));
    }
    if (range.to) {
      setCheckOut(format(range.to, 'yyyy-MM-dd'));
    }
  };

  // Enhanced validation using the robust validation logic
  const validateBookingRange = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return { valid: false, reason: "Please select both check-in and check-out dates." };
    
    const range: DateRange = {
      from: new Date(startDate),
      to: new Date(endDate)
    };
    
    return validateStayRange(range, bookedCheckInDates);
  };

  // Calculate price breakdown
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const nights = calculateNights();
  const subtotal = basePrice * nights;
  const totalPrice = subtotal + cleaningFee + petFee + serviceFee;

  const navigateMonth = (direction: number) => {
    setCurrentMonth(prev => addMonths(prev, direction));
  };

  const checkAvailability = () => {
    const now = Date.now();
    if (now - lastAvailabilityCheck < RATE_LIMIT_MS) {
      return;
    }

    if (!checkIn || !checkOut) {
      setValidationErrors({ general: "Please select both check-in and check-out dates" });
      return;
    }

    setIsCheckingAvailability(true);
    setLastAvailabilityCheck(now);

    // Validate using the hardened validator
    const verdict = validateStayRange(
      { from: new Date(checkIn), to: new Date(checkOut) },
      bookedCheckInDates,
      { maxStayDays: 30 }
    );

    setTimeout(() => {
      setIsCheckingAvailability(false);
      
      if (!verdict.valid) {
        setValidationErrors({ checkOut: verdict.reason! });
        return;
      }

      // Clear validation errors and calculate price
      setValidationErrors({});
      const nights = calculateNights();
      const total = (basePrice * nights) + cleaningFee + petFee + serviceFee;
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {/* All'arco Venice Logo */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <svg width="40" height="40" viewBox="0 0 40 40" className="transition-transform duration-300 hover:scale-105">
                    <defs>
                      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#1e40af', stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#60a5fa', stopOpacity: 1 }} />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    
                    {/* Venetian Arch Symbol */}
                    <path
                      d="M8 32 L8 20 Q8 12 20 12 Q32 12 32 20 L32 32 L28 32 L28 20 Q28 16 20 16 Q12 16 12 20 L12 32 L8 32 Z"
                      fill="url(#logoGradient)"
                      filter="url(#glow)"
                      className="animate-pulse"
                    />
                    
                    {/* Decorative Elements */}
                    <circle cx="20" cy="14" r="1.5" fill="#60a5fa" opacity="0.8" />
                    <circle cx="16" cy="18" r="1" fill="#93c5fd" opacity="0.6" />
                    <circle cx="24" cy="18" r="1" fill="#93c5fd" opacity="0.6" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    All'arco
                  </h1>
                  <p className="text-xs text-gray-500 font-medium">Venice</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact
              </Button>
              
              <div className="relative">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center space-x-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                </Button>
                
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-50">
                    <div className="py-1">
                      <Link href="/api/login">
                        <a className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          <LogIn className="w-4 h-4 mr-2" />
                          Sign In
                        </a>
                      </Link>
                      <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create Account
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Luxury Apartment in Historic Venice
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience authentic Venetian living in our beautifully restored apartment featuring original architecture and modern amenities.
          </p>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid grid-cols-12 gap-8">
          {/* Calendar Section */}
          <div className="col-span-6">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-6">Select Your Dates</h2>
              
              {/* Calendar Navigation */}
              <div className="flex items-center justify-between mb-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateMonth(-1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h3 className="text-lg font-medium">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateMonth(1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Advanced Calendar Component */}
              <AdvancedCalendar
                bookedCheckIns={bookedCheckInDates}
                defaultMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                onValidRangeSelect={handleValidRangeSelect}
              />
            </Card>
          </div>

          {/* Selected Dates & Booking Summary */}
          <div className="col-span-3">
            <Card className="p-6 sticky top-24">
              <h3 className="text-lg font-semibold mb-4">Your Stay</h3>
              
              {/* Selected Dates Display */}
              <div className="space-y-4 mb-6">
                <div className="bg-white rounded-lg p-3 border">
                  <div className="flex items-center mb-2">
                    <Calendar className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Check-in</span>
                  </div>
                  <div className="text-blue-600 font-semibold text-sm">
                    {checkIn ? formatDateDisplay(checkIn) : 'Select date'}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border">
                  <div className="flex items-center mb-2">
                    <Calendar className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Check-out</span>
                  </div>
                  <div className="text-blue-600 font-semibold text-sm">
                    {checkOut ? formatDateDisplay(checkOut) : 'Select date'}
                  </div>
                </div>
              </div>

              {/* Guest Selection */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Guests</label>
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    disabled={guests <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="font-medium">{guests} guests</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setGuests(Math.min(4, guests + 1))}
                    disabled={guests >= 4}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Price Breakdown */}
              {nights > 0 && (
                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex justify-between">
                    <span>€{basePrice.toFixed(2)} × {nights} nights</span>
                    <span>€{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cleaning fee</span>
                    <span>€{cleaningFee.toFixed(2)}</span>
                  </div>
                  {petFee > 0 && (
                    <div className="flex justify-between">
                      <span>Pet fee</span>
                      <span>€{petFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Service fee</span>
                    <span>€{serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>€{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Validation Errors */}
              {Object.keys(validationErrors).length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  {Object.values(validationErrors).map((error, index) => (
                    <p key={index} className="text-sm text-red-700">{error}</p>
                  ))}
                </div>
              )}

              {/* Check Availability Button */}
              <Button 
                onClick={checkAvailability}
                disabled={!checkIn || !checkOut || isCheckingAvailability}
                className="w-full"
              >
                {isCheckingAvailability ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Checking...
                  </>
                ) : (
                  'Check Availability'
                )}
              </Button>
            </Card>
          </div>

          {/* Property Details */}
          <div className="col-span-3">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Property Details</h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <Bed className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-sm">2 bedrooms, 1 bathroom</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-sm">Sleeps up to 4 guests</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-sm">Historic Venice Center</span>
                </div>
                <div className="flex items-center">
                  <Wifi className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-sm">Free WiFi</span>
                </div>
                <div className="flex items-center">
                  <Car className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-sm">Private parking available</span>
                </div>
              </div>

              {/* Rating */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center mb-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="ml-2 text-sm font-medium">4.9</span>
                </div>
                <p className="text-sm text-gray-600">Based on 127 reviews</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden space-y-6">
          {/* Mobile Calendar */}
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Select Your Dates</h2>
            
            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigateMonth(-1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="text-lg font-medium">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigateMonth(1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Advanced Calendar Component */}
            <AdvancedCalendar
              bookedCheckIns={bookedCheckInDates}
              defaultMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              onValidRangeSelect={handleValidRangeSelect}
            />

            {/* Selected Dates Display */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <Calendar className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Check-in</span>
                  </div>
                  <div className="text-blue-600 font-semibold text-sm">
                    {checkIn ? formatDateDisplay(checkIn) : 'Tap calendar'}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <Calendar className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Check-out</span>
                  </div>
                  <div className="text-blue-600 font-semibold text-sm">
                    {checkOut ? formatDateDisplay(checkOut) : 'Tap calendar'}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Mobile Booking Summary */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>
            
            {/* Guest Selection */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Guests</label>
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                  disabled={guests <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="font-medium">{guests} guests</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setGuests(Math.min(4, guests + 1))}
                  disabled={guests >= 4}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Price Breakdown */}
            {nights > 0 && (
              <div className="space-y-3 mb-4 text-sm">
                <div className="flex justify-between">
                  <span>€{basePrice.toFixed(2)} × {nights} nights</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cleaning fee</span>
                  <span>€{cleaningFee.toFixed(2)}</span>
                </div>
                {petFee > 0 && (
                  <div className="flex justify-between">
                    <span>Pet fee</span>
                    <span>€{petFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Service fee</span>
                  <span>€{serviceFee.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>€{totalPrice.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Validation Errors */}
            {Object.keys(validationErrors).length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                {Object.values(validationErrors).map((error, index) => (
                  <p key={index} className="text-sm text-red-700">{error}</p>
                ))}
              </div>
            )}

            {/* Check Availability Button */}
            <Button 
              onClick={checkAvailability}
              disabled={!checkIn || !checkOut || isCheckingAvailability}
              className="w-full"
            >
              {isCheckingAvailability ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Checking...
                </>
              ) : (
                'Check Availability'
              )}
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
}