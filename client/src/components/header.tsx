import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
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
  Menu, 
  User as UserIcon, 
  Bell, 
  Calendar, 
  MessageSquare, 
  Settings, 
  LogOut,
  BarChart3
} from "lucide-react";
import { Link } from "wouter";

export default function Header() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Simple check: if we have user data with an ID, show authenticated UI
  const showUserDropdown = user && user.id;

  const { data: unreadCount } = useQuery({
    queryKey: ["/api/messages/unread-count"],
    enabled: !!user && user.role === 'admin',
    refetchInterval: 1000,
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="relative">
              <svg 
                width="40" 
                height="40" 
                viewBox="0 0 40 40" 
                className="text-blue-600"
                fill="currentColor"
              >
                <path d="M20 4 L32 12 Q32 20 20 28 Q8 20 8 12 Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <circle cx="20" cy="16" r="3" fill="currentColor"/>
              </svg>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                All'Arco
              </h1>
              <p className="text-xs text-gray-500 -mt-1">Venice</p>
            </div>
          </Link>

          {/* Navigation & User Menu */}
          <div className="flex items-center space-x-3">
            {/* Notification Icon for authenticated users */}
            {showUserDropdown && (
              <Button variant="ghost" size="sm" className="relative p-2 rounded-full hover:bg-gray-100">
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadCount && unreadCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[20px]">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* User Dropdown or Login Button */}
            {showUserDropdown ? (
              <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 border border-gray-300 rounded-full py-2 px-4 hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95">
                    <Menu className="h-4 w-4" />
                    <UserIcon className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-sm font-medium">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user?.email || "User"}
                    </div>
                    <div className="text-sm text-gray-600">{user?.email}</div>
                  </div>
                  
                  <DropdownMenuItem>
                    <Calendar className="mr-2 h-4 w-4" />
                    Bookings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Messages
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild>
                <a href="/api/login">Sign In</a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}