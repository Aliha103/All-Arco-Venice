import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import { useToast } from "./use-toast";

export function useAdminAuth() {
  const { data: user, isLoading, error, refetch } = useQuery<User>({
    queryKey: ["/api/admin/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: (failureCount, error) => {
      if (error && ((error as any).status === 401 || (error as any).status === 403)) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 1 * 60 * 1000, // Cache for 1 minute
    refetchOnWindowFocus: true,
    refetchInterval: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    enabled: true,
  });
  
  const isAuthenticated = !!user;
  const isAdmin = user && ((user as any)?.role === 'admin' || (user as any)?.role === 'team_member');
  const [isValidating, setIsValidating] = useState(true);
  const [hasValidated, setHasValidated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Initial validation
    if (!isLoading && !hasValidated) {
      setIsValidating(true);
      
      // Add a small delay to ensure auth state is stable
      const timeoutId = setTimeout(() => {
        if (!isAuthenticated) {
          toast({
            title: "Authentication Required",
            description: "Please log in to access the admin dashboard.",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/";
          }, 1500);
        } else if (!isAdmin) {
          toast({
            title: "Access Denied",
            description: "You need admin privileges to access this page.",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/";
          }, 1500);
        } else {
          setIsValidating(false);
        }
        setHasValidated(true);
      }, 500); // Small delay to ensure stable auth state

      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, isAuthenticated, isAdmin, hasValidated, toast]);

  // Handle auth state changes (like session expiry)
  useEffect(() => {
    if (hasValidated && !isLoading) {
      if (!isAuthenticated) {
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else if (!isAdmin) {
        toast({
          title: "Access Revoked",
          description: "Your admin access has been revoked.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      }
    }
  }, [isAuthenticated, isAdmin, hasValidated, isLoading, toast]);

  // Retry authentication on error
  useEffect(() => {
    if (error && hasValidated) {
      console.error("Admin auth error:", error);
      
      // Retry authentication once
      const retryTimeout = setTimeout(() => {
        refetch();
      }, 1000);

      return () => clearTimeout(retryTimeout);
    }
  }, [error, hasValidated, refetch]);

  return {
    user,
    isLoading: isLoading || isValidating,
    isAuthenticated,
    isAdmin,
    isValidating,
    hasValidated,
    error,
    refetch,
  };
}