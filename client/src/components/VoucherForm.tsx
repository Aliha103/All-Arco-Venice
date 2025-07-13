import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Percent, Calendar, DollarSign, Hash, Users, Clock, Sparkles, Tag, Info, Shield } from "lucide-react";

interface VoucherFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

interface VoucherFormData {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  usageLimit: number;
  minBookingAmount: number;
  maxDiscountAmount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export default function VoucherForm({ onClose, onSuccess }: VoucherFormProps) {
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleCloseModal = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };
  
  useEffect(() => {
    setIsVisible(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    // Add keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseModal();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  const [formData, setFormData] = useState<VoucherFormData>({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    usageLimit: 1,
    minBookingAmount: 0,
    maxDiscountAmount: 0,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    isActive: true
  });

  const createVoucherMutation = useMutation({
    mutationFn: async (voucherData: VoucherFormData) => {
      const response = await fetch('/api/vouchers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voucherData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create voucher');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vouchers"] });
      toast({
        title: "✨ Success!",
        description: "Voucher created successfully and is now active",
      });
      onSuccess?.();
      // Add a small delay for better UX
      setTimeout(() => {
        onClose();
      }, 500);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.code.trim()) {
      newErrors.code = "Voucher code is required";
    } else if (formData.code.length < 3) {
      newErrors.code = "Voucher code must be at least 3 characters";
    }
    
    if (formData.discountValue <= 0) {
      newErrors.discountValue = "Discount value must be greater than 0";
    } else if (formData.discountType === 'percentage' && formData.discountValue > 100) {
      newErrors.discountValue = "Percentage discount cannot exceed 100%";
    }
    
    if (formData.usageLimit < 1) {
      newErrors.usageLimit = "Usage limit must be at least 1";
    }
    
    if (new Date(formData.validFrom) >= new Date(formData.validUntil)) {
      newErrors.validUntil = "Valid until date must be after valid from date";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "⚠️ Validation Error",
        description: "Please fix the errors in the form before submitting",
        variant: "destructive",
      });
      return;
    }

    createVoucherMutation.mutate(formData);
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code: result });
    toast({
      title: "Code Generated",
      description: `New voucher code: ${result}`,
    });
  };
  

  return (
    <div 
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCloseModal();
        }
      }}
    >
      <div className={`bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-gray-200 transform transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`} style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        {/* Header */}
        <div className="relative bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 px-8 py-6 flex-shrink-0 shadow-lg">
          <div className="flex items-center justify-between">
            {/* Left side - Icon and title */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 id="voucher-form-title" className="text-2xl font-bold text-white">Create New Voucher</h2>
                <p id="voucher-form-description" className="text-green-100 text-sm">Set up discount codes for your customers</p>
              </div>
            </div>
            
            {/* Close button */}
            <button
              onClick={handleCloseModal}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 text-white hover:text-white hover:rotate-90"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Content - Single Column Layout */}
        <div className="flex-1 overflow-y-auto min-h-0" role="dialog" aria-labelledby="voucher-form-title" aria-describedby="voucher-form-description" style={{ scrollbarWidth: 'thin', scrollbarColor: '#a8b2d1 #f1f3f4' }}>
          <form id="voucher-form" onSubmit={handleSubmit} autoComplete="off" className="p-4 sm:p-6 animate-in fade-in duration-500">
            <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
              {/* Voucher Details */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-2xl border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Hash className="w-5 h-5 text-blue-600" />
                  Voucher Details
                </h3>
                
                {/* Voucher Code */}
                <div className="space-y-3 mb-6">
                  <Label htmlFor="code" className="text-sm font-medium text-gray-700">
                    Voucher Code
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => {
                        setFormData({ ...formData, code: e.target.value.toUpperCase() });
                        if (errors.code) {
                          setErrors({ ...errors, code: '' });
                        }
                      }}
                      placeholder="Enter voucher code"
                      className={`flex-1 h-12 text-base ${errors.code ? 'border-red-500 ring-red-500' : 'border-gray-300'}`}
                      maxLength={20}
                      aria-describedby={errors.code ? 'code-error' : undefined}
                    />
                    <Button
                      type="button"
                      onClick={generateRandomCode}
                      variant="outline"
                      className="h-12 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 hover:scale-105"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                  {errors.code && (
                    <p id="code-error" className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <Info className="w-4 h-4" />
                      {errors.code}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g., 'Summer Special - 30% off all bookings'"
                    rows={4}
                    className="resize-none transition-all duration-200 focus:ring-2 focus:ring-green-500/30 text-base"
                  />
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    This description will be shown to customers when they apply the voucher
                  </p>
                </div>
              </div>

              {/* Discount Configuration */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 rounded-2xl border border-green-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Percent className="w-5 h-5 text-green-600" />
                  Discount Configuration
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="discountType" className="text-sm font-medium text-gray-700">
                      Discount Type
                    </Label>
                    <Select 
                      value={formData.discountType} 
                      onValueChange={(value: 'percentage' | 'fixed') => setFormData({ ...formData, discountType: value })}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="discountValue" className="text-sm font-medium text-gray-700">
                      Discount Value
                    </Label>
                    <Input
                      id="discountValue"
                      type="number"
                      min="0"
                      step={formData.discountType === 'percentage' ? '1' : '0.01'}
                      max={formData.discountType === 'percentage' ? '100' : undefined}
                      value={formData.discountValue}
                      onChange={(e) => {
                        setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 });
                        if (errors.discountValue) {
                          setErrors({ ...errors, discountValue: '' });
                        }
                      }}
                      placeholder={formData.discountType === 'percentage' ? '20' : '25.00'}
                      className={`h-12 text-base ${errors.discountValue ? 'border-red-500 ring-red-500' : 'border-gray-300'}`}
                      aria-describedby={errors.discountValue ? 'discountValue-error' : undefined}
                    />
                  </div>
                </div>
                
                {errors.discountValue && (
                  <p id="discountValue-error" className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <Info className="w-4 h-4" />
                    {errors.discountValue}
                  </p>
                )}

                {/* Max Discount Amount (only for percentage) */}
                {formData.discountType === 'percentage' && (
                  <div className="space-y-3 mt-4">
                    <Label htmlFor="maxDiscountAmount" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Max Discount Amount (€) - Optional
                    </Label>
                    <Input
                      id="maxDiscountAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-green-500/30"
                    />
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Set a maximum discount cap to control costs (leave 0 for no limit)
                    </p>
                  </div>
                )}
              </div>

              {/* Usage & Restrictions */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 sm:p-6 rounded-2xl border border-purple-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Usage & Restrictions
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="usageLimit" className="text-sm font-medium text-gray-700">
                      Usage Limit
                    </Label>
                    <Input
                      id="usageLimit"
                      type="number"
                      min="1"
                      value={formData.usageLimit}
                      onChange={(e) => {
                        setFormData({ ...formData, usageLimit: parseInt(e.target.value) || 1 });
                        if (errors.usageLimit) {
                          setErrors({ ...errors, usageLimit: '' });
                        }
                      }}
                      placeholder="1"
                      className={`h-12 text-base ${errors.usageLimit ? 'border-red-500 ring-red-500' : 'border-gray-300'}`}
                      aria-describedby={errors.usageLimit ? 'usageLimit-error' : undefined}
                    />
                    {errors.usageLimit && (
                      <p id="usageLimit-error" className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <Info className="w-4 h-4" />
                        {errors.usageLimit}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="minBookingAmount" className="text-sm font-medium text-gray-700">
                      Min Booking Amount (€)
                    </Label>
                    <Input
                      id="minBookingAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.minBookingAmount}
                      onChange={(e) => setFormData({ ...formData, minBookingAmount: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-green-500/30"
                    />
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Minimum booking value required to use this voucher
                    </p>
                  </div>
                </div>
              </div>

              {/* Validity Period */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 sm:p-6 rounded-2xl border border-orange-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  Validity Period
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="validFrom" className="text-sm font-medium text-gray-700">
                      Valid From
                    </Label>
                    <Input
                      id="validFrom"
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                      className="h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-green-500/30"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="validUntil" className="text-sm font-medium text-gray-700">
                      Valid Until
                    </Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => {
                        setFormData({ ...formData, validUntil: e.target.value });
                        if (errors.validUntil) {
                          setErrors({ ...errors, validUntil: '' });
                        }
                      }}
                      className={`h-12 text-base ${errors.validUntil ? 'border-red-500 ring-red-500' : 'border-gray-300'}`}
                      aria-describedby={errors.validUntil ? 'validUntil-error' : undefined}
                    />
                  </div>
                </div>
                
                {errors.validUntil && (
                  <p id="validUntil-error" className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <Info className="w-4 h-4" />
                    {errors.validUntil}
                  </p>
                )}
              </div>

              {/* Activation Status */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 rounded-2xl border border-green-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-green-600" />
                  Activation Status
                </h3>
                
                <div className="flex items-center space-x-3 p-3 sm:p-4 bg-white rounded-xl border border-green-200">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500 w-5 h-5"
                  />
                  <Label htmlFor="isActive" className="text-base font-medium text-green-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Active immediately
                  </Label>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  When enabled, the voucher will be active immediately after creation
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Sticky Form Actions */}
        <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 max-w-2xl mx-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              className="w-full sm:w-auto px-6 sm:px-8 h-12 font-medium border-2 hover:bg-gray-50 transition-all duration-200 text-base hover:scale-105"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              form="voucher-form"
              disabled={createVoucherMutation.isPending}
              className="w-full sm:w-auto px-6 sm:px-8 h-12 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:transform-none disabled:hover:scale-100 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createVoucherMutation.isPending ? (
                <>
                  <Clock className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" aria-hidden="true" />
                  <span>Create Voucher</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
