import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Star, 
  ArrowLeft, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Users,
  MapPin,
  Hotel,
  ThumbsUp,
  MessageSquare,
  Clock,
  Lock
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  label: string;
  required?: boolean;
  description?: string;
}

const StarRating = ({ rating, onRatingChange, label, required = false, description }: StarRatingProps) => {
  const [hoveredStar, setHoveredStar] = useState(0);
  
  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
  
  return (
    <div className="space-y-3 group">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {(rating > 0 || hoveredStar > 0) && (
          <Badge variant="secondary" className="text-xs">
            {ratingLabels[hoveredStar || rating]}
          </Badge>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <div 
          className="flex space-x-1"
          onMouseLeave={() => setHoveredStar(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onRatingChange(star)}
              onMouseEnter={() => setHoveredStar(star)}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-1 transition-all duration-200 hover:scale-110 active:scale-95"
              aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
            >
              <Star
                className={`w-7 h-7 transition-all duration-200 ${
                  star <= (hoveredStar || rating)
                    ? 'text-yellow-400 fill-current drop-shadow-md' 
                    : 'text-gray-300 hover:text-gray-400'
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <span className="text-sm font-medium text-gray-600 ml-2">
            {rating}/5
          </span>
        )}
      </div>
      
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
      
      {required && rating === 0 && (
        <p className="text-xs text-red-500 flex items-center">
          <AlertCircle className="w-3 h-3 mr-1" />
          This rating is required
        </p>
      )}
    </div>
  );
};

export default function ReviewPage() {
  const [location, navigate] = useLocation();
  
  // Parse query parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('booking');
  const guestEmail = urlParams.get('email');




  const [formData, setFormData] = useState({
    guestName: '',
    content: '',
    rating: 0,
    cleanlinessRating: 0,
    accuracyRating: 0,
    locationRating: 0,
    checkinRating: 0,
    valueRating: 0,
    communicationRating: 0,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bookingInfo, setBookingInfo] = useState<any>(null);

  useEffect(() => {

    if (!bookingId || !guestEmail) {

      toast({
        title: "Invalid Link",
        description: "This review link is invalid or expired.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    // Fetch booking information to verify and prefill guest name
    fetchBookingInfo();
  }, [bookingId, guestEmail]);

  const fetchBookingInfo = async () => {

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const booking = await response.json();


        // Trim and compare emails (case-insensitive)
        const bookingEmail = booking.guestEmail?.trim().toLowerCase();
        const expectedEmail = guestEmail?.trim().toLowerCase();
        
        if (bookingEmail === expectedEmail) {

          setBookingInfo(booking);
          setFormData(prev => ({
            ...prev,
            guestName: `${booking.guestFirstName} ${booking.guestLastName}`
          }));
        } else {



          throw new Error('Email mismatch');
        }
      } else {
        const errorData = await response.text();

        throw new Error('Booking not found');
      }
    } catch (error) {

      toast({
        title: "Error",
        description: "Unable to verify booking information.",
        variant: "destructive",
      });
      navigate('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.rating) {
      toast({
        title: "Missing Rating",
        description: "Please provide an overall rating.",
        variant: "destructive",
      });
      return;
    }

    if (formData.content.length < 10) {
      toast({
        title: "Review Too Short",
        description: "Please write at least 10 characters for your review.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reviews/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: parseInt(bookingId!),
          guestEmail: guestEmail!,
          ...formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        toast({
          title: "Review Submitted!",
          description: "Thank you for your review. It will be published after admin approval.",
        });
        // Don't navigate away, show success state instead
      } else {
        throw new Error(data.message || 'Failed to submit review');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!bookingInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border-t-4 border-blue-600 animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Verifying your booking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 group"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
              Back to Home
            </button>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Secure Review Portal</span>
            </div>
          </div>
        </div>
      </div>

      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <CheckCircle className="w-4 h-4" />
              <span>Verified Booking</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Share Your Experience
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Help future guests by sharing your honest review of your recent stay
            </p>
          </div>

          {/* Booking Info Card */}
          <Card className="mb-8 border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Hotel className="w-5 h-5 mr-2 text-blue-600" />
                  Confirmation Code
                </h3>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-mono text-lg px-4 py-2">
                  {bookingInfo.confirmationCode}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{new Date(bookingInfo.checkInDate).toLocaleDateString()} - {new Date(bookingInfo.checkOutDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  <span>{bookingInfo.guests} guest{bookingInfo.guests !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{bookingInfo.guestCountry}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Review Form */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                  Rate Your Stay
                </CardTitle>
                <p className="text-gray-600">
                  Your feedback helps us improve and assists future guests
                </p>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-8">
              {isSubmitted ? (
                // Success State - Review Submitted
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-6">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Review Submitted Successfully!
                  </h3>
                  <p className="text-lg text-gray-600 mb-6 max-w-md mx-auto">
                    Thank you for sharing your experience. Your review will be published after admin approval.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
                    <div className="flex items-center text-green-800">
                      <Clock className="w-5 h-5 mr-2" />
                      <span className="font-medium">Review Status: Under Review</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Typically approved within 24 hours
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => navigate('/')}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
                    >
                      Return to Home
                    </Button>
                    <div>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setIsSubmitted(false);
                          setFormData({
                            guestName: `${bookingInfo.guestFirstName} ${bookingInfo.guestLastName}`,
                            content: '',
                            rating: 0,
                            cleanlinessRating: 0,
                            accuracyRating: 0,
                            locationRating: 0,
                            checkinRating: 0,
                            valueRating: 0,
                            communicationRating: 0,
                          });
                        }}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Submit Another Review
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                {/* Guest Info */}
                <div className="bg-gray-50/50 rounded-xl p-6 border border-gray-200/50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-600" />
                    Guest Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Name *
                      </label>
                      <Input
                        value={formData.guestName}
                        onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                        required
                        className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>
                </div>

                {/* Overall Rating */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200/50">
                  <StarRating
                    rating={formData.rating}
                    onRatingChange={(rating) => setFormData({ ...formData, rating })}
                    label="Overall Rating"
                    required={true}
                    description="Rate your overall experience during this stay"
                  />
                </div>

                {/* Detailed Ratings */}
                <div className="bg-blue-50/30 rounded-xl p-6 border border-blue-200/50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <Star className="w-5 h-5 mr-2 text-blue-600" />
                    Detailed Ratings
                    <span className="text-sm font-normal text-gray-500 ml-2">(Optional)</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StarRating
                      rating={formData.cleanlinessRating}
                      onRatingChange={(rating) => setFormData({ ...formData, cleanlinessRating: rating })}
                      label="Cleanliness"
                      description="How clean was the property?"
                    />
                    <StarRating
                      rating={formData.accuracyRating}
                      onRatingChange={(rating) => setFormData({ ...formData, accuracyRating: rating })}
                      label="Accuracy"
                      description="Did it match the description?"
                    />
                    <StarRating
                      rating={formData.locationRating}
                      onRatingChange={(rating) => setFormData({ ...formData, locationRating: rating })}
                      label="Location"
                      description="How was the neighborhood?"
                    />
                    <StarRating
                      rating={formData.checkinRating}
                      onRatingChange={(rating) => setFormData({ ...formData, checkinRating: rating })}
                      label="Check-in"
                      description="How smooth was check-in?"
                    />
                    <StarRating
                      rating={formData.valueRating}
                      onRatingChange={(rating) => setFormData({ ...formData, valueRating: rating })}
                      label="Value"
                      description="Was it worth the price?"
                    />
                    <StarRating
                      rating={formData.communicationRating}
                      onRatingChange={(rating) => setFormData({ ...formData, communicationRating: rating })}
                      label="Communication"
                      description="How responsive was the host?"
                    />
                  </div>
                </div>

                {/* Review Content */}
                <div className="bg-purple-50/30 rounded-xl p-6 border border-purple-200/50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ThumbsUp className="w-5 h-5 mr-2 text-purple-600" />
                    Written Review *
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Share your experience in detail
                    </label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Tell us about your stay... What did you love? What could be improved? Any tips for future guests?"
                      rows={6}
                      required
                      minLength={10}
                      maxLength={1000}
                      className={`bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500 resize-none ${
                        formData.content.length < 10 && formData.content.length > 0 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : ''
                      }`}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className={`text-xs ${
                        formData.content.length < 10 && formData.content.length > 0 
                          ? 'text-red-500' 
                          : 'text-gray-500'
                      }`}>
                        {formData.content.length < 10 && formData.content.length > 0 
                          ? `${10 - formData.content.length} more characters needed` 
                          : 'Minimum 10 characters'
                        }
                      </p>
                      <p className="text-xs text-gray-500">
                        {formData.content.length}/1000
                      </p>
                    </div>
                  </div>
                </div>

                {/* Security Notice */}
                <Alert className="bg-green-50 border-green-200">
                  <Lock className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Privacy Protected:</strong> Your review will be moderated before publication. 
                    Personal information will be kept confidential.
                  </AlertDescription>
                </Alert>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button
                    type="submit"
                    size="lg"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    disabled={isSubmitting || !formData.rating || formData.content.length < 10}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Submitting Review...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Submit Review
                      </>
                    )}
                  </Button>
                </div>

                {/* Footer Notice */}
                <div className="text-center pt-4 border-t border-gray-200/50">
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-2">
                    <Clock className="w-4 h-4" />
                    <span>Reviews are typically approved within 24 hours</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    By submitting this review, you agree to our terms of service and privacy policy.
                  </p>
                </div>
              </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}