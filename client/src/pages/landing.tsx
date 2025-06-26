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
  const base = 110.5, clean=25, service=15, pet=hasPet?20:0
  const nights=(!checkIn||!checkOut)?1:Math.max(1,(new Date(checkOut).getTime()-new Date(checkIn).getTime())/86_400_000)
  const discNight=nights>=7?base*0.9:nights>=3?base*0.95:base
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
      <section className="bg-white px-4 py-10 sm:py-14">
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
      <section className="bg-gray-50 px-4 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Mobile Layout */}
            <div className="block lg:hidden">
              <div className="p-6 space-y-6">
                {/* Host Profile */}
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900 mb-2">
                      Entire apartment hosted by Fatima
                    </h2>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center space-x-1 bg-yellow-50 px-3 py-1 rounded-full">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-semibold text-yellow-700">Superhost</span>
                      </div>
                      <span className="text-sm text-gray-600 font-medium">5+ years hosting</span>
                      <span className="text-sm text-gray-600 font-medium">100+ reviews</span>
                    </div>
                  </div>
                </div>

                {/* Property Details Grid */}
                <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-100">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="font-semibold text-gray-900 text-sm">5 guests</div>
                    <div className="text-xs text-gray-500">Maximum</div>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Bed className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="font-semibold text-gray-900 text-sm">2 bedrooms</div>
                    <div className="text-xs text-gray-500">Private</div>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <div className="w-6 h-6 flex items-center justify-center">
                        <div className="w-4 h-4 bg-purple-600 rounded"></div>
                      </div>
                    </div>
                    <div className="font-semibold text-gray-900 text-sm">1 bathroom</div>
                    <div className="text-xs text-gray-500">Full bath</div>
                  </div>
                </div>

                {/* Price & Availability */}
                <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50 rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                  <div className="text-center space-y-3">
                    <div className="space-y-1">
                      <div className="text-3xl font-bold text-slate-900 tracking-tight">€110.50</div>
                      <div className="text-sm text-slate-500 font-medium uppercase tracking-wide">/per night</div>
                    </div>
                    <div className="pt-2">
                      <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                        <span className="text-sm text-emerald-700 font-semibold">Available</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:block">
              <div className="flex items-center justify-between p-8">
                {/* Left: Host Info */}
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-xl">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                      Entire apartment hosted by Fatima
                    </h2>
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2 bg-yellow-50 px-4 py-2 rounded-full">
                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                        <span className="font-semibold text-yellow-700">Superhost</span>
                      </div>
                      <span className="text-gray-600 font-medium">5+ years hosting</span>
                      <span className="text-gray-600 font-medium">100+ reviews</span>
                    </div>
                  </div>
                </div>

                {/* Center: Property Details */}
                <div className="flex items-center space-x-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">5 guests</div>
                      <div className="text-sm text-gray-500">Maximum capacity</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                      <Bed className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">2 bedrooms</div>
                      <div className="text-sm text-gray-500">Private spaces</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                      <div className="w-6 h-6 flex items-center justify-center">
                        <div className="w-4 h-4 bg-purple-600 rounded"></div>
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">1 bathroom</div>
                      <div className="text-sm text-gray-500">Full bathroom</div>
                    </div>
                  </div>
                </div>

                {/* Right: Price */}
                <div className="text-right">
                  <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50 rounded-2xl p-8 border border-slate-200/60 shadow-lg min-w-[200px]">
                    <div className="text-center space-y-4">
                      <div className="space-y-2">
                        <div className="text-4xl font-bold text-slate-900 tracking-tight">€110.50</div>
                        <div className="text-sm text-slate-500 font-medium uppercase tracking-wide">/per night</div>
                      </div>
                      <div className="pt-1">
                        <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-5 py-2.5 rounded-full">
                          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                          <span className="text-sm text-emerald-700 font-semibold">Available</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* —— Booking —— */}
      <section id="booking-section" className="py-16 px-4 max-w-4xl mx-auto">
        <Card><CardContent className="p-8 space-y-8">
          <h2 className="text-xl font-semibold flex items-center text-gray-900"><Clock className="w-5 h-5 mr-2 text-blue-600"/>Select your dates{isCheckingAvailability&&<Clock className="w-4 h-4 ml-2 animate-spin text-blue-600"/>}</h2>
          <AdvancedCalendar bookedCheckIns={bookedCheckInDates} onValidRangeSelect={handleValidRangeSelect}/>
          <div className="bg-blue-50 rounded-xl p-4 text-sm space-y-1"><div className="flex justify-between"><span>Check‑in</span><span>{checkIn||"—"}</span></div><div className="flex justify-between"><span>Check‑out</span><span>{checkOut||"—"}</span></div>{validationErrors.checkOut&&<p className="text-red-600 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{validationErrors.checkOut}</p>}</div>
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-1"><div className="flex justify-between"><span>€{discNight.toFixed(2)} × {nights} night{nights!==1&&"s"}</span><span>€{(discNight*nights).toFixed(2)}</span></div><div className="flex justify-between text-sm text-gray-600"><span>Cleaning</span><span>€{clean.toFixed(2)}</span></div><div className="flex justify-between text-sm text-gray-600"><span>Service</span><span>€{service.toFixed(2)}</span></div>{hasPet&&<div className="flex justify-between text-sm text-gray-600"><span>Pet fee</span><span>€{pet.toFixed(2)}</span></div>}<hr /><div className="flex justify-between font-semibold"><span>Total</span><span>€{total.toFixed(2)}</span></div></div>
          <Button disabled={Object.keys(validationErrors).length>0||!checkIn||!checkOut} className="w-full" asChild><a href="/api/login" className="flex items-center justify-center"><Lock className="w-4 h-4 mr-2"/>Reserve securely</a></Button>
        </CardContent></Card>
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
              <div key={title} className="bg-gray-50 rounded-xl p-6 flex space-x-4 items-start hover:shadow-sm">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow">{icon}</div>
                <div><h3 className="font-semibold text-gray-900 mb-1">{title}</h3><p className="text-sm text-gray-600">{desc}</p></div>
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
            <div key={name} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-semibold text-sm">{name[0]}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{name}</h4>
                  <p className="text-sm text-gray-600">{location}</p>
                </div>
              </div>
              <div className="flex mb-3">{[1,2,3,4,5].map(n=> <Star key={n} className="w-4 h-4 text-yellow-400 fill-current" />)}</div>
              <p className="text-gray-700 text-sm">"{text}"</p>
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
  )
}

/* Quick‑chat widget */
function ChatWidget(){
  const [open,setOpen]=useState(false);const[name,setName]=useState("");const[email,setEmail]=useState("");
  return open?(
    <div className="fixed bottom-6 right-6 w-80 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center"><h3 className="font-semibold">All'Arco</h3><button onClick={()=>setOpen(false)}><Lock className="w-4 h-4"/></button></div>
      <div className="p-4 text-gray-700 text-sm">👋 How can we help you?</div>
      <div className="p-4 space-y-3 border-t"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" className="w-full p-2 border rounded"/><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full p-2 border rounded"/><Button onClick={()=>setOpen(false)} className="w-full">Start chat</Button></div>
    </div>
  ):(
    <button onClick={()=>setOpen(true)} className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center z-50"><MessageCircle className="w-6 h-6"/></button>
  )
}