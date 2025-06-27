import { useState, useEffect, useRef } from "react"
import { Link } from "wouter"
import { useQuery } from "@tanstack/react-query"
import Header from "@/components/header"
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
  Tv,
  Thermometer,
  Key,
  Sparkles,
  LogIn,
  UserPlus,
  ChevronDown,
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

  // Get images by position for display
  const activeImages = heroImages?.filter(img => img.isActive) || [];
  const getImageByPosition = (position: string) => {
    return activeImages.find(img => img.position === position);
  };

  const mainImage = getImageByPosition("main");
  const topRightImage = getImageByPosition("top-right");
  const topLeftImage = getImageByPosition("top-left");
  const bottomRightImage = getImageByPosition("bottom-right");
  const bottomLeftImage = getImageByPosition("bottom-left");

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
              <div className="col-span-2 row-span-2 relative">
                {mainImage ? (
                  <img 
                    src={mainImage.url} 
                    alt={mainImage.alt}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                    Main Bedroom
                  </div>
                )}
              </div>
              
              {/* Top right images */}
              <div className="relative">
                {topLeftImage ? (
                  <img 
                    src={topLeftImage.url} 
                    alt={topLeftImage.alt}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-green-100 flex items-center justify-center text-green-600 text-sm">
                    Kitchen
                  </div>
                )}
              </div>
              <div className="relative">
                {topRightImage ? (
                  <img 
                    src={topRightImage.url} 
                    alt={topRightImage.alt}
                    className="w-full h-full object-cover rounded-tr-xl"
                  />
                ) : (
                  <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm rounded-tr-xl">
                    Living Room
                  </div>
                )}
              </div>
              
              {/* Bottom right images */}
              <div className="relative">
                {bottomLeftImage ? (
                  <img 
                    src={bottomLeftImage.url} 
                    alt={bottomLeftImage.alt}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-yellow-100 flex items-center justify-center text-yellow-600 text-sm">
                    Balcony/Outdoor
                  </div>
                )}
              </div>
              <div className="relative">
                {bottomRightImage ? (
                  <img 
                    src={bottomRightImage.url} 
                    alt={bottomRightImage.alt}
                    className="w-full h-full object-cover rounded-br-xl"
                  />
                ) : (
                  <div className="w-full h-full bg-purple-100 flex items-center justify-center text-purple-600 text-sm rounded-br-xl">
                    Bathroom
                  </div>
                )}
                {/* Photos counter overlay */}
                {activeImages.length > 5 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="bg-white text-black px-4 py-2 rounded-lg font-medium text-sm shadow-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      +{activeImages.length - 5} photos
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden relative h-64 rounded-xl overflow-hidden">
              {mainImage ? (
                <img 
                  src={mainImage.url} 
                  alt={mainImage.alt}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                  Main Bedroom
                </div>
              )}
              {activeImages.length > 1 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="bg-white text-black px-4 py-2 rounded-lg font-medium text-sm shadow-lg">
                    +{activeImages.length - 1} photos
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* —— Property Description —— */}
      <section className="bg-white px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
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

            {/* Booking Section */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-gray-900">€{total.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">total</div>
                  </div>

                  {/* Calendar */}
                  <div className="mb-6">
                    <AdvancedCalendar
                      bookedCheckIns={bookedCheckInDates}
                      onValidRangeSelect={handleValidRangeSelect}
                      className="w-full"
                    />
                    {validationErrors.checkOut && (
                      <div className="flex items-center space-x-2 mt-2 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{validationErrors.checkOut}</span>
                      </div>
                    )}
                  </div>

                  {/* Guests & Pets */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Guests</span>
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setGuests(Math.max(1, guests - 1))}
                          disabled={guests <= 1}
                          className="w-8 h-8 p-0"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center">{guests}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setGuests(Math.min(5, guests + 1))}
                          disabled={guests >= 5}
                          className="w-8 h-8 p-0"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-medium flex items-center space-x-2">
                        <PawPrint className="w-4 h-4" />
                        <span>Pets</span>
                      </span>
                      <Button
                        variant={hasPet ? "default" : "outline"}
                        size="sm"
                        onClick={() => setHasPet(!hasPet)}
                        className="px-4"
                      >
                        {hasPet ? "Yes" : "No"}
                      </Button>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span>€{discNight.toFixed(2)} × {nights} night{nights !== 1 && "s"}</span>
                      <span>€{(discNight * nights).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cleaning fee</span>
                      <span>€{clean.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Service fee</span>
                      <span>€{service.toFixed(2)}</span>
                    </div>
                    {hasPet && (
                      <div className="flex justify-between text-sm">
                        <span>Pet fee</span>
                        <span>€{pet.toFixed(2)}</span>
                      </div>
                    )}
                    <hr className="border-gray-200"/>
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>€{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button 
                    disabled={Object.keys(validationErrors).length > 0 || !checkIn || !checkOut} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    asChild
                  >
                    <a href="/api/login" className="flex items-center justify-center">
                      <Lock className="w-4 h-4 mr-2"/>
                      Reserve
                    </a>
                  </Button>
                </CardContent>
              </Card>
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
    </div>
  )
}