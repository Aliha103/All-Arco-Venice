import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { WebSocketService } from "@/services/WebSocketService";

/**
 * Professional realtime connection hook - WebSocket functionality DISABLED
 * This hook has been disabled to prevent page load interruption issues
 */
export function useRealtimeConnection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const wsServiceRef = useRef<WebSocketService | null>(null);

  useEffect(() => {
    // DISABLED: All WebSocket functionality
    // WebSocket connections have been disabled to prevent page load interruptions
    return () => {
      // No cleanup needed
    };
  }, [queryClient, toast]);

  return wsServiceRef.current;
}