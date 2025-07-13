import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import VoucherForm from "@/components/VoucherForm";
import PromotionForm from "@/components/PromotionForm";
import { 
  DollarSign, 
  Plus, 
  CheckCircle, 
  TrendingUp,
  Gift,
  Sparkles,
  Calendar,
  Heart,
  Percent,
  X,
  Eye,
  Loader2,
  MoreHorizontal,
  Settings,
  Trash2,
  ToggleLeft,
  ToggleRight,
  BarChart3,
  Users
} from "lucide-react";

interface PricingSettings {
  basePrice: number;
  cleaningFee: number;
  petFee: number;
  discountWeekly: number;
  discountMonthly: number;
}

interface PricingTabProps {
  pricingForm: PricingSettings;
  setPricingForm: (form: PricingSettings) => void;
  pricingLoading: boolean;
  formatCurrency: (amount: number) => string;
}

export default function PricingTab({ 
  pricingForm, 
  setPricingForm, 
  pricingLoading, 
  formatCurrency 
}: PricingTabProps) {
  const { toast } = useToast();
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Voucher modal state
  const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null);
  const [showVoucherDetails, setShowVoucherDetails] = useState(false);
  const [showVoucherForm, setShowVoucherForm] = useState(false);
  
  // Promotion modal state
  const [showPromotionForm, setShowPromotionForm] = useState(false);

  // Add custom styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin-slow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes spin-slower {
        from { transform: rotate(0deg); }
        to { transform: rotate(-360deg); }
      }
      @keyframes float {
        0%, 100% {
          transform: translateY(0) translateX(0) scale(1);
          opacity: 0.6;
        }
        33% {
          transform: translateY(-10px) translateX(5px) scale(1.1);
          opacity: 0.8;
        }
        66% {
          transform: translateY(5px) translateX(-5px) scale(0.9);
          opacity: 0.7;
        }
      }
      @keyframes fade-in-up {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes scale-up {
        from {
          opacity: 0;
          transform: scale(0.9);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      .animate-spin-slow { animation: spin-slow 20s linear infinite; }
      .animate-spin-slower { animation: spin-slower 30s linear infinite; }
      .animate-fade-in { animation: fade-in-up 0.3s ease-out; }
      .animate-fade-in-up { animation: fade-in-up 0.6s ease-out both; }
      .animate-scale-up { animation: scale-up 0.3s ease-out; }
      .glass-card {
        background: rgba(255, 255, 255, 0.25);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
      }
      .glass-card:hover {
        background: rgba(255, 255, 255, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.4);
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.2);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Scroll and mouse tracking for parallax effects
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Voucher data query
  const { data: vouchers = [], isLoading: vouchersLoading } = useQuery<any[]>({
    queryKey: ["/api/vouchers"],
    queryFn: async () => {
      const response = await fetch('/api/vouchers');
      if (!response.ok) throw new Error('Failed to fetch vouchers');
      return response.json();
    },
    retry: false,
  });

  // Voucher usage history query
  const { data: voucherUsageHistory = [], isLoading: usageHistoryLoading } = useQuery<any[]>({
    queryKey: ["/api/vouchers", selectedVoucher?.id, "usage"],
    queryFn: async () => {
      if (!selectedVoucher?.id) return [];
      const response = await fetch(`/api/vouchers/${selectedVoucher.id}/usage`);
      if (!response.ok) throw new Error('Failed to fetch voucher usage history');
      return response.json();
    },
    enabled: !!selectedVoucher?.id && showVoucherDetails,
    retry: false,
  });

  // Promotions data query - fetch all promotions for admin, not just active ones
  const { data: promotions = [], isLoading: promotionsLoading } = useQuery<any[]>({
    queryKey: ["/api/promotions"],
    queryFn: async () => {
      const response = await fetch('/api/promotions');
      if (!response.ok) throw new Error('Failed to fetch promotions');
      return response.json();
    },
    retry: false,
  });

  // Update pricing settings mutation
  const updatePricingMutation = useMutation({
    mutationFn: async (pricingData: PricingSettings) => {
      await apiRequest("PUT", "/api/pricing-settings", pricingData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-settings"] });
      toast({
        title: "Success",
        description: "Pricing settings updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update pricing settings",
        variant: "destructive",
      });
    },
  });

  // Toggle promotion status mutation
  const togglePromotionMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await fetch(`/api/promotions/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update promotion status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotions"] });
      toast({
        title: "Success",
        description: "Promotion status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update promotion status",
        variant: "destructive",
      });
    },
  });

  // Delete promotion mutation
  const deletePromotionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/promotions/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete promotion');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotions"] });
      toast({
        title: "Success",
        description: "Promotion deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete promotion",
        variant: "destructive",
      });
    },
  });

  // Toggle voucher status mutation
  const toggleVoucherMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await fetch(`/api/vouchers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update voucher status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vouchers"] });
      toast({
        title: "Success",
        description: "Voucher status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update voucher status",
        variant: "destructive",
      });
    },
  });

  // Format date function
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-6 lg:p-8 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-spin-slow"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-spin-slower"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 lg:p-10 mb-6 lg:mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Eye className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Current Pricing</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
            {[
              { label: "Base Price", value: formatCurrency(pricingForm.basePrice), icon: DollarSign, color: "blue", delay: 0 },
              { label: "Cleaning Fee", value: formatCurrency(pricingForm.cleaningFee), icon: Sparkles, color: "emerald", delay: 100 },
              { label: "Pet Fee", value: formatCurrency(pricingForm.petFee), icon: Heart, color: "purple", delay: 200 },
              { label: "Weekly Discount", value: `${pricingForm.discountWeekly}%`, icon: Calendar, color: "orange", delay: 300 },
              { label: "Monthly Discount", value: `${pricingForm.discountMonthly}%`, icon: TrendingUp, color: "red", delay: 400 },
            ].map((item, index) => (
              <div
                key={item.label}
                className="group relative animate-fade-in-up"
                style={{ animationDelay: `${item.delay}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/80 to-white/60 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
                <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">{item.label}</p>
                        <p className="text-lg sm:text-xl lg:text-2xl font-black text-gray-900 truncate">{item.value}</p>
                      </div>
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  style={{
                    background: item.color === 'blue' ? 'linear-gradient(to bottom right, #60a5fa, #2563eb)' :
                              item.color === 'emerald' ? 'linear-gradient(to bottom right, #34d399, #059669)' :
                              item.color === 'purple' ? 'linear-gradient(to bottom right, #a78bfa, #7c3aed)' :
                              item.color === 'orange' ? 'linear-gradient(to bottom right, #fb923c, #ea580c)' :
                              'linear-gradient(to bottom right, #f87171, #dc2626)',
                    boxShadow: item.color === 'blue' ? '0 10px 15px -3px rgba(37, 99, 235, 0.25)' :
                              item.color === 'emerald' ? '0 10px 15px -3px rgba(5, 150, 105, 0.25)' :
                              item.color === 'purple' ? '0 10px 15px -3px rgba(124, 58, 237, 0.25)' :
                              item.color === 'orange' ? '0 10px 15px -3px rgba(234, 88, 12, 0.25)' :
                              '0 10px 15px -3px rgba(220, 38, 38, 0.25)'
                  }}>
                        <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out`}
                        style={{ 
                          width: '75%',
                          background: item.color === 'blue' ? 'linear-gradient(to right, #60a5fa, #2563eb)' :
                                    item.color === 'emerald' ? 'linear-gradient(to right, #34d399, #059669)' :
                                    item.color === 'purple' ? 'linear-gradient(to right, #a78bfa, #7c3aed)' :
                                    item.color === 'orange' ? 'linear-gradient(to right, #fb923c, #ea580c)' :
                                    'linear-gradient(to right, #f87171, #dc2626)'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Core Pricing Form with Glass Effect */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 lg:p-10 mb-6 lg:mb-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Core Pricing</h2>
              <p className="text-sm sm:text-base text-gray-600">Adjust your pricing strategy</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
            {[
              { 
                name: 'basePrice', 
                label: 'Base Price per Night', 
                icon: DollarSign, 
                color: 'blue',
                description: 'Your standard nightly rate',
                prefix: '€',
                suffix: '/night',
                step: 0.01,
                min: 0
              },
              { 
                name: 'cleaningFee', 
                label: 'Cleaning Fee', 
                icon: Sparkles, 
                color: 'emerald',
                description: 'One-time cleaning charge',
                prefix: '€',
                suffix: '/stay',
                step: 0.01,
                min: 0
              },
              { 
                name: 'petFee', 
                label: 'Pet Fee', 
                icon: Heart, 
                color: 'purple',
                description: 'Additional charge for pets',
                prefix: '€',
                suffix: '/night',
                step: 0.01,
                min: 0
              },
              { 
                name: 'discountWeekly', 
                label: 'Weekly Discount', 
                icon: Calendar, 
                color: 'orange',
                description: 'Discount for 7+ nights',
                prefix: '',
                suffix: '%',
                step: 1,
                min: 0,
                max: 100
              },
              { 
                name: 'discountMonthly', 
                label: 'Monthly Discount', 
                icon: TrendingUp, 
                color: 'red',
                description: 'Discount for 30+ nights',
                prefix: '',
                suffix: '%',
                step: 1,
                min: 0,
                max: 100
              }
            ].map((field, index) => (
              <div key={field.name} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/40 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl p-5 border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      style={{
                        background: field.color === 'blue' ? 'linear-gradient(to bottom right, #60a5fa, #2563eb)' :
                                  field.color === 'emerald' ? 'linear-gradient(to bottom right, #34d399, #059669)' :
                                  field.color === 'purple' ? 'linear-gradient(to bottom right, #a78bfa, #7c3aed)' :
                                  field.color === 'orange' ? 'linear-gradient(to bottom right, #fb923c, #ea580c)' :
                                  'linear-gradient(to bottom right, #f87171, #dc2626)',
                        boxShadow: field.color === 'blue' ? '0 10px 15px -3px rgba(37, 99, 235, 0.25)' :
                                  field.color === 'emerald' ? '0 10px 15px -3px rgba(5, 150, 105, 0.25)' :
                                  field.color === 'purple' ? '0 10px 15px -3px rgba(124, 58, 237, 0.25)' :
                                  field.color === 'orange' ? '0 10px 15px -3px rgba(234, 88, 12, 0.25)' :
                                  '0 10px 15px -3px rgba(220, 38, 38, 0.25)'
                      }}>
                      <field.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <Label htmlFor={field.name} className="text-sm font-bold text-gray-900">
                        {field.label}
                      </Label>
                      <p className="text-xs text-gray-600">{field.description}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm font-medium">{field.prefix}</span>
                    </div>
                    <Input
                      id={field.name}
                      type="number"
                      step={field.step}
                      min={field.min}
                      max={field.max}
                      value={pricingForm[field.name as keyof PricingSettings]}
                      onChange={(e) => setPricingForm({ 
                        ...pricingForm, 
                        [field.name]: parseFloat(e.target.value) || 0 
                      })}
                      className="pl-8 pr-12 bg-white/80 border-white/50 focus:border-white/80 text-gray-900 placeholder-gray-500 shadow-lg hover:shadow-xl transition-all duration-300"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm font-medium">{field.suffix}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end">
            <Button
              onClick={() => updatePricingMutation.mutate(pricingForm)}
              disabled={updatePricingMutation.isPending}
              className="relative group overflow-hidden h-12 sm:h-14 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
              <span className="relative flex items-center justify-center gap-3">
                {updatePricingMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </span>
            </Button>
          </div>
        </div>

        {/* Promotions Section */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 lg:p-10 mb-6 lg:mb-8 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Promotions</h3>
                <p className="text-sm text-gray-600">Create special offers to attract guests</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowPromotionForm(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Promotion
            </Button>
          </div>
          
          {/* Promotions Content */}
          {promotionsLoading ? (
            <div className="bg-gradient-to-br from-orange-50/50 to-red-50/50 rounded-2xl p-8 border border-orange-200/30 text-center">
              <div className="animate-pulse space-y-4">
                <div className="w-12 h-12 bg-orange-200 rounded-full mx-auto"></div>
                <div className="h-4 bg-orange-200 rounded w-48 mx-auto"></div>
                <div className="h-10 bg-orange-200 rounded w-32 mx-auto"></div>
              </div>
            </div>
          ) : promotions.length > 0 ? (
            <div className="space-y-4">
              {promotions.map((promotion, index) => {
                const isActive = promotion.isActive && new Date() >= new Date(promotion.startDate) && new Date() <= new Date(promotion.endDate);
                const isExpired = new Date() > new Date(promotion.endDate);
                const isScheduled = promotion.isActive && new Date() < new Date(promotion.startDate);
                const isInactive = !promotion.isActive;
                
                return (
                  <div
                    key={promotion.id}
                    className="group relative animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                      isActive ? 'bg-gradient-to-br from-orange-400/20 to-red-400/20' : 
                      isExpired ? 'bg-gradient-to-br from-gray-400/20 to-slate-400/20' :
                      isInactive ? 'bg-gradient-to-br from-gray-400/20 to-slate-400/20' :
                      'bg-gradient-to-br from-yellow-400/20 to-orange-400/20'
                    } opacity-0 group-hover:opacity-100 blur-xl`}></div>
                    
                    <div className={`relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 transition-all duration-300 hover:scale-[1.02] ${
                      isActive ? 'border-orange-200/50 hover:border-orange-300' : 
                      isExpired ? 'border-gray-200/50 hover:border-gray-300' :
                      isInactive ? 'border-gray-200/50 hover:border-gray-300' :
                      'border-yellow-200/50 hover:border-yellow-300'
                    }`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                              isActive ? 'bg-orange-100 text-orange-800' : 
                              isExpired ? 'bg-gray-100 text-gray-800' :
                              isInactive ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {promotion.discountPercentage}% OFF
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              isActive ? 'bg-green-100 text-green-800' : 
                              isExpired ? 'bg-red-100 text-red-800' :
                              isInactive ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {isActive ? 'ACTIVE' : 
                               isExpired ? 'EXPIRED' : 
                               isInactive ? 'INACTIVE' : 
                               'SCHEDULED'}
                            </span>
                          </div>
                          <h4 className="text-lg font-bold text-gray-900">{promotion.name}</h4>
                          <p className="text-sm text-gray-600">{promotion.description}</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Tag: {promotion.tag}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!isExpired && (
                                <DropdownMenuItem
                                  onClick={() => togglePromotionMutation.mutate({ 
                                    id: promotion.id, 
                                    isActive: !promotion.isActive 
                                  })}
                                  disabled={togglePromotionMutation.isPending}
                                  className="flex items-center gap-2"
                                >
                                  {promotion.isActive ? (
                                    <>
                                      <ToggleLeft className="h-4 w-4" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <ToggleRight className="h-4 w-4" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => deletePromotionMutation.mutate(promotion.id)}
                                disabled={deletePromotionMutation.isPending}
                                className="flex items-center gap-2 text-red-600 hover:text-red-700 focus:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      {/* Promotion Statistics */}
                      <div className="mt-4 pt-4 border-t border-gray-200/50">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Bookings:</span>
                            <span className="text-sm font-medium text-gray-900">{promotion.bookingCount || 0}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Nights:</span>
                            <span className="text-sm font-medium text-gray-900">{promotion.totalNights || 0}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Savings:</span>
                            <span className="text-sm font-medium text-gray-900">€{promotion.totalSavings || '0.00'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-orange-50/50 to-red-50/50 rounded-2xl p-8 border border-orange-200/30 text-center">
              <Gift className="w-12 h-12 text-orange-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No promotions created yet</p>
              <p className="text-sm text-gray-500">Create your first promotion to attract more guests with special offers</p>
            </div>
          )}
        </div>

        {/* Vouchers Section */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 lg:p-10 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25">
                <Percent className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Vouchers</h3>
                <p className="text-sm text-gray-600">Manage discount codes</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowVoucherForm(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Voucher
            </Button>
          </div>

          {/* Voucher Grid */}
          {vouchersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200/50 rounded-2xl h-32"></div>
                </div>
              ))}
            </div>
          ) : vouchers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {vouchers.map((voucher, index) => {
                const isExpired = new Date(voucher.validUntil) < new Date();
                const isMaxUsed = voucher.usageLimit && voucher.usageCount >= voucher.usageLimit;
                const effectiveStatus = isExpired || isMaxUsed ? 'EXPIRED' : (voucher.isActive ? 'ACTIVE' : 'INACTIVE');
                
                return (
                  <div
                    key={voucher.id}
                    className="group relative animate-fade-in-up cursor-pointer"
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => {
                      setSelectedVoucher(voucher);
                      setShowVoucherDetails(true);
                    }}
                  >
                    <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                      effectiveStatus === 'ACTIVE' ? 'bg-gradient-to-br from-green-400/20 to-emerald-400/20' : 
                      effectiveStatus === 'EXPIRED' ? 'bg-gradient-to-br from-red-400/20 to-pink-400/20' :
                      'bg-gradient-to-br from-gray-400/20 to-slate-400/20'
                    } opacity-0 group-hover:opacity-100 blur-xl`}></div>
                    
                    <div className={`relative bg-white/80 backdrop-blur-sm rounded-2xl p-5 border-2 transition-all duration-300 hover:scale-[1.02] ${
                      effectiveStatus === 'ACTIVE' ? 'border-green-200/50 hover:border-green-300' : 
                      effectiveStatus === 'EXPIRED' ? 'border-red-200/50 hover:border-red-300' :
                      'border-gray-200/50 hover:border-gray-300'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <p className={`font-mono font-bold text-lg truncate ${
                            effectiveStatus === 'ACTIVE' ? 'text-green-700' : 
                            effectiveStatus === 'EXPIRED' ? 'text-red-700' :
                            'text-gray-700'
                          }`}>
                            {voucher.code}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {voucher.discountType === 'percentage' ? `${voucher.discountValue}% off` : `€${voucher.discountValue} off`}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                            effectiveStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                            effectiveStatus === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {effectiveStatus}
                          </span>
                          {!isExpired && !isMaxUsed && (
                            <Button
                              size="sm"
                              variant={voucher.isActive ? "outline" : "default"}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleVoucherMutation.mutate({
                                  id: voucher.id,
                                  isActive: !voucher.isActive
                                });
                              }}
                              disabled={toggleVoucherMutation.isPending}
                              className="h-7 text-xs"
                            >
                              {toggleVoucherMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                voucher.isActive ? 'Deactivate' : 'Activate'
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Usage</span>
                          <span className="font-medium">{voucher.usageCount}/{voucher.usageLimit || '∞'}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                              effectiveStatus === 'ACTIVE' ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 
                              effectiveStatus === 'EXPIRED' ? 'bg-gradient-to-r from-red-400 to-pink-500' :
                              'bg-gradient-to-r from-gray-400 to-slate-500'
                            }`}
                            style={{ 
                              width: voucher.usageLimit 
                                ? `${(voucher.usageCount / voucher.usageLimit) * 100}%` 
                                : '0%' 
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Expires: {formatDate(voucher.validUntil)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-50/50 to-slate-50/50 rounded-2xl p-8 border border-gray-200/30 text-center">
              <Percent className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No vouchers created yet</p>
              <p className="text-sm text-gray-500">Create your first voucher to offer discounts to guests</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showVoucherForm && (
        <VoucherForm
          onClose={() => setShowVoucherForm(false)}
          onSuccess={() => {
            toast({
              title: "Success",
              description: "Voucher created successfully",
            });
          }}
        />
      )}

      {showPromotionForm && (
        <PromotionForm
          onClose={() => setShowPromotionForm(false)}
          onSuccess={() => {
            toast({
              title: "Success",
              description: "Promotion created successfully",
            });
          }}
        />
      )}

      {/* Voucher Details Modal */}
      {showVoucherDetails && selectedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowVoucherDetails(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Percent className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Voucher Details</h2>
                    <p className="text-white/80 text-sm">Manage and track voucher usage</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVoucherDetails(false)}
                  className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Voucher Info Card */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-6 border border-gray-200/50">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 font-mono">{selectedVoucher.code}</h3>
                    <p className="text-gray-600 mt-1">{selectedVoucher.description || 'No description'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    selectedVoucher.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedVoucher.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Discount</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedVoucher.discountType === 'percentage' 
                        ? `${selectedVoucher.discountValue}%` 
                        : `€${selectedVoucher.discountValue}`}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Usage</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedVoucher.usageCount}/{selectedVoucher.usageLimit || '∞'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Expires</p>
                    <p className={`text-lg font-bold ${
                      new Date(selectedVoucher.validUntil) < new Date() ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {formatDate(selectedVoucher.validUntil)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Usage Statistics */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200/50">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Usage Statistics
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                      <p className="text-2xl font-bold text-blue-600">{selectedVoucher.usageCount}</p>
                    </div>
                    <p className="text-sm text-gray-600">Times Used</p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                      <p className="text-2xl font-bold text-green-600">
                        €{voucherUsageHistory.reduce((total, usage) => total + parseFloat(usage.discountAmount || 0), 0).toFixed(2)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600">Total Savings</p>
                  </div>
                </div>
              </div>

              {/* Detailed Usage History */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-6 border border-gray-200/50">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-600" />
                  Usage History
                </h4>
                
                {usageHistoryLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">Loading usage history...</span>
                  </div>
                ) : voucherUsageHistory.length > 0 ? (
                  <div className="space-y-4">
                    {voucherUsageHistory.map((usage, index) => (
                      <div key={usage.id || index} className="bg-white rounded-lg p-4 border border-gray-200/50 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{usage.guestName}</p>
                                <p className="text-sm text-gray-600">{usage.guestEmail}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mt-3">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Booking Period</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {formatDate(usage.checkInDate)} - {formatDate(usage.checkOutDate)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Booking ID</p>
                                <p className="text-sm font-medium text-gray-900">
                                  #{usage.bookingId}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Booking Amount</p>
                                <p className="text-sm font-medium text-gray-900">
                                  €{parseFloat(usage.bookingAmount || 0).toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Discount Applied</p>
                                <p className="text-sm font-medium text-green-600">
                                  €{parseFloat(usage.discountAmount || 0).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-xs text-gray-500 mb-1">Used On</p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(usage.usedAt).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-1">No usage history yet</p>
                    <p className="text-sm text-gray-400">This voucher hasn't been used by any guests</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowVoucherDetails(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium"
                >
                  Close
                </Button>
                {!(new Date(selectedVoucher.validUntil) < new Date()) && (
                  <Button
                    onClick={() => {
                      toggleVoucherMutation.mutate({
                        id: selectedVoucher.id,
                        isActive: !selectedVoucher.isActive
                      });
                    }}
                    disabled={toggleVoucherMutation.isPending}
                    className={`flex-1 ${
                      selectedVoucher.isActive 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-green-500 hover:bg-green-600'
                    } text-white font-medium`}
                  >
                    {toggleVoucherMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      selectedVoucher.isActive ? 'Deactivate' : 'Activate'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
