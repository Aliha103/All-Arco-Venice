import { useState, useEffect } from "react"
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
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                <User className="w-4 h-4 text-gray-600" />
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
          <div className="bg-white rounded-xl border border-gray-200 p-6 smooth-hover touch-interaction fade-in">
            <div className="flex flex-col xl:flex-row xl:items-center gap-4">
              {/* Top Row: Host Info and Price */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center gentle-scale touch-interaction cursor-pointer">
                    <User className="w-6 h-6 text-blue-600 transition-colors duration-200" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Entire apartment hosted by Fatima</h2>
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

                {/* Price */}
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold text-gray-900">€110.50</div>
                  <div className="text-sm text-gray-500">/night</div>
                </div>
              </div>

              {/* Bottom Row: Property Details */}
              <div className="flex flex-wrap items-center gap-6 xl:ml-auto">
                <div className="flex items-center space-x-2 text-sm">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 font-medium">5 guests</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Bed className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 font-medium">2 bedrooms</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <div className="w-2 h-2 bg-gray-400 rounded"></div>
                  </div>
                  <span className="text-gray-900 font-medium">1 bathroom</span>
                </div>
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

          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">About This Space</h2>
            <p className="text-gray-600 text-center text-lg">Experience authentic Venetian luxury in the heart of the floating city</p>
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
      {/* —— Guest Reviews (condensed) —— */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center mb-12"><h2 className="text-2xl font-bold text-gray-900">Guest Reviews</h2><p className="text-gray-600">Rated 4.9/5 by 2,400 guests</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name:"Sarah M.", location:"London", text:"Absolutely magical! Perfect location in Venice." },
            { name:"James R.", location:"New York", text:"Outstanding experience. Beautifully restored apartment." },
            { name:"Emma L.", location:"Sydney", text:"Perfect romantic getaway with amazing canal views." },
          ].map(({name,location,text})=> (
            <div key={name} className="bg-white rounded-xl p-6 shadow-sm smooth-hover touch-interaction cursor-pointer fade-in group">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 gentle-scale">
                  <span className="text-blue-600 font-semibold text-sm group-hover:text-blue-700 transition-colors duration-200">{name[0]}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600">{name}</h4>
                  <p className="text-sm text-gray-600 transition-colors duration-200">{location}</p>
                </div>
              </div>
              <div className="flex mb-3">{[1,2,3,4,5].map(n=> <Star key={n} className="w-4 h-4 text-yellow-400 fill-current gentle-scale cursor-pointer" />)}</div>
              <p className="text-gray-700 text-sm transition-colors duration-200 group-hover:text-gray-900">"{text}"</p>
            </div>
          ))}
        </div>
      </section>
      {/* —— Footer —— */}
      <footer className="bg-gray-100 border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { title:"Support", items:["Help Center","Safety information","Cancellation options","Report a problem"] },
            { title:"Community", items:["All'Arco.com","Referral program","Venice guide","Guest stories"] },
            { title:"Hosting", items:["Host your home","Host resources","Community forum","Hosting tips"] },
            { title:"All'Arco", items:["Newsroom","New features","Letter from founders","Careers"] },
          ].map(({title,items})=> (
            <div key={title}><h4 className="font-semibold text-gray-900 mb-4">{title}</h4><ul className="space-y-3 text-gray-600 text-sm">{items.map(i=> <li key={i}><a href="#" className="hover:text-gray-900">{i}</a></li>)}</ul></div>
          ))}
        </div>
        <div className="border-t border-gray-200 py-6 px-4 text-sm text-gray-600 flex flex-col sm:flex-row justify-between max-w-7xl mx-auto">
          <span>&copy; 2024 All'Arco, Inc.</span>
          <span className="mt-2 sm:mt-0">English (US) · € EUR</span>
        </div>
      </footer>
      {/* —— Chat —— */}
      <ChatWidget />
    </div>
  );
}

/* Quick‑chat widget */
function ChatWidget(){
  const [open,setOpen]=useState(false);const[name,setName]=useState("");const[email,setEmail]=useState("");
  return open?(
    <div className="fixed bottom-6 right-6 w-80 bg-white rounded-lg shadow-xl z-50 overflow-hidden slide-up">
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center"><h3 className="font-semibold">All'Arco</h3><button onClick={()=>setOpen(false)} className="gentle-scale touch-interaction"><Lock className="w-4 h-4"/></button></div>
      <div className="p-4 text-gray-700 text-sm fade-in">👋 How can we help you?</div>
      <div className="p-4 space-y-3 border-t"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" className="w-full p-2 border rounded transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"/><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full p-2 border rounded transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"/><Button onClick={()=>setOpen(false)} className="w-full interactive-button touch-interaction">Start chat</Button></div>
    </div>
  ):(
    <button onClick={()=>setOpen(true)} className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center z-50 interactive-button touch-interaction"><MessageCircle className="w-6 h-6 transition-transform duration-200"/></button>
  )
}