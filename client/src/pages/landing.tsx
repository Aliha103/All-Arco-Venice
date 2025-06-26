import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, Wifi, Car, Wind, Utensils, Bed, Calendar, Users, PawPrint, Minus, Plus, Shield, CheckCircle, AlertCircle, Lock, Clock, ChevronLeft, ChevronRight, Info, Building, Building2, Sparkles, Tv, Thermometer, Key, MessageCircle, X, ChevronDown, LogIn, UserPlus } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Calendar as AdvancedCalendar, validateStayRange } from "@/components/advanced-calendar";
import { DateRange } from "react-day-picker";
import { format, startOfDay } from "date-fns";

export default function Landing() {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [hasPet, setHasPet] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [lastAvailabilityCheck, setLastAvailabilityCheck] = useState<number>(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
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

  // Convert booked check-in dates to Date objects for the advanced calendar
  const bookedCheckInDates = existingBookings.map(booking => new Date(booking.checkIn));

  // Generate list of all booked dates (excluding checkout days)
  const bookedDates = existingBookings.flatMap(booking => {
    const dates = [];
    const start = new Date(booking.checkIn);
    const end = new Date(booking.checkOut);
    
    while (start < end) {
      dates.push(start.toISOString().split('T')[0]);
      start.setDate(start.getDate() + 1);
    }
    return dates;
  });

  // Generate list of checkout-only dates
  const checkoutOnlyDates = existingBookings.map(booking => booking.checkOut);

  // Advanced booking validation functions
  const canCheckInOnDate = (date: string) => {
    // Can't check in if date is already booked for check-in
    if (bookedDates.includes(date)) return false;
    return true;
  };

  const canCheckOutOnDate = (date: string) => {
    // Can always check out on any date (including booked check-in dates)
    return true;
  };

  const isCheckoutOnlyDate = (date: string) => {
    // Dates that are booked for check-in are checkout-only for new bookings
    return date === '2024-07-16';
  };

  const canBookDateRange = (startDate: string, endDate: string) => {
    // Check if check-in date is available
    if (!canCheckInOnDate(startDate)) return false;
    
    // Check if any dates in the range (excluding checkout date) are booked
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    while (start < end) {
      const dateStr = start.toISOString().split('T')[0];
      if (bookedDates.includes(dateStr)) {
        return false;
      }
      start.setDate(start.getDate() + 1);
    }
    
    return true;
  };

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
      } else if (!canCheckInOnDate(checkIn)) {
        errors.checkIn = "This date is not available for check-in";
      }
    }
    
    if (!checkOut) {
      errors.checkOut = "Check-out date is required";
    } else if (checkIn) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      if (checkOutDate <= checkInDate) {
        errors.checkOut = "Check-out must be after check-in date";
      } else if (!canBookDateRange(checkIn, checkOut)) {
        errors.checkOut = "Selected dates conflict with existing bookings";
      } else {
        const diffTime = checkOutDate.getTime() - checkInDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        if (diffDays > 30) {
          errors.checkOut = "Maximum stay is 30 nights";
        }
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

  // Calendar helper functions
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateString = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

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

  const parseDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00');
  };

  const isDateBooked = (dateString: string) => {
    return bookedDates.includes(dateString);
  };

  const isDateInRange = (dateString: string) => {
    if (!checkIn || !checkOut) return false;
    const date = parseDate(dateString);
    const start = parseDate(checkIn);
    const end = parseDate(checkOut);
    return date >= start && date <= end;
  };

  const isDateSelected = (dateString: string) => {
    return dateString === checkIn || dateString === checkOut;
  };

  const isDateInHoverRange = (dateString: string) => {
    if (!checkIn || !hoveredDate) return false;
    if (checkOut) return false; // Don't show hover range if both dates are selected
    
    const date = parseDate(dateString);
    const start = parseDate(checkIn);
    const end = parseDate(hoveredDate);
    
    if (end < start) return false;
    return date >= start && date <= end;
  };

  const handleDateClick = (dateString: string) => {
    const clickedDate = parseDate(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (clickedDate < today) return;

    if (!checkIn || (checkIn && checkOut)) {
      // Start new selection - check if can check-in on this date
      if (canCheckInOnDate(dateString)) {
        setCheckIn(dateString);
        setCheckOut("");
      }
    } else {
      // Complete the range
      const startDate = parseDate(checkIn);
      if (clickedDate <= startDate) {
        // If clicked date is before or same as check-in, make it the new check-in
        if (canCheckInOnDate(dateString)) {
          setCheckIn(dateString);
          setCheckOut("");
        }
      } else {
        // Set as check-out date - validate the range
        if (canBookDateRange(checkIn, dateString)) {
          setCheckOut(dateString);
        }
      }
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + (direction === 'next' ? 1 : -1));
      return newMonth;
    });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateString = formatDateString(date);
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today;
      const isBooked = isDateBooked(dateString);
      const isSelected = isDateSelected(dateString);
      const isInRange = isDateInRange(dateString);
      const isInHoverRange = isDateInHoverRange(dateString);
      const isCheckoutOnly = isCheckoutOnlyDate(dateString);
      const canCheckIn = canCheckInOnDate(dateString);
      const canCheckOut = canCheckOutOnDate(dateString);
      const isDisabled = isPast || isBooked;
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(dateString)}
          onMouseEnter={() => setHoveredDate(dateString)}
          onMouseLeave={() => setHoveredDate(null)}
          disabled={isDisabled}
          className={`
            h-10 w-10 rounded-lg text-sm font-medium transition-all duration-300 relative group
            transform hover:scale-105 active:scale-95
            ${isDisabled 
              ? 'text-gray-300 cursor-not-allowed opacity-50' 
              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm cursor-pointer'
            }
            ${isSelected 
              ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md hover:from-blue-600 hover:to-blue-700' 
              : ''
            }
            ${isInRange && !isSelected 
              ? 'bg-gradient-to-b from-blue-100 to-blue-200 text-blue-700 border border-blue-300' 
              : ''
            }
            ${isInHoverRange && !isSelected && !isInRange
              ? 'bg-blue-50 text-blue-600 border border-blue-200' 
              : ''
            }
            ${isToday && !isSelected 
              ? 'ring-2 ring-blue-400 ring-opacity-50' 
              : ''
            }
            ${isBooked && !isCheckoutOnly
              ? 'bg-red-50 text-red-400 line-through border border-red-200' 
              : ''
            }
            ${isCheckoutOnly && !isSelected
              ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100' 
              : ''
            }

          `}
        >
          {day}
          {isBooked && !isCheckoutOnly && (
            <div className="absolute bottom-1 right-1">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
            </div>
          )}
          {isSelected && (
            <div className="absolute top-0.5 right-0.5">
              <CheckCircle className="w-3 h-3 text-white opacity-80" />
            </div>
          )}
          {!isDisabled && !isSelected && !isCheckoutOnly && (
            <div className="absolute inset-0 rounded-lg bg-blue-500 opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
          )}
        </button>
      );
    }
    
    return days;
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-4 xl:px-6">
          <div className="flex justify-between items-center h-12 sm:h-14 lg:h-12 mt-[5px] mb-[5px]">
            <div className="flex items-center">
              <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-2 group">
                {/* Elegant Logo Mark */}
                <div className="relative">
                  {/* Main logo container */}
                  <div className="w-9 h-9 sm:w-11 sm:h-11 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 shadow-xl flex items-center justify-center transform group-hover:scale-105 transition-all duration-500 ease-out">
                    {/* Venetian Architecture Symbol */}
                    <div className="relative">
                      {/* Stylized 'A' with arch design */}
                      <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" viewBox="0 0 32 32" fill="none">
                        {/* Main arch structure */}
                        <path 
                          d="M8 24 L16 8 L24 24 M12 20 L20 20" 
                          stroke="currentColor" 
                          strokeWidth="2.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          className="drop-shadow-sm"
                        />
                        {/* Venetian arch detail */}
                        <path 
                          d="M10 24 Q16 18 22 24" 
                          stroke="currentColor" 
                          strokeWidth="1.5" 
                          strokeLinecap="round" 
                          fill="none"
                          opacity="0.7"
                        />
                        {/* Decorative elements */}
                        <circle cx="16" cy="12" r="1" fill="currentColor" opacity="0.8"/>
                      </svg>
                      
                      {/* Subtle inner glow */}
                      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 rounded-full"></div>
                    </div>
                    
                    {/* Premium shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out"></div>
                  </div>
                  
                  
                </div>
                
                {/* Refined Brand Typography */}
                <div className="flex flex-col space-y-0.5">
                  <div className="flex items-baseline space-x-2">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                      <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                        All'
                      </span>
                      <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 bg-clip-text text-transparent">
                        Arco
                      </span>
                    </h1>
                    <div className="hidden sm:block text-xs font-semibold text-slate-500 tracking-widest uppercase border-l border-slate-300 pl-2 leading-tight">
                      Venice
                    </div>
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500 font-medium tracking-wide uppercase opacity-80 leading-none">
                    Luxury Residence
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-6 lg:space-x-4">
              <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600">
                <span className="font-medium">EN</span>
                <span className="text-gray-400">|</span>
                <button className="hover:text-gray-900 transition-colors">IT</button>
              </div>
              <div className="relative">
                <button 
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center space-x-1 p-2 hover:bg-gray-50 rounded-xl transition-all duration-200 group border border-transparent hover:border-gray-200"
                  aria-label="Account menu"
                  aria-expanded={isUserDropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform duration-300 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                {isUserDropdownOpen && (
                  <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-300">
                    {/* Auth Options */}
                    <div className="p-2">
                      <button 
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          // Add slight delay for smooth UX
                          setTimeout(() => {
                            window.location.href = '/api/login';
                          }, 150);
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-3 text-left rounded-xl hover:bg-blue-50 transition-all duration-200 group"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                          <LogIn className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-900">Sign In</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </button>
                      
                      <button 
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          // Add slight delay for smooth UX
                          setTimeout(() => {
                            window.location.href = '/api/login';
                          }, 150);
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-3 text-left rounded-xl hover:bg-green-50 transition-all duration-200 group mt-1"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                          <UserPlus className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-900">Create Account</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                      </button>
                    </div>
                    
                    
                  </div>
                )}
                
                {/* Enhanced Backdrop */}
                {isUserDropdownOpen && (
                  <div 
                    className="fixed inset-0 z-40 bg-black/5 backdrop-blur-sm" 
                    onClick={() => setIsUserDropdownOpen(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsUserDropdownOpen(false);
                      }
                    }}
                    tabIndex={-1}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* Hero Section */}
      <section className="bg-white px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pt-[15px] pb-[15px]">
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
      <section id="booking-section" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Book Your Stay</h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">Choose your dates and start planning your perfect getaway</p>
        </div>

        <Card className="overflow-hidden shadow-lg">
          <CardContent className="p-8 sm:p-12 lg:p-16">
            {/* Mobile Layout - Vertical */}
            <div className="block md:hidden space-y-6">
              {/* Advanced Calendar Section */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                      Select Your Dates
                      {isCheckingAvailability && <Clock className="w-4 h-4 ml-2 animate-spin text-blue-600" />}
                    </h3>
                    <button
                      onClick={() => {setCheckIn(""); setCheckOut("");}}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  
                  {/* Interactive Guide */}
                  {!checkIn && !checkOut && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 animate-in fade-in duration-500">
                      <p className="text-sm text-blue-700 flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        Click any available date below to start your booking
                      </p>
                    </div>
                  )}
                  
                  {checkIn && !checkOut && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 animate-in slide-in-from-top duration-300">
                      <p className="text-sm text-amber-700 flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Great! Now select your check-out date
                      </p>
                    </div>
                  )}
                </div>

                {/* Selected Dates Display */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 transition-all duration-300">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-3 transition-all duration-200 hover:shadow-sm">
                        <div className="flex items-center mb-2">
                          <Calendar className="w-4 h-4 text-blue-600 mr-2" />
                          <span className="text-sm font-medium text-gray-700">Check-in</span>
                        </div>
                        <div className="text-blue-600 font-semibold text-sm">
                          {checkIn ? new Date(checkIn).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          }) : 'Tap calendar'}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 transition-all duration-200 hover:shadow-sm">
                        <div className="flex items-center mb-2">
                          <Calendar className="w-4 h-4 text-blue-600 mr-2" />
                          <span className="text-sm font-medium text-gray-700">Check-out</span>
                        </div>
                        <div className="text-blue-600 font-semibold text-sm">
                          {checkOut ? new Date(checkOut).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          }) : 'Tap calendar'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Indicator */}
                    <div className="bg-white rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">Booking Progress</span>
                        <span className="text-xs text-gray-500">
                          {checkIn && checkOut ? 'Complete' : checkIn ? '50%' : '0%'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500 ${
                            checkIn && checkOut ? 'w-full' : checkIn ? 'w-1/2' : 'w-0'
                          }`}
                        ></div>
                      </div>
                    </div>
                    
                    {checkIn && checkOut && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-center text-green-700">
                          <CheckCircle className="w-4 h-4 mr-2 animate-pulse" />
                          <span className="font-medium">{nights} night{nights !== 1 ? 's' : ''} selected</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Calendar Navigation */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => navigateMonth('prev')}
                      className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200 group"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transform group-hover:scale-110 transition-all duration-200" />
                    </button>
                    <h4 className="text-lg font-semibold text-gray-900 animate-in fade-in duration-300">
                      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </h4>
                    <button
                      onClick={() => navigateMonth('next')}
                      className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all duration-200 group"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transform group-hover:scale-110 transition-all duration-200" />
                    </button>
                  </div>

                  {/* Days of week header */}
                  <div className="grid grid-cols-7 mb-3">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="h-8 flex items-center justify-center text-xs font-semibold text-gray-500 bg-gray-50 rounded">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {renderCalendar()}
                  </div>

                  {/* Legend */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center justify-center">
                        <div className="w-3 h-3 bg-blue-600 rounded-full mr-1.5 shadow-sm"></div>
                        <span className="text-gray-700 font-medium">Selected</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="w-3 h-3 bg-blue-100 rounded-full mr-1.5"></div>
                        <span className="text-gray-700 font-medium">In Range</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="w-3 h-3 bg-red-100 rounded-full mr-1.5"></div>
                        <span className="text-gray-700 font-medium">Booked</span>
                      </div>
                    </div>
                  </div>
                </div>

                {validationErrors.checkIn && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center text-red-800">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      <span className="text-sm">{validationErrors.checkIn}</span>
                    </div>
                  </div>
                )}

                {validationErrors.checkOut && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center text-red-800">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      <span className="text-sm">{validationErrors.checkOut}</span>
                    </div>
                  </div>
                )}
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

            {/* Tablet Layout - 2 Columns: 60% Calendar, 40% Preferences */}
            <div className="hidden md:grid lg:hidden gap-8" style={{ gridTemplateColumns: '60% 40%' }}>
              {/* Left: Advanced Calendar Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                    Select Your Dates
                    {isCheckingAvailability && <Clock className="w-4 h-4 ml-2 animate-spin text-blue-600" />}
                  </h3>
                  <button
                    onClick={() => {setCheckIn(""); setCheckOut("");}}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Clear
                  </button>
                </div>

                {/* Selected Dates Display */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 transition-all duration-300">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-3 transition-all duration-200 hover:shadow-sm">
                        <div className="flex items-center mb-2">
                          <Calendar className="w-4 h-4 text-blue-600 mr-2" />
                          <span className="text-sm font-medium text-gray-700">Check-in</span>
                        </div>
                        <div className="text-blue-600 font-semibold text-sm">
                          {checkIn ? new Date(checkIn).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          }) : 'Tap calendar'}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 transition-all duration-200 hover:shadow-sm">
                        <div className="flex items-center mb-2">
                          <Calendar className="w-4 h-4 text-blue-600 mr-2" />
                          <span className="text-sm font-medium text-gray-700">Check-out</span>
                        </div>
                        <div className="text-blue-600 font-semibold text-sm">
                          {checkOut ? new Date(checkOut).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          }) : 'Tap calendar'}
                        </div>
                      </div>
                    </div>
                    {checkIn && checkOut && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-center text-green-700">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          <span className="font-medium">{nights} night{nights !== 1 ? 's' : ''} selected</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Calendar Navigation */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => navigateMonth('prev')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </h4>
                    <button
                      onClick={() => navigateMonth('next')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  {/* Days of week header */}
                  <div className="grid grid-cols-7 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {renderCalendar()}
                  </div>

                  {/* Legend */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-xs">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-600 rounded mr-2"></div>
                        <span className="text-gray-600">Selected</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-100 rounded mr-2"></div>
                        <span className="text-gray-600">In Range</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-100 rounded mr-2"></div>
                        <span className="text-gray-600">Booked</span>
                      </div>
                    </div>
                  </div>
                </div>

                {(validationErrors.checkIn || validationErrors.checkOut) && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center text-red-800">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      <span className="text-sm">
                        {validationErrors.checkIn || validationErrors.checkOut}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Guests/Pets + Price (Vertical Stack) */}
              <div className="space-y-6">
                {/* Guests & Pets */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900">Preferences</h3>
                  
                  {/* Guests */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-blue-50 p-2 rounded-lg mr-3">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <span className="text-gray-900 font-medium">Guests</span>
                          <p className="text-xs text-gray-500">Maximum 5 guests</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setGuests(Math.max(1, guests - 1))}
                          disabled={guests <= 1}
                          className="w-9 h-9 rounded-full border-2 border-blue-200 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 transform hover:scale-105 active:scale-95"
                        >
                          <Minus className="w-4 h-4 text-blue-600" />
                        </button>
                        <div className="bg-blue-50 rounded-lg px-3 py-1 min-w-[3rem] text-center">
                          <span className="text-lg font-bold text-blue-700">{guests}</span>
                        </div>
                        <button
                          onClick={() => setGuests(Math.min(5, guests + 1))}
                          disabled={guests >= 5}
                          className="w-9 h-9 rounded-full border-2 border-blue-200 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 transform hover:scale-105 active:scale-95"
                        >
                          <Plus className="w-4 h-4 text-blue-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Pets */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-orange-50 p-2 rounded-lg mr-3">
                          <PawPrint className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <span className="text-gray-900 font-medium">Bringing pets?</span>
                          <p className="text-xs text-gray-500">Pet-friendly accommodation</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={hasPet}
                          onChange={(e) => setHasPet(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-blue-600 group-hover:shadow-md transition-all duration-200"></div>
                      </label>
                    </div>
                    {hasPet && (
                      <div className="mt-3 pt-3 border-t border-gray-100 animate-in slide-in-from-top-2 duration-300">
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                          <p className="text-sm text-orange-700 font-medium flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Additional €20 pet fee applies
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price Summary */}
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-2xl border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-center mb-6">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="text-3xl font-bold text-gray-900 animate-in zoom-in duration-300">
                        €{discountedPrice.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">per night</div>
                      {hasDiscount && (
                        <div className="mt-1">
                          <span className="text-xs text-gray-400 line-through">€{basePrice.toFixed(2)}</span>
                          <span className="ml-2 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                            {nights >= 7 ? '10% OFF' : '5% OFF'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="bg-white rounded-lg p-3 space-y-2">
                      <div className="flex justify-between text-sm text-gray-700">
                        <span>€{discountedPrice.toFixed(2)} × {nights} night{nights !== 1 ? 's' : ''}</span>
                        <span className="font-medium">€{(discountedPrice * nights).toFixed(2)}</span>
                      </div>
                      {hasDiscount && (
                        <div className="flex justify-between text-sm text-green-600 animate-in slide-in-from-right duration-300">
                          <span>Discount savings</span>
                          <span className="font-medium">-€{discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm text-gray-700">
                        <span>Cleaning fee</span>
                        <span className="font-medium">€{cleaningFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-700">
                        <span>Service fee</span>
                        <span className="font-medium">€{serviceFee.toFixed(2)}</span>
                      </div>
                      {hasPet && (
                        <div className="flex justify-between text-sm text-orange-600 animate-in slide-in-from-right duration-300">
                          <span className="flex items-center">
                            <PawPrint className="w-3 h-3 mr-1" />
                            Pet fee
                          </span>
                          <span className="font-medium">€{petFee.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                      <div className="flex justify-between font-bold text-lg text-green-800">
                        <span>Total</span>
                        <span className="animate-in zoom-in duration-300">€{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95" asChild>
                    <a href="/api/login" className="flex items-center justify-center">
                      <Lock className="w-4 h-4 mr-2" />
                      Reserve Now
                    </a>
                  </Button>
                  
                  <p className="text-xs text-gray-500 text-center mt-3 flex items-center justify-center">
                    <Shield className="w-3 h-3 mr-1" />
                    Secure booking - You won't be charged yet
                  </p>
                </div>
              </div>
            </div>

            {/* Desktop Layout - Tablet-like for medium screens, full desktop for XL+ */}
            <div className="hidden lg:grid gap-8 lg:grid-cols-5 xl:grid-cols-12">
              {/* Column 1: Advanced Calendar Section - 60% on tablet-like, 50% on XL+ */}
              <div className="lg:col-span-3 xl:col-span-6 space-y-6">
                <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                        Select Dates
                        {isCheckingAvailability && <Clock className="w-4 h-4 ml-2 animate-spin text-blue-600" />}
                      </h3>
                      <button
                        onClick={() => {setCheckIn(""); setCheckOut("");}}
                        className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Clear
                      </button>
                    </div>

                    {/* Selected Dates Display */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 transition-all duration-300">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white rounded-lg p-3 transition-all duration-200 hover:shadow-sm">
                            <div className="flex items-center mb-2">
                              <Calendar className="w-4 h-4 text-blue-600 mr-2" />
                              <span className="text-sm font-medium text-gray-700">Check-in</span>
                            </div>
                            <div className="text-blue-600 font-semibold text-sm">
                              {checkIn ? formatDateDisplay(checkIn) : 'Select date'}
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-3 transition-all duration-200 hover:shadow-sm">
                            <div className="flex items-center mb-2">
                              <Calendar className="w-4 h-4 text-blue-600 mr-2" />
                              <span className="text-sm font-medium text-gray-700">Check-out</span>
                            </div>
                            <div className="text-blue-600 font-semibold text-sm">
                              {checkOut ? formatDateDisplay(checkOut) : 'Select date'}
                            </div>
                          </div>
                        </div>
                        {checkIn && checkOut && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center justify-center text-green-700">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              <span className="font-medium">{nights} night{nights !== 1 ? 's' : ''} selected</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Calendar Navigation */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={() => navigateMonth('prev')}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </h4>
                        <button
                          onClick={() => navigateMonth('next')}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>

                      {/* Days of week header */}
                      <div className="grid grid-cols-7 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {renderCalendar()}
                      </div>

                      {/* Legend */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between text-xs">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-600 rounded mr-2"></div>
                            <span className="text-gray-600">Selected</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-100 rounded mr-2"></div>
                            <span className="text-gray-600">In Range</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-100 rounded mr-2"></div>
                            <span className="text-gray-600">Unavailable</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {(validationErrors.checkIn || validationErrors.checkOut) && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center text-red-800">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          <span className="text-sm">
                            {validationErrors.checkIn || validationErrors.checkOut}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

              {/* Column 2: Combined Guests & Price Section - 40% on tablet-like, split on XL+ */}
              <div className="lg:col-span-2 xl:col-span-3 space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Guests & Pets</h3>
                
                {/* Guests */}
                <div className="space-y-4">
                  <div className="border border-gray-300 rounded-xl bg-gray-50">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center">
                        <Users className="w-5 h-5 text-gray-500 mr-3" />
                        <div>
                          <span className="text-gray-700 font-medium">Guests</span>
                          <p className="text-xs text-gray-500">Max 5</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleGuestChange(-1)}
                          disabled={guests <= 1}
                          className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white hover:border-blue-400 transition-all duration-200"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="min-w-[2rem] text-center">
                          <span className="text-lg font-bold text-gray-900">{guests}</span>
                        </div>
                        <button
                          onClick={() => handleGuestChange(1)}
                          disabled={guests >= 5}
                          className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white hover:border-blue-400 transition-all duration-200"
                        >
                          <Plus className="w-4 h-4" />
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
                          <span className="text-gray-700 font-medium">Pets</span>
                          <p className="text-xs text-gray-500">€20 fee</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasPet}
                          onChange={(e) => setHasPet(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>
                    {hasPet && (
                      <div className="px-4 pb-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                          <p className="text-green-800 text-sm">Pet fee included</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price Breakdown for tablet-like layout (LG screens) */}
                <div className="xl:hidden space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 relative overflow-hidden">
                    <div className="text-center mb-4">
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
                  </div>
                </div>
              </div>

              {/* Column 3: Price Breakdown - Hidden on tablet-like, shown on XL+ */}
              <div className="hidden xl:block xl:col-span-3 space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Price Breakdown</h3>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 relative overflow-hidden">
                  <div className="text-center mb-4">
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
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      {/* About This Space Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            About This Space
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Experience authentic Venetian luxury in the heart of the floating city
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Property Overview */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description Card */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-start mb-6">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                  <Building className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">All'Arco Apartment</h3>
                  <p className="text-blue-600 font-medium">Historic Venice Center</p>
                </div>
              </div>
              
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Welcome to All'Arco Apartment, a meticulously restored 2-bedroom sanctuary that captures the timeless elegance of Venice. Nestled just steps from the iconic St. Mark's Square, this exquisite retreat seamlessly blends centuries-old Venetian charm with contemporary luxury.
                </p>
                
                <p>
                  Featuring authentic Venetian architecture, a fully equipped gourmet kitchen, and an enchanting private balcony with canal views, this apartment offers an unparalleled Venice experience. Perfectly positioned for cultural immersion, with world-renowned museums, acclaimed restaurants, and historic landmarks all within a leisurely stroll.
                </p>
              </div>
            </div>

            {/* Key Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                  <Bed className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">2 Bedrooms</h4>
                <p className="text-sm text-gray-600">Sleeps up to 5 guests comfortably</p>
              </div>
              
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-4">
                  <Building2 className="w-5 h-5 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">3rd Floor</h4>
                <p className="text-sm text-gray-600">Historic building with authentic charm</p>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 h-full">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mr-4">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Premium Amenities</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                    <Wifi className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">High-Speed WiFi</p>
                    <p className="text-xs text-gray-600">Complimentary throughout</p>
                  </div>
                </div>

                <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center mr-3">
                    <Utensils className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Gourmet Kitchen</p>
                    <p className="text-xs text-gray-600">Fully equipped for cooking</p>
                  </div>
                </div>

                <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center mr-3">
                    <Tv className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Smart Entertainment</p>
                    <p className="text-xs text-gray-600">Premium streaming access</p>
                  </div>
                </div>

                <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center mr-3">
                    <Thermometer className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Climate Control</p>
                    <p className="text-xs text-gray-600">Air conditioning & heating</p>
                  </div>
                </div>

                <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                    <Car className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Parking Available</p>
                    <p className="text-xs text-gray-600">Nearby secured options</p>
                  </div>
                </div>

                <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center mr-3">
                    <Key className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Seamless Check-in</p>
                    <p className="text-xs text-gray-600">Self-service convenience</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="bg-gray-50 p-8 rounded-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Verified Property</h4>
              <p className="text-sm text-gray-600">Licensed & insured accommodation</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Quality Assured</h4>
              <p className="text-sm text-gray-600">Premium certified standards</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">24/7 Support</h4>
              <p className="text-sm text-gray-600">Always available to help</p>
            </div>
          </div>
        </div>
      </section>
      {/* Guest Reviews Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-gray-50">
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full mb-6">
            <Star className="w-5 h-5 mr-2" />
            <span className="font-semibold">Guest Reviews</span>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            What our guests say about their Venice experience
          </p>
        </div>

        {/* Overall Rating Section */}
        <div className="bg-white rounded-2xl p-8 mb-12 shadow-lg border border-gray-200">
          <div className="flex items-center mb-8">
            <Star className="w-6 h-6 text-yellow-500 mr-3 fill-current" />
            <h3 className="text-xl font-bold text-gray-900">Overall Rating</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Cleanliness */}
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-8 h-8 text-yellow-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Cleanliness</h4>
              <div className="flex justify-center mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${star <= 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="text-lg font-bold text-gray-900">4.9</span>
            </div>

            {/* Price Value */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">€</span>
                </div>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Price Value</h4>
              <div className="flex justify-center mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${star <= 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="text-lg font-bold text-gray-900">4.8</span>
            </div>

            {/* WiFi Quality */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Wifi className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">WiFi Quality</h4>
              <div className="flex justify-center mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${star <= 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="text-lg font-bold text-gray-900">4.9</span>
            </div>

            {/* Response Time */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Response Time</h4>
              <div className="flex justify-center mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${star <= 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="text-lg font-bold text-gray-900">4.7</span>
            </div>
          </div>
        </div>

        {/* Recent Reviews Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <div className="flex items-center mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Recent Reviews</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Review 1 */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900">Sarah M.</h4>
                  <p className="text-sm text-gray-600">London, UK</p>
                </div>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-4 h-4 text-yellow-400 fill-current"
                    />
                  ))}
                  <span className="text-xs text-gray-500 ml-2">December 2024</span>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                "Absolutely magical! The apartment exceeded all expectations. Perfect location steps from St. Mark's Square, immaculate cleanliness, and Marco was incredibly responsive. The balcony view was breathtaking!"
              </p>
            </div>

            {/* Review 2 */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900">James R.</h4>
                  <p className="text-sm text-gray-600">New York, USA</p>
                </div>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-4 h-4 text-yellow-400 fill-current"
                    />
                  ))}
                  <span className="text-xs text-gray-500 ml-2">November 2024</span>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                "Outstanding Venice experience! The apartment is beautifully restored with authentic Venetian charm. Kitchen was fully equipped, WiFi excellent, and the location unbeatable. Highly recommend!"
              </p>
            </div>

            {/* Review 3 */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900">Emma L.</h4>
                  <p className="text-sm text-gray-600">Sydney, Australia</p>
                </div>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-4 h-4 text-yellow-400 fill-current"
                    />
                  ))}
                  <span className="text-xs text-gray-500 ml-2">October 2024</span>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                "Perfect romantic getaway! The apartment combines historic charm with modern comfort. Amazing canal views, spotless condition, and Marco provided excellent local recommendations."
              </p>
            </div>

            {/* Review 4 */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900">David K.</h4>
                  <p className="text-sm text-gray-600">Toronto, Canada</p>
                </div>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-4 h-4 text-yellow-400 fill-current"
                    />
                  ))}
                  <span className="text-xs text-gray-500 ml-2">September 2024</span>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                "Exceptional stay in Venice! The apartment is a true gem with authentic details and all modern amenities. Prime location made exploring effortless. Communication was prompt and helpful throughout."
              </p>
            </div>
          </div>

          {/* View More Reviews Button */}
          <div className="text-center mt-8">
            <Button variant="outline" className="px-8 py-3">
              View All Reviews
            </Button>
          </div>
        </div>
      </section>
      {/* Advanced Call to Action */}
      <section className="relative py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-6xl mx-auto">
          {/* Main Content */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Ready to Book Your
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent block sm:inline sm:ml-3">
                Perfect Stay?
              </span>
            </h2>
            
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Join thousands of satisfied guests who have made All'arco their home away from home. 
              Experience luxury, comfort, and unforgettable memories in the heart of the city.
            </p>

            {/* Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 max-w-2xl mx-auto">
              <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="text-2xl font-bold text-primary mb-1">4.9★</div>
                <div className="text-sm text-gray-600">Guest Rating</div>
              </div>
              <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="text-2xl font-bold text-primary mb-1">2,400+</div>
                <div className="text-sm text-gray-600">Happy Guests</div>
              </div>
              <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="text-2xl font-bold text-primary mb-1">24/7</div>
                <div className="text-sm text-gray-600">Support</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="group bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => {
                  const bookingSection = document.querySelector('#booking-section');
                  if (bookingSection) {
                    bookingSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <span>Book Your Stay Now</span>
                <Calendar className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="group border-2 border-gray-300 hover:border-primary hover:bg-primary/5 text-gray-700 hover:text-primary px-8 py-4 text-lg font-medium rounded-xl transition-all duration-300"
                asChild
              >
                <a href="#about" className="flex items-center space-x-2">
                  <span>Learn More</span>
                  <Info className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                </a>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-10 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">Trusted by guests worldwide</p>
              <div className="flex flex-wrap justify-center items-center gap-6 opacity-60">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-gray-700">Verified Property</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-gray-700">Secure Booking</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-medium text-gray-700">Instant Confirmation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Support Column */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
              <ul className="space-y-3 text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Safety information</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Cancellation options</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Report a problem</a></li>
              </ul>
            </div>

            {/* Community Column */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Community</h4>
              <ul className="space-y-3 text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">All'Arco.com</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Referral program</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Venice guide</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Guest stories</a></li>
              </ul>
            </div>

            {/* Hosting Column */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Hosting</h4>
              <ul className="space-y-3 text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">Host your home</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Host resources</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Community forum</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Hosting tips</a></li>
              </ul>
            </div>

            {/* All'Arco Column */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">All'Arco</h4>
              <ul className="space-y-3 text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">Newsroom</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Learn about new features</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Letter from our founders</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Careers</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 text-sm text-gray-600">
              <span>&copy; 2024 All'Arco, Inc.</span>
              <span className="hidden md:inline">·</span>
              <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
              <span className="hidden md:inline">·</span>
              <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
              <span className="hidden md:inline">·</span>
              <a href="#" className="hover:text-gray-900 transition-colors">Sitemap</a>
            </div>

            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-sm text-gray-600">English (US)</span>
              <span className="text-sm text-gray-600">€ EUR</span>
            </div>
          </div>
        </div>
      </footer>
      {/* Chat Popup */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-all duration-200 z-50"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
      {isChatOpen && (
        <div className="fixed bottom-6 right-6 w-80 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Chat Header */}
          <div className="bg-primary text-primary-foreground p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/80 rounded-full flex items-center justify-center text-sm font-semibold">
                  AA
                </div>
                <div>
                  <h3 className="font-semibold">All'Arco Apartment</h3>
                  <div className="flex items-center space-x-2 text-sm opacity-90">
                    <Lock className="w-3 h-3" />
                    <span>End-to-end encrypted</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-secondary rounded-full"></div>
                      <span>Online</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="text-primary-foreground/80 hover:text-primary-foreground text-sm">
                  End Chat
                </button>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="text-primary-foreground/80 hover:text-primary-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Chat Content */}
          <div className="p-4 bg-gray-50 min-h-64">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-sm font-semibold text-primary-foreground">
                AA
              </div>
              <div className="flex-1">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-gray-800">
                    👋 Welcome to All'Arco Apartment! How can we help you today?
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-1">All'Arco Staff • now</p>
              </div>
            </div>
          </div>

          {/* Chat Input Form */}
          <div className="p-4 border-t bg-white space-y-3">
            <input
              type="text"
              placeholder="Your name"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <input
              type="email"
              placeholder="Your email"
              value={chatEmail}
              onChange={(e) => setChatEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              onClick={() => {
                // Handle chat start - for now just close the popup
                setIsChatOpen(false);
                setChatName("");
                setChatEmail("");
              }}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Start Chatting
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
