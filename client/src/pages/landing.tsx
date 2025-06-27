import { useState, useEffect, useRef } from "react"
import { Link } from "wouter"
import { useQuery } from "@tanstack/react-query"
import Header from "@/components/header"
import ImageGalleryModal from "@/components/image-gallery-modal"
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
import { DateRange } from "react-day-picker"
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
  //  Image gallery state
  /* ------------------------------------------------------------------ */
  const { data: heroImages } = useQuery<HeroImage[]>({
    queryKey: ["/api/hero-images/active"],
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

  // Mock booked check-in dates (replace with real API data)
  const bookedCheckInDates = ["2025-06-15","2025-06-22","2025-07-01","2025-07-10","2025-07-20"].map(d=>new Date(d))

  /* ------------------------------------------------------------------ */
  //  Calendar wiring
  /* ------------------------------------------------------------------ */
  const handleValidRangeSelect = (range: DateRange) => {
    if (range.from) setCheckIn(format(range.from, "yyyy-MM-dd"))
    if (range.to) setCheckOut(format(range.to, "yyyy-MM-dd"))
  }

  /* ------------------------------------------------------------------ */
  //  Validation + mock availability
  /* ------------------------------------------------------------------ */
  const RATE_LIMIT_MS = 2000
  useEffect(() => {
    if (!checkIn || !checkOut) return setValidationErrors({})
    const verdict = validateStayRange({ from:new Date(checkIn), to:new Date(checkOut) }, bookedCheckInDates, { maxStayDays:30 })
    setValidationErrors(verdict.valid ? {} : { checkOut: verdict.reason! })
    if (verdict.valid && Date.now()-lastAvailabilityCheck>RATE_LIMIT_MS) {
      setIsCheckingAvailability(true)
      setLastAvailabilityCheck(Date.now())
      setTimeout(()=>setIsCheckingAvailability(false),800)
    }
  },[checkIn,checkOut])

  /* ------------------------------------------------------------------ */
  //  Pricing helpers
  /* ------------------------------------------------------------------ */
  const base = 110.5, clean=25, service=15
  const nights=(!checkIn||!checkOut)?1:Math.max(1,(new Date(checkOut).getTime()-new Date(checkIn).getTime())/86_400_000)
  const discNight=nights>=7?base*0.9:nights>=3?base*0.95:base
  // Pet fee: €25 for 1 night, €35 total for multiple nights
  const pet = hasPet ? (nights === 1 ? 25 : 35) : 0
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
              className="md:hidden relative h-64 rounded-xl overflow-hidden"
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
                    className="min-w-full h-full relative cursor-pointer"
                    onClick={() => openModal(index)}
                  >
                    <img 
                      src={image.url} 
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {activeImages.length === 0 && (
                  <div className="min-w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                    No images available
                  </div>
                )}
              </div>

              {/* Navigation Arrows */}
              {activeImages.length > 1 && (
                <>
                  <button
                    onClick={goToPrevMobile}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors z-10"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={goToNextMobile}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors z-10"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Dots Indicator */}
              {activeImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {activeImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentMobileIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentMobileIndex 
                          ? 'bg-white' 
                          : 'bg-white bg-opacity-50'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Photo Counter */}
              <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-sm">
                {currentMobileIndex + 1} / {activeImages.length}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* —— Property Information Section —— */}
      <section className="bg-gradient-to-br from-gray-50 via-white to-blue-50/30 px-3 sm:px-4 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/50 shadow-lg sm:shadow-xl shadow-gray-100/50 overflow-hidden">
            
            {/* Desktop/Tablet Layout: 3 columns side by side */}
            <div className="hidden md:block p-6 lg:p-8">
              <div className="grid grid-cols-3 gap-8 items-start">
                
                {/* 1/3 Left: Host Information */}
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        F
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                        <Star className="w-3 h-3 text-white fill-current" />
                      </div>
                    </div>
                    
                    <div className="space-y-2 flex-1">
                      <h3 className="text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
                        Entire apartment hosted by
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Fatima</span>
                      </h3>
                      
                      <div className="flex flex-col gap-2 text-sm">
                        <span className="flex items-center space-x-1.5 bg-gradient-to-r from-yellow-50 to-orange-50 px-3 py-1.5 rounded-full border border-yellow-200/50 w-fit">
                          <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                          <span className="font-semibold text-yellow-700">Superhost</span>
                        </span>
                        <span className="text-gray-600 font-medium">5+ years hosting</span>
                        <span className="text-gray-600 font-medium">100+ reviews</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2/3 Center: Property Details */}
                <div className="space-y-4">
                  <div className="group flex items-center space-x-4 p-4 rounded-xl bg-white/60 hover:bg-white/80 transition-all duration-300 hover:shadow-md cursor-pointer">
                    <div className="w-11 h-11 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg">5 guests</div>
                      <div className="text-sm text-gray-500 font-medium">Maximum capacity</div>
                    </div>
                  </div>
                  
                  <div className="group flex items-center space-x-4 p-4 rounded-xl bg-white/60 hover:bg-white/80 transition-all duration-300 hover:shadow-md cursor-pointer">
                    <div className="w-11 h-11 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Bed className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg">2 bedrooms</div>
                      <div className="text-sm text-gray-500 font-medium">Private spaces</div>
                    </div>
                  </div>
                  
                  <div className="group flex items-center space-x-4 p-4 rounded-xl bg-white/60 hover:bg-white/80 transition-all duration-300 hover:shadow-md cursor-pointer">
                    <div className="w-11 h-11 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Key className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg">1 bathroom</div>
                      <div className="text-sm text-gray-500 font-medium">Full bathroom</div>
                    </div>
                  </div>
                </div>

                {/* 3/3 Right: Pricing */}
                <div className="text-right">
                  <div className="space-y-3">
                    <div className="text-3xl font-bold text-gray-900">
                      €110.50 
                      <span className="text-lg font-medium text-gray-500">/night</span>
                    </div>
                    <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-1.5 rounded-full border border-green-200/50">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold text-green-700">Available now</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Layout: Custom overlapping design */}
            <div className="block md:hidden relative p-4">
              {/* 1 - Host Information (top) */}
              <div className="relative z-10 bg-white/90 backdrop-blur-sm rounded-xl p-4 mb-4 shadow-sm">
                <div className="flex items-start space-x-4">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      F
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                      <Star className="w-2.5 h-2.5 text-white fill-current" />
                    </div>
                  </div>
                  
                  <div className="space-y-2 flex-1">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">
                      <span className="block">Entire apartment hosted by</span>
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Fatima</span>
                    </h3>
                    
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="flex items-center space-x-1.5 bg-gradient-to-r from-yellow-50 to-orange-50 px-2.5 py-1 rounded-full border border-yellow-200/50">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span className="font-semibold text-yellow-700">Superhost</span>
                      </span>
                      <span className="text-gray-600 font-medium">5+ years hosting</span>
                      <span className="text-gray-600 font-medium">100+ reviews</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 - Property Details (bottom background) */}
              <div className="relative z-20 bg-gradient-to-r from-gray-50/50 to-blue-50/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/60">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-base">5 guests</div>
                    <div className="text-xs text-gray-500 font-medium">Maximum capacity</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/60">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                    <Bed className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-base">2 bedrooms</div>
                    <div className="text-xs text-gray-500 font-medium">Private spaces</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/60">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
                    <Key className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-base">1 bathroom</div>
                    <div className="text-xs text-gray-500 font-medium">Full bathroom</div>
                  </div>
                </div>
              </div>

              {/* 2 - Pricing (overlapping in front) */}
              <div className="absolute top-20 right-4 z-30 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-gray-900">
                    €110.50 
                    <span className="text-base font-medium text-gray-500">/night</span>
                  </div>
                  <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-1.5 rounded-full border border-green-200/50">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-green-700 whitespace-nowrap">Available now</span>
                  </div>
                </div>
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
                <div className="flex items-center space-x-2">
                  <Bed className="w-5 h-5 text-blue-600" />
                  <span>2 bedrooms</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Sleeps up to 5 guests</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span>2 min walk to Rialto Bridge</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Wifi className="w-5 h-5 text-blue-600" />
                  <span>High-speed Wi-Fi</span>
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
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {review.name[0]}
                    </div>
                    <div className="ml-3">
                      <div className="font-semibold">{review.name}</div>
                      <div className="text-sm text-gray-600">{review.date}</div>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* —— Footer —— */}
      <footer className="bg-gray-900 text-white px-4 py-12">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">All'Arco Venice</h3>
          <p className="text-gray-300 mb-6">Your gateway to authentic Venetian luxury</p>
          <div className="flex justify-center space-x-6">
            <span>© 2024 All'Arco Venice</span>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
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
  )
}