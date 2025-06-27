import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HeroImage {
  id: number;
  url: string;
  title: string;
  alt: string;
  position: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function HeroImagesGrid() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch active hero images
  const { data: heroImages, isLoading } = useQuery<HeroImage[]>({
    queryKey: ["/api/hero-images/active"],
    retry: false,
  });

  // Filter and organize images by position
  const activeImages = heroImages?.filter(img => img.isActive) || [];
  
  const getImageByPosition = (position: string) => {
    return activeImages.find(img => img.position === position);
  };

  const mainImage = getImageByPosition("main");
  const topRightImage = getImageByPosition("top-right");
  const topLeftImage = getImageByPosition("top-left");
  const bottomRightImage = getImageByPosition("bottom-right");
  const bottomLeftImage = getImageByPosition("bottom-left");

  // Calculate additional images count for booking.com style display
  const displayedPositions = ["main", "top-right", "top-left", "bottom-right", "bottom-left"];
  const displayedImages = activeImages.filter(img => displayedPositions.includes(img.position));
  const additionalImagesCount = Math.max(0, activeImages.length - displayedImages.length);

  // Fallback placeholder content
  const placeholders = {
    main: { title: "Main Bedroom", bgColor: "bg-gray-200", textColor: "text-gray-700" },
    "top-right": { title: "Living Room", bgColor: "bg-blue-100", textColor: "text-blue-600" },
    "top-left": { title: "Kitchen", bgColor: "bg-green-100", textColor: "text-green-600" },
    "bottom-right": { title: "Bathroom", bgColor: "bg-purple-100", textColor: "text-purple-600" },
    "bottom-left": { title: "Balcony/Outdoor", bgColor: "bg-yellow-100", textColor: "text-yellow-600" },
    other: { title: "Other Space", bgColor: "bg-orange-100", textColor: "text-orange-600" }
  };

  const renderImageOrPlaceholder = (image: HeroImage | undefined, position: string, className: string = "", showCounter: boolean = false) => {
    const placeholder = placeholders[position as keyof typeof placeholders];
    
    if (image) {
      return (
        <div className={`relative overflow-hidden ${className}`}>
          <img 
            src={image.url} 
            alt={image.alt}
            title={image.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              const target = e.target as HTMLImageElement;
              const parent = target.parentElement!;
              parent.innerHTML = `
                <div class="w-full h-full flex items-center justify-center ${placeholder.bgColor} ${placeholder.textColor} font-medium text-sm">
                  ${image.title}
                </div>
              `;
            }}
          />
          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
            {image.title}
          </div>
          {showCounter && additionalImagesCount > 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-white text-black px-3 py-2 rounded-md font-medium text-sm shadow-lg hover:bg-gray-100 transition-colors cursor-pointer">
                +{additionalImagesCount} photos
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={`relative w-full h-full flex items-center justify-center ${placeholder.bgColor} ${placeholder.textColor} font-medium text-sm ${className}`}>
        {placeholder.title}
        {showCounter && additionalImagesCount > 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white text-black px-3 py-2 rounded-md font-medium text-sm shadow-lg hover:bg-gray-100 transition-colors cursor-pointer">
              +{additionalImagesCount} photos
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="relative">
        {/* Desktop Loading State */}
        <div className="hidden md:grid md:grid-cols-5 md:grid-rows-2 gap-1 h-64 sm:h-80 lg:h-96 rounded-xl overflow-hidden">
          <div className="col-span-3 row-span-2 bg-gray-200 animate-pulse rounded-l-xl"></div>
          <div className="bg-gray-200 animate-pulse"></div>
          <div className="bg-gray-200 animate-pulse rounded-tr-xl"></div>
          <div className="bg-gray-200 animate-pulse"></div>
          <div className="bg-gray-200 animate-pulse rounded-br-xl"></div>
        </div>
        
        {/* Mobile Loading State */}
        <div className="md:hidden h-64 bg-gray-200 animate-pulse rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Desktop and Tablet Layout */}
      <div className="hidden md:grid md:grid-cols-5 md:grid-rows-2 gap-1 h-64 sm:h-80 lg:h-96 rounded-xl overflow-hidden">
        {/* Main large image - spans 3 columns and 2 rows */}
        <div className="col-span-3 row-span-2 relative">
          {renderImageOrPlaceholder(mainImage, "main", "rounded-l-xl")}
        </div>
        
        {/* Top right - 2 small images */}
        <div className="relative">
          {renderImageOrPlaceholder(topLeftImage, "top-left", "")}
        </div>
        <div className="relative">
          {renderImageOrPlaceholder(topRightImage, "top-right", "rounded-tr-xl")}
        </div>
        
        {/* Bottom right - 2 small images */}
        <div className="relative">
          {renderImageOrPlaceholder(bottomLeftImage, "bottom-left", "")}
        </div>
        <div className="relative">
          {renderImageOrPlaceholder(bottomRightImage, "bottom-right", "rounded-br-xl", true)}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden grid grid-cols-1 gap-2 h-64 rounded-xl overflow-hidden">
        <div className="relative">
          {renderImageOrPlaceholder(mainImage, "main", "rounded-xl", true)}
        </div>
      </div>
    </div>
  );
}