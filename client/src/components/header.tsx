import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  User as UserIcon, 
  Bell, 
  Calendar, 
  MessageSquare, 
  Settings, 
  LogOut,
  BarChart3,
  LogIn,
  UserPlus,
  ChevronRight,
  Shield,
  Search,
  FileText
} from "lucide-react";
import { Link } from "wouter";
import { FindReservationModal } from "@/components/FindReservationModal";

export default function Header() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFindReservationOpen, setIsFindReservationOpen] = useState(false);
  const queryClient = useQueryClient();

  // All hooks must be called unconditionally
  const { data: unreadCount } = useQuery<number>({
    queryKey: ["/api/messages/unread-count"],
    enabled: !!user && (user as any)?.role === 'admin',
    // Removed refetchInterval - WebSocket handles real-time updates
  });

  const handleLogout = () => {
    // Immediate cache invalidation
    queryClient.removeQueries();
    queryClient.clear();
    
    // Force immediate window reload without waiting for server response
    // This ensures complete application state reset
    window.location.href = '/api/auth/logout-redirect';
  };

  // Show loading state without early return
  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="relative">
              <div className="w-9 h-9 sm:w-11 sm:h-11 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 shadow-xl flex items-center justify-center transform group-hover:scale-105 transition-all duration-500 ease-out">
                <div className="relative">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" viewBox="0 0 32 32" fill="none">
                    <path 
                      d="M8 24 L16 8 L24 24 M12 20 L20 20" 
                      stroke="currentColor" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="drop-shadow-sm"
                    />
                    <path 
                      d="M10 24 Q16 18 22 24" 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      fill="none"
                      opacity="0.7"
                    />
                    <circle cx="16" cy="12" r="1" fill="currentColor" opacity="0.8"/>
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 rounded-full"></div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out"></div>
              </div>
            </div>
            <div className="flex flex-col space-y-0.5">
              <div className="flex items-baseline space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                    All'
                  </span>
                  <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 bg-clip-text text-transparent">
                    Arco
                  </span>
                </h1>
                <div className="hidden sm:block text-xs font-semibold text-slate-500 tracking-widest uppercase border-l border-slate-300 pl-2 leading-tight">
                  Venice
                </div>
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 font-medium tracking-wide uppercase opacity-80 leading-none">
                Luxury Residence
              </div>
            </div>
          </Link>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Language Toggle */}
            <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600">
              <span className="font-medium">EN</span>
              <span className="text-gray-400">|</span>
              <button className="hover:text-gray-900 transition-colors">IT</button>
            </div>

            {/* User Authentication */}
            {user ? (
              <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-12 w-12 rounded-full bg-blue-100 hover:bg-blue-200 transition-all duration-200 border-2 border-blue-200 hover:border-blue-300">
                    <UserIcon className="w-5 h-5 text-blue-600" />
                    {unreadCount && unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500 hover:bg-red-600">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-50" align="end" forceMount>
                  <div className="flex items-center justify-start space-x-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-sm">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  
                  {(user as any)?.role !== 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/bookings" className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        My Bookings
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem asChild>
                    <Link href="/messages" className="flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Messages
                      {unreadCount && unreadCount > 0 && (
                        <Badge className="ml-auto h-5 w-5 p-0 text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </Link>
                  </DropdownMenuItem>

                  {(user as any)?.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-12 w-12 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                    <UserIcon className="w-5 h-5 text-gray-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 p-0 shadow-lg border-0 bg-white rounded-xl" align="end">
                  <div className="p-3 space-y-1">
                    {/* Sign In Option */}
                    <a href="/login" className="block">
                      <div className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-all duration-200 group">
                        <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                          <LogIn className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                            Sign In
                          </h3>
                        </div>
                      </div>
                    </a>

                    {/* Create Account Option */}
                    <a href="/signup" className="block">
                      <div className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-green-50 transition-all duration-200 group">
                        <div className="w-9 h-9 bg-green-500 rounded-lg flex items-center justify-center shadow-sm">
                          <UserPlus className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-800 group-hover:text-green-600 transition-colors">
                            Create Account
                          </h3>
                        </div>
                      </div>
                    </a>

                    
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}