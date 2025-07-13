import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { WebSocketService, createWebSocketUrl } from "@/services/WebSocketService";

/**
 * Professional realtime connection hook - completely rewritten
 * NO MORE CACHED CODE ISSUES
 */
export function useRealtimeConnection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const wsServiceRef = useRef<WebSocketService | null>(null);

  useEffect(() => {
    const wsService = new WebSocketService({
      url: createWebSocketUrl(),
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000
    });

    wsServiceRef.current = wsService;

    // Set up all message handlers
    wsService.on('new_booking', (message) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      
      toast({
        title: "New Booking",
        description: `New booking received: ${message.data?.confirmationNumber}`,
      });
    });

    wsService.on('new_message', (message) => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-timeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
      
      toast({
        title: "New Message",
        description: `Message from ${message.data?.senderName}`,
      });
    });

    wsService.on('calendar_update', (message) => {
      const { year, month } = message.data || {};
      queryClient.invalidateQueries({ 
        queryKey: ["/api/bookings/calendar", year, month] 
      });
    });

    wsService.on('analytics_update', () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
    });

    wsService.on('pricing_update', () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-settings"] });
    });

    wsService.on('promotion_update', () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/active-promotion"] });
    });

    wsService.on('review_update', () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/stats"] });
    });

    wsService.on('hero_images_update', () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-images"] });
    });

    wsService.on('users_update', () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    });

    wsService.on('pms_integration_update', () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pms/integrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pms/integrations/health"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pms/bookings/stats"] });
    });

    wsService.on('database_status_update', () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health"] });
    });

    // Connect
    wsService.connect();

    return () => {
      wsService.destroy();
    };
  }, [queryClient, toast]);

  return wsServiceRef.current;
}
