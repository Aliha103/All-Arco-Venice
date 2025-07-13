import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Search,
  Filter,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  Building,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Printer,
  RefreshCw,
  Eye,
  PawPrint,
  CreditCard
} from 'lucide-react';

interface Booking {
  id: number;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestCountry: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  hasPet: boolean;
  paymentMethod: "online" | "property";
  totalPrice: number;
  status: string;
  confirmationCode: string;
  createdAt: string;
  bookingSource?: "direct" | "airbnb" | "booking.com" | "blocked" | "custom";
  blockReason?: string;
}

interface BookingsProps {
  bookings: Booking[] | undefined;
  isLoading: boolean;
  onStatusUpdate?: (bookingId: number, status: string) => void;
  onRefresh?: () => void;
  onBookingSelect?: (booking: Booking) => void;
}

const Bookings: React.FC<BookingsProps> = ({ bookings, isLoading, onStatusUpdate, onRefresh, onBookingSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 15;

  // Filter bookings based on all criteria
  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    
    return bookings.filter(booking => {
      // Search filter
      const searchMatch = searchTerm === '' || 
        booking.guestFirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.guestLastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.guestEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.confirmationCode.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter - handle underscore/hyphen variations
      const statusMatch = statusFilter === 'all' || 
        booking.status === statusFilter || 
        booking.status.replace('_', '-') === statusFilter || 
        booking.status.replace('-', '_') === statusFilter;

      // Payment filter
      const paymentMatch = paymentFilter === 'all' || booking.paymentMethod === paymentFilter;

      // Source filter
      const sourceMatch = sourceFilter === 'all' || (booking.bookingSource || 'direct') === sourceFilter;

      // Date filter
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkIn = new Date(booking.checkInDate);
      checkIn.setHours(0, 0, 0, 0);
      const checkOut = new Date(booking.checkOutDate);
      checkOut.setHours(0, 0, 0, 0);

      let dateMatch = true;
      if (dateFilter === 'today') {
        dateMatch = checkIn.getTime() === today.getTime() || checkOut.getTime() === today.getTime();
      } else if (dateFilter === 'this-week') {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        dateMatch = (checkIn >= weekStart && checkIn <= weekEnd) || 
                   (checkOut >= weekStart && checkOut <= weekEnd);
      } else if (dateFilter === 'this-month') {
        dateMatch = (checkIn.getMonth() === today.getMonth() && checkIn.getFullYear() === today.getFullYear()) ||
                   (checkOut.getMonth() === today.getMonth() && checkOut.getFullYear() === today.getFullYear());
      }

      return searchMatch && statusMatch && paymentMatch && sourceMatch && dateMatch;
    });
  }, [bookings, searchTerm, statusFilter, paymentFilter, sourceFilter, dateFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentFilter, sourceFilter, dateFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setDateFilter('all');
    setSourceFilter('all');
    setCurrentPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'checked-in': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'checked-out': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'no-show': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'airbnb': return '🏠';
      case 'booking.com': return '🏨';
      case 'direct': return '🌐';
      case 'blocked': return '🚫';
      default: return '📋';
    }
  };

  const getSourceLabel = (source?: string) => {
    switch (source) {
      case 'airbnb': return 'Airbnb';
      case 'booking.com': return 'Booking.com';
      case 'direct': return 'Direct Website';
      case 'blocked': return 'Admin Block';
      default: return 'Direct';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const exportCSV = () => {
    if (!filteredBookings.length) return;

    const headers = ['Confirmation Code', 'Guest Name', 'Email', 'Check-in', 'Check-out', 'Guests', 'Total Price', 'Status', 'Payment Method', 'Source'];
    const rows = filteredBookings.map(booking => [
      booking.confirmationCode,
      `${booking.guestFirstName} ${booking.guestLastName}`,
      booking.guestEmail,
      formatDate(booking.checkInDate),
      formatDate(booking.checkOutDate),
      booking.guests,
      booking.totalPrice,
      booking.status,
      booking.paymentMethod,
      booking.bookingSource || 'direct'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `bookings_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <>
      <Card className="h-full shadow-lg border-0 bg-white">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                All Bookings
              </CardTitle>
              <CardDescription className="text-blue-100 mt-1">
                Manage and view all property bookings with advanced filtering
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={exportCSV}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={printReport}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Search and Filters */}
        <div className="px-6 py-5 border-b bg-gradient-to-r from-gray-50 to-blue-50/30 space-y-5">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by guest name, email, or confirmation code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-base border-2 border-gray-200 focus:border-blue-500 rounded-xl shadow-sm"
              />
            </div>
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-10 bg-white border-2 border-gray-200 hover:border-blue-400 rounded-lg shadow-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="checked-in">Checked In</SelectItem>
                <SelectItem value="checked-out">Checked Out</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no-show">No Show</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[160px] h-10 bg-white border-2 border-gray-200 hover:border-blue-400 rounded-lg shadow-sm">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="property">At Property</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[160px] h-10 bg-white border-2 border-gray-200 hover:border-blue-400 rounded-lg shadow-sm">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
                <SelectItem value="airbnb">Airbnb</SelectItem>
                <SelectItem value="booking.com">Booking.com</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[160px] h-10 bg-white border-2 border-gray-200 hover:border-blue-400 rounded-lg shadow-sm">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="sm"
              onClick={resetFilters}
              className="h-10 bg-white border-2 border-gray-200 hover:border-red-400 hover:text-red-600 rounded-lg shadow-sm"
            >
              <Filter className="w-4 h-4 mr-2" />
              Reset Filters
            </Button>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4">
              <p className="text-sm font-medium text-gray-700">
                Showing <span className="font-bold text-blue-600">{startIndex + 1}-{Math.min(endIndex, filteredBookings.length)}</span> of <span className="font-bold">{filteredBookings.length}</span> bookings
              </p>
              {filteredBookings.length !== bookings?.length && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  <Filter className="w-4 h-4" />
                  {(bookings?.length || 0) - filteredBookings.length} filtered out
                </div>
              )}
            </div>
            {totalPages > 1 && (
              <p className="text-sm text-gray-500">
                Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
              </p>
            )}
          </div>
        </div>

        {/* Bookings List */}
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : currentBookings.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">
                {filteredBookings.length === 0 && bookings && bookings.length > 0 
                  ? 'No bookings match your filters' 
                  : 'No bookings found'}
              </p>
              {filteredBookings.length === 0 && bookings && bookings.length > 0 && (
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {currentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 cursor-pointer group border-l-4 border-l-transparent hover:border-l-blue-500"
                  onClick={() => {
                    if (onBookingSelect) {
                      onBookingSelect(booking);
                    }
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Left Section: Guest Info + Details */}
                    <div className="flex-1">
                      {/* Header Row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {booking.guestFirstName.charAt(0)}{booking.guestLastName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-base text-gray-900">
                              {booking.guestFirstName} {booking.guestLastName}
                            </h3>
                            <p className="text-xs text-gray-600">{booking.guestEmail}</p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(booking.status)} font-medium px-2 py-1 text-xs`}>
                          {booking.status.replace('-', ' ').toUpperCase()}
                        </Badge>
                      </div>

                      {/* Booking Details - Horizontal Layout */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">{formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-green-600" />
                          <span>{booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-orange-600" />
                          <span>{booking.guestCountry || 'N/A'}</span>
                        </div>

                        {booking.hasPet && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                            <PawPrint className="w-3 h-3" />
                            Pet
                          </div>
                        )}
                      </div>

                      {/* Additional Info Row */}
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          <span className="text-sm">{getSourceIcon(booking.bookingSource)}</span>
                          {getSourceLabel(booking.bookingSource)}
                        </div>
                        
                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          #{booking.confirmationCode}
                        </div>
                        
                        <span className="text-xs text-gray-500">Booked {formatDate(booking.createdAt)}</span>
                      </div>
                    </div>

                    {/* Right Section: Price */}
                    <div className="text-right">
                      <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <p className="text-xl font-bold text-green-700">{formatCurrency(booking.totalPrice)}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <CreditCard className="w-3 h-3 text-green-600" />
                          <span className="text-xs font-medium text-green-600">
                            {booking.paymentMethod === 'online' ? 'Online' : 'Property'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t bg-gray-50/50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </p>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={i}
                        variant={pageNum === currentPage ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </>
  );
};

export default Bookings;
