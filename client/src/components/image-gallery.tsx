import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Trash2 } from "lucide-react";

export default function ImageGallery() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImages, setSelectedImages] = useState<number[]>([]);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["/api/property-images"],
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: number) => {
      await apiRequest("DELETE", `/api/property-images/${imageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/property-images"] });
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
      setSelectedImages([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageSelect = (imageId: number) => {
    if (user?.role !== 'admin') return;
    
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedImages.length === 0) return;
    
    selectedImages.forEach(imageId => {
      deleteImageMutation.mutate(imageId);
    });
  };

  // Default images if none in database
  const defaultImages = [
    {
      id: 1,
      url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      alt: "Elegant living room of All'arco Apartment",
      isPrimary: true
    },
    {
      id: 2,
      url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      alt: "Modern kitchen",
      isPrimary: false
    },
    {
      id: 3,
      url: "https://images.unsplash.com/photo-1556020685-ae41abfc9365?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      alt: "Comfortable bedroom",
      isPrimary: false
    },
    {
      id: 4,
      url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      alt: "Modern bathroom",
      isPrimary: false
    },
    {
      id: 5,
      url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      alt: "Balcony with city view",
      isPrimary: false
    }
  ];

  const displayImages = images.length > 0 ? images : defaultImages;
  const primaryImage = displayImages.find((img: any) => img.isPrimary) || displayImages[0];
  const secondaryImages = displayImages.filter((img: any) => !img.isPrimary).slice(0, 4);

  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Main Image */}
        <div className="lg:row-span-2">
          <img
            src={primaryImage?.url}
            alt={primaryImage?.alt || "Main apartment view"}
            className={`w-full h-full object-cover rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer ${
              user?.role === 'admin' && selectedImages.includes(primaryImage?.id) 
                ? 'ring-4 ring-primary' 
                : ''
            }`}
            onClick={() => handleImageSelect(primaryImage?.id)}
          />
        </div>
        
        {/* Secondary Images */}
        <div className="grid grid-cols-2 gap-4">
          {secondaryImages.map((image: any) => (
            <img
              key={image.id}
              src={image.url}
              alt={image.alt || "Apartment view"}
              className={`w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer ${
                user?.role === 'admin' && selectedImages.includes(image.id) 
                  ? 'ring-4 ring-primary' 
                  : ''
              }`}
              onClick={() => handleImageSelect(image.id)}
            />
          ))}
        </div>
      </div>

      {/* Admin Image Management */}
      {user?.role === 'admin' && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Image Management</h3>
            <div className="flex space-x-3">
              <Button className="bg-secondary hover:bg-blue-700">
                <Upload className="mr-2 h-4 w-4" />
                Upload New Images
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeleteSelected}
                disabled={selectedImages.length === 0 || deleteImageMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({selectedImages.length})
              </Button>
            </div>
            {selectedImages.length > 0 && (
              <p className="text-sm text-blue-700 mt-2">
                Click on images to select/deselect them for deletion
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </section>
  );
}
