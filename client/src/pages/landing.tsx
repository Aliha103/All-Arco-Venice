import { useState, useEffect, useRef } from "react"
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
export default function Landing() {
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
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /* ------------------------------------------------------------------ */
  //  Mock bookings → arrival dates only
  /* ------------------------------------------------------------------ */
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
      {/* —— Header —— */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              {/* AllArco Logo */}
              <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">AllArco</h1>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-gray-500 font-medium">VENICE</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-400 uppercase tracking-wide">LUXURY RESIDENCE</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <span className="text-sm text-gray-600">EN</span>
              <span className="text-sm text-gray-600">IT</span>
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-all duration-200 hover:scale-105"
                >
                  <User className="w-4 h-4 text-gray-600" />
                </button>
                
                {/* Dropdown Menu */}
                {isUserDropdownOpen && (
                  <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                      Welcome to All'Arco
                    </div>
                    <a 
                      href="/api/login" 
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <LogIn className="w-4 h-4 text-blue-600" />
                      <span>Log in</span>
                    </a>
                    <a 
                      href="/api/login" 
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <UserPlus className="w-4 h-4 text-green-600" />
                      <span>Sign up</span>
                    </a>
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <div className="px-4 py-2 text-xs text-gray-500">
                        Need help? Contact support
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* —— Hero —— */}
      <section className="bg-white px-4 py-10 sm:py-14 pl-[10px] pr-[10px]">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">All'Arco Apartment – Heart of Venice</h1>
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-6">
            <span className="flex items-center space-x-1"><Star className="w-4 h-4 text-yellow-400 fill-current" /><span>4.89</span><span>·</span><span>127 reviews</span></span>
            <span className="flex items-center space-x-1"><MapPin className="w-4 h-4" /><span>Venice, Italy</span></span>
          </div>
          {/* Images grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 h-64 sm:h-80 lg:h-96 rounded-xl overflow-hidden">
            <div className="bg-gray-200 flex items-center justify-center rounded-l-xl lg:rounded-none">Main bedroom</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-100 flex items-center justify-center rounded-tr-xl text-blue-600 text-sm">Terrace view</div>
              <div className="bg-green-100 flex items-center justify-center"><Utensils className="w-6 h-6 text-green-600" /></div>
              <div className="bg-purple-100 flex items-center justify-center rounded-bl-xl lg:rounded-none text-purple-600 text-sm">Living room</div>
              <div className="bg-gray-100 flex items-center justify-center rounded-br-xl text-gray-500 text-sm">+3 photos</div>
            </div>
          </div>
        </div>
      </section>
      {/* —— Host Information —— */}
      <section className="px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 smooth-hover touch-interaction fade-in">
            {/* Mobile Layout */}
            <div className="flex flex-col gap-4 md:hidden">
              {/* Host Info */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center gentle-scale touch-interaction cursor-pointer flex-shrink-0">
                  <User className="w-5 h-5 text-blue-600 transition-colors duration-200" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-gray-900 truncate">Entire apartment hosted by Fatima</h2>
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1 text-xs text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span>Superhost</span>
                    </div>
                    <span>100+ reviews</span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900">€110.50</div>
                <div className="text-xs text-gray-500">/night</div>
              </div>

              {/* Property Details */}
              <div className="flex items-center justify-center gap-3 text-xs text-gray-600">
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-900 font-medium">5 guests</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Bed className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-900 font-medium">2 bedrooms</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded"></div>
                  </div>
                  <span className="text-gray-900 font-medium">1 bathroom</span>
                </div>
              </div>
            </div>

            {/* Tablet Layout */}
            <div className="hidden md:flex lg:hidden items-start justify-between gap-6">
              {/* Left Side: Host Info + Property Details (Vertical) */}
              <div className="flex-1 space-y-4">
                {/* Host Info */}
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center gentle-scale touch-interaction cursor-pointer flex-shrink-0">
                    <User className="w-6 h-6 text-blue-600 transition-colors duration-200" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 truncate">Entire apartment hosted by Fatima</h2>
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span>Superhost</span>
                      </div>
                      <span>5+ years hosting</span>
                      <span>100+ reviews</span>
                    </div>
                  </div>
                </div>

                {/* Property Details */}
                <div className="flex items-center gap-6 text-sm text-gray-600 pl-15">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 font-medium">5 guests</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Bed className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 font-medium">2 bedrooms</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-400 rounded"></div>
                    </div>
                    <span className="text-gray-900 font-medium">1 bathroom</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Price */}
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-bold text-gray-900">€110.50</div>
                <div className="text-sm text-gray-500">/night</div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:flex lg:items-center lg:justify-between gap-4">
              {/* Section 1: Host Info - 1/3 */}
              <div className="flex items-center space-x-3 lg:flex-1">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center gentle-scale touch-interaction cursor-pointer flex-shrink-0">
                  <User className="w-6 h-6 text-blue-600 transition-colors duration-200" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">Entire apartment hosted by Fatima</h2>
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>Superhost</span>
                    </div>
                    <span>5+ years hosting</span>
                    <span>100+ reviews</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Property Details - 1/3 */}
              <div className="flex items-center justify-center gap-6 text-sm text-gray-600 lg:flex-1">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 font-medium">5 guests</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Bed className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 font-medium">2 bedrooms</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <div className="w-2 h-2 bg-gray-400 rounded"></div>
                  </div>
                  <span className="text-gray-900 font-medium">1 bathroom</span>
                </div>
              </div>

              {/* Section 3: Price - 1/3 */}
              <div className="text-right flex-shrink-0 lg:flex-1">
                <div className="text-2xl font-bold text-gray-900">€110.50</div>
                <div className="text-sm text-gray-500">/night</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* —— Booking —— */}
      <section id="booking-section" className="py-16 px-4 max-w-6xl mx-auto pl-[0px] pr-[0px] pt-[15px] pb-[15px] text-center">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Book Your Stay</h2>
          <p className="text-gray-600">Choose your dates and start planning your perfect getaway</p>
        </div>
        
        <Card className="smooth-hover touch-interaction slide-up">
          <CardContent className="p-8">
            {/* Mobile: Single column layout */}
            <div className="md:hidden">
              <div className="space-y-8">
                {/* Select Dates */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-blue-600"/>
                      Select Dates
                    </h3>
                    <button className="text-sm text-blue-600 hover:text-blue-700">Clear</button>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Check-in</div>
                        <div className="text-sm font-medium text-gray-900">{checkIn || "Select date"}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Check-out</div>
                        <div className="text-sm font-medium text-gray-900">{checkOut || "Select date"}</div>
                      </div>
                    </div>
                    {validationErrors.checkOut && (
                      <p className="text-red-600 flex items-center text-sm gentle-pulse">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {validationErrors.checkOut}
                      </p>
                    )}
                  </div>
                  
                  <AdvancedCalendar bookedCheckIns={bookedCheckInDates} onValidRangeSelect={handleValidRangeSelect}/>
                </div>

                {/* Guests & Pets */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Guests & Pets</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div className="flex items-center">
                        <Users className="w-5 h-5 mr-3 text-gray-400"/>
                        <div>
                          <div className="font-medium text-gray-900">Guests</div>
                          <div className="text-sm text-gray-500">Max 5</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => setGuests(Math.max(1, guests - 1))}
                          disabled={guests <= 1}
                          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                            guests <= 1 
                              ? 'border-gray-200 text-gray-300 cursor-not-allowed' 
                              : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-800'
                          }`}
                        >
                          <Minus className="w-4 h-4"/>
                        </button>
                        <span className="font-medium text-gray-900 min-w-[20px] text-center">{guests}</span>
                        <button 
                          onClick={() => setGuests(Math.min(5, guests + 1))}
                          disabled={guests >= 5}
                          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                            guests >= 5 
                              ? 'border-gray-200 text-gray-300 cursor-not-allowed' 
                              : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-800'
                          }`}
                        >
                          <Plus className="w-4 h-4"/>
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center">
                        <PawPrint className="w-5 h-5 mr-3 text-gray-400"/>
                        <div>
                          <div className="font-medium text-gray-900">Pets</div>
                        </div>
                      </div>
                      <div 
                        onClick={() => setHasPet(!hasPet)}
                        className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${
                          hasPet ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                          hasPet ? 'translate-x-6' : 'translate-x-0'
                        }`}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div>
                  
                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold text-gray-900">€{total.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">per night</div>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">€{discNight.toFixed(2)} × {nights} night{nights !== 1 && "s"}</span>
                        <span className="font-medium">€{(discNight * nights).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cleaning fee</span>
                        <span className="font-medium">€{clean.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service fee</span>
                        <span className="font-medium">€{service.toFixed(2)}</span>
                      </div>
                      {hasPet && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pet fee</span>
                          <span className="font-medium">€{pet.toFixed(2)}</span>
                        </div>
                      )}
                      <hr className="border-gray-200"/>
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span>€{total.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <Button 
                      disabled={Object.keys(validationErrors).length > 0 || !checkIn || !checkOut} 
                      className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg interactive-button touch-interaction"
                      asChild
                    >
                      <a href="/api/login" className="flex items-center justify-center">
                        <Lock className="w-4 h-4 mr-2 transition-transform duration-200"/>
                        Select dates to continue
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tablet: 60/40 layout with price under guests */}
            <div className="hidden md:block lg:hidden">
              <div className="grid grid-cols-5 gap-8">
                {/* Select Dates - 60% (3/5) */}
                <div className="col-span-3 max-w-full overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-blue-600"/>
                      Select Dates
                    </h3>
                    <button className="text-sm text-blue-600 hover:text-blue-700">Clear</button>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Check-in</div>
                        <div className="text-sm font-medium text-gray-900">{checkIn || "Select date"}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Check-out</div>
                        <div className="text-sm font-medium text-gray-900">{checkOut || "Select date"}</div>
                      </div>
                    </div>
                    {validationErrors.checkOut && (
                      <p className="text-red-600 flex items-center text-sm gentle-pulse">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {validationErrors.checkOut}
                      </p>
                    )}
                  </div>
                  
                  <div className="w-full max-w-full">
                    <AdvancedCalendar bookedCheckIns={bookedCheckInDates} onValidRangeSelect={handleValidRangeSelect}/>
                  </div>
                </div>

                {/* Right column: Guests & Pets + Price - 40% (2/5) */}
                <div className="col-span-2 space-y-8 max-w-full overflow-hidden">
                  {/* Guests & Pets */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Guests & Pets</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div className="flex items-center">
                          <Users className="w-5 h-5 mr-3 text-gray-400"/>
                          <div>
                            <div className="font-medium text-gray-900">Guests</div>
                            <div className="text-sm text-gray-500">Max 5</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button 
                            onClick={() => setGuests(Math.max(1, guests - 1))}
                            disabled={guests <= 1}
                            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                              guests <= 1 
                                ? 'border-gray-200 text-gray-300 cursor-not-allowed' 
                                : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-800'
                            }`}
                          >
                            <Minus className="w-4 h-4"/>
                          </button>
                          <span className="font-medium text-gray-900 min-w-[20px] text-center">{guests}</span>
                          <button 
                            onClick={() => setGuests(Math.min(5, guests + 1))}
                            disabled={guests >= 5}
                            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                              guests >= 5 
                                ? 'border-gray-200 text-gray-300 cursor-not-allowed' 
                                : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-800'
                            }`}
                          >
                            <Plus className="w-4 h-4"/>
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center">
                          <PawPrint className="w-5 h-5 mr-3 text-gray-400"/>
                          <div>
                            <div className="font-medium text-gray-900">Pets</div>
                          </div>
                        </div>
                        <div 
                          onClick={() => setHasPet(!hasPet)}
                          className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${
                            hasPet ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                            hasPet ? 'translate-x-6' : 'translate-x-0'
                          }`}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price Breakdown - Under Guests & Pets */}
                  <div>
                    <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                      <div className="text-center mb-4">
                        <div className="text-3xl font-bold text-gray-900">€{total.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">per night</div>
                      </div>
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">€{discNight.toFixed(2)} × {nights} night{nights !== 1 && "s"}</span>
                          <span className="font-medium">€{(discNight * nights).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cleaning fee</span>
                          <span className="font-medium">€{clean.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Service fee</span>
                          <span className="font-medium">€{service.toFixed(2)}</span>
                        </div>
                        {hasPet && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Pet fee</span>
                            <span className="font-medium">€{pet.toFixed(2)}</span>
                          </div>
                        )}
                        <hr className="border-gray-200"/>
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Total</span>
                          <span>€{total.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <Button 
                        disabled={Object.keys(validationErrors).length > 0 || !checkIn || !checkOut} 
                        className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg interactive-button touch-interaction"
                        asChild
                      >
                        <a href="/api/login" className="flex items-center justify-center">
                          <Lock className="w-4 h-4 mr-2 transition-transform duration-200"/>
                          Select dates to continue
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop: Three columns */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-8">
              {/* Select Dates Column */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-600"/>
                    Select Dates
                  </h3>
                  <button className="text-sm text-blue-600 hover:text-blue-700">Clear</button>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Check-in</div>
                      <div className="text-sm font-medium text-gray-900">{checkIn || "Select date"}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Check-out</div>
                      <div className="text-sm font-medium text-gray-900">{checkOut || "Select date"}</div>
                    </div>
                  </div>
                  {validationErrors.checkOut && (
                    <p className="text-red-600 flex items-center text-sm gentle-pulse">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {validationErrors.checkOut}
                    </p>
                  )}
                </div>
                
                <AdvancedCalendar bookedCheckIns={bookedCheckInDates} onValidRangeSelect={handleValidRangeSelect}/>
              </div>

              {/* Guests & Pets Column */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Guests & Pets</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 mr-3 text-gray-400"/>
                      <div>
                        <div className="font-medium text-gray-900">Guests</div>
                        <div className="text-sm text-gray-500">Max 5</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        disabled={guests <= 1}
                        className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                          guests <= 1 
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed' 
                            : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-800'
                        }`}
                      >
                        <Minus className="w-4 h-4"/>
                      </button>
                      <span className="font-medium text-gray-900 min-w-[20px] text-center">{guests}</span>
                      <button 
                        onClick={() => setGuests(Math.min(5, guests + 1))}
                        disabled={guests >= 5}
                        className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                          guests >= 5 
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed' 
                            : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-800'
                        }`}
                      >
                        <Plus className="w-4 h-4"/>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center">
                      <PawPrint className="w-5 h-5 mr-3 text-gray-400"/>
                      <div>
                        <div className="font-medium text-gray-900">Pets</div>
                      </div>
                    </div>
                    <div 
                      onClick={() => setHasPet(!hasPet)}
                      className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${
                        hasPet ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                        hasPet ? 'translate-x-6' : 'translate-x-0'
                      }`}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Breakdown Column */}
              <div>
                
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-gray-900">€{total.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">per night</div>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">€{discNight.toFixed(2)} × {nights} night{nights !== 1 && "s"}</span>
                      <span className="font-medium">€{(discNight * nights).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cleaning fee</span>
                      <span className="font-medium">€{clean.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service fee</span>
                      <span className="font-medium">€{service.toFixed(2)}</span>
                    </div>
                    {hasPet && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pet fee</span>
                        <span className="font-medium">€{pet.toFixed(2)}</span>
                      </div>
                    )}
                    <hr className="border-gray-200"/>
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>€{total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <Button 
                    disabled={Object.keys(validationErrors).length > 0 || !checkIn || !checkOut} 
                    className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg interactive-button touch-interaction"
                    asChild
                  >
                    <a href="/api/login" className="flex items-center justify-center">
                      <Lock className="w-4 h-4 mr-2 transition-transform duration-200"/>
                      Select dates to continue
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      {/* —— About This Space —— */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">About This Space</h2>
          <p className="text-xl text-gray-600">Experience authentic Venetian luxury in the heart of the floating city</p>
        </div>
      </section>
      {/* —— Property Description —— */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start space-x-4 mb-8">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 10 9 11 1.09-.21 2.16-.56 3.16-1.04.14-.06.29-.14.43-.21.04-.02.08-.05.12-.07.17-.1.34-.21.5-.32.08-.06.16-.11.24-.17.14-.11.28-.22.41-.34.07-.06.14-.13.21-.19.12-.11.24-.23.35-.35.06-.06.12-.13.18-.19.11-.13.22-.26.32-.4.05-.07.11-.14.16-.21.09-.13.18-.26.26-.4.04-.07.09-.14.13-.21.07-.13.14-.26.21-.4.03-.07.07-.14.1-.21.06-.14.12-.28.17-.42.02-.07.05-.14.07-.21.04-.14.08-.29.12-.44.01-.07.03-.14.04-.21.03-.15.05-.31.07-.47 0-.07.01-.14.02-.21.01-.16.02-.33.02-.5V7l-10-5z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">All'Arco Apartment</h2>
              <p className="text-lg text-blue-600 font-medium">Historic Venice Center</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-sm">
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              Welcome to All'Arco Apartment, a meticulously restored 2-bedroom sanctuary that captures the 
              timeless elegance of Venice. Nestled just steps from the iconic St. Mark's Square, this exquisite 
              retreat seamlessly blends centuries-old Venetian charm with contemporary luxury.
            </p>

            <p className="text-gray-700 text-lg leading-relaxed mb-8">
              Featuring authentic Venetian architecture, a fully equipped gourmet kitchen, and an enchanting 
              private balcony with canal views, this apartment offers an unparalleled Venice experience. 
              Perfectly positioned for cultural immersion, with world-renowned museums, acclaimed 
              restaurants, and historic landmarks all within a leisurely stroll.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 14c1.66 0 3-1.34 3-3S8.66 8 7 8s-3 1.34-3 3 1.34 3 3 3zm0-4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm12-3h-8v8H3V5H1v11c0 1.11.89 2 2 2h14c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">2 Bedrooms</h3>
                  <p className="text-gray-600">Sleeps up to 5 guests comfortably</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">3rd Floor</h3>
                  <p className="text-gray-600">Historic building with authentic charm</p>
                </div>
              </div>
            </div>
          </div>

          
        </div>
      </section>
      {/* —— Amenities —— */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Premium Amenities</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon:<Wifi className="w-6 h-6 text-blue-600" />, title:"High‑Speed WiFi", desc:"Complimentary throughout" },
              { icon:<Utensils className="w-6 h-6 text-orange-600" />, title:"Gourmet Kitchen", desc:"Fully equipped for cooking" },
              { icon:<Tv className="w-6 h-6 text-purple-600" />, title:"Smart Entertainment", desc:"Premium streaming access" },
              { icon:<Thermometer className="w-6 h-6 text-green-600" />, title:"Climate Control", desc:"Air conditioning & heating" },
              { icon:<Car className="w-6 h-6 text-blue-600" />, title:"Parking Available", desc:"Nearby secured options" },
              { icon:<Key className="w-6 h-6 text-indigo-600" />, title:"Seamless Check‑in", desc:"Self‑service convenience" },
            ].map(({icon,title,desc})=> (
              <div key={title} className="bg-gray-50 rounded-xl p-6 flex space-x-4 items-start smooth-hover touch-interaction cursor-pointer fade-in group">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow gentle-scale">{icon}</div>
                <div><h3 className="font-semibold text-gray-900 mb-1 transition-colors duration-200 group-hover:text-blue-600">{title}</h3><p className="text-sm text-gray-600 transition-colors duration-200">{desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* —— Trust & Quality Assurance —— */}
      <section className="py-16 px-4 bg-gray-50 pt-[0px] pb-[0px]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-4 mb-16 pt-[10px] pb-[10px]">
            <div className="text-center flex-1 min-w-0 max-w-xs">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z"/>
                </svg>
              </div>
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Verified Property</h3>
              <p className="text-gray-600 text-xs sm:text-sm">Licensed & insured accommodation</p>
            </div>

            <div className="text-center flex-1 min-w-0 max-w-xs">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z"/>
                </svg>
              </div>
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Quality Assured</h3>
              <p className="text-gray-600 text-xs sm:text-sm">Premium certified standards</p>
            </div>

            <div className="text-center flex-1 min-w-0 max-w-xs">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
                </svg>
              </div>
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">24/7 Support</h3>
              <p className="text-gray-600 text-xs sm:text-sm">Always available to help</p>
            </div>
          </div>

          {/* Guest Reviews Badge */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center bg-yellow-50 border border-yellow-200 rounded-full px-4 py-2 mb-4">
              <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.46,13.97L5.82,21L12,17.27Z"/>
              </svg>
              <span className="text-yellow-700 font-medium">Guest Reviews</span>
            </div>
            <h2 className="text-xl text-gray-900 mb-8">What our guests say about their Venice experience</h2>

            {/* Rating Categories */}
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.46,13.97L5.82,21L12,17.27Z"/>
                </svg>
                <span className="text-lg font-semibold text-gray-900">Overall Rating</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H5C3.89,1 3,1.89 3,3V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V9M19,19H5V3H9V9H19V19Z"/>
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">Cleanliness</h4>
                  <div className="flex justify-center mb-1">
                    {[1,2,3,4].map(i => <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />)}
                    <Star className="w-3 h-3 text-gray-300" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">4.9</span>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z"/>
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">Price Value</h4>
                  <div className="flex justify-center mb-1">
                    {[1,2,3,4].map(i => <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />)}
                    <Star className="w-3 h-3 text-gray-300" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">4.8</span>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3,5A2,2 0 0,1 5,3H19A2,2 0 0,1 21,5V9.17L12,14.17L3,9.17V5M21,11.83L12,16.83L3,11.83V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V11.83Z"/>
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">WiFi Quality</h4>
                  <div className="flex justify-center mb-1">
                    {[1,2,3,4].map(i => <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />)}
                    <Star className="w-3 h-3 text-gray-300" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">4.9</span>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">Response Time</h4>
                  <div className="flex justify-center mb-1">
                    {[1,2,3,4].map(i => <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />)}
                    <Star className="w-3 h-3 text-gray-300" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">4.7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* —— Recent Reviews —— */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center mb-8">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L20.71,8.71L23,11V6M6,2H8V4H6V2M10,2H12V4H10V2M14,2H16V4H14V2Z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Recent Reviews</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Review 1 */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Sarah M.</h3>
                  <p className="text-sm text-gray-600">London, UK</p>
                </div>
                <div className="text-right">
                  <div className="flex mb-1">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />)}
                  </div>
                  <p className="text-xs text-gray-500">December 2024</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                "Absolutely magical! The apartment exceeded all expectations. Perfect location steps from St. Mark's Square, immaculate cleanliness, and Marco was incredibly responsive. The balcony view was breathtaking!"
              </p>
            </div>

            {/* Review 2 */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">James R.</h3>
                  <p className="text-sm text-gray-600">New York, USA</p>
                </div>
                <div className="text-right">
                  <div className="flex mb-1">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />)}
                  </div>
                  <p className="text-xs text-gray-500">November 2024</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                "Outstanding Venice experience! The apartment is beautifully restored with authentic Venetian charm. Kitchen was fully equipped, WiFi excellent, and the location unbeatable. Highly recommend!"
              </p>
            </div>

            {/* Review 3 */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Emma L.</h3>
                  <p className="text-sm text-gray-600">Sydney, Australia</p>
                </div>
                <div className="text-right">
                  <div className="flex mb-1">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />)}
                  </div>
                  <p className="text-xs text-gray-500">October 2024</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                "Perfect romantic getaway! The apartment combines historic charm with modern comfort. Amazing canal views, spotless condition, and Marco provided excellent local recommendations."
              </p>
            </div>

            {/* Review 4 */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">David K.</h3>
                  <p className="text-sm text-gray-600">Toronto, Canada</p>
                </div>
                <div className="text-right">
                  <div className="flex mb-1">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />)}
                  </div>
                  <p className="text-xs text-gray-500">September 2024</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                "Exceptional stay in Venice! The apartment is a true gem with authentic details and all modern amenities. Prime location made exploring effortless. Communication was prompt and helpful throughout."
              </p>
            </div>
          </div>

          <div className="text-center">
            <button className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              View All Reviews
            </button>
          </div>
        </div>
      </section>
      
      {/* —— Footer —— */}
      <footer className="bg-gray-100 border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { title:"Support", items:["Help Center","Safety information","Cancellation options","Report a problem"] },
            { title:"Community", items:["All'Arco.com","Referral program","Venice guide","Guest stories"] },
            { title:"All'Arco", items:["Newsroom","New features","Letter from founders","Careers"] },
          ].map(({title,items})=> (
            <div key={title}><h4 className="font-semibold text-gray-900 mb-4">{title}</h4><ul className="space-y-3 text-gray-600 text-sm">{items.map(i=> <li key={i}><a href="#" className="hover:text-gray-900">{i}</a></li>)}</ul></div>
          ))}
        </div>
        <div className="border-t border-gray-200 py-6 px-4 text-sm text-gray-600 flex flex-col sm:flex-row justify-between max-w-7xl mx-auto">
          <span>&copy; {new Date().getFullYear()} All'Arco, Inc.</span>
          <span className="mt-2 sm:mt-0">English (US) · € EUR</span>
        </div>
      </footer>
      {/* —— Chat —— */}
      <ChatWidget />
    </div>
  );
}

/* Advanced Chat Widget */
function ChatWidget(){
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "👋 Welcome to All'Arco! How can we help you today?", sender: "bot", timestamp: new Date() }
  ]);

  const handleSubmit = () => {
    if (name && email) {
      setIsTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, 
          { id: prev.length + 1, text: `Hi ${name}! Thanks for reaching out. We'll get back to you shortly at ${email}.`, sender: "bot", timestamp: new Date() }
        ]);
        setIsTyping(false);
        setName("");
        setEmail("");
      }, 1500);
    }
  };

  return (
    <>
      {/* Chat Window */}
      <div className={`fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden transition-all duration-500 ease-out transform ${
        open ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4 pointer-events-none'
      }`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold">All'Arco Support</h3>
              <div className="flex items-center space-x-1 text-xs text-blue-100">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Online now</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setOpen(false)} 
            className="w-8 h-8 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'bot' ? 'justify-start' : 'justify-end'} animate-fadeIn`}>
              <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                message.sender === 'bot' 
                  ? 'bg-white text-gray-800 shadow-sm' 
                  : 'bg-blue-600 text-white'
              }`}>
                {message.text}
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start animate-fadeIn">
              <div className="bg-white px-4 py-2 rounded-2xl shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="p-4 border-t bg-white space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name" 
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
            <input 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address" 
              type="email"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>
          <Button 
            onClick={handleSubmit}
            disabled={!name || !email || isTyping}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg transition-all duration-200 font-medium"
          >
            {isTyping ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Connecting...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <MessageCircle className="w-4 h-4" />
                <span>Start conversation</span>
              </div>
            )}
          </Button>
        </div>
      </div>

      {/* Chat Toggle Button */}
      <button 
        onClick={() => setOpen(true)} 
        className={`fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full shadow-2xl flex items-center justify-center z-50 transition-all duration-300 transform hover:scale-110 ${
          open ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
        }`}
      >
        <div className="relative">
          <MessageCircle className="w-6 h-6 transition-transform duration-200" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        </div>
      </button>
    </>
  )
}