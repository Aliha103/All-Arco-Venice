import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 0, // Always check server for fresh data
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchInterval: false,
    refetchOnMount: true,
    refetchOnReconnect: true, // Refetch when reconnecting
    enabled: true,
  });

  console.log('🔴 useAuth hook - Current user:', user);
  console.log('🔴 useAuth hook - Is authenticated:', !!user);
  console.log('🔴 useAuth hook - Is loading:', isLoading);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
