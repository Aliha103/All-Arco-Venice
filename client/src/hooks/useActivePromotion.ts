import { useQuery } from "@tanstack/react-query";

interface ActivePromotion {
  hasActivePromotion: boolean;
  promotionName: string | null;
  discountPercentage: number;
  tag?: string;
  description?: string;
}

export function useActivePromotion() {
  return useQuery<ActivePromotion>({
    queryKey: ["/api/active-promotion"],
    queryFn: async () => {
      const response = await fetch("/api/promotions/current-effect");
      if (!response.ok) {
        throw new Error("Failed to fetch promotion");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - WebSocket will update when needed
    // Removed refetchInterval - WebSocket handles real-time updates
  });
}