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
      <section className="bg-white px-4 py-8">
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
                  <div className="text-lg md:text-xl font-semibold text-gray-900">€110.50 <span className="text-sm md:text-base font-normal">/night</span></div>
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
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                      Entire apartment hosted by Fatima
                    </h2>
                    <div className="flex items-center space-x-3 text-xs sm:text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span>Superhost</span>
                      </span>
                      <span>5+ years hosting</span>
                      <span>100+ reviews</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-base sm:text-lg font-semibold text-gray-900">€110.50 <span className="text-xs sm:text-sm font-normal">/night</span></div>
                  <div className="flex items-center justify-end space-x-1 mt-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600">Available</span>
                  </div>
                </div>
              </div>
              
              {/* Property Details Row */}
              <div className="flex items-center space-x-6 pt-4 border-t border-gray-200">
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