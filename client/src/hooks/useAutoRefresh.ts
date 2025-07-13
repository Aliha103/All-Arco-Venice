import { useEffect, useRef, useCallback, useState } from 'react';
import { useWebSocketState } from './useWebSocketState';

interface UseAutoRefreshOptions {
  enabled?: boolean;
  queryKeys?: string[];
  fallbackInterval?: number; // Only used if WebSocket fails
}

export function useAutoRefresh(options: UseAutoRefreshOptions = {}) {
  const {
    enabled = true,
    queryKeys = [
      '/api/analytics',
      '/api/bookings',
      '/api/pricing-settings',
      '/api/promotions',
      '/api/hero-images',
      '/api/users',
      '/api/reviews'
    ],
    fallbackInterval = 30000 // 30 seconds as fallback only
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(enabled);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [isUsingWebSocket, setIsUsingWebSocket] = useState(true);

  // Use WebSocket state for connection monitoring
  const { isConnected } = useWebSocketState();

  const refreshData = useCallback(() => {
    if (!isActiveRef.current) return;
    
    // Update refresh tracking
    setLastRefreshTime(new Date());
    setRefreshCount(prev => prev + 1);
  }, []);

  // Fallback polling - only used if WebSocket is not available
  const startFallbackPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (enabled && !isUsingWebSocket) {
      console.warn('WebSocket unavailable, falling back to polling every', fallbackInterval, 'ms');
      intervalRef.current = setInterval(refreshData, fallbackInterval);
      isActiveRef.current = true;
    }
  }, [enabled, fallbackInterval, refreshData, isUsingWebSocket]);

  const stopFallbackPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isActiveRef.current = false;
  }, []);

  // Monitor WebSocket connection status
  useEffect(() => {
    setIsUsingWebSocket(isConnected);
    
    if (!isConnected && enabled) {
      // WebSocket is down, start fallback polling
      startFallbackPolling();
    } else if (isConnected) {
      // WebSocket is up, stop fallback polling
      stopFallbackPolling();
    }
  }, [isConnected, enabled, startFallbackPolling, stopFallbackPolling]);

  // Update active state when enabled prop changes
  useEffect(() => {
    isActiveRef.current = enabled;
    if (!enabled) {
      stopFallbackPolling();
    } else if (!isUsingWebSocket) {
      startFallbackPolling();
    }
  }, [enabled, isUsingWebSocket, startFallbackPolling, stopFallbackPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isAutoRefreshActive: isActiveRef.current,
    isUsingWebSocket,
    refreshData,
    lastRefreshTime,
    refreshCount,
    // Legacy methods for backward compatibility
    startAutoRefresh: () => {
      isActiveRef.current = true;
      if (!isUsingWebSocket) startFallbackPolling();
    },
    stopAutoRefresh: stopFallbackPolling,
    toggleAutoRefresh: () => {
      if (isActiveRef.current) {
        stopFallbackPolling();
        isActiveRef.current = false;
      } else {
        isActiveRef.current = true;
        if (!isUsingWebSocket) startFallbackPolling();
      }
    }
  };
}