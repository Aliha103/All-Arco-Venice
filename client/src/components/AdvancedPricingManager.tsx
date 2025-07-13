import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  DollarSign, 
  Settings, 
  TrendingUp, 
  Calendar, 
  PawPrint, 
  Sparkles, 
  Eye, 
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Percent,
  Home,
  Clock,
  Zap
} from "lucide-react";

import './AdvancedPricingStyles.css';

interface PricingSettings {
  basePrice: number;
  cleaningFee: number;
  petFee: number;
  cleaningFeeShortStay: number;
  cleaningFeeLongStay: number;
  petFeeShortStay: number;
  petFeeLongStay: number;
  discountWeekly: number;
  discountMonthly: number;
}

interface PricingPreview {
  nights: number;
  baseTotal: number;
  cleaningFee: number;
  petFee: number;
  discountAmount: number;
  discountPercent: number;
  finalTotal: number;
}

const AdvancedPricingManager: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("rates");
  const [editMode, setEditMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewSettings, setPreviewSettings] = useState({
    nights: 3,
    hasPet: false,
    guestCount: 2
  });

  const [formData, setFormData] = useState<PricingSettings>({
    basePrice: 150,
    cleaningFee: 25,
    petFee: 35,
    cleaningFeeShortStay: 25,
    cleaningFeeLongStay: 35,
    petFeeShortStay: 15,
    petFeeLongStay: 25,
    discountWeekly: 10,
    discountMonthly: 20
  });

  const [originalData, setOriginalData] = useState<PricingSettings | null>(null);

  const { data: pricingData, isLoading } = useQuery({
    queryKey: ["pricing-settings"],
    queryFn: () => apiRequest("/api/pricing-settings"),
    refetchOnWindowFocus: false
  });

  const updatePricingMutation = useMutation({
    mutationFn: (data: PricingSettings) => 
      apiRequest("/api/pricing-settings", {
        method: "PUT",
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-settings"] });
      toast({
        title: "Success",
        description: "Pricing settings updated successfully",
        variant: "default"
      });
      setEditMode(false);
      setOriginalData(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update pricing settings",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    if (pricingData) {
      const settings = {
        basePrice: parseFloat(pricingData.basePrice),
        cleaningFee: parseFloat(pricingData.cleaningFee),
        petFee: parseFloat(pricingData.petFee),
        cleaningFeeShortStay: parseFloat(pricingData.cleaningFeeShortStay),
        cleaningFeeLongStay: parseFloat(pricingData.cleaningFeeLongStay),
        petFeeShortStay: parseFloat(pricingData.petFeeShortStay),
        petFeeLongStay: parseFloat(pricingData.petFeeLongStay),
        discountWeekly: pricingData.discountWeekly,
        discountMonthly: pricingData.discountMonthly
      };
      setFormData(settings);
    }
  }, [pricingData]);

  const handleEdit = () => {
    setOriginalData({ ...formData });
    setEditMode(true);
  };

  const handleCancel = () => {
    if (originalData) {
      setFormData(originalData);
    }
    setEditMode(false);
    setOriginalData(null);
  };

  const handleSave = () => {
    updatePricingMutation.mutate(formData);
  };

  const calculatePreview = (): PricingPreview => {
    const { nights, hasPet } = previewSettings;
    const baseTotal = formData.basePrice * nights;
    
    const cleaningFee = nights <= 2 ? formData.cleaningFeeShortStay : formData.cleaningFeeLongStay;
    const petFee = hasPet ? (nights <= 2 ? formData.petFeeShortStay : formData.petFeeLongStay) : 0;
    
    let discountPercent = 0;
    if (nights >= 28) discountPercent = formData.discountMonthly;
    else if (nights >= 7) discountPercent = formData.discountWeekly;
    
    const discountAmount = (baseTotal * discountPercent) / 100;
    const finalTotal = baseTotal - discountAmount + cleaningFee + petFee;

    return {
      nights,
      baseTotal,
      cleaningFee,
      petFee,
      discountAmount,
      discountPercent,
      finalTotal
    };
  };

  const preview = calculatePreview();

  const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;

  const hasChanges = originalData && JSON.stringify(formData) !== JSON.stringify(originalData);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading pricing settings...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

return (
    <div className="pricing-manager-container">
      <header className="pricing-header">
        <h2 className="pricing-title">Pricing Settings</h2>
        <p className="pricing-subtitle">Configure your property's pricing structure and discounts</p>
        <div className="pricing-actions">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
            className="action-button"
          >
            <Eye className="action-icon" />
            {previewMode ? "Hide Preview" : "Show Preview"}
          </Button>
          {editMode ? (
            <div className="action-buttons">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="action-button"
              >
                <RotateCcw className="action-icon" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updatePricingMutation.isPending || !hasChanges}
                className="action-button"
              >
                <Save className="action-icon" />
                {updatePricingMutation.isPending ? "Saving..." : "Update Pricing"}
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={handleEdit}
              className="action-button"
            >
              <Settings className="action-icon" />
              Edit Pricing
            </Button>
          )}
        </div>
      </header>

      {hasChanges && (
        <div className="status-indicator">
          <AlertCircle className="indicator-icon" />
          <span>You have unsaved changes</span>
        </div>
      )}

      <main className="pricing-main">
        {/* Pricing Configuration */}
        <div className="pricing-tabs-container">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="pricing-tabs">
            <TabsList className="tabs-list">
              <TabsTrigger value="rates" className="tabs-trigger">
                <Home className="tabs-icon" />
                Core Pricing
              </TabsTrigger>
              <TabsTrigger value="fees" className="tabs-trigger">
                <Sparkles className="tabs-icon" />
                Additional Fees
              </TabsTrigger>
              <TabsTrigger value="discounts" className="tabs-trigger">
                <Percent className="tabs-icon" />
                Length of Stay Discounts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rates" className="tabs-content">
              <Card className="card">
                <CardHeader>
                  <CardTitle className="card-title">
                    Base Price per Night (€)
                  </CardTitle>
                  <CardDescription className="card-description">
                    Your main nightly rate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    id="basePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                    disabled={!editMode}
                    className="pricing-input"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fees" className="tabs-content">
              <Card className="card">
                <CardHeader>
                  <CardTitle className="card-title">
                    Cleaning Fee (€)
                  </CardTitle>
                  <CardDescription className="card-description">
                    One-time cleaning fee
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    id="cleaningFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cleaningFee}
                    onChange={(e) => setFormData({ ...formData, cleaningFee: parseFloat(e.target.value) || 0 })}
                    disabled={!editMode}
                    className="pricing-input"
                  />
                </CardContent>
              </Card>

              <Card className="card">
                <CardHeader>
                  <CardTitle className="card-title">
                    Pet Fee (€)
                  </CardTitle>
                  <CardDescription className="card-description">
                    Additional fee for pets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    id="petFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.petFee}
                    onChange={(e) => setFormData({ ...formData, petFee: parseFloat(e.target.value) || 0 })}
                    disabled={!editMode}
                    className="pricing-input"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="discounts" className="tabs-content">
              <Card className="card">
                <CardHeader>
                  <CardTitle className="card-title">
                    Weekly Discount (%)
                  </CardTitle>
                  <CardDescription className="card-description">
                    For stays of 7+ nights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    id="weeklyDiscount"
                    type="number"
                    step="1"
                    min="0"
                    value={formData.discountWeekly}
                    onChange={(e) => setFormData({ ...formData, discountWeekly: parseInt(e.target.value) || 0 })}
                    disabled={!editMode}
                    className="pricing-input"
                  />
                </CardContent>
              </Card>

              <Card className="card">
                <CardHeader>
                  <CardTitle className="card-title">
                    Monthly Discount (%)
                  </CardTitle>
                  <CardDescription className="card-description">
                    For stays of 30+ nights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    id="monthlyDiscount"
                    type="number"
                    step="1"
                    min="0"
                    value={formData.discountMonthly}
                    onChange={(e) => setFormData({ ...formData, discountMonthly: parseInt(e.target.value) || 0 })}
                    disabled={!editMode}
                    className="pricing-input"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

      </main>
    </div>
  );
};

export default AdvancedPricingManager;