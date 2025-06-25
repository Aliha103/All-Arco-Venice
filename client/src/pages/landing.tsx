import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, Wifi, Car, Wind, Utensils } from "lucide-react";

export default function Landing() {
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
      <section className="relative">
        <div className="h-64 sm:h-80 md:h-96 bg-gradient-to-r from-primary/10 to-secondary/10 flex items-center justify-center px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-3 sm:mb-4">
              Welcome to All'arco
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              Experience luxury and comfort in the heart of the city. Your perfect home away from home.
            </p>
            <Button size="lg" className="text-sm sm:text-base" asChild>
              <a href="/api/login">Start Booking</a>
            </Button>
          </div>
        </div>
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
