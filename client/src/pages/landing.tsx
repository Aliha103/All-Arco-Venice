import { useState, useEffect, useRef } from "react"
import { Link, useLocation } from "wouter"
import { useQuery, useMutation } from "@tanstack/react-query"
import Header from "@/components/header"
import ImageGalleryModal from "@/components/image-gallery-modal"
import { apiRequest } from "@/lib/queryClient"
import { Calendar } from "@/components/advanced-calendar"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import {
  Star,
  MapPin,
  Users,
  User,
  PawPrint,
  Minus,
  Plus,
  CheckCircle,
  Lock,
  AlertCircle,
  Clock,
  MessageCircle,
  Car,
  Wifi,
  Utensils,
  Bed,
  Bath,
  Tv,
  Thermometer,
  Key,
  Sparkles,
  LogIn,
  UserPlus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Calendar as AdvancedCalendar,
  validateStayRange,
} from "@/components/advanced-calendar"
import { DateRange as ReactDateRange } from "react-day-picker"
import { format } from "date-fns"

/**
 * Landing page – complete UI with hero, booking, amenities, reviews & footer.
 */
interface HeroImage {
  id: number;
  url: string;
  title: string;
  alt: string;
  position: string;
  isActive: boolean;
  displayOrder: number;
}

export default function Landing() {
  /* ------------------------------------------------------------------ */
  //  Authentication and Toast
  /* ------------------------------------------------------------------ */
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Check if user is admin
  const isAdmin = user?.email === 'admin@allarco.com';

  /* ------------------------------------------------------------------ */
  //  Data queries
  /* ------------------------------------------------------------------ */
  const { data: heroImages } = useQuery<HeroImage[]>({
    queryKey: ["/api/hero-images/active"],
    retry: false,
  });

  // Fetch pricing settings from database
  const { data: pricingSettings } = useQuery<{
    basePrice: number;
    cleaningFee: number;
    petFee: number;
    discountWeekly: number;
    discountMonthly: number;
  }>({
    queryKey: ["/api/pricing-settings"],
    retry: false,
  });

  // Get all active images sorted by display order
  const activeImages = heroImages?.filter(img => img.isActive).sort((a, b) => a.displayOrder - b.displayOrder) || [];
  
  // Use the first 5 images for the gallery layout
  const galleryImages = activeImages.slice(0, 5);
  const [mainImage, ...smallImages] = galleryImages;

  /* ------------------------------------------------------------------ */
  //  Modal state
  /* ------------------------------------------------------------------ */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialIndex, setModalInitialIndex] = useState(0);

  // Calculate pricing when dates or guest details change
  const calculatePricingMutation = useMutation({
    mutationFn: async (params: { checkInDate: string; checkOutDate: string; guests: number; hasPet: boolean; referralCode?: string }) => {
      const response = await apiRequest('POST', '/api/bookings/calculate-pricing', params);
      return response.json();
    }
  });

  const [, setLocation] = useLocation();

  // Enhanced validation for Reserve Now button
  const isValidBooking = () => {
    // Must have both dates selected and no validation errors
    return checkIn && checkOut && Object.keys(validationErrors).length === 0;
  };

  const handleReserveNow = async () => {
    // Check if user is admin and prevent booking
    if (isAdmin) {
      toast({
        title: "Admin Access Restricted",
        description: "To create bookings, please use the Admin Dashboard. This booking interface is for guest viewing only.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidBooking()) return;

    try {
      // Calculate pricing first
      const pricing = await calculatePricingMutation.mutateAsync({
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guests,
        hasPet,
      });

      // Store booking details and navigate to booking page
      const bookingDetails = {
        checkIn,
        checkOut,
        guests,
        hasPet,
        pricing
      };
      
      localStorage.setItem('bookingDetails', JSON.stringify(bookingDetails));
      setLocation('/booking');
    } catch (error) {
      console.error('Failed to calculate pricing:', error);
    }
  };

  const openModal = (index: number) => {
    setModalInitialIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  /* ------------------------------------------------------------------ */
  //  Mobile carousel state
  /* ------------------------------------------------------------------ */
  const [currentMobileIndex, setCurrentMobileIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const goToNextMobile = () => {
    setCurrentMobileIndex((prev) => (prev + 1) % activeImages.length);
  };

  const goToPrevMobile = () => {
    setCurrentMobileIndex((prev) => (prev - 1 + activeImages.length) % activeImages.length);
  };

  // Touch handlers for swipe functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0); // Reset touchEnd
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && activeImages.length > 1) {
      goToNextMobile();
    }
    if (isRightSwipe && activeImages.length > 1) {
      goToPrevMobile();
    }
  };

  /* ------------------------------------------------------------------ */
  //  Booking state
  /* ------------------------------------------------------------------ */
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [guests, setGuests] = useState(2)
  const [hasPet, setHasPet] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)
  const [lastAvailabilityCheck, setLastAvailabilityCheck] = useState(0)

  // Real-time booking data with 100ms refresh
  const { data: blockedDatesData } = useQuery<string[]>({
    queryKey: ["/api/bookings/dates"],
    refetchInterval: 100, // 100ms refresh for real-time updates
    staleTime: 0, // Always consider data stale for real-time updates
  });

  // Convert blocked date strings to Date objects for calendar
  const bookedCheckInDates = blockedDatesData?.map(dateStr => new Date(dateStr)) || [];

  /* ------------------------------------------------------------------ */
  //  Calendar wiring
  /* ------------------------------------------------------------------ */
  const handleValidRangeSelect = (range: ReactDateRange) => {
    if (range.from) setCheckIn(format(range.from, "yyyy-MM-dd"))
    if (range.to) setCheckOut(format(range.to, "yyyy-MM-dd"))
  }

  /* ------------------------------------------------------------------ */
  //  Validation + mock availability
  /* ------------------------------------------------------------------ */
  const RATE_LIMIT_MS = 2000
  useEffect(() => {
    if (!checkIn || !checkOut) return setValidationErrors({})
    const verdict = validateStayRange({ from:new Date(checkIn), to:new Date(checkOut) }, bookedCheckInDates, { maxStayDays:15 })
    setValidationErrors(verdict.valid ? {} : { checkOut: verdict.reason! })
    if (verdict.valid && Date.now()-lastAvailabilityCheck>RATE_LIMIT_MS) {
      setIsCheckingAvailability(true)
      setLastAvailabilityCheck(Date.now())
      setTimeout(()=>setIsCheckingAvailability(false),800)
    }
  },[checkIn,checkOut])

  /* ------------------------------------------------------------------ */
  //  Pricing helpers - use database settings with fallbacks
  /* ------------------------------------------------------------------ */
  const base = pricingSettings?.basePrice || 110.5;
  const cleaningFee = pricingSettings?.cleaningFee || 25;
  const petFee = pricingSettings?.petFee || 25;
  const service = 15;
  const nights=(!checkIn||!checkOut)?1:Math.max(1,(new Date(checkOut).getTime()-new Date(checkIn).getTime())/86_400_000)
  
  // Use dynamic cleaning fee from database
  const clean = cleaningFee;
  
  // Discount system: use database settings
  const weeklyDiscount = pricingSettings?.discountWeekly || 5;
  const monthlyDiscount = pricingSettings?.discountMonthly || 10;
  
  const getDiscount = (nights: number) => {
    if (nights >= 14) return monthlyDiscount / 100; // Monthly discount for 14+ days
    if (nights >= 7) return weeklyDiscount / 100;   // Weekly discount for 7+ days
    return 0;
  }
  
  const discount = getDiscount(nights)
  const discNight = base * (1 - discount)
  
  // Use dynamic pet fee from database
  const pet = hasPet ? petFee : 0
  const total=discNight*nights+clean+service+pet

  /* ------------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Use the proper Header component with authentication */}
      <Header />
      {/* —— Hero —— */}
      <section className="bg-white px-4 py-10 sm:py-14 pl-[10px] pr-[10px]">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">All'Arco Apartment – Heart of Venice</h1>
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-6">
            <span className="flex items-center space-x-1"><Star className="w-4 h-4 text-yellow-400 fill-current" /><span>4.89</span><span>·</span><span>127 reviews</span></span>
            <span className="flex items-center space-x-1"><MapPin className="w-4 h-4" /><span>Venice, Italy</span></span>
          </div>
          {/* Property Images Gallery */}
          <div className="relative">
            {/* Desktop Layout */}
            <div className="hidden md:grid md:grid-cols-4 md:grid-rows-2 gap-2 h-96 rounded-xl overflow-hidden">
              {/* Main large image - spans 2 columns and 2 rows */}
              <div className="col-span-2 row-span-2 relative cursor-pointer" onClick={() => openModal(0)}>
                {mainImage ? (
                  <img 
                    src={mainImage.url} 
                    alt={mainImage.alt}
                    className="w-full h-full object-cover hover:opacity-95 transition-opacity duration-200"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                    Main Bedroom
                  </div>
                )}
              </div>
              
              {/* Right side images - display uploaded images */}
              {smallImages.map((image, index) => {
                const isTopRight = index === 1;
                const isBottomRight = index === 3;
                const cornerClass = isTopRight ? "rounded-tr-xl" : isBottomRight ? "rounded-br-xl" : "";
                const galleryIndex = index + 1; // +1 because main image is index 0
                
                return (
                  <div key={image.id} className="relative cursor-pointer" onClick={() => openModal(galleryIndex)}>
                    <img 
                      src={image.url} 
                      alt={image.alt}
                      className={`w-full h-full object-cover hover:opacity-95 transition-opacity duration-200 ${cornerClass}`}
                    />
                    {/* Photos counter overlay on last image */}
                    {index === 3 && activeImages.length > 5 && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="bg-white text-black px-4 py-2 rounded-lg font-medium text-sm shadow-lg hover:bg-gray-100 transition-colors cursor-pointer">
                          +{activeImages.length - 5} photos
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Fill remaining slots with placeholders if needed */}
              {smallImages.length < 4 && [...Array(4 - smallImages.length)].map((_, index) => {
                const actualIndex = smallImages.length + index;
                const isTopRight = actualIndex === 1;
                const isBottomRight = actualIndex === 3;
                const cornerClass = isTopRight ? "rounded-tr-xl" : isBottomRight ? "rounded-br-xl" : "";
                const placeholderColors = [
                  "bg-green-100 text-green-600", // Kitchen
                  "bg-blue-100 text-blue-600",  // Living Room  
                  "bg-yellow-100 text-yellow-600", // Balcony
                  "bg-purple-100 text-purple-600"  // Bathroom
                ];
                const placeholderTexts = ["Kitchen", "Living Room", "Balcony", "Bathroom"];
                
                return (
                  <div key={`placeholder-${index}`} className={`relative w-full h-full flex items-center justify-center text-sm ${placeholderColors[actualIndex]} ${cornerClass}`}>
                    {placeholderTexts[actualIndex]}
                  </div>
                );
              })}
            </div>

            {/* Mobile Layout - Swipeable Carousel */}
            <div 
              className="md:hidden relative h-64 rounded-xl overflow-hidden transform transition-all duration-200 active:scale-[0.98]"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Image Container */}
              <div 
                className="relative w-full h-full flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${currentMobileIndex * 100}%)` }}
              >
                {activeImages.map((image, index) => (
                  <div 
                    key={image.id} 
                    className="min-w-full h-full relative cursor-pointer transform transition-all duration-200 active:scale-95"
                    onClick={() => openModal(index)}
                  >
                    <img 
                      src={image.url} 
                      alt={image.alt}
                      className="w-full h-full object-cover transition-transform duration-300"
                    />
                    {/* Touch feedback overlay */}
                    <div className="absolute inset-0 bg-blue-500/0 active:bg-blue-500/10 transition-colors duration-150"></div>
                  </div>
                ))}
                {activeImages.length === 0 && (
                  <div className="min-w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 animate-pulse">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-2 animate-pulse"></div>
                      <span>Loading images...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Arrows with enhanced touch feedback */}
              {activeImages.length > 1 && (
                <>
                  <button
                    onClick={goToPrevMobile}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all duration-200 z-10 active:scale-90 active:bg-opacity-80"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={goToNextMobile}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all duration-200 z-10 active:scale-90 active:bg-opacity-80"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Enhanced Dots Indicator with haptic-like feedback */}
              {activeImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {activeImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentMobileIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 transform active:scale-125 ${
                        index === currentMobileIndex 
                          ? 'bg-white scale-110 shadow-lg' 
                          : 'bg-white bg-opacity-60 hover:bg-opacity-80'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Photo Counter with smooth animations */}
              <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-sm transition-all duration-300 transform hover:scale-105">
                <span className="transition-all duration-200">{currentMobileIndex + 1}</span> / {activeImages.length}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* —— Property Information Section —— */}
      <section className="bg-white px-4 py-8 transform transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          
          {/* Desktop Layout */}
          <div className="hidden lg:block">
            <div className="flex items-center justify-between mb-6">
              {/* Left: Host Info */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl xl:text-2xl font-semibold text-gray-900">
                    Entire apartment hosted by Fatima
                  </h2>
                  <div className="flex items-center space-x-4 text-gray-600 mt-1 text-sm xl:text-base">
                    <span className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span>Superhost</span>
                    </span>
                    <span>5+ years hosting</span>
                    <span>100+ reviews</span>
                  </div>
                </div>
              </div>
              
              {/* Middle: Property Details */}
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm xl:text-base">5 guests</div>
                    <div className="text-xs xl:text-sm text-gray-500">Maximum capacity</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Bed className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm xl:text-base">2 bedrooms</div>
                    <div className="text-xs xl:text-sm text-gray-500">Private spaces</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Key className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm xl:text-base">1 bathroom</div>
                    <div className="text-xs xl:text-sm text-gray-500">Full bathroom</div>
                  </div>
                </div>
              </div>
              
              {/* Right: Price */}
              <div className="text-right">
                <div className="text-xl xl:text-2xl font-semibold text-gray-900">€110.50 <span className="text-base xl:text-lg font-normal">/night</span></div>
                <div className="flex items-center justify-end space-x-1 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs xl:text-sm text-green-600">Available</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tablet Layout */}
          <div className="hidden md:block lg:hidden">
            <div className="space-y-6">
              {/* Host Info and Price Row */}
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Users className="w-7 h-7 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                      Entire apartment hosted by Fatima
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span>Superhost</span>
                      </span>
                      <span>5+ years hosting</span>
                      <span>100+ reviews</span>
                    </div>
                  </div>
                </div>
                
                {/* Property Details - Middle */}
                <div className="flex items-center space-x-4 px-6">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">5 guests</div>
                      <div className="text-xs text-gray-500">Maximum capacity</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Bed className="w-4 h-4 text-gray-600" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">2 bedrooms</div>
                      <div className="text-xs text-gray-500">Private spaces</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Key className="w-4 h-4 text-gray-600" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">1 bathroom</div>
                      <div className="text-xs text-gray-500">Full bathroom</div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg md:text-xl font-semibold text-gray-900">€{base.toFixed(2)} <span className="text-sm md:text-base font-normal">/night</span></div>
                  <div className="flex items-center justify-end space-x-1 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs md:text-sm text-green-600">Available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="block md:hidden">
            <div className="space-y-4">
              {/* Host Info and Price Row */}
              <div className="flex items-start justify-between transform transition-all duration-200 active:scale-[0.98]">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center transform transition-all duration-200 active:scale-95 active:bg-blue-200">
                    <Users className="w-6 h-6 text-blue-600 transition-transform duration-200" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 transition-colors duration-200">
                      Entire apartment hosted by Fatima
                    </h2>
                    <div className="flex items-center space-x-3 text-xs sm:text-sm text-gray-600">
                      <span className="flex items-center space-x-1 transform transition-all duration-200 active:scale-95">
                        <Star className="w-3 h-3 text-yellow-500 fill-current transition-transform duration-200 active:scale-110" />
                        <span>Superhost</span>
                      </span>
                      <span className="transition-colors duration-200 active:text-gray-800">5+ years hosting</span>
                      <span className="transition-colors duration-200 active:text-gray-800">100+ reviews</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-base sm:text-lg font-semibold text-gray-900 transition-all duration-200 active:scale-105">
                    €{base.toFixed(2)} <span className="text-xs sm:text-sm font-normal">/night</span>
                  </div>
                  <div className="flex items-center justify-end space-x-1 mt-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 transition-colors duration-200">Available</span>
                  </div>
                </div>
              </div>
              
              {/* Property Details Row with Enhanced Touch Feedback */}
              <div className="flex items-center space-x-6 pt-4 border-t border-gray-200 transition-all duration-200">
                <div className="flex items-center space-x-2 transform transition-all duration-200 active:scale-95 active:bg-gray-50 p-2 rounded-lg -m-2">
                  <Users className="w-4 h-4 text-gray-600 transition-transform duration-200 active:scale-110" />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm transition-colors duration-200">5 guests</div>
                    <div className="text-xs text-gray-500 transition-colors duration-200">Maximum capacity</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 transform transition-all duration-200 active:scale-95 active:bg-gray-50 p-2 rounded-lg -m-2">
                  <Bed className="w-4 h-4 text-gray-600 transition-transform duration-200 active:scale-110" />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm transition-colors duration-200">2 bedrooms</div>
                    <div className="text-xs text-gray-500 transition-colors duration-200">Private spaces</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 transform transition-all duration-200 active:scale-95 active:bg-gray-50 p-2 rounded-lg -m-2">
                  <Key className="w-4 h-4 text-gray-600 transition-transform duration-200 active:scale-110" />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm transition-colors duration-200">1 bathroom</div>
                    <div className="text-xs text-gray-500 transition-colors duration-200">Full bathroom</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* —— Booking Calendar Section —— */}
      <section className="bg-gray-50 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Book Your Stay</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Choose your dates and start planning your perfect getaway</p>
          </div>

          {/* Single Unified Booking Widget */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 pl-[10px] pr-[10px]">
            {/* Mobile: Stacked layout */}
            <div className="grid grid-cols-1 md:hidden gap-6">
              {/* Calendar Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CalendarIcon className="w-5 h-5 mr-2 text-blue-600" />
                    Select Dates
                  </h3>
                  <button 
                    onClick={() => {
                      setCheckIn('');
                      setCheckOut('');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Clear
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="border border-gray-300 rounded-lg p-3 bg-blue-50">
                    <div className="flex items-center mb-2">
                      <CalendarIcon className="w-4 h-4 mr-2 text-blue-600" />
                      <label className="block text-xs font-medium text-gray-700">Check-in</label>
                    </div>
                    <button className="w-full text-left text-sm font-medium text-blue-600">
                      {checkIn ? new Date(checkIn).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric'
                      }) : 'Select date'}
                    </button>
                  </div>
                  
                  <div className="border border-gray-300 rounded-lg p-3 bg-blue-50">
                    <div className="flex items-center mb-2">
                      <CalendarIcon className="w-4 h-4 mr-2 text-blue-600" />
                      <label className="block text-xs font-medium text-gray-700">Check-out</label>
                    </div>
                    <button className="w-full text-left text-sm font-medium text-blue-600">
                      {checkOut ? new Date(checkOut).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric'
                      }) : 'Select date'}
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <AdvancedCalendar
                    bookedCheckIns={bookedCheckInDates}
                    onValidRangeSelect={handleValidRangeSelect}
                    className="w-full"
                  />
                  
                  <div className="mt-4 flex justify-center items-center gap-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      <span className="text-gray-600">Selected</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-200 rounded-full"></div>
                      <span className="text-gray-600">In Range</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                      <span className="text-gray-600">Unavailable</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guests & Pets Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Guests & Pets</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 mr-2 text-gray-600" />
                      <div>
                        <div className="font-medium text-gray-900">Guests</div>
                        <div className="text-xs text-gray-500">Max 5</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-semibold text-gray-900 min-w-[20px] text-center">{guests}</span>
                      <button 
                        onClick={() => setGuests(Math.min(5, guests + 1))}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <PawPrint className="w-5 h-5 mr-2 text-gray-600" />
                      <div>
                        <div className="font-medium text-gray-900">Pets</div>
                        <div className="text-xs text-gray-500">€{petFee.toFixed(2)} fee</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setHasPet(!hasPet)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        hasPet ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          hasPet ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Price Breakdown Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Breakdown</h3>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    €{discNight.toFixed(2)}
                    {discount > 0 && <span className="text-sm text-gray-500 line-through ml-2">€{base.toFixed(2)}</span>}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    per night
                    {discount > 0 && <span className="text-green-600 ml-2">({(discount * 100).toFixed(0)}% off)</span>}
                  </div>
                  
                  {checkIn && checkOut && (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>€{base.toFixed(2)} × {nights} night{nights !== 1 ? 's' : ''}</span>
                        <span>€{(base * nights).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cleaning fee</span>
                        <span>€{cleaningFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service fee</span>
                        <span>€{service.toFixed(2)}</span>
                      </div>
                      {hasPet && (
                        <div className="flex justify-between">
                          <span>Pet fee</span>
                          <span>€{petFee.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-semibold">
                        <span>Total</span>
                        <span>€{(base * nights + cleaningFee + service + (hasPet ? petFee : 0)).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  disabled={!isValidBooking() || isAdmin}
                  onClick={handleReserveNow}
                  className={`w-full py-3 px-4 rounded-lg font-semibold mt-6 transition-all duration-200 ${
                    isAdmin 
                      ? 'bg-orange-100 border-2 border-orange-300 text-orange-700 cursor-not-allowed'
                      : isValidBooking()
                        ? 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-[1.02] active:scale-95'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isAdmin 
                    ? 'Admin View Only - Use Admin Dashboard to Book'
                    : !checkIn || !checkOut 
                      ? 'Select dates to continue' 
                      : Object.keys(validationErrors).length > 0 
                        ? 'Invalid date selection' 
                        : 'Reserve Now'}
                </button>
              </div>

              {!checkIn && !checkOut && !isAdmin && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  ⚠️ Check-in date is required
                </div>
              )}
              
              {isAdmin && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700">
                  ℹ️ Admin users can view booking interface but must use Admin Dashboard to create bookings
                </div>
              )}
            </div>

            {/* Tablet: 60% calendar, 40% booking controls */}
            <div className="hidden md:grid xl:hidden grid-cols-5 gap-8">
              {/* Calendar - 60% (3/5) */}
              <div className="col-span-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CalendarIcon className="w-5 h-5 mr-2 text-blue-600" />
                    Select Dates
                  </h3>
                  <button 
                    onClick={() => {
                      setCheckIn('');
                      setCheckOut('');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Clear
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="border border-gray-300 rounded-lg p-3 bg-blue-50">
                    <div className="flex items-center mb-2">
                      <CalendarIcon className="w-4 h-4 mr-2 text-blue-600" />
                      <label className="block text-xs font-medium text-gray-700">Check-in</label>
                    </div>
                    <button className="w-full text-left text-sm font-medium text-blue-600">
                      {checkIn ? new Date(checkIn).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric'
                      }) : 'Select date'}
                    </button>
                  </div>
                  
                  <div className="border border-gray-300 rounded-lg p-3 bg-blue-50">
                    <div className="flex items-center mb-2">
                      <CalendarIcon className="w-4 h-4 mr-2 text-blue-600" />
                      <label className="block text-xs font-medium text-gray-700">Check-out</label>
                    </div>
                    <button className="w-full text-left text-sm font-medium text-blue-600">
                      {checkOut ? new Date(checkOut).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric'
                      }) : 'Select date'}
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <AdvancedCalendar
                    bookedCheckIns={bookedCheckInDates}
                    onValidRangeSelect={handleValidRangeSelect}
                    className="w-full"
                  />
                  
                  <div className="mt-4 flex justify-center items-center gap-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      <span className="text-gray-600">Selected</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-200 rounded-full"></div>
                      <span className="text-gray-600">In Range</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                      <span className="text-gray-600">Unavailable</span>
                    </div>
                  </div>
                </div>

                {!checkIn && !checkOut && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mt-4">
                    ⚠️ Check-in date is required
                  </div>
                )}
              </div>

              {/* Booking Controls - 40% (2/5) */}
              <div className="col-span-2">
                <div className="space-y-6">
                  {/* Guests & Pets Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Guests & Pets</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Users className="w-5 h-5 mr-2 text-gray-600" />
                          <div>
                            <div className="font-medium text-gray-900">Guests</div>
                            <div className="text-xs text-gray-500">Max 5</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button 
                            onClick={() => setGuests(Math.max(1, guests - 1))}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-semibold text-gray-900 min-w-[20px] text-center">{guests}</span>
                          <button 
                            onClick={() => setGuests(Math.min(5, guests + 1))}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <PawPrint className="w-5 h-5 mr-2 text-gray-600" />
                          <div>
                            <div className="font-medium text-gray-900">Pets</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setHasPet(!hasPet)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            hasPet ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              hasPet ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Price Breakdown Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Breakdown</h3>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 mb-2">
                        €{discNight.toFixed(2)}
                        {discount > 0 && <span className="text-sm text-gray-500 line-through ml-2">€{base.toFixed(2)}</span>}
                      </div>
                      <div className="text-sm text-gray-600 mb-4">
                        per night
                        {discount > 0 && <span className="text-green-600 ml-2">({(discount * 100).toFixed(0)}% off)</span>}
                      </div>
                      
                      {checkIn && checkOut && (
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>€{discNight.toFixed(2)} × {nights} night{nights !== 1 ? 's' : ''}</span>
                            <span>€{(discNight * nights).toFixed(2)}</span>
                          </div>
                          {discount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Length of stay discount</span>
                              <span>-€{((base - discNight) * nights).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Cleaning fee</span>
                            <span>€{clean.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Service fee</span>
                            <span>€{service.toFixed(2)}</span>
                          </div>
                          {hasPet && (
                            <div className="flex justify-between">
                              <span>Pet fee</span>
                              <span>€{pet.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-semibold">
                            <span>Total</span>
                            <span>€{total.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button
                      disabled={!isValidBooking() || isAdmin}
                      onClick={handleReserveNow}
                      className={`w-full py-3 px-4 rounded-lg font-semibold mt-6 transition-all duration-200 ${
                        isAdmin 
                          ? 'bg-orange-100 border-2 border-orange-300 text-orange-700 cursor-not-allowed'
                          : isValidBooking()
                            ? 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-[1.02] active:scale-95'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isAdmin 
                        ? 'Admin View Only - Use Admin Dashboard to Book'
                        : !checkIn || !checkOut 
                          ? 'Select dates to continue' 
                          : Object.keys(validationErrors).length > 0 
                            ? 'Invalid date selection' 
                            : 'Reserve Now'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop: 50% calendar, 25% guests & pets, 25% price breakdown */}
            <div className="hidden xl:grid grid-cols-4 gap-8">
              {/* Calendar - 50% (2/4) */}
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CalendarIcon className="w-5 h-5 mr-2 text-blue-600" />
                    Select Dates
                  </h3>
                  <button 
                    onClick={() => {
                      setCheckIn('');
                      setCheckOut('');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Clear
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="border border-gray-300 rounded-lg p-3 bg-blue-50">
                    <div className="flex items-center mb-2">
                      <CalendarIcon className="w-4 h-4 mr-2 text-blue-600" />
                      <label className="block text-xs font-medium text-gray-700">Check-in</label>
                    </div>
                    <button className="w-full text-left text-sm font-medium text-blue-600">
                      {checkIn ? new Date(checkIn).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric'
                      }) : 'Select date'}
                    </button>
                  </div>
                  
                  <div className="border border-gray-300 rounded-lg p-3 bg-blue-50">
                    <div className="flex items-center mb-2">
                      <CalendarIcon className="w-4 h-4 mr-2 text-blue-600" />
                      <label className="block text-xs font-medium text-gray-700">Check-out</label>
                    </div>
                    <button className="w-full text-left text-sm font-medium text-blue-600">
                      {checkOut ? new Date(checkOut).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric'
                      }) : 'Select date'}
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <AdvancedCalendar
                    bookedCheckIns={bookedCheckInDates}
                    onValidRangeSelect={handleValidRangeSelect}
                    className="w-full"
                  />
                  
                  <div className="mt-4 flex justify-center items-center gap-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      <span className="text-gray-600">Selected</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-200 rounded-full"></div>
                      <span className="text-gray-600">In Range</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                      <span className="text-gray-600">Unavailable</span>
                    </div>
                  </div>
                </div>

                {!checkIn && !checkOut && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mt-4">
                    ⚠️ Check-in date is required
                  </div>
                )}
              </div>

              {/* Guests & Pets - 25% (1/4) */}
              <div className="col-span-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Guests & Pets</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 mr-2 text-gray-600" />
                      <div>
                        <div className="font-medium text-gray-900">Guests</div>
                        <div className="text-xs text-gray-500">Max 5</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-semibold text-gray-900 min-w-[20px] text-center">{guests}</span>
                      <button 
                        onClick={() => setGuests(Math.min(5, guests + 1))}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <PawPrint className="w-5 h-5 mr-2 text-gray-600" />
                      <div>
                        <div className="font-medium text-gray-900">Pets</div>
                        <div className="text-xs text-gray-500">€20 fee</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setHasPet(!hasPet)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        hasPet ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          hasPet ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Price Breakdown - 25% (1/4) */}
              <div className="col-span-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Breakdown</h3>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    €{discNight.toFixed(2)}
                    {discount > 0 && <span className="text-sm text-gray-500 line-through ml-2">€{base.toFixed(2)}</span>}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    per night
                    {discount > 0 && <span className="text-green-600 ml-2">({(discount * 100).toFixed(0)}% off)</span>}
                  </div>
                  
                  {checkIn && checkOut && (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>€{discNight.toFixed(2)} × {nights} night{nights !== 1 ? 's' : ''}</span>
                        <span>€{(discNight * nights).toFixed(2)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Length of stay discount</span>
                          <span>-€{((base - discNight) * nights).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Cleaning fee</span>
                        <span>€{clean.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service fee</span>
                        <span>€{service.toFixed(2)}</span>
                      </div>
                      {hasPet && (
                        <div className="flex justify-between">
                          <span>Pet fee</span>
                          <span>€{pet.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-semibold">
                        <span>Total</span>
                        <span>€{total.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  disabled={!isValidBooking()}
                  onClick={handleReserveNow}
                  className={`w-full py-3 px-4 rounded-lg font-semibold mt-6 transition-all duration-200 ${
                    isValidBooking()
                      ? 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-[1.02] active:scale-95'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {!checkIn || !checkOut ? 'Select dates to continue' : 
                   Object.keys(validationErrors).length > 0 ? 'Invalid date selection' : 'Reserve Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* —— Property Description —— */}
      <section className="bg-white px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Space</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Experience the elegance of Venice in our beautifully restored 16th-century apartment, located in the prestigious All'Arco district. This stunning 2-bedroom, 1-bathroom retreat offers an authentic Venetian experience with modern amenities and breathtaking canal views.
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                The apartment features original exposed wooden beams, hand-painted frescoes, and meticulously preserved architectural details that tell the story of Venice's rich history. The spacious living area flows seamlessly into a fully equipped modern kitchen, perfect for preparing meals with fresh ingredients from the nearby Rialto Market.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center space-x-2 transform transition-all duration-200 hover:scale-105 active:scale-95 p-3 rounded-lg hover:bg-blue-50 active:bg-blue-100">
                  <Bed className="w-5 h-5 text-blue-600 transition-transform duration-200 active:scale-110" />
                  <span className="transition-colors duration-200 active:text-blue-700">2 bedrooms</span>
                </div>
                <div className="flex items-center space-x-2 transform transition-all duration-200 hover:scale-105 active:scale-95 p-3 rounded-lg hover:bg-blue-50 active:bg-blue-100">
                  <Users className="w-5 h-5 text-blue-600 transition-transform duration-200 active:scale-110" />
                  <span className="transition-colors duration-200 active:text-blue-700">Sleeps up to 5 guests</span>
                </div>
                <div className="flex items-center space-x-2 transform transition-all duration-200 hover:scale-105 active:scale-95 p-3 rounded-lg hover:bg-blue-50 active:bg-blue-100">
                  <MapPin className="w-5 h-5 text-blue-600 transition-transform duration-200 active:scale-110" />
                  <span className="transition-colors duration-200 active:text-blue-700">2 min walk to Rialto Bridge</span>
                </div>
                <div className="flex items-center space-x-2 transform transition-all duration-200 hover:scale-105 active:scale-95 p-3 rounded-lg hover:bg-blue-50 active:bg-blue-100">
                  <Wifi className="w-5 h-5 text-blue-600 transition-transform duration-200 active:scale-110" />
                  <span className="transition-colors duration-200 active:text-blue-700">High-speed Wi-Fi</span>
                </div>
              </div>
            </div>


          </div>
        </div>
      </section>
      {/* —— Reviews Section —— */}
      <section className="bg-gray-50 px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Guest Reviews</h2>
            <div className="flex items-center justify-center space-x-4">
              <div className="text-5xl font-bold text-gray-900">4.89</div>
              <div>
                <div className="flex items-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <div className="text-gray-600">Based on 127 reviews</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah M.",
                rating: 5,
                comment: "Absolutely magical! The apartment exceeded all expectations. The location is perfect and the views are breathtaking.",
                date: "November 2024"
              },
              {
                name: "Marco R.",
                rating: 5,
                comment: "Authentic Venetian experience with modern comforts. The host was incredibly helpful and the apartment was spotless.",
                date: "October 2024"
              },
              {
                name: "Emma L.",
                rating: 5,
                comment: "Perfect for exploring Venice! Walking distance to all major attractions. The apartment is beautifully decorated.",
                date: "September 2024"
              }
            ].map((review, index) => (
              <Card key={index} className="transform transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold transform transition-all duration-200 active:scale-110 active:bg-blue-700">
                      {review.name[0]}
                    </div>
                    <div className="ml-3">
                      <div className="font-semibold transition-colors duration-200 active:text-blue-600">{review.name}</div>
                      <div className="text-sm text-gray-600 transition-colors duration-200">{review.date}</div>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star 
                        key={i} 
                        className="w-4 h-4 text-yellow-400 fill-current transform transition-all duration-200 hover:scale-110 active:scale-125" 
                        style={{ animationDelay: `${i * 100}ms` }}
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 transition-colors duration-200 active:text-gray-900">{review.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* —— Footer —— */}
      <footer className="bg-gray-900 text-white px-4 py-12 transform transition-all duration-300">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4 transform transition-all duration-200 hover:scale-105 active:scale-95">All'Arco Venice</h3>
          <p className="text-gray-300 mb-6 transition-colors duration-200 hover:text-white">Your gateway to authentic Venetian luxury</p>
          <div className="flex justify-center space-x-6">
            <span className="transform transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer hover:text-blue-300">© 2024 All'Arco Venice</span>
            <span className="transform transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer hover:text-blue-300">Privacy Policy</span>
            <span className="transform transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer hover:text-blue-300">Terms of Service</span>
          </div>
        </div>
      </footer>
      {/* Image Gallery Modal */}
      <ImageGalleryModal
        images={activeImages}
        initialIndex={modalInitialIndex}
        isOpen={isModalOpen}
        onClose={closeModal}
      />

    </div>
  );
}