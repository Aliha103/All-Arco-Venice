import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookingActionsWrapper } from '@/components/PermissionWrapper';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  PawPrint,
  DollarSign,
  Hash,
  Building,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  LogIn,
  LogOut,
  UserX,
  RotateCcw,
  Info
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
  paymentReceived?: boolean;
  paymentReceivedBy?: string;
  cityTaxCollected?: boolean;
  cityTaxCollectedBy?: string;
  // Timestamps for when collections happened
  paymentReceivedAt?: string;
  cityTaxCollectedAt?: string;
  // Pricing fields
  basePrice?: number;
  cleaningFee?: number;
  serviceFee?: number;
  petFee?: number;
  cityTax?: number;
  // Discount fields
  lengthOfStayDiscount?: number;
  lengthOfStayDiscountPercent?: number;
  referralCredit?: number;
  // Promotion and voucher fields
  promotionDiscount?: number;
  promotionDiscountPercent?: number;
  activePromotion?: string;
  promoCodeDiscount?: number;
  promoCodeDiscountPercent?: number;
  appliedPromoCode?: string;
  voucherDiscount?: number;
  appliedVoucher?: string;
}

interface BookingInfoProps {
  booking: Booking | null;
  onClose: () => void;
  onStatusUpdate?: (bookingId: number, status: string) => void;
}

const BookingInfo: React.FC<BookingInfoProps> = ({ booking, onClose, onStatusUpdate }) => {
  const { user } = useAdminAuth();
  const [selectedAction, setSelectedAction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'main' | 'payment' | 'cityTax'>('main');
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [paymentReceivedBy, setPaymentReceivedBy] = useState('');
  const [cityTaxCollected, setCityTaxCollected] = useState(false);
  const [cityTaxCollectedBy, setCityTaxCollectedBy] = useState('');
  const [pendingAction, setPendingAction] = useState('');
  
  // Auto-refresh functionality specific to this booking
  const {
    refreshData
  } = useAutoRefresh({
    interval: 5000, // 5 seconds - reasonable refresh rate
    enabled: !!booking, // Only enable if booking exists
    queryKeys: [
      '/api/bookings',
      '/api/analytics',
      `/api/bookings/${booking?.id}`
    ]
  });
  
  // Fetch current booking data to ensure it's up to date
  const { data: currentBooking, isLoading: bookingLoading } = useQuery({
    queryKey: [`/api/bookings/${booking?.id}`],
    enabled: !!booking?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - WebSocket will update when needed
    // Removed refetchInterval - WebSocket handles real-time updates
  });
  
  // Use currentBooking if available, fallback to prop booking
  const displayBooking = (currentBooking as Booking) || booking;

  // Reset dialog states when booking changes
  useEffect(() => {
    setPaymentReceived(false);
    setPaymentReceivedBy('');
    setCityTaxCollected(false);
    setCityTaxCollectedBy('');
    setCurrentStep('main');
    setPendingAction('');
  }, [displayBooking?.id]);

  // Handle escape key to go back or close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (currentStep === 'payment' || currentStep === 'cityTax') {
          console.log('Going back to main step (escape key)');
          setCurrentStep('main');
          setIsProcessing(false);
          setPendingAction('');
        }
      }
    };

    if (currentStep !== 'main') {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [currentStep]);

  if (!displayBooking) return null;

  // Calculate booking status and available actions
  const checkInDate = new Date(displayBooking.checkInDate);
  const checkOutDate = new Date(displayBooking.checkOutDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  checkInDate.setHours(0, 0, 0, 0);
  checkOutDate.setHours(0, 0, 0, 0);

  const isBeforeCheckIn = today < checkInDate;
  const isCheckInDay = today.getTime() === checkInDate.getTime();
  const isDuringStay = today > checkInDate && today < checkOutDate;
  const isCheckOutDay = today.getTime() === checkOutDate.getTime();
  const isPastStay = today > checkOutDate;

  // Check if booking check-in date is past minimum 2 days (actions restricted)
  const isBookingOld = () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const checkInDate = new Date(displayBooking.checkInDate);
    checkInDate.setHours(0, 0, 0, 0);
    twoDaysAgo.setHours(0, 0, 0, 0);
    return checkInDate < twoDaysAgo;
  };

  const getAvailableActions = () => {
    const normalizeStatus = (status: string) => status.replace('_', '-').toLowerCase();
    const currentStatus = normalizeStatus(displayBooking.status);
    
    if (currentStatus === 'cancelled') return [];

    // Check if booking check-in date is too old for status changes (except cancel and modify)
    const isOld = isBookingOld();

    // Before check-in date
    if (isBeforeCheckIn) {
      return ['cancel', 'modify'];
    } 
    
    // On check-in day but not checked in yet
    else if (isCheckInDay && currentStatus !== 'checked-in' && currentStatus !== 'no-show') {
      const actions = ['no-show'];
      if (!isOld) actions.unshift('check-in');
      return actions;
    }
    
    // Guest is checked in
    else if (currentStatus === 'checked-in') {
      const actions = [];
      if (!isOld) {
        actions.push('undo-check-in', 'check-out');
      }
      return actions;
    } 
    
    // Guest is checked out
    else if (currentStatus === 'checked-out') {
      const actions = [];
      if (!isOld) {
        actions.push('undo-check-out');
      }
      return actions;
    }
    
    // Guest is marked as no-show
    else if (currentStatus === 'no-show') {
      const actions = [];
      if (!isOld) {
        actions.push('undo-no-show');
      }
      return actions;
    }
    
    // During stay period but still confirmed (late check-in)
    else if (isDuringStay && currentStatus === 'confirmed') {
      const actions = [];
      if (!isOld) {
        actions.push('check-in', 'check-out');
      }
      return actions;
    }
    
    // On or after check-out day but still confirmed
    else if ((isCheckOutDay || isPastStay) && currentStatus === 'confirmed') {
      const actions = [];
      if (!isOld) {
        actions.push('check-in', 'check-out');
      }
      return actions;
    }
    
    return [];
  };

  const availableActions = getAvailableActions();

  const handlePaymentConfirmation = async () => {
    console.log('handlePaymentConfirmation called');
    console.log('paymentReceived:', paymentReceived);
    console.log('paymentReceivedBy:', paymentReceivedBy);
    console.log('pendingAction:', pendingAction);
    
    try {
      // Update booking with payment information
      await apiRequest('PATCH', `/api/bookings/${displayBooking.id}/payment`, {
        paymentReceived,
        paymentReceivedBy: paymentReceived ? paymentReceivedBy : null
      });
      
      console.log('Payment information updated successfully');
      
      // If this is a check-in flow (not just updating info), proceed with status update
      if (pendingAction && (displayBooking.status !== 'checked_in' && displayBooking.status !== 'checked_out')) {
        console.log('Performing status update for:', pendingAction);
        await performStatusUpdate(pendingAction);
      }
      
      // If payment is online or already received, move to city tax step
      if (displayBooking.paymentMethod === 'online' || paymentReceived) {
        console.log('Moving to city tax step');
        setCurrentStep('cityTax');
      } else {
        console.log('Payment flow complete, no city tax needed');
        setIsProcessing(false);
        setPendingAction('');
        setCurrentStep('main');
        refreshData(); // Refresh to show updated payment info
      }
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      setIsProcessing(false);
      setPendingAction('');
      setCurrentStep('main');
    }
  };

  const handleCityTaxConfirmation = async () => {
    try {
      // Update booking with city tax information
      await apiRequest('PATCH', `/api/bookings/${displayBooking.id}/city-tax`, {
        cityTaxCollected,
        cityTaxCollectedBy: cityTaxCollected ? cityTaxCollectedBy : null
      });
      
      console.log('City tax information updated successfully');
      
      setCurrentStep('main');
      setIsProcessing(false);
      setPendingAction('');
      refreshData(); // Refresh to show updated city tax info
    } catch (error) {
      console.error('City tax confirmation failed:', error);
      setIsProcessing(false);
      setCurrentStep('main');
    }
  };

  const performStatusUpdate = async (action: string) => {
    const statusMap: Record<string, string> = {
      'cancel': 'cancelled',
      'check-in': 'checked_in',
      'no-show': 'no_show',
      'check-out': 'checked_out',
      'undo-check-in': 'confirmed',
      'undo-check-out': 'checked_in',
      'undo-no-show': 'confirmed'
    };

    if (statusMap[action] && onStatusUpdate) {
      await onStatusUpdate(displayBooking.id, statusMap[action]);
      refreshData();
    }
  };

  const handleActionChange = async (action: string) => {
    setIsProcessing(true);
    setPendingAction(action);
    
    try {
      // Special handling for check-in action
      if (action === 'check-in') {
        // Check if payment is required
        if (displayBooking.paymentMethod === 'property' && !displayBooking.paymentReceived) {
          setCurrentStep('payment');
          return; // Don't set processing to false yet
        }
        
        // If payment is online or already received, check city tax
        if (displayBooking.paymentMethod === 'online' || displayBooking.paymentReceived) {
          await performStatusUpdate(action);
          setCurrentStep('cityTax');
          return; // Don't set processing to false yet
        }
      }
      
      // For all other actions, proceed normally
      await performStatusUpdate(action);
      setSelectedAction('');
      setPendingAction('');
    } catch (error) {
      console.error('Action failed:', error);
      setPendingAction('');
    } finally {
      // Only set processing to false if we're not in a sub-step
      if (currentStep === 'main') {
        setIsProcessing(false);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status.replace('_', '-').toLowerCase();
    switch (normalizedStatus) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'checked-in': return <LogIn className="w-4 h-4" />;
      case 'checked-out': return <LogOut className="w-4 h-4" />;
      case 'no-show': return <UserX className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.replace('_', '-').toLowerCase();
    switch (normalizedStatus) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'checked-in': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'checked-out': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'no-show': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Calculate nights from actual booking data
  const nights = Math.ceil((new Date(displayBooking.checkOutDate).getTime() - new Date(displayBooking.checkInDate).getTime()) / (1000 * 60 * 60 * 24));
  
  // Use actual database values instead of hardcoded values
  const priceBreakdown = {
    nightlyRate: Number(displayBooking.basePrice) || 0,
    nights: nights,
    cleaningFee: Number(displayBooking.cleaningFee) || 0,
    petFee: Number(displayBooking.petFee) || 0,
    serviceFee: Number(displayBooking.serviceFee) || 0,
    taxes: Number(displayBooking.cityTax) || 0
  };
  
  // Calculate subtotal using actual values
  const baseAmount = priceBreakdown.nightlyRate * priceBreakdown.nights;
  const subtotal = baseAmount + priceBreakdown.cleaningFee + priceBreakdown.petFee + priceBreakdown.serviceFee;
  const discountAmount = 
    (Number(displayBooking.promotionDiscount) || 0) +
    (Number(displayBooking.promoCodeDiscount) || 0) +
    (Number(displayBooking.voucherDiscount) || 0) +
    (Number(displayBooking.lengthOfStayDiscount) || 0) +
    (Number(displayBooking.referralCredit) || 0);
  const subtotalAfterDiscounts = subtotal - discountAmount;

  return (
    <>
      <Dialog open={!!booking} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 border-0 shadow-2xl">
        <DialogHeader className="relative pb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-t-lg opacity-5"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg">
                {displayBooking.guestFirstName.charAt(0)}{displayBooking.guestLastName.charAt(0)}
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  Booking Details
                </DialogTitle>
                <p className="text-xs text-gray-600 mt-1">Comprehensive booking information and management</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(displayBooking.status)} flex items-center gap-1 px-3 py-1 text-xs font-semibold shadow-lg border-2 transition-all duration-300 hover:scale-105`}>
                {getStatusIcon(displayBooking.status)}
                {displayBooking.status.replace('-', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
        </DialogHeader>

        <div className="space-y-5 mt-5">
          {/* Booking Overview */}
          <Card className="group border-0 shadow-xl bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/10 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
            <CardContent className="pt-5 pb-5">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Calendar className="w-3 h-3 text-white" />
                  </div>
                  Booking Overview
                </h3>
                <div className="h-px bg-gradient-to-r from-blue-200 via-indigo-200 to-transparent"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div className="group/item flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 border border-blue-100">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform duration-300">
                      <Hash className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Confirmation Code</p>
                      <p className="font-mono font-bold text-base text-gray-900 tracking-wider">{displayBooking.confirmationCode}</p>
                    </div>
                  </div>
                  
                  <div className="group/item flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all duration-300 border border-purple-100">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform duration-300">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Booking Date</p>
                      <p className="font-semibold text-base text-gray-900">{formatDate(displayBooking.createdAt)}</p>
                    </div>
                  </div>

                  <div className="group/item flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 transition-all duration-300 border border-orange-100">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform duration-300">
                      <Building className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Booking Source</p>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-base text-gray-900 capitalize">{displayBooking.bookingSource || 'Direct'}</p>
                        <div className="px-1.5 py-0.5 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                          {displayBooking.bookingSource === 'direct' ? '🌐' : displayBooking.bookingSource === 'airbnb' ? '🏠' : '🏨'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="group/item flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all duration-300 border border-green-100">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform duration-300">
                      <LogIn className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Check-in</p>
                      <p className="font-semibold text-base text-gray-900">{formatDate(displayBooking.checkInDate)}</p>
                    </div>
                  </div>
                  
                  <div className="group/item flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 transition-all duration-300 border border-red-100">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform duration-300">
                      <LogOut className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Check-out</p>
                      <p className="font-semibold text-base text-gray-900">{formatDate(displayBooking.checkOutDate)}</p>
                    </div>
                  </div>

                  <div className="group/item flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 transition-all duration-300 border border-indigo-100">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform duration-300">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Duration</p>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-base text-gray-900">{priceBreakdown.nights}</p>
                        <span className="text-gray-600 text-sm">nights</span>
                        <div className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
                          🌙
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guest Information */}
          <Card className="group border-0 shadow-xl bg-gradient-to-br from-white via-emerald-50/20 to-green-50/10 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
            <CardContent className="pt-5 pb-5">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  Guest Information
                </h3>
                <div className="h-px bg-gradient-to-r from-emerald-200 via-green-200 to-transparent"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group/item flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-all duration-300 border border-blue-100">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform duration-300">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Full Name</p>
                    <p className="font-bold text-base text-gray-900">{displayBooking.guestFirstName} {displayBooking.guestLastName}</p>
                  </div>
                </div>
                
                <div className="group/item flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 transition-all duration-300 border border-purple-100">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform duration-300">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Email Address</p>
                    <p className="font-semibold text-sm text-gray-900 break-all">{displayBooking.guestEmail}</p>
                  </div>
                </div>

                <div className="group/item flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 transition-all duration-300 border border-emerald-100">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform duration-300">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Phone Number</p>
                    <p className="font-semibold text-sm text-gray-900">{displayBooking.guestPhone || 'Not provided'}</p>
                  </div>
                </div>

                <div className="group/item flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 transition-all duration-300 border border-orange-100">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform duration-300">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Country</p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-gray-900">{displayBooking.guestCountry || 'Not specified'}</p>
                      <div className="px-1.5 py-0.5 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                        🌍
                      </div>
                    </div>
                  </div>
                </div>

                <div className="group/item flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 transition-all duration-300 border border-indigo-100">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform duration-300">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Party Size</p>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-base text-gray-900">{displayBooking.guests}</p>
                      <span className="text-gray-600 text-sm">{displayBooking.guests === 1 ? 'guest' : 'guests'}</span>
                      <div className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
                        👥
                      </div>
                    </div>
                  </div>
                </div>

                {displayBooking.hasPet && (
                  <div className="group/item flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 transition-all duration-300 border border-pink-100">
                    <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform duration-300">
                      <PawPrint className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Pet Information</p>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-gray-900">Traveling with pet</p>
                        <div className="px-1.5 py-0.5 bg-pink-100 text-pink-800 text-xs font-medium rounded-full">
                          🐕
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Price Breakdown */}
          <Card className="group border-0 shadow-xl bg-gradient-to-br from-white via-green-50/20 to-emerald-50/10 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
            <CardContent className="pt-5 pb-5">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-3 h-3 text-white" />
                  </div>
                  Price Breakdown
                </h3>
                <div className="h-px bg-gradient-to-r from-green-200 via-emerald-200 to-transparent"></div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-white/70 hover:bg-white transition-all duration-300 border border-gray-100 group/item">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center group-hover/item:scale-110 transition-transform duration-300">
                      <span className="text-white text-xs font-bold">💰</span>
                    </div>
                    <span className="font-medium text-gray-700 text-sm">
                      {formatCurrency(priceBreakdown.nightlyRate)} × {priceBreakdown.nights} nights
                    </span>
                  </div>
                  <span className="font-bold text-base text-gray-900">
                    {formatCurrency(priceBreakdown.nightlyRate * priceBreakdown.nights)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 rounded-lg bg-white/70 hover:bg-white transition-all duration-300 border border-gray-100 group/item">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center group-hover/item:scale-110 transition-transform duration-300">
                      <span className="text-white text-xs font-bold">🧹</span>
                    </div>
                    <span className="font-medium text-gray-700 text-sm">Cleaning fee</span>
                  </div>
                  <span className="font-bold text-base text-gray-900">{formatCurrency(priceBreakdown.cleaningFee)}</span>
                </div>

                {displayBooking.hasPet && (
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/70 hover:bg-white transition-all duration-300 border border-gray-100 group/item">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center group-hover/item:scale-110 transition-transform duration-300">
                        <PawPrint className="w-3 h-3 text-white" />
                      </div>
                      <span className="font-medium text-gray-700 text-sm">Pet fee</span>
                    </div>
                    <span className="font-bold text-base text-gray-900">{formatCurrency(priceBreakdown.petFee)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center p-3 rounded-lg bg-white/70 hover:bg-white transition-all duration-300 border border-gray-100 group/item">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center group-hover/item:scale-110 transition-transform duration-300">
                      <span className="text-white text-xs font-bold">🛎️</span>
                    </div>
                    <span className="font-medium text-gray-700 text-sm">Service fee</span>
                  </div>
                  <span className="font-bold text-base text-gray-900">{formatCurrency(priceBreakdown.serviceFee)}</span>
                </div>

                <div className="my-4">
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                </div>

                <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                  <span className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                    <span className="text-base">📊</span>
                    Subtotal
                  </span>
                  <span className="font-bold text-lg text-blue-700">{formatCurrency(subtotal)}</span>
                </div>

                {/* Discount Section */}
                {discountAmount > 0 && (
                  <>
                    <div className="my-3">
                      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-600">🎉 Discounts Applied</span>
                      </div>
                      
                      {Number(displayBooking.promotionDiscount) > 0 && (
                        <div className="flex justify-between items-center p-2 rounded-lg bg-green-50 border border-green-200">
                          <span className="text-sm font-medium text-green-700">Promotion Discount</span>
                          <span className="text-sm font-bold text-green-800">-{formatCurrency(Number(displayBooking.promotionDiscount))}</span>
                        </div>
                      )}
                      
                      {Number(displayBooking.promoCodeDiscount) > 0 && (
                        <div className="flex justify-between items-center p-2 rounded-lg bg-green-50 border border-green-200">
                          <span className="text-sm font-medium text-green-700">Promo Code Discount</span>
                          <span className="text-sm font-bold text-green-800">-{formatCurrency(Number(displayBooking.promoCodeDiscount))}</span>
                        </div>
                      )}
                      
                      {Number(displayBooking.voucherDiscount) > 0 && (
                        <div className="flex justify-between items-center p-2 rounded-lg bg-green-50 border border-green-200">
                          <span className="text-sm font-medium text-green-700">Voucher Discount</span>
                          <span className="text-sm font-bold text-green-800">-{formatCurrency(Number(displayBooking.voucherDiscount))}</span>
                        </div>
                      )}
                      
                      {Number(displayBooking.lengthOfStayDiscount) > 0 && (
                        <div className="flex justify-between items-center p-2 rounded-lg bg-green-50 border border-green-200">
                          <span className="text-sm font-medium text-green-700">Length of Stay Discount</span>
                          <span className="text-sm font-bold text-green-800">-{formatCurrency(Number(displayBooking.lengthOfStayDiscount))}</span>
                        </div>
                      )}
                      
                      {Number(displayBooking.referralCredit) > 0 && (
                        <div className="flex justify-between items-center p-2 rounded-lg bg-green-50 border border-green-200">
                          <span className="text-sm font-medium text-green-700">Referral Credit</span>
                          <span className="text-sm font-bold text-green-800">-{formatCurrency(Number(displayBooking.referralCredit))}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center p-2 rounded-lg bg-green-100 border border-green-300">
                        <span className="text-sm font-semibold text-green-800">Total Discounts</span>
                        <span className="text-sm font-bold text-green-900">-{formatCurrency(discountAmount)}</span>
                      </div>
                    </div>
                    
                    <div className="my-3">
                      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200">
                      <span className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                        <span className="text-base">🧮</span>
                        Subtotal after discounts
                      </span>
                      <span className="font-bold text-lg text-orange-700">{formatCurrency(subtotalAfterDiscounts)}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between items-center p-3 rounded-lg bg-white/70 hover:bg-white transition-all duration-300 border border-gray-100 group/item">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center group-hover/item:scale-110 transition-transform duration-300">
                      <span className="text-white text-xs font-bold">🏛️</span>
                    </div>
                    <span className="font-medium text-gray-700 text-sm">Taxes</span>
                  </div>
                  <span className="font-bold text-base text-gray-900">{formatCurrency(priceBreakdown.taxes)}</span>
                </div>

                <div className="my-4">
                  <div className="h-px bg-gradient-to-r from-transparent via-green-400 to-transparent"></div>
                </div>

                <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-green-100 via-emerald-100 to-teal-100 border-2 border-green-300 shadow-lg">
                  <span className="font-bold text-lg text-green-800 flex items-center gap-2">
                    <span className="text-lg">💎</span>
                    Total Amount
                  </span>
                  <span className="font-black text-2xl text-green-900">{formatCurrency(displayBooking.totalPrice)}</span>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Payment Method</p>
                    <p className="font-bold text-base text-gray-900 capitalize flex items-center gap-2">
                      {displayBooking.paymentMethod}
                      <span className="text-base">{displayBooking.paymentMethod === 'online' ? '💳' : '🏛️'}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment & Tax Collection History */}
              {(displayBooking.paymentReceived || displayBooking.cityTaxCollected || displayBooking.status === 'checked_in' || displayBooking.status === 'checked_out') && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">📋</span>
                    </div>
                    <h4 className="font-semibold text-gray-900">Collection History</h4>
                  </div>
                  
                  {/* Payment Collection Info */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs">💳</span>
                        </div>
                        <span className="font-medium text-blue-900">Payment Collection</span>
                      </div>
                      <div className="text-right">
                        {displayBooking.paymentReceived ? (
                          <div>
                            <div className="text-green-600 font-semibold text-sm flex items-center gap-1">
                              <span className="text-green-500">✅</span> Collected
                            </div>
                            {displayBooking.paymentReceivedBy ? (
                              <div className="text-blue-700 text-xs">
                                by {displayBooking.paymentReceivedBy}
                              </div>
                            ) : (
                              <button 
                                onClick={() => setCurrentStep('payment')}
                                className="text-blue-600 hover:text-blue-800 text-xs underline mt-1"
                              >
                                + Add collector info
                              </button>
                            )}
                          </div>
                        ) : displayBooking.paymentMethod === 'online' ? (
                          <div className="text-blue-600 font-semibold text-sm flex items-center gap-1">
                            <span className="text-blue-500">💳</span> Paid Online
                          </div>
                        ) : displayBooking.status === 'checked_in' || displayBooking.status === 'checked_out' ? (
                          <div className="space-y-1">
                            <div className="text-red-600 font-semibold text-sm flex items-center gap-1">
                              <span className="text-red-500">⚠️</span> Not Recorded
                            </div>
                            <button 
                              onClick={() => setCurrentStep('payment')}
                              className="text-blue-600 hover:text-blue-800 text-xs underline"
                            >
                              + Record collection
                            </button>
                          </div>
                        ) : (
                          <div className="text-amber-600 font-semibold text-sm flex items-center gap-1">
                            <span className="text-amber-500">⏳</span> Pending
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* City Tax Collection Info */}
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-3 border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs">🏛️</span>
                        </div>
                        <span className="font-medium text-emerald-900">City Tax Collection</span>
                      </div>
                      <div className="text-right">
                        {displayBooking.cityTaxCollected ? (
                          <div>
                            <div className="text-green-600 font-semibold text-sm flex items-center gap-1">
                              <span className="text-green-500">✅</span> Collected
                            </div>
                            {displayBooking.cityTaxCollectedBy ? (
                              <div className="text-emerald-700 text-xs">
                                by {displayBooking.cityTaxCollectedBy}
                              </div>
                            ) : (
                              <button 
                                onClick={() => setCurrentStep('cityTax')}
                                className="text-emerald-600 hover:text-emerald-800 text-xs underline mt-1"
                              >
                                + Add collector info
                              </button>
                            )}
                          </div>
                        ) : displayBooking.status === 'checked_in' || displayBooking.status === 'checked_out' ? (
                          <div className="space-y-1">
                            <div className="text-red-600 font-semibold text-sm flex items-center gap-1">
                              <span className="text-red-500">⚠️</span> Not Recorded
                            </div>
                            <button 
                              onClick={() => setCurrentStep('cityTax')}
                              className="text-emerald-600 hover:text-emerald-800 text-xs underline"
                            >
                              + Record collection
                            </button>
                          </div>
                        ) : (
                          <div className="text-amber-600 font-semibold text-sm flex items-center gap-1">
                            <span className="text-amber-500">⏳</span> Pending
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Advanced Booking Actions with Smooth Step Flow */}
          <BookingActionsWrapper user={user}>
            {availableActions.length > 0 && (
              <Card className="group border-0 shadow-xl bg-gradient-to-br from-white via-violet-50/20 to-purple-50/10 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01]">
                <CardContent className="pt-5 pb-5">
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">⚡</span>
                      </div>
                      {currentStep === 'main' && 'Booking Actions'}
                      {currentStep === 'payment' && 'Payment Confirmation'}
                      {currentStep === 'cityTax' && 'City Tax Collection'}
                    </h3>
                    {currentStep !== 'main' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCurrentStep('main');
                          setIsProcessing(false);
                          setPendingAction('');
                        }}
                        className="text-gray-500 hover:text-gray-700 px-2 py-1 h-8"
                      >
                        ← Back
                      </Button>
                    )}
                  </div>
                  <div className="h-px bg-gradient-to-r from-violet-200 via-purple-200 to-transparent"></div>
                </div>
                
                {isCheckInDay && displayBooking.status.replace('_', '-').toLowerCase() !== 'checked-in' && (
                  <Alert className="mb-4 border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50">
                    <div className="w-5 h-5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <AlertCircle className="h-3 w-3 text-white" />
                    </div>
                    <AlertDescription className="font-medium text-amber-800 ml-2 text-sm">
                      🎯 Today is the check-in date. Please process the guest check-in.
                    </AlertDescription>
                  </Alert>
                )}
                
                {isBookingOld() && (
                  <Alert className="mb-4 border-2 border-red-300 bg-gradient-to-r from-red-50 to-pink-50">
                    <div className="w-5 h-5 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                      <AlertCircle className="h-3 w-3 text-white" />
                    </div>
                    <AlertDescription className="font-medium text-red-800 ml-2 text-sm">
                      ⏰ This booking's check-in date is more than 2 days old. Status change actions are restricted for data integrity.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Dynamic Content Based on Current Step */}
                <div className="bg-gradient-to-br from-gray-50 to-violet-50/30 rounded-xl p-4 transition-all duration-300">
                  
                  {/* Main Actions Step */}
                  {currentStep === 'main' && (
                    <div className="animate-in fade-in duration-300">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-700 mb-2">Select Action</label>
                          <Select value={selectedAction} onValueChange={setSelectedAction}>
                            <SelectTrigger className="w-full h-10 bg-white border-2 border-violet-200 hover:border-violet-400 rounded-lg shadow-lg transition-all duration-300">
                              <SelectValue placeholder="🔧 Select an action..." className="font-medium text-sm" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-2 border-violet-200 rounded-xl shadow-2xl">
                          {availableActions.includes('cancel') && (
                            <SelectItem value="cancel" className="cursor-pointer hover:bg-red-50">
                              <div className="flex items-center gap-3 p-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                                  <XCircle className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">Cancel Booking</p>
                                  <p className="text-xs text-gray-500">Mark booking as cancelled</p>
                                </div>
                              </div>
                            </SelectItem>
                          )}
                          {availableActions.includes('modify') && (
                            <SelectItem value="modify" className="cursor-pointer hover:bg-blue-50">
                              <div className="flex items-center gap-3 p-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                  <Edit className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">Modify Booking</p>
                                  <p className="text-xs text-gray-500">Change dates or details</p>
                                </div>
                              </div>
                            </SelectItem>
                          )}
                          {availableActions.includes('check-in') && (
                            <SelectItem value="check-in" className="cursor-pointer hover:bg-green-50">
                              <div className="flex items-center gap-3 p-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                                  <LogIn className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">Check In Guest</p>
                                  <p className="text-xs text-gray-500">Guest has arrived</p>
                                </div>
                              </div>
                            </SelectItem>
                          )}
                          {availableActions.includes('no-show') && (
                            <SelectItem value="no-show" className="cursor-pointer hover:bg-gray-50">
                              <div className="flex items-center gap-3 p-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                                  <UserX className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">Mark as No-Show</p>
                                  <p className="text-xs text-gray-500">Guest didn't arrive</p>
                                </div>
                              </div>
                            </SelectItem>
                          )}
                          {availableActions.includes('check-out') && (
                            <SelectItem value="check-out" className="cursor-pointer hover:bg-purple-50">
                              <div className="flex items-center gap-3 p-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                                  <LogOut className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">Check Out Guest</p>
                                  <p className="text-xs text-gray-500">Guest has departed</p>
                                </div>
                              </div>
                            </SelectItem>
                          )}
                          {availableActions.includes('undo-check-in') && (
                            <SelectItem value="undo-check-in" className="cursor-pointer hover:bg-orange-50">
                              <div className="flex items-center gap-3 p-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                                  <RotateCcw className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">Undo Check-In</p>
                                  <p className="text-xs text-gray-500">Revert to confirmed</p>
                                </div>
                              </div>
                            </SelectItem>
                          )}
                          {availableActions.includes('undo-check-out') && (
                            <SelectItem value="undo-check-out" className="cursor-pointer hover:bg-indigo-50">
                              <div className="flex items-center gap-3 p-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                  <RotateCcw className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">Undo Check-Out</p>
                                  <p className="text-xs text-gray-500">Revert to checked-in</p>
                                </div>
                              </div>
                            </SelectItem>
                          )}
                          {availableActions.includes('undo-no-show') && (
                            <SelectItem value="undo-no-show" className="cursor-pointer hover:bg-yellow-50">
                              <div className="flex items-center gap-3 p-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg flex items-center justify-center">
                                  <RotateCcw className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">Undo No-Show</p>
                                  <p className="text-xs text-gray-500">Revert to confirmed</p>
                                </div>
                              </div>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-shrink-0">
                      <label className="block text-xs font-medium text-gray-700 mb-2">Execute</label>
                      <Button 
                        onClick={() => handleActionChange(selectedAction)}
                        disabled={!selectedAction || isProcessing}
                        className="w-full sm:w-32 h-10 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold rounded-lg shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {isProcessing ? (
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-sm">⚡</span>
                            Apply
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>

                  {selectedAction === 'modify' && (
                    <Alert className="mt-4 border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Info className="h-3 w-3 text-white" />
                      </div>
                      <AlertDescription className="font-medium text-blue-800 ml-2 text-sm">
                        ℹ️ Modification is only available if the new dates are available. This feature will check availability before allowing changes.
                      </AlertDescription>
                    </Alert>
                  )}
                    </div>
                  )}
                  
                  {/* Payment Confirmation Step */}
                  {currentStep === 'payment' && (
                    <div className="animate-in slide-in-from-right duration-300">
                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                              <span className="text-white text-lg">💳</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-blue-900">
                                {displayBooking.status === 'checked_in' || displayBooking.status === 'checked_out' 
                                  ? 'Update Payment Information' 
                                  : 'Payment Required'
                                }
                              </h4>
                              <p className="text-blue-700 text-sm">
                                {displayBooking.status === 'checked_in' || displayBooking.status === 'checked_out'
                                  ? 'Record or update who collected the payment'
                                  : 'This booking requires payment at the property'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex items-center h-5 mt-1">
                              <input
                                id="payment-checkbox-inline"
                                type="checkbox"
                                checked={paymentReceived}
                                onChange={(e) => {
                                  console.log('Payment checkbox changed:', e.target.checked);
                                  setPaymentReceived(e.target.checked);
                                }}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                              />
                            </div>
                            <div className="flex-1">
                              <label htmlFor="payment-checkbox-inline" className="font-medium text-gray-900 cursor-pointer">
                                ✅ Yes, guest has paid
                              </label>
                              <p className="text-gray-600 text-sm mt-1">Check this if the guest has completed payment at the property</p>
                            </div>
                          </div>
                          
                          {paymentReceived && (
                            <div className="animate-in slide-in-from-top-2 duration-200 bg-gray-50 rounded-lg p-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                👤 Who received the payment?
                              </label>
                              <input
                                type="text"
                                value={paymentReceivedBy}
                                onChange={(e) => setPaymentReceivedBy(e.target.value)}
                                placeholder="Enter name (e.g., John, Front Desk)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                autoFocus
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setCurrentStep('main');
                              setIsProcessing(false);
                              setPendingAction('');
                              setPaymentReceived(false);
                              setPaymentReceivedBy('');
                            }}
                            className="flex-1"
                          >
                            ← Cancel
                          </Button>
                          <Button
                            onClick={handlePaymentConfirmation}
                            disabled={paymentReceived && !paymentReceivedBy.trim()}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          >
                            {displayBooking.status === 'checked_in' || displayBooking.status === 'checked_out' 
                              ? '✅ Update Information' 
                              : 'Continue →'
                            }
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* City Tax Collection Step */}
                  {currentStep === 'cityTax' && (
                    <div className="animate-in slide-in-from-right duration-300">
                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-4 border border-emerald-200">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                              <span className="text-white text-lg">🏛️</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-emerald-900">
                                {displayBooking.status === 'checked_in' || displayBooking.status === 'checked_out' 
                                  ? 'Update City Tax Information' 
                                  : 'City Tax Collection'
                                }
                              </h4>
                              <p className="text-emerald-700 text-sm">
                                {displayBooking.status === 'checked_in' || displayBooking.status === 'checked_out'
                                  ? 'Record or update who collected the city tax'
                                  : 'Please collect the city tax from the guest'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id="city-tax-collected-inline"
                              checked={cityTaxCollected}
                              onCheckedChange={(checked) => {
                                console.log('City tax checkbox changed:', checked);
                                setCityTaxCollected(!!checked);
                              }}
                              className="cursor-pointer"
                            />
                            <label
                              htmlFor="city-tax-collected-inline"
                              className="text-sm font-medium text-gray-700 cursor-pointer select-none flex-1"
                              onClick={() => {
                                console.log('City tax label clicked, current state:', cityTaxCollected);
                                setCityTaxCollected(!cityTaxCollected);
                              }}
                            >
                              ✅ City tax collected
                            </label>
                          </div>
                          
                          {cityTaxCollected && (
                            <div className="animate-in slide-in-from-top-2 duration-200 bg-gray-50 rounded-lg p-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                👤 Who collected the city tax?
                              </label>
                              <Input
                                value={cityTaxCollectedBy}
                                onChange={(e) => setCityTaxCollectedBy(e.target.value)}
                                placeholder="Enter name (e.g., John, Front Desk)"
                                className="w-full"
                                autoFocus
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setCurrentStep('main');
                              setIsProcessing(false);
                              setPendingAction('');
                              setCityTaxCollected(false);
                              setCityTaxCollectedBy('');
                            }}
                            className="flex-1"
                          >
                            ← Skip for Now
                          </Button>
                          <Button
                            onClick={handleCityTaxConfirmation}
                            disabled={cityTaxCollected && !cityTaxCollectedBy.trim()}
                            className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                          >
                            {displayBooking.status === 'checked_in' || displayBooking.status === 'checked_out' 
                              ? '✅ Update Information' 
                              : '✅ Complete Check-in'
                            }
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          </BookingActionsWrapper>

          {/* Status History */}
          {displayBooking.blockReason && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4">Additional Information</h3>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Block Reason: {displayBooking.blockReason}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingInfo;
