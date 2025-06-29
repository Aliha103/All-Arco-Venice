import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/home";
import Landing from "@/pages/landing";
import BookingPage from "@/pages/booking";
import BookingsPage from "@/pages/bookings";
import Signup from "@/pages/signup";
import Login from "@/pages/login";
import AdminDashboard from "@/pages/admin-dashboard";
import Checkout from "@/pages/checkout";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public routes (always accessible) */}
      <Route path="/signup" component={Signup} />
      <Route path="/login" component={Login} />
      
      {/* Landing page for non-authenticated users */}
      <Route path="/" component={Landing} />
      
      {/* Public booking page */}
      <Route path="/booking" component={BookingPage} />
      
      {/* Bookings page - accessible to everyone for lookup functionality */}
      <Route path="/bookings" component={BookingsPage} />
      
      {/* Always accessible routes - auth handled inside components */}
      <Route path="/dashboard" component={AdminDashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/settings" component={Settings} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
