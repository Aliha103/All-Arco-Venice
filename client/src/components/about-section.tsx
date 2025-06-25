import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Home, Star, Edit } from "lucide-react";

export default function AboutSection() {
  const { user } = useAuth();

  const { data: aboutContent = [], isLoading } = useQuery({
    queryKey: ["/api/about-content"],
  });

  // Default content if none in database
  const defaultContent = [
    {
      id: 1,
      title: "Prime Location",
      description: "Located in the heart of the city, walking distance to major attractions, restaurants, and public transport.",
      icon: "map-pin",
      isActive: true
    },
    {
      id: 2,
      title: "Luxury Comfort",
      description: "Spacious 2-bedroom apartment with modern amenities, fully equipped kitchen, and stunning city views from two balconies.",
      icon: "home",
      isActive: true
    },
    {
      id: 3,
      title: "5-Star Experience",
      description: "Exceptional hospitality with 24/7 support, concierge services, and personalized recommendations for your stay.",
      icon: "star",
      isActive: true
    }
  ];

  const displayContent = aboutContent.length > 0 ? aboutContent : defaultContent;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'map-pin':
        return <MapPin className="text-primary text-2xl" />;
      case 'home':
        return <Home className="text-success text-2xl" />;
      case 'star':
        return <Star className="text-warning text-2xl" />;
      default:
        return <MapPin className="text-primary text-2xl" />;
    }
  };

  const getIconBgColor = (iconName: string) => {
    switch (iconName) {
      case 'map-pin':
        return 'bg-primary bg-opacity-10';
      case 'home':
        return 'bg-success bg-opacity-10';
      case 'star':
        return 'bg-warning bg-opacity-10';
      default:
        return 'bg-primary bg-opacity-10';
    }
  };

  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardContent className="p-8">
            <div className="h-8 bg-gray-200 rounded animate-pulse mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mx-auto mb-4" />
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-3" />
                  <div className="h-20 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-3xl">Why All'arco Apartment?</CardTitle>
            
            {/* Admin Edit Controls */}
            {user?.role === 'admin' && (
              <Button className="bg-secondary hover:bg-blue-700">
                <Edit className="mr-2 h-4 w-4" />
                Edit Content
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayContent.map((item: any) => (
              <div key={item.id} className="text-center">
                <div className={`w-16 h-16 ${getIconBgColor(item.icon)} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  {getIcon(item.icon)}
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
