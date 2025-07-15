import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error, refetch } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }), // Return null instead of throwing on 401
    retry: (failureCount, error) => {
      // Retry up to 2 times for network errors, but not for 401/403
      if (error && (error as any).status === 401 || (error as any).status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes (reduced for better admin checks)
    refetchOnWindowFocus: false, // Disable refetch on window focus to prevent chat widget re-renders
    refetchInterval: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    enabled: true,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user && (user as any)?.role === 'admin',
    error,
    refetch,
  };
}
