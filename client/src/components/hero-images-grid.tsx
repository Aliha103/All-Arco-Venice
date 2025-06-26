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

  // Fallback placeholder content
  const placeholders = {
    main: { title: "Main bedroom", bgColor: "bg-gray-200", textColor: "text-gray-700" },
    "top-right": { title: "Living room", bgColor: "bg-blue-100", textColor: "text-blue-600" },
    "top-left": { title: "Kitchen", bgColor: "bg-green-100", textColor: "text-green-600" },
    "bottom-right": { title: "Bathroom", bgColor: "bg-purple-100", textColor: "text-purple-600" },
    "bottom-left": { title: "Balcony", bgColor: "bg-yellow-100", textColor: "text-yellow-600" }
  };

  const renderImageOrPlaceholder = (image: HeroImage | undefined, position: string, className: string = "") => {
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
        </div>
      );
    }

    return (
      <div className={`w-full h-full flex items-center justify-center ${placeholder.bgColor} ${placeholder.textColor} font-medium text-sm ${className}`}>
        {placeholder.title}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 h-64 sm:h-80 lg:h-96 rounded-xl overflow-hidden">
        <div className="bg-gray-200 animate-pulse rounded-l-xl lg:rounded-none"></div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-200 animate-pulse rounded-tr-xl"></div>
          <div className="bg-gray-200 animate-pulse"></div>
          <div className="bg-gray-200 animate-pulse"></div>
          <div className="bg-gray-200 animate-pulse rounded-br-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 h-64 sm:h-80 lg:h-96 rounded-xl overflow-hidden">
      {/* Main image - large left panel */}
      <div className="relative">
        {renderImageOrPlaceholder(mainImage, "main", "rounded-l-xl lg:rounded-none")}
      </div>

      {/* Right side grid - 2x2 */}
      <div className="grid grid-cols-2 gap-2">
        {/* Top row */}
        {renderImageOrPlaceholder(topLeftImage, "top-left", "")}
        {renderImageOrPlaceholder(topRightImage, "top-right", "rounded-tr-xl")}
        
        {/* Bottom row */}
        {renderImageOrPlaceholder(bottomLeftImage, "bottom-left", "")}
        {renderImageOrPlaceholder(bottomRightImage, "bottom-right", "rounded-br-xl")}
      </div>
    </div>
  );
}