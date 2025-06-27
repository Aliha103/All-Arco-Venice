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
            
            {/* Main Content */}
            <div className="p-4 sm:p-6 lg:p-8">
              {/* Mobile & Tablet: Stack vertically, Desktop: Side by side */}
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 xl:gap-8">
                
                {/* Host Information */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5 flex-1">
                  <div className="relative shrink-0 self-center sm:self-start">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg">
                      F
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                      <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white fill-current" />
                    </div>
                  </div>
                  
                  <div className="space-y-2 sm:space-y-3 text-center sm:text-left flex-1">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
                      <span className="block sm:inline">Entire apartment hosted by</span>
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block sm:inline"> Fatima</span>
                    </h3>
                    
                    {/* Host credentials - responsive layout */}
                    <div className="flex flex-col sm:flex-row sm:flex-wrap items-center sm:items-start gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm">
                      <span className="flex items-center space-x-1.5 bg-gradient-to-r from-yellow-50 to-orange-50 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-yellow-200/50">
                        <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-500 fill-current shrink-0" />
                        <span className="font-semibold text-yellow-700 whitespace-nowrap">Superhost</span>
                      </span>
                      <span className="text-gray-600 font-medium whitespace-nowrap">5+ years hosting</span>
                      <span className="text-gray-600 font-medium whitespace-nowrap">100+ reviews</span>
                    </div>
                  </div>
                </div>

                {/* Pricing Section */}
                <div className="text-center xl:text-right shrink-0">
                  <div className="space-y-2">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                      €110.50 
                      <span className="text-base sm:text-lg font-medium text-gray-500">/night</span>
                    </div>
                    <div className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-1.5 rounded-full border border-green-200/50">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0"></div>
                      <span className="text-sm font-semibold text-green-700 whitespace-nowrap">Available now</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Details - Fully responsive grid */}
            <div className="bg-gradient-to-r from-gray-50/50 to-blue-50/30 border-t border-gray-100/50 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                
                {/* Guests */}
                <div className="group flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/60 hover:bg-white/80 transition-all duration-300 hover:shadow-md cursor-pointer">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-gray-900 text-base sm:text-lg truncate">5 guests</div>
                    <div className="text-xs sm:text-sm text-gray-500 font-medium">Maximum capacity</div>
                  </div>
                </div>
                
                {/* Bedrooms */}
                <div className="group flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/60 hover:bg-white/80 transition-all duration-300 hover:shadow-md cursor-pointer">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
                    <Bed className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-gray-900 text-base sm:text-lg truncate">2 bedrooms</div>
                    <div className="text-xs sm:text-sm text-gray-500 font-medium">Private spaces</div>
                  </div>
                </div>
                
                {/* Bathroom */}
                <div className="group flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/60 hover:bg-white/80 transition-all duration-300 hover:shadow-md cursor-pointer md:col-span-1">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
                    <Key className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-gray-900 text-base sm:text-lg truncate">1 bathroom</div>
                    <div className="text-xs sm:text-sm text-gray-500 font-medium">Full bathroom</div>
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