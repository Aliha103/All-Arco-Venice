import { useActivePromotion } from "@/hooks/useActivePromotion";

interface PriceDisplayProps {
  basePrice: number;
  className?: string;
  showPerNight?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export function PriceDisplay({ 
  basePrice, 
  className = "", 
  showPerNight = true,
  size = "md" 
}: PriceDisplayProps) {
  const { data: promotion } = useActivePromotion();
  
  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg md:text-xl",
    lg: "text-xl xl:text-2xl",
    xl: "text-2xl xl:text-3xl"
  };
  
  const crossOutClasses = {
    sm: "text-xs",
    md: "text-sm md:text-base",
    lg: "text-base xl:text-lg",
    xl: "text-lg xl:text-xl"
  };
  
  const perNightClasses = {
    sm: "text-xs",
    md: "text-sm md:text-base",
    lg: "text-base xl:text-lg",
    xl: "text-lg xl:text-xl"
  };

  if (promotion?.hasActivePromotion) {
    const discountedPrice = basePrice * (1 - promotion.discountPercentage / 100);
    
    return (
      <div className={`${className} flex flex-col`}>
        {promotion.tag && (
          <div className="inline-flex items-center px-2 py-1 mb-2 text-xs font-semibold text-white bg-red-500 rounded-full w-fit">
            {promotion.tag}
          </div>
        )}
        <div className="flex items-baseline gap-2">
          <div className={`font-semibold text-gray-900 ${sizeClasses[size]}`}>
            €{discountedPrice.toFixed(2)}
            {showPerNight && (
              <span className={`font-normal ${perNightClasses[size]}`}>
                /night
              </span>
            )}
          </div>
          <div className={`text-gray-500 line-through ${crossOutClasses[size]}`}>
            €{basePrice.toFixed(2)}
          </div>
        </div>
        {promotion.promotionName && (
          <div className="text-xs text-green-600 font-medium mt-1">
            {promotion.discountPercentage}% off - {promotion.promotionName}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className={`font-semibold text-gray-900 ${sizeClasses[size]}`}>
        €{basePrice.toFixed(2)}
        {showPerNight && (
          <span className={`font-normal ${perNightClasses[size]}`}>
            /night
          </span>
        )}
      </div>
    </div>
  );
}