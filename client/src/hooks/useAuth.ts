import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const queryResult = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 2000,
  });

  const { data: user, isLoading, error, isSuccess, status } = queryResult;

  // More robust authentication detection
  const isAuthenticated = status === 'success' && !!user;

  // Debug logging
  console.log('useAuth hook - status:', status);
  console.log('useAuth hook - user:', user);
  console.log('useAuth hook - isSuccess:', isSuccess);
  console.log('useAuth hook - error:', error);
  console.log('useAuth hook - isAuthenticated:', isAuthenticated);

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
  };
}
