import { useState } from "react";
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
  


  const { data: unreadCount } = useQuery({
    queryKey: ["/api/messages/unread-count"],
    enabled: !!user && user.role === 'admin',
    refetchInterval: 1000,
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95">
              <h1 className="text-2xl font-bold text-primary transition-colors duration-200 hover:text-blue-700">All'arco</h1>
              <span className="ml-2 text-sm text-gray-600 hidden sm:block transition-colors duration-200 hover:text-gray-800">Luxury Apartment</span>
            </div>
          </Link>

          {/* Navigation & User Menu */}
          <div className="flex items-center space-x-3">
            {/* Notification Icon for all authenticated users */}
            {isAuthenticated && (
              <Button variant="ghost" size="sm" className="relative p-2 rounded-full hover:bg-gray-100">
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadCount && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {Number(unreadCount) > 9 ? '9+' : String(unreadCount)}
                  </span>
                )}
              </Button>
            )}

            {/* User Dropdown */}
            {isAuthenticated ? (
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
