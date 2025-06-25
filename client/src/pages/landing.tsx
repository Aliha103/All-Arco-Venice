import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, Wifi, Car, Wind, Utensils, Bed, Calendar, Users, PawPrint, Minus, Plus, Shield, CheckCircle, AlertCircle, Lock, Clock } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Landing() {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [hasPet, setHasPet] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [lastAvailabilityCheck, setLastAvailabilityCheck] = useState<number>(0);

  const basePrice = 110.50;
  const cleaningFee = 25.00;
  const petFee = hasPet ? 20.00 : 0;
  const serviceFee = 15.00;

  // Rate limiting for availability checks (max 1 per 2 seconds)
  const RATE_LIMIT_MS = 2000;
  // Advanced validation functions
  const validateDates = () => {
    const errors: Record<string, string> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!checkIn) {
      errors.checkIn = "Check-in date is required";
    } else {
      const checkInDate = new Date(checkIn);
      if (checkInDate < today) {
        errors.checkIn = "Check-in date cannot be in the past";
      }
    }
    
    if (!checkOut) {
      errors.checkOut = "Check-out date is required";
    } else if (checkIn) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      if (checkOutDate <= checkInDate) {
        errors.checkOut = "Check-out must be after check-in date";
      }
      
      const diffTime = checkOutDate.getTime() - checkInDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      if (diffDays > 30) {
        errors.checkOut = "Maximum stay is 30 nights";
      }
    }
    
    return errors;
  };

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 1;
  };

  // Availability check with rate limiting
  const checkAvailability = async () => {
    const now = Date.now();
    if (now - lastAvailabilityCheck < RATE_LIMIT_MS) {
      return;
    }

    if (!checkIn || !checkOut || Object.keys(validateDates()).length > 0) {
      return;
    }

    setIsCheckingAvailability(true);
    setLastAvailabilityCheck(now);

    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API call
      // In real app: const response = await apiRequest("POST", "/api/check-availability", { checkIn, checkOut });
    } catch (error) {
      console.error("Availability check failed:", error);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // Real-time validation
  useEffect(() => {
    const errors = validateDates();
    setValidationErrors(errors);
    
    if (Object.keys(errors).length === 0 && checkIn && checkOut) {
      checkAvailability();
    }
  }, [checkIn, checkOut]);

  // Secure date handlers with validation
  const handleCheckInChange = (value: string) => {
    setCheckIn(value);
    if (checkOut && new Date(value) >= new Date(checkOut)) {
      setCheckOut("");
    }
  };

  const handleCheckOutChange = (value: string) => {
    setCheckOut(value);
  };

  // Enhanced guest controls with validation
  const handleGuestChange = (delta: number) => {
    const newGuests = guests + delta;
    if (newGuests >= 1 && newGuests <= 5) {
      setGuests(newGuests);
    }
  };

  const nights = calculateNights();
  const subtotal = basePrice * nights;
  const total = subtotal + cleaningFee + petFee + serviceFee;

  // Pricing tiers based on length of stay
  const getDiscountedPrice = () => {
    if (nights >= 7) return basePrice * 0.9; // 10% discount for week+
    if (nights >= 3) return basePrice * 0.95; // 5% discount for 3+ nights
    return basePrice;
  };

  const discountedPrice = getDiscountedPrice();
  const hasDiscount = discountedPrice < basePrice;
  const discountAmount = hasDiscount ? (basePrice - discountedPrice) * nights : 0;
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center">
              <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">All'Arco Venice</h1>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-6">
              <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600">
                <span className="font-medium">EN</span>
                <span className="text-gray-400">|</span>
                <button className="hover:text-gray-900 transition-colors">IT</button>
              </div>
              <button className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Title and Rating */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              All'Arco Apartment - Heart of Venice
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="font-medium">4.89</span>
                <span>·</span>
                <span>127 reviews</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>Venice, Italy</span>
              </div>
            </div>
          </div>

          {/* Hero Images Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 h-64 sm:h-80 lg:h-96 rounded-xl overflow-hidden">
            {/* Main Image */}
            <div className="relative group cursor-pointer">
              <div className="w-full h-full bg-gray-200 rounded-l-xl lg:rounded-l-xl lg:rounded-r-none overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="w-16 h-16 mx-auto mb-2 bg-gray-400 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">Main Bedroom</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Smaller Images Grid */}
            <div className="grid grid-cols-2 gap-2 h-full">
              {/* Top Right */}
              <div className="relative group cursor-pointer">
                <div className="w-full h-full bg-gray-200 rounded-tr-xl overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <div className="text-center text-gray-600">
                      <div className="w-10 h-10 mx-auto mb-1 bg-blue-400 rounded flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-xs">Terrace View</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Right */}
              <div className="relative group cursor-pointer">
                <div className="w-full h-full bg-gray-200 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                    <div className="text-center text-gray-600">
                      <div className="w-10 h-10 mx-auto mb-1 bg-green-400 rounded flex items-center justify-center">
                        <Utensils className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-xs">Kitchen</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Left */}
              <div className="relative group cursor-pointer">
                <div className="w-full h-full bg-gray-200 rounded-bl-xl overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                    <div className="text-center text-gray-600">
                      <div className="w-10 h-10 mx-auto mb-1 bg-purple-400 rounded flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.75 2.524z" />
                        </svg>
                      </div>
                      <p className="text-xs">Living Room</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Right with +3 photos overlay */}
              <div className="relative group cursor-pointer">
                <div className="w-full h-full bg-gray-200 rounded-br-xl overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center">
                    <div className="text-center text-gray-600">
                      <div className="w-10 h-10 mx-auto mb-1 bg-gray-400 rounded flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-xs">Bedroom</p>
                    </div>
                  </div>
                  {/* +3 photos overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">+3 photos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>


        </div>
      </section>

      {/* Apartment Details Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl p-6 sm:p-8 lg:p-10 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            {/* Mobile Layout (Vertical) */}
            <div className="block md:hidden">
              <div className="space-y-6">
                {/* Host Section */}
                <div className="flex items-center space-x-4 pb-4 border-b border-gray-100">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center shadow-sm">
                    <svg className="w-7 h-7 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">
                      Entire apartment hosted by Fatima
                    </h2>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-amber-400 fill-current" />
                        <span className="text-sm font-medium text-gray-700 ml-1">Superhost</span>
                      </div>
                      <span className="text-gray-300">•</span>
                      <span className="text-sm text-gray-600">5+ years hosting</span>
                    </div>
                  </div>
                </div>

                {/* Apartment Specs */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 mx-auto mb-2 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                      </svg>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">5</div>
                    <div className="text-xs text-gray-600">guests</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 mx-auto mb-2 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                      </svg>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">2</div>
                    <div className="text-xs text-gray-600">bedrooms</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 mx-auto mb-2 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                      </svg>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">1</div>
                    <div className="text-xs text-gray-600">bathroom</div>
                  </div>
                </div>

                {/* Pricing Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline">
                        <span className="text-2xl font-bold text-gray-900">€110.50</span>
                        <span className="text-base text-gray-600 ml-1">/night</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-green-600">Available Now</span>
                      </div>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
                      Book Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tablet & Desktop Layout (Horizontal) */}
            <div className="hidden md:block">
              <div className="flex items-center justify-between gap-8">
                {/* Left side - Apartment details */}
                <div className="flex-1">
                  <div className="flex items-start space-x-6">
                    {/* Enhanced Host icon */}
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0 border-2 border-white">
                      <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    
                    {/* Enhanced Apartment info */}
                    <div className="flex-1">
                      <h2 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-2">
                        Entire apartment hosted by Fatima
                      </h2>
                      
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-amber-400 fill-current" />
                          <span className="text-sm font-medium text-gray-700">Superhost</span>
                        </div>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm text-gray-600">5+ years hosting</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm text-gray-600">100+ reviews</span>
                      </div>
                      
                      {/* Enhanced Apartment specs */}
                      <div className="flex items-center gap-6 lg:gap-8">
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">5 guests</div>
                            <div className="text-xs text-gray-600">Maximum capacity</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <Bed className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">2 bedrooms</div>
                            <div className="text-xs text-gray-600">Private spaces</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">1 bathroom</div>
                            <div className="text-xs text-gray-600">Full bathroom</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right side - Pricing and availability */}
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">
                    €110.50
                    <span className="text-lg font-normal text-gray-600 ml-1">/night</span>
                  </div>
                  <div className="flex items-center justify-end space-x-2 mt-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-600">Available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Book Your Stay</h2>
          <p className="text-gray-600">Choose your dates and start planning your perfect getaway</p>
        </div>

        <Card className="overflow-hidden shadow-lg">
          <CardContent className="p-6 sm:p-8">
            {/* Mobile Layout - Vertical */}
            <div className="block md:hidden space-y-6">
              {/* Calendar Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Select Dates</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check-in
                      {isCheckingAvailability && <Clock className="inline w-3 h-3 ml-1 animate-spin" />}
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={checkIn}
                        onChange={(e) => handleCheckInChange(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-all ${
                          validationErrors.checkIn 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        min={new Date().toISOString().split('T')[0]}
                        max={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      />
                      {checkIn && !validationErrors.checkIn && (
                        <CheckCircle className="absolute right-3 top-2.5 w-4 h-4 text-green-500" />
                      )}
                      {validationErrors.checkIn && (
                        <AlertCircle className="absolute right-3 top-2.5 w-4 h-4 text-red-500" />
                      )}
                    </div>
                    {validationErrors.checkIn && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.checkIn}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check-out
                      {isCheckingAvailability && <Clock className="inline w-3 h-3 ml-1 animate-spin" />}
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={checkOut}
                        onChange={(e) => handleCheckOutChange(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-all ${
                          validationErrors.checkOut 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        min={checkIn ? new Date(new Date(checkIn).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                        max={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                        disabled={!checkIn}
                      />
                      {checkOut && !validationErrors.checkOut && (
                        <CheckCircle className="absolute right-3 top-2.5 w-4 h-4 text-green-500" />
                      )}
                      {validationErrors.checkOut && (
                        <AlertCircle className="absolute right-3 top-2.5 w-4 h-4 text-red-500" />
                      )}
                    </div>
                    {validationErrors.checkOut && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.checkOut}</p>
                    )}
                    {!validationErrors.checkOut && checkIn && checkOut && nights > 1 && (
                      <p className="text-green-600 text-xs mt-1 flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {nights} nights stay confirmed
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Guests & Pets Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Guests & Preferences</h3>
                
                {/* Guests */}
                <div className="border border-gray-300 rounded-xl bg-gray-50">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-gray-500 mr-3" />
                      <div>
                        <span className="text-gray-700 font-medium">Guests</span>
                        <p className="text-xs text-gray-500">Maximum 5 guests</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleGuestChange(-1)}
                        disabled={guests <= 1}
                        className="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white hover:border-blue-400 transition-all duration-200 group"
                        aria-label="Decrease guests"
                      >
                        <Minus className="w-4 h-4 group-hover:text-blue-600 transition-colors" />
                      </button>
                      <div className="min-w-[3rem] text-center">
                        <span className="text-xl font-bold text-gray-900">{guests}</span>
                        <p className="text-xs text-gray-500">{guests === 1 ? 'guest' : 'guests'}</p>
                      </div>
                      <button
                        onClick={() => handleGuestChange(1)}
                        disabled={guests >= 5}
                        className="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white hover:border-blue-400 transition-all duration-200 group"
                        aria-label="Increase guests"
                      >
                        <Plus className="w-4 h-4 group-hover:text-blue-600 transition-colors" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pets */}
                <div className="border border-gray-300 rounded-xl bg-gray-50">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center">
                      <PawPrint className="w-5 h-5 text-gray-500 mr-3" />
                      <div>
                        <span className="text-gray-700 font-medium">Pets Welcome</span>
                        <p className="text-xs text-gray-500">€20 additional fee per stay</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={hasPet}
                        onChange={(e) => setHasPet(e.target.checked)}
                        className="sr-only peer"
                        aria-label="Toggle pet accommodation"
                      />
                      <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 group-hover:shadow-md transition-all duration-200"></div>
                    </label>
                  </div>
                  {hasPet && (
                    <div className="px-4 pb-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                        <p className="text-green-800 text-sm">Pet accommodation confirmed. €20 fee included in total.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 relative overflow-hidden">
                {/* Security Badge */}
                <div className="absolute top-4 right-4">
                  <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    <Shield className="w-3 h-3" />
                    <span>Secure</span>
                  </div>
                </div>

                <div className="text-center mb-4 mt-2">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="text-2xl font-bold text-gray-900">
                      €{hasDiscount ? discountedPrice.toFixed(2) : basePrice.toFixed(2)}
                    </div>
                    {hasDiscount && (
                      <div className="text-lg text-gray-500 line-through">
                        €{basePrice.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">per night</div>
                  {hasDiscount && (
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium mt-2 inline-block">
                      {nights >= 7 ? '10% weekly discount' : '5% multi-night discount'}
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span>
                      €{hasDiscount ? discountedPrice.toFixed(2) : basePrice.toFixed(2)} × {nights} night{nights !== 1 ? 's' : ''}
                      {hasDiscount && <span className="text-green-600 ml-1">(discounted)</span>}
                    </span>
                    <span>€{(hasDiscount ? discountedPrice * nights : subtotal).toFixed(2)}</span>
                  </div>
                  
                  {hasDiscount && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount savings</span>
                      <span>-€{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span>Cleaning fee</span>
                    <span>€{cleaningFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Service fee</span>
                    <span>€{serviceFee.toFixed(2)}</span>
                  </div>
                  {hasPet && (
                    <div className="flex justify-between text-sm">
                      <span>Pet fee</span>
                      <span>€{petFee.toFixed(2)}</span>
                    </div>
                  )}
                  <hr className="border-gray-300" />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span className="text-lg">€{(hasDiscount ? (discountedPrice * nights) + cleaningFee + petFee + serviceFee : total).toFixed(2)}</span>
                  </div>
                  
                  {hasDiscount && (
                    <div className="text-center">
                      <span className="text-xs text-green-600 font-medium">
                        You saved €{discountAmount.toFixed(2)}!
                      </span>
                    </div>
                  )}
                </div>

                {/* Availability Status */}
                {checkIn && checkOut && Object.keys(validationErrors).length === 0 && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center text-green-800">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">Available for your dates</span>
                    </div>
                    {isCheckingAvailability && (
                      <div className="flex items-center text-blue-600 mt-1">
                        <Clock className="w-3 h-3 mr-1 animate-spin" />
                        <span className="text-xs">Checking real-time availability...</span>
                      </div>
                    )}
                  </div>
                )}

                {Object.keys(validationErrors).length === 0 && checkIn && checkOut ? (
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-semibold transition-all transform hover:scale-[1.02]" 
                    asChild={true}
                  >
                    <a href="/api/login" className="flex items-center justify-center">
                      <Lock className="w-4 h-4 mr-2" />
                      Reserve Securely
                    </a>
                  </Button>
                ) : (
                  <Button 
                    className="w-full bg-gray-400 text-white py-3 rounded-xl font-semibold cursor-not-allowed" 
                    disabled
                  >
                    <span className="flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      {!checkIn || !checkOut ? 'Select dates to continue' : 'Please fix errors above'}
                    </span>
                  </Button>
                )}
                
                <div className="text-center mt-3 space-y-1">
                  <p className="text-xs text-gray-500">You won't be charged yet</p>
                  <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
                    <Shield className="w-3 h-3" />
                    <span>SSL encrypted • Secure payment</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tablet Layout - 2 Columns */}
            <div className="hidden md:grid lg:hidden grid-cols-2 gap-8">
              {/* Left: Calendar Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  Select Dates
                  {isCheckingAvailability && <Clock className="w-4 h-4 ml-2 animate-spin text-blue-600" />}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Check-in</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={checkIn}
                        onChange={(e) => handleCheckInChange(e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all ${
                          validationErrors.checkIn 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        min={new Date().toISOString().split('T')[0]}
                        max={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      />
                      {checkIn && !validationErrors.checkIn && (
                        <CheckCircle className="absolute right-3 top-3.5 w-4 h-4 text-green-500" />
                      )}
                      {validationErrors.checkIn && (
                        <AlertCircle className="absolute right-3 top-3.5 w-4 h-4 text-red-500" />
                      )}
                    </div>
                    {validationErrors.checkIn && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.checkIn}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Check-out</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={checkOut}
                        onChange={(e) => handleCheckOutChange(e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all ${
                          validationErrors.checkOut 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        min={checkIn ? new Date(new Date(checkIn).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                        max={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                        disabled={!checkIn}
                      />
                      {checkOut && !validationErrors.checkOut && (
                        <CheckCircle className="absolute right-3 top-3.5 w-4 h-4 text-green-500" />
                      )}
                      {validationErrors.checkOut && (
                        <AlertCircle className="absolute right-3 top-3.5 w-4 h-4 text-red-500" />
                      )}
                    </div>
                    {validationErrors.checkOut && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.checkOut}</p>
                    )}
                    {!validationErrors.checkOut && checkIn && checkOut && nights > 1 && (
                      <p className="text-green-600 text-xs mt-1 flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {nights} nights stay confirmed
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Guests/Pets + Price (Vertical Stack) */}
              <div className="space-y-6">
                {/* Guests & Pets */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900">Preferences</h3>
                  
                  {/* Guests */}
                  <div className="flex items-center justify-between p-4 border border-gray-300 rounded-xl bg-gray-50">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-gray-500 mr-3" />
                      <span className="text-gray-700">Guests</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        disabled={guests <= 1}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-lg font-semibold min-w-[2rem] text-center">{guests}</span>
                      <button
                        onClick={() => setGuests(Math.min(5, guests + 1))}
                        disabled={guests >= 5}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Pets */}
                  <div className="flex items-center justify-between p-4 border border-gray-300 rounded-xl bg-gray-50">
                    <div className="flex items-center">
                      <PawPrint className="w-5 h-5 text-gray-500 mr-3" />
                      <span className="text-gray-700">Pets</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasPet}
                        onChange={(e) => setHasPet(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  {hasPet && (
                    <p className="text-sm text-gray-500 ml-2">Additional €20 pet fee will be added</p>
                  )}
                </div>

                {/* Price Summary */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-gray-900">€{basePrice.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">per night</div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span>€{basePrice.toFixed(2)} × {nights} night{nights !== 1 ? 's' : ''}</span>
                      <span>€{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cleaning fee</span>
                      <span>€{cleaningFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Service fee</span>
                      <span>€{serviceFee.toFixed(2)}</span>
                    </div>
                    {hasPet && (
                      <div className="flex justify-between text-sm">
                        <span>Pet fee</span>
                        <span>€{petFee.toFixed(2)}</span>
                      </div>
                    )}
                    <hr className="border-gray-300" />
                    <div className="flex justify-between font-bold text-base">
                      <span>Total</span>
                      <span>€{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-semibold transition-all" asChild>
                    <a href="/api/login">Reserve Now</a>
                  </Button>
                  
                  <p className="text-xs text-gray-500 text-center mt-3">You won't be charged yet</p>
                </div>
              </div>
            </div>

            {/* Desktop Layout - 3 Equal Columns */}
            <div className="hidden lg:grid grid-cols-3 gap-8">
              {/* Column 1: Calendar Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Select Dates</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Check-in</label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Check-out</label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      min={checkIn || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>

              {/* Column 2: Guests & Pets Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Guests & Pets</h3>
                
                {/* Guests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of guests</label>
                  <div className="flex items-center justify-between p-4 border border-gray-300 rounded-xl bg-gray-50">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-gray-500 mr-3" />
                      <span className="text-gray-700">Guests</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        disabled={guests <= 1}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-lg font-semibold min-w-[2rem] text-center">{guests}</span>
                      <button
                        onClick={() => setGuests(Math.min(5, guests + 1))}
                        disabled={guests >= 5}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pets */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pet preference</label>
                  <div className="flex items-center justify-between p-4 border border-gray-300 rounded-xl bg-gray-50">
                    <div className="flex items-center">
                      <PawPrint className="w-5 h-5 text-gray-500 mr-3" />
                      <span className="text-gray-700">Bringing pets?</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasPet}
                        onChange={(e) => setHasPet(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  {hasPet && (
                    <p className="text-sm text-gray-500 mt-2">Additional €20 pet fee will be added</p>
                  )}
                </div>
              </div>

              {/* Column 3: Price Breakdown */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Price Breakdown</h3>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-gray-900">€{basePrice.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">per night</div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span>€{basePrice.toFixed(2)} × {nights} night{nights !== 1 ? 's' : ''}</span>
                      <span>€{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cleaning fee</span>
                      <span>€{cleaningFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Service fee</span>
                      <span>€{serviceFee.toFixed(2)}</span>
                    </div>
                    {hasPet && (
                      <div className="flex justify-between text-sm">
                        <span>Pet fee</span>
                        <span>€{petFee.toFixed(2)}</span>
                      </div>
                    )}
                    <hr className="border-gray-300" />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>€{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-semibold transition-all transform hover:scale-105" asChild>
                    <a href="/api/login">Reserve Now</a>
                  </Button>
                  
                  <p className="text-xs text-gray-500 text-center mt-3">You won't be charged yet</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Features Preview */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Why Choose All'arco?</h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4">
            Discover what makes our apartment the perfect choice for your stay
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <Card>
            <CardContent className="p-4 sm:p-6 text-center">
              <MapPin className="w-10 h-10 sm:w-12 sm:h-12 text-primary mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Prime Location</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Located in the heart of the city, walking distance to major attractions and restaurants.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6 text-center">
              <Star className="w-10 h-10 sm:w-12 sm:h-12 text-warning mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">5-Star Experience</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Exceptional hospitality with 24/7 support and personalized recommendations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Luxury Comfort</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Spacious 2-bedroom apartment with modern amenities and stunning city views.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Amenities Preview */}
      <section className="bg-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Premium Amenities</h2>
            <p className="text-sm sm:text-base text-gray-600">Everything you need for a comfortable stay</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Wifi className="text-secondary text-lg sm:text-xl flex-shrink-0" />
              <span className="text-sm sm:text-base text-gray-700 font-medium">Free Wi-Fi</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Car className="text-secondary text-lg sm:text-xl flex-shrink-0" />
              <span className="text-sm sm:text-base text-gray-700 font-medium">Free Parking</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Wind className="text-secondary text-lg sm:text-xl flex-shrink-0" />
              <span className="text-sm sm:text-base text-gray-700 font-medium">Air Conditioning</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Utensils className="text-secondary text-lg sm:text-xl flex-shrink-0" />
              <span className="text-sm sm:text-base text-gray-700 font-medium">Full Kitchen</span>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-primary py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4 px-4">
            Ready to Book Your Perfect Stay?
          </h2>
          <p className="text-primary-foreground mb-6 sm:mb-8 text-base sm:text-lg px-4">
            Join thousands of satisfied guests who have made All'arco their home away from home.
          </p>
          <Button size="lg" variant="secondary" className="text-sm sm:text-base" asChild>
            <a href="/api/login">Book Your Stay Now</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-1 sm:col-span-2">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">All'arco Apartment</h3>
              <p className="text-gray-300 mb-4 text-sm sm:text-base">
                Experience luxury and comfort in the heart of the city. Your perfect home away from home.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Quick Links</h4>
              <ul className="space-y-2 text-gray-300 text-sm sm:text-base">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">House Rules</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Contact Info</h4>
              <ul className="space-y-2 text-gray-300 text-sm sm:text-base">
                <li>City Center, Downtown</li>
                <li>+1 (555) 123-4567</li>
                <li>info@allarco.com</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-gray-400">
            <p className="text-xs sm:text-sm">&copy; 2024 All'arco Apartment. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
