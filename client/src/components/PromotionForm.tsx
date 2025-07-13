import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X, Gift, Calendar, Percent, Sparkles, Tag, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface PromotionFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function PromotionForm({ onClose, onSuccess }: PromotionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: "",
    tag: "",
    discountPercentage: "",
    startDate: "",
    endDate: "",
    description: "",
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createPromotionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/promotions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/promotions/active"] });
      toast({
        title: "Success",
        description: "Promotion created successfully",
      });
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || "Failed to create promotion";
      
      // Check if it's the active promotion conflict error
      if (errorMessage.includes("Cannot add new promotion while another promotion is active")) {
        toast({
          title: "Cannot Create Active Promotion",
          description: "Another promotion is currently active. You can create this promotion as inactive, or deactivate the existing promotion first.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Promotion name is required";
    }

    if (!formData.tag.trim()) {
      newErrors.tag = "Tag is required";
    }

    if (!formData.discountPercentage || parseFloat(formData.discountPercentage) <= 0) {
      newErrors.discountPercentage = "Discount percentage must be greater than 0";
    }

    if (parseFloat(formData.discountPercentage) > 100) {
      newErrors.discountPercentage = "Discount percentage cannot exceed 100%";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start >= end) {
        newErrors.endDate = "End date must be after start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    createPromotionMutation.mutate({
      ...formData,
      discountPercentage: parseInt(formData.discountPercentage),
    });
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full blur-2xl animate-pulse"></div>
        </div>

        {/* Header */}
        <div className="relative bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Create Promotion</h2>
                <p className="text-white/80 text-sm">Set up a new promotional campaign</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="relative p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Promotion Name */}
            <div>
              <Label htmlFor="name" className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Promotion Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Summer Special, Holiday Discount"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Tag */}
            <div>
              <Label htmlFor="tag" className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tag
              </Label>
              <Input
                id="tag"
                type="text"
                placeholder="e.g., SUMMER2024, HOLIDAY"
                value={formData.tag}
                onChange={(e) => handleInputChange("tag", e.target.value.toUpperCase())}
                className={`mt-1 ${errors.tag ? 'border-red-500' : ''}`}
              />
              {errors.tag && <p className="text-red-500 text-sm mt-1">{errors.tag}</p>}
            </div>

            {/* Discount Percentage */}
            <div>
              <Label htmlFor="discountPercentage" className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Percent className="w-4 h-4" />
                Discount Percentage
              </Label>
              <div className="relative mt-1">
                <Input
                  id="discountPercentage"
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  placeholder="e.g., 15"
                  value={formData.discountPercentage}
                  onChange={(e) => handleInputChange("discountPercentage", e.target.value)}
                  className={`pr-8 ${errors.discountPercentage ? 'border-red-500' : ''}`}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">%</span>
                </div>
              </div>
              {errors.discountPercentage && <p className="text-red-500 text-sm mt-1">{errors.discountPercentage}</p>}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                  className={`mt-1 ${errors.startDate ? 'border-red-500' : ''}`}
                />
                {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
              </div>

              <div>
                <Label htmlFor="endDate" className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  className={`mt-1 ${errors.endDate ? 'border-red-500' : ''}`}
                />
                {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-sm font-bold text-gray-900">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your promotion..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="mt-1 resize-none"
                rows={3}
              />
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  formData.isActive ? 'bg-green-100' : 'bg-gray-200'
                }`}>
                  {formData.isActive ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formData.isActive ? 'Promotion will be active immediately' : 'Promotion will be created as inactive'}
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange("isActive", checked)}
              />
            </div>

            {/* Preview */}
            {formData.name && formData.discountPercentage && (
              <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Gift className="w-5 h-5 text-orange-600" />
                    Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-orange-500 text-white">
                      {formData.discountPercentage}% OFF
                    </Badge>
                    <div>
                      <p className="font-bold text-gray-900">{formData.name}</p>
                      {formData.tag && (
                        <p className="text-sm text-gray-600">Tag: {formData.tag}</p>
                      )}
                    </div>
                  </div>
                  {formData.description && (
                    <p className="text-sm text-gray-600 mt-2">{formData.description}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createPromotionMutation.isPending}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                {createPromotionMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    Create Promotion
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
