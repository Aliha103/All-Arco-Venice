import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Wifi, Car, Wind, Utensils, Tv, Dumbbell, Shield } from "lucide-react";

const iconMap: { [key: string]: any } = {
  wifi: Wifi,
  car: Car,
  wind: Wind,
  utensils: Utensils,
  tv: Tv,
  dumbbell: Dumbbell,
  shield: Shield,
};

export default function AmenitiesSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: amenities = [], isLoading } = useQuery({
    queryKey: ["/api/amenities"],
  });

  const deleteAmenityMutation = useMutation({
    mutationFn: async (amenityId: number) => {
      await apiRequest("DELETE", `/api/amenities/${amenityId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/amenities"] });
      toast({
        title: "Success",
        description: "Amenity removed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Default amenities if none in database
  const defaultAmenities = [
    { id: 1, name: "Free Wi-Fi", icon: "wifi", isActive: true },
    { id: 2, name: "Free Parking", icon: "car", isActive: true },
    { id: 3, name: "Air Conditioning", icon: "wind", isActive: true },
    { id: 4, name: "Full Kitchen", icon: "utensils", isActive: true },
    { id: 5, name: "Smart TV", icon: "tv", isActive: true },
    { id: 6, name: "Gym Access", icon: "dumbbell", isActive: true },
    { id: 7, name: "24/7 Security", icon: "shield", isActive: true },
  ];

  const displayAmenities = amenities.length > 0 ? amenities : defaultAmenities;

  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-8">
            <div className="h-8 bg-gray-200 rounded animate-pulse mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Amenities & Features</CardTitle>
            
            {/* Admin Controls */}
            {user?.role === 'admin' && (
              <Button className="bg-secondary hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Amenity
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayAmenities.map((amenity: any) => {
              const IconComponent = iconMap[amenity.icon] || Wifi;
              
              return (
                <div 
                  key={amenity.id} 
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <IconComponent className="text-secondary text-xl flex-shrink-0" />
                  <span className="text-gray-700 font-medium flex-grow">{amenity.name}</span>
                  
                  {/* Admin delete button */}
                  {user?.role === 'admin' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-800 h-6 w-6"
                      onClick={() => deleteAmenityMutation.mutate(amenity.id)}
                      disabled={deleteAmenityMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
