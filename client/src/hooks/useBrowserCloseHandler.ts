import React, { useEffect } from 'react';
import { queryClient } from '@/lib/queryClient';
import { sessionManager } from '@/lib/sessionManager';

export function useBrowserCloseHandler() {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Use session manager to clear all storage
      sessionManager.clearAllStorage();
      
      // Clear React Query cache
      queryClient.clear();
      
    };

    const handleUnload = () => {
      // Final cleanup when page is actually being unloaded
      sessionManager.clearAllStorage();
      queryClient.clear();
    };

    // No visibility change handling to avoid annoyance
    // Only clear on actual browser close events

    const handlePageHide = () => {
      // Clear storage when page is hidden (covers mobile scenarios)
      sessionManager.clearAllStorage();
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    window.addEventListener('pagehide', handlePageHide);

    // Cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);
}
