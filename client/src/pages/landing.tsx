import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, Wifi, Car, Wind, Utensils } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-lg font-semibold text-gray-900">All'Arco Venice</h1>
            </div>

          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative">
        <div className="h-96 bg-gradient-to-r from-primary/10 to-secondary/10 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              Welcome to All'arco
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Experience luxury and comfort in the heart of the city. Your perfect home away from home.
            </p>
            <Button size="lg" asChild>
              <a href="/api/login">Start Booking</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose All'arco?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover what makes our apartment the perfect choice for your stay
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="p-6 text-center">
              <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Prime Location</h3>
              <p className="text-gray-600">
                Located in the heart of the city, walking distance to major attractions and restaurants.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Star className="w-12 h-12 text-warning mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">5-Star Experience</h3>
              <p className="text-gray-600">
                Exceptional hospitality with 24/7 support and personalized recommendations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-success bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Luxury Comfort</h3>
              <p className="text-gray-600">
                Spacious 2-bedroom apartment with modern amenities and stunning city views.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Amenities Preview */}
      <section className="bg-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Premium Amenities</h2>
            <p className="text-gray-600">Everything you need for a comfortable stay</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3 p-3">
              <Wifi className="text-secondary text-xl" />
              <span className="text-gray-700 font-medium">Free Wi-Fi</span>
            </div>
            <div className="flex items-center space-x-3 p-3">
              <Car className="text-secondary text-xl" />
              <span className="text-gray-700 font-medium">Free Parking</span>
            </div>
            <div className="flex items-center space-x-3 p-3">
              <Wind className="text-secondary text-xl" />
              <span className="text-gray-700 font-medium">Air Conditioning</span>
            </div>
            <div className="flex items-center space-x-3 p-3">
              <Utensils className="text-secondary text-xl" />
              <span className="text-gray-700 font-medium">Full Kitchen</span>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-primary py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Book Your Perfect Stay?
          </h2>
          <p className="text-primary-foreground mb-8 text-lg">
            Join thousands of satisfied guests who have made All'arco their home away from home.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <a href="/api/login">Book Your Stay Now</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">All'arco Apartment</h3>
              <p className="text-gray-300 mb-4">
                Experience luxury and comfort in the heart of the city. Your perfect home away from home.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">House Rules</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact Info</h4>
              <ul className="space-y-2 text-gray-300">
                <li>City Center, Downtown</li>
                <li>+1 (555) 123-4567</li>
                <li>info@allarco.com</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 All'arco Apartment. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
