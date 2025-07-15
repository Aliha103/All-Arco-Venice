import React, { Suspense, useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StackHandler, StackProvider, StackTheme } from "@stackframe/react";
import { useAuth } from "@/hooks/useAuth";
import { useBrowserCloseHandler } from "@/hooks/useBrowserCloseHandler";
import Home from "@/pages/home";
import Landing from "@/pages/landing";
import BookingPage from "@/pages/booking";
import BookingsPage from "@/pages/bookings";
import ReviewPage from "@/pages/review";
import Signup from "@/pages/signup";
import Login from "@/pages/login";
import AdminDashboard from "@/pages/admin-dashboard";
import Checkout from "@/pages/checkout";
import Settings from "@/pages/settings";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";
import OAuthDebug from "@/pages/oauth-debug";
import { stackClientApp } from "./stack";
import CelebrationModal from "@/components/CelebrationModal";
// DISABLED: import { WebSocketService, createWebSocketUrl } from "@/services/WebSocketService";

const StackHandlerRoutes: React.FC = () => {
  const [location] = useLocation();
  
  return (
    <StackHandler app={stackClientApp} location={location} fullPage />
  );
};

const Router: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* StackFrame authentication handler routes */}
      <Route path="/handler/*" component={StackHandlerRoutes} />
      
      {/* Public routes (always accessible) */}
      <Route path="/signup" component={Signup} />
      <Route path="/login" component={Login} />
      <Route path="/oauth-debug" component={OAuthDebug} />
      
      {/* Landing page for non-authenticated users */}
      <Route path="/" component={Landing} />
      
      {/* Public booking page */}
      <Route path="/booking" component={BookingPage} />
      
      {/* Bookings page - accessible to everyone for lookup functionality */}
      <Route path="/bookings" component={BookingsPage} />
      
      {/* Review page for guests */}
      <Route path="/review" component={ReviewPage} />
      
      {/* Always accessible routes - auth handled inside components */}
      <Route path="/dashboard" component={AdminDashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/settings" component={Settings} />
      <Route path="/profile" component={Profile} />
      
      <Route component={NotFound} />
    </Switch>
  );
};

const App: React.FC = () => {
  // Handle browser close events and localStorage cleanup
  useBrowserCloseHandler();
  
  // Celebration modal state
  const [celebrationData, setCelebrationData] = useState<any>(null);
  const [isModalOpen, setModalOpen] = useState(false);

  // WebSocket connection for celebrations - DISABLED
  // useEffect(() => {
  //   const webSocketService = new WebSocketService({ url: createWebSocketUrl() });
  //   webSocketService.connect();

  //   const handleCelebrationMessage = (message: any) => {
  //     if (message.type === 'celebration_notification') {
  //       console.log('🎉 Received celebration notification:', message.data);
  //       setCelebrationData(message.data);
  //       setModalOpen(true);
  //     }
  //   };

  //   webSocketService.on('celebration_notification', handleCelebrationMessage);

  //   return () => {
  //     webSocketService.off('celebration_notification', handleCelebrationMessage);
  //     webSocketService.disconnect();
  //   };
  // }, []);

  // Test celebration event listener for development
  useEffect(() => {
    const handleTestCelebration = (event: any) => {
      console.log('🎉 Test celebration triggered:', event.detail);
      setCelebrationData(event.detail.data);
      setModalOpen(true);
    };

    window.addEventListener('test-celebration', handleTestCelebration);

    return () => {
      window.removeEventListener('test-celebration', handleTestCelebration);
    };
  }, []);
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StackProvider app={stackClientApp}>
        <StackTheme>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Toaster />
              <Router />
              <CelebrationModal
                isOpen={isModalOpen}
                onRequestClose={() => setModalOpen(false)}
                celebrationData={celebrationData ? {
                  primaryMessage: celebrationData.messages?.primary || 'Congratulations!',
                  secondaryMessage: celebrationData.messages?.secondary || 'You earned credits!',
                  creditAmount: celebrationData.creditAmount || 0,
                } : { primaryMessage: '', secondaryMessage: '', creditAmount: 0 }}
              />
            </TooltipProvider>
          </QueryClientProvider>
        </StackTheme>
      </StackProvider>
    </Suspense>
  );
};

export default App;
