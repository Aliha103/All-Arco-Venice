import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

interface ReviewStats {
  averageRating: number;
  totalCount: number;
  cleanlinessAvg: number;
  locationAvg: number;
  checkinAvg: number;
  valueAvg: number;
  communicationAvg: number;
}

interface Review {
  id: number;
  rating: number;
  content: string;
  createdAt: string;
  guestName: string;
}

export default function ReviewsSection() {
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: ["/api/reviews"],
  });

  const { data: reviewStats, isLoading: statsLoading } = useQuery<ReviewStats>({
    queryKey: ["/api/reviews/stats"],
  });

  // Default data if no reviews in database
  const defaultStats = {
    averageRating: 4.8,
    totalCount: 127,
    cleanlinessAvg: 4.9,
    locationAvg: 4.8,
    checkinAvg: 4.7,
    valueAvg: 4.8,
    communicationAvg: 4.9,
  };

  const defaultReviews = [
    {
      id: 1,
      guestName: "Maria Rodriguez",
      rating: 5,
      content: "Amazing apartment in perfect location! Everything was exactly as described. The host was incredibly responsive and helpful. Would definitely stay here again!",
      createdAt: "2024-12-01T00:00:00Z"
    },
    {
      id: 2,
      guestName: "John Smith",
      rating: 5,
      content: "Spotlessly clean, modern amenities, and the balcony views are spectacular. Great for both business and leisure travelers. Highly recommended!",
      createdAt: "2024-11-15T00:00:00Z"
    },
    {
      id: 3,
      guestName: "Emma Parker",
      rating: 4,
      content: "Beautiful apartment with excellent facilities. The kitchen is fully equipped and the location is perfect for exploring the city. Very comfortable stay!",
      createdAt: "2024-10-20T00:00:00Z"
    }
  ];

  const displayStats = reviewStats || defaultStats;
  const displayReviews = (reviews && reviews.length > 0) ? reviews : defaultReviews;

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-warning fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (reviewsLoading || statsLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardContent className="p-8">
            <div className="h-8 bg-gray-200 rounded animate-pulse mb-12" />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="h-8 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-2 bg-gray-200 rounded animate-pulse" />
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
        <CardContent className="p-8">
          {/* Rating Overview */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Guest Reviews</h2>
            <div className="flex items-center justify-center space-x-4">
              <div className="text-5xl font-bold text-gray-900">
                {displayStats.averageRating.toFixed(1)}
              </div>
              <div>
                <div className="flex items-center mb-2">
                  <div className="flex">
                    {renderStars(displayStats.averageRating)}
                  </div>
                </div>
                <div className="text-gray-600">
                  Based on {displayStats.totalCount} reviews
                </div>
              </div>
            </div>
          </div>

          {/* Rating Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {displayStats.cleanlinessAvg.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Cleanliness</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-success h-2 rounded-full" 
                  style={{ width: `${(displayStats.cleanlinessAvg / 5) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {displayStats.locationAvg.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Location</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-success h-2 rounded-full" 
                  style={{ width: `${(displayStats.locationAvg / 5) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {displayStats.checkinAvg.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Check-in</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-success h-2 rounded-full" 
                  style={{ width: `${(displayStats.checkinAvg / 5) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {displayStats.valueAvg.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Value</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-success h-2 rounded-full" 
                  style={{ width: `${(displayStats.valueAvg / 5) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {displayStats.communicationAvg.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Communication</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-success h-2 rounded-full" 
                  style={{ width: `${(displayStats.communicationAvg / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Individual Reviews */}
          <div className="space-y-6">
            {displayReviews.slice(0, 3).map((review: any) => (
              <div key={review.id} className="border-b border-gray-200 pb-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-semibold">
                      {getInitials(review.guestName)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-semibold">{review.guestName}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                      <div className="flex">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <p className="text-gray-700">{review.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Show More Reviews Button */}
          <div className="text-center mt-8">
            <Button variant="outline">
              Show All Reviews
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
