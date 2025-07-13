import { useEffect, useState } from "react";
import { WebSocketState } from "@/services/WebSocketService";
import { useRealtimeConnection } from "./useRealtimeConnection";

/**
 * Hook to monitor WebSocket connection state
 * Useful for showing connection status in UI components
 */
export function useWebSocketState() {
  const [state, setState] = useState<WebSocketState>(WebSocketState.DISCONNECTED);
  const [isConnected, setIsConnected] = useState(false);
  const wsService = useRealtimeConnection();

  useEffect(() => {
    if (!wsService) return;

    // Initial state
    setState(wsService.getState());
    setIsConnected(wsService.isConnected());

    // Listen for state changes
    const handleStateChange = (newState: WebSocketState) => {
      setState(newState);
      setIsConnected(newState === WebSocketState.CONNECTED);
    };

    wsService.onStateChange(handleStateChange);

    // Update state periodically (in case of missed events)
    const interval = setInterval(() => {
      setState(wsService.getState());
      setIsConnected(wsService.isConnected());
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [wsService]);

  return {
    state,
    isConnected,
    isConnecting: state === WebSocketState.CONNECTING,
    isReconnecting: state === WebSocketState.RECONNECTING,
    hasError: state === WebSocketState.ERROR
  };
}
