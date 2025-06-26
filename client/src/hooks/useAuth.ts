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

  // Debug logging in useAuth hook
  console.log("=== USEAUTH DEBUG ===");
  console.log("Query status:", status);
  console.log("Query isSuccess:", isSuccess);
  console.log("Query isLoading:", isLoading);
  console.log("Query error:", error);
  console.log("Raw data from query:", user);
  console.log("Data type:", typeof user);
  console.log("=== USEAUTH DEBUG END ===");

  // More robust authentication detection
  const isAuthenticated = status === 'success' && !!user;

  console.log("Computed isAuthenticated:", isAuthenticated);

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
  };
}
