import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Link,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  RefreshCw,
  Shield,
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  Eye,
  EyeOff,
  AlertTriangle,
  Info,
  Activity,
  Zap,
  Calendar,
  BarChart,
  Lock,
  FileText,
  HelpCircle,
  CheckSquare,
  XCircle,
  ArrowUpDown,
  X,
  Users,
  Database,
  Save,
  CalendarCheck,
  CalendarX,
  UserPlus,
  Home,
  DollarSign,
  MapPin,
  Bed,
  Ban,
  Server,
  Wifi,
  WifiOff,
} from "lucide-react";

// Database Models matching your existing schema
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: Date;
  bookings: Booking[];
}

interface Property {
  id: string;
  name: string;
  address: string;
  maxGuests: number;
  bedrooms: number;
  pricePerNight: number;
  blockedDates: Date[];
}

interface Booking {
  id: string;
  integrationId: string;
  platform: string;
  propertyId: string;
  userId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalPrice: number;
  status: "confirmed" | "pending" | "cancelled";
  externalId: string;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

// Enhanced integration interface
interface Integration {
  id: string;
  name: string;
  method: "ICAL" | "API" | "WEBHOOK";
  details: string;
  status: "active" | "inactive" | "error" | "syncing" | "pending";
  lastSync: string;
  nextSync?: string;
  bookingsCount: number;
  errorCount: number;
  lastError?: string;
  autoSync: boolean;
  syncInterval: number;
  encryptionEnabled: boolean;
  webhookUrl?: string;
  rateLimitRemaining?: number;
  healthScore: number;
  mapping?: Record<string, string>;
  testMode: boolean;
  preventDoubleBooking: boolean;
}

interface IntegrationHealth {
  uptime: number;
  avgSyncTime: number;
  successRate: number;
  lastIncident?: string;
}

interface SyncProgress {
  integrationId: string;
  progress: number;
  status: string;
  processedItems: number;
  totalItems: number;
}

interface BookingStats {
  totalBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  bookingsByPlatform: Array<{ name: string; count: number }>;
  occupancyRate: number;
}

// Toast Component
interface ToastProps {
  message: string;
  type: "success" | "error" | "warning";
  onClose: () => void;
}

const Toast = ({ message, type, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transition-all transform animate-in slide-in-from-bottom-5 ${
        type === "error"
          ? "bg-red-500 text-white"
          : type === "warning"
          ? "bg-yellow-500 text-white"
          : "bg-gray-900 text-white"
      }`}
    >
      {type === "error" ? (
        <XCircle className="w-5 h-5" />
      ) : type === "warning" ? (
        <AlertTriangle className="w-5 h-5" />
      ) : (
        <CheckCircle className="w-5 h-5" />
      )}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const integrationOptions = [
  {
    name: "Airbnb",
    methods: ["ICAL"],
    icon: "🏠",
    color: "red",
    documentation: "https://help.airbnb.com/ical",
  },
  {
    name: "Booking.com",
    methods: ["ICAL", "API", "WEBHOOK"],
    icon: "🏨",
    color: "blue",
    documentation: "https://connect.booking.com",
  },
  {
    name: "Trip.com",
    methods: ["API", "WEBHOOK"],
    icon: "✈️",
    color: "orange",
    documentation: "https://api.trip.com",
  },
  {
    name: "Agoda",
    methods: ["ICAL", "API"],
    icon: "🏖️",
    color: "pink",
    documentation: "https://ycs.agoda.com",
  },
  {
    name: "Expedia",
    methods: ["ICAL", "API", "WEBHOOK"],
    icon: "🌎",
    color: "yellow",
    documentation: "https://expediaconnectivity.com",
  },
  {
    name: "Vrbo",
    methods: ["ICAL"],
    icon: "🏡",
    color: "green",
    documentation: "https://help.vrbo.com",
  },
];

// API Service for database communication
const apiRequest = async (
  method: string,
  endpoint: string,
  data: any = null
) => {
  // Use default URL or get from window location
  const baseURL = window.location.origin.includes("localhost")
    ? "http://localhost:3000"
    : window.location.origin;

  try {
    const response = await fetch(`${baseURL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`, // Use existing auth
      },
      body: data ? JSON.stringify(data) : null,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response;
  } catch (error) {
    console.error("API Request failed:", error);
    throw error;
  }
};

const PMSSettings: React.FC = () => {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: "success" | "error" | "warning" }>>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<
    Record<string, IntegrationHealth>
  >({});
  const [loading, setLoading] = useState(true);
  const [isAddingIntegration, setIsAddingIntegration] = useState(false);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "status" | "lastSync">("name");
  const [selectedIntegrations, setSelectedIntegrations] = useState<Set<string>>(
    new Set()
  );
  const [syncProgress, setSyncProgress] = useState<
    Record<string, SyncProgress>
  >({});
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testingIntegrationId, setTestingIntegrationId] = useState<
    string | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bookingStats, setBookingStats] = useState<BookingStats | null>(null);
  const [databaseStatus, setDatabaseStatus] = useState<
    "connected" | "disconnected" | "error"
  >("connected");
  const [lastBackup, setLastBackup] = useState<Date | null>(null);

  const [newIntegration, setNewIntegration] = useState({
    name: "",
    method: "ICAL" as "ICAL" | "API" | "WEBHOOK",
    details: "",
    autoSync: true,
    syncInterval: 60,
    encryptionEnabled: true,
    testMode: true,
    webhookUrl: "",
    preventDoubleBooking: true,
  });

  // Toast functionality
  const showToast = useCallback(
    (message: string, type: "success" | "error" | "warning" = "success") => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
    },
    []
  );

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Check database connection
  const checkDatabaseConnection = useCallback(async () => {
    try {
      const response = await apiRequest("GET", "/api/health");
      const data = await response.json();
      setDatabaseStatus(
        data.database === "connected" ? "connected" : "disconnected"
      );
      if (data.lastBackup) {
        setLastBackup(new Date(data.lastBackup));
      }
    } catch (error) {
      setDatabaseStatus("error");
    }
  }, []);

  // Fetch integrations from database
  const fetchIntegrations = useCallback(async () => {
    try {
      const response = await apiRequest("GET", "/api/pms/integrations");
      const data = await response.json();
      setIntegrations(data);
    } catch (error) {
      showToast("Failed to load integrations from database", "error");
      setDatabaseStatus("error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Fetch health metrics
  const fetchHealthMetrics = useCallback(async () => {
    try {
      const response = await apiRequest("GET", "/api/pms/integrations/health");
      const data = await response.json();
      setHealthMetrics(data);
    } catch (error) {
      console.error("Failed to load health metrics:", error);
    }
  }, []);

  // Fetch booking statistics
  const fetchBookingStats = useCallback(async () => {
    try {
      const response = await apiRequest("GET", "/api/pms/bookings/stats");
      const data = await response.json();
      setBookingStats(data);
    } catch (error) {
      console.error("Failed to load booking stats:", error);
    }
  }, []);

  // Initialize data - WebSocket will handle real-time updates
  useEffect(() => {
    checkDatabaseConnection();
    fetchIntegrations();
    fetchHealthMetrics();
    fetchBookingStats();
  }, [
    checkDatabaseConnection,
    fetchIntegrations,
    fetchHealthMetrics,
    fetchBookingStats,
  ]);

  // Use main WebSocket connection for real-time updates
  useEffect(() => {
    // DISABLED: PMS WebSocket functionality
    // WebSocket connections have been disabled to prevent page load interruptions
    
    return () => {
      // No cleanup needed - WebSocket disabled
    };
  }, [fetchIntegrations, fetchHealthMetrics, fetchBookingStats, checkDatabaseConnection]);

  // Filter and sort integrations
  const filteredIntegrations = useMemo(() => {
    let filtered = integrations;

    if (searchQuery) {
      filtered = filtered.filter(
        (int) =>
          int.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          int.method.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((int) => int.status === statusFilter);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "status":
          return a.status.localeCompare(b.status);
        case "lastSync":
          return (
            new Date(b.lastSync).getTime() - new Date(a.lastSync).getTime()
          );
        default:
          return 0;
      }
    });
  }, [integrations, searchQuery, statusFilter, sortBy]);

  // Helper functions
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return url.startsWith("http://") || url.startsWith("https://");
    } catch {
      return false;
    }
  };

  const isValidApiKey = (key: string) => {
    return key.length >= 16 && /^[a-zA-Z0-9-_]+$/.test(key);
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.slice(0, 4) + "•".repeat(key.length - 8) + key.slice(-4);
  };

  const resetNewIntegration = () => {
    setNewIntegration({
      name: "",
      method: "ICAL",
      details: "",
      autoSync: true,
      syncInterval: 60,
      encryptionEnabled: true,
      testMode: true,
      webhookUrl: "",
      preventDoubleBooking: true,
    });
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "syncing":
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  // Actions
  const handleAddIntegration = async () => {
    if (!newIntegration.name || !newIntegration.details) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    if (
      newIntegration.method === "ICAL" &&
      !isValidUrl(newIntegration.details)
    ) {
      showToast("Invalid iCal URL format", "error");
      return;
    }

    if (
      newIntegration.method === "API" &&
      !isValidApiKey(newIntegration.details)
    ) {
      showToast("Invalid API key format", "error");
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiRequest(
        "POST",
        "/api/pms/integrations",
        newIntegration
      );
      const data = await response.json();

      setIntegrations((prev) => [...prev, data]);
      setIsAddingIntegration(false);
      resetNewIntegration();
      showToast("Integration added successfully and saved to database");

      // Refresh data
      fetchIntegrations();
      fetchBookingStats();
    } catch (error) {
      showToast("Failed to add integration to database", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncIntegration = async (id: string) => {
    const integration = integrations.find((int) => int.id === id);
    if (!integration) return;

    setSyncProgress((prev) => ({
      ...prev,
      [id]: {
        integrationId: id,
        progress: 0,
        status: "Starting sync...",
        processedItems: 0,
        totalItems: 100,
      },
    }));

    setIntegrations((prev) =>
      prev.map((int) => (int.id === id ? { ...int, status: "syncing" } : int))
    );

    try {
      if (integration.preventDoubleBooking) {
        showToast("Checking for booking conflicts...", "warning");
      }

      const response = await apiRequest(
        "POST",
        `/api/pms/integrations/${id}/sync`,
        {
          checkConflicts: integration.preventDoubleBooking,
        }
      );
      const result = await response.json();

      if (result.conflicts && result.conflicts.length > 0) {
        showToast(
          `Warning: ${result.conflicts.length} booking conflicts detected`,
          "warning"
        );
      }

      showToast(
        `Sync completed. Imported ${result.imported || 0} bookings to database`
      );

      setIntegrations((prev) =>
        prev.map((int) =>
          int.id === id
            ? {
                ...int,
                status: "active",
                lastSync: new Date().toISOString(),
                bookingsCount: int.bookingsCount + (result.imported || 0),
              }
            : int
        )
      );

      // Refresh stats
      fetchBookingStats();
    } catch (error) {
      showToast("Sync failed. Check database connection", "error");
      setIntegrations((prev) =>
        prev.map((int) =>
          int.id === id
            ? { ...int, status: "error", lastError: error instanceof Error ? error.message : String(error) }
            : int
        )
      );
    }
  };

  const handleBulkSync = async () => {
    const ids = Array.from(selectedIntegrations);
    showToast(`Starting sync for ${ids.length} integrations...`);

    for (const id of ids) {
      await handleSyncIntegration(id);
    }

    setSelectedIntegrations(new Set());
  };

  const handleTestIntegration = async (id: string) => {
    setIsTesting(true);
    try {
      const response = await apiRequest(
        "POST",
        `/api/pms/integrations/${id}/test`
      );
      const result = await response.json();

      if (result.success) {
        showToast("Integration test passed! Connection verified.");
        setIntegrations((prev) =>
          prev.map((int) =>
            int.id === id ? { ...int, status: "active" } : int
          )
        );
      } else {
        showToast(`Test failed: ${result.error}`, "error");
      }

      setShowTestDialog(false);
      setTestingIntegrationId(null);
    } catch (error) {
      showToast("Integration test failed", "error");
    } finally {
      setIsTesting(false);
    }
  };

  const handleDeleteIntegration = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this integration?")) {
      return;
    }

    setIsDeleting(true);
    try {
      console.log(`🗑️ Attempting to delete integration: ${id}`);
      const response = await apiRequest("DELETE", `/api/pms/integrations/${id}`);
      console.log(`✅ Delete response:`, response);
      
      setIntegrations((prev) => prev.filter((int) => int.id !== id));
      showToast("Integration deleted successfully");
      fetchBookingStats();
    } catch (error) {
      console.error(`❌ Delete integration error:`, error);
      
      // Show more specific error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to delete integration";
      
      showToast(`Delete failed: ${errorMessage}`, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await apiRequest("GET", "/api/pms/export");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pms-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast("Data exported successfully");
    } catch (error) {
      showToast("Failed to export data", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Container */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* Database Connection Alert */}
      {databaseStatus !== "connected" && (
        <Alert variant="destructive">
          <WifiOff className="w-4 h-4" />
          <AlertDescription>
            Database connection {databaseStatus === "error" ? "error" : "lost"}.
            Some features may not work properly.
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Channel Manager</h2>
          <p className="text-gray-600">
            Manage booking platform integrations with database sync
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedIntegrations.size > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={handleBulkSync}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Selected ({selectedIntegrations.size})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIntegrations(new Set())}
              >
                Clear Selection
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog
            open={isAddingIntegration}
            onOpenChange={setIsAddingIntegration}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Integration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Channel Integration</DialogTitle>
                <DialogDescription>
                  Connect a new booking platform with automatic database sync
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="basic" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Setup</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div>
                    <Label htmlFor="integration-name">Platform</Label>
                    <Select
                      value={newIntegration.name}
                      onValueChange={(value) =>
                        setNewIntegration((prev) => ({ ...prev, name: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {integrationOptions.map((option) => (
                          <SelectItem key={option.name} value={option.name}>
                            <div className="flex items-center gap-2">
                              <span>{option.icon}</span>
                              <span>{option.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {newIntegration.name && (
                      <a
                        href={
                          integrationOptions.find(
                            (opt) => opt.name === newIntegration.name
                          )?.documentation
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        View integration documentation
                      </a>
                    )}
                  </div>

                  {newIntegration.name && (
                    <div>
                      <Label htmlFor="integration-method">
                        Connection Method
                      </Label>
                      <Select
                        value={newIntegration.method}
                        onValueChange={(value: "ICAL" | "API" | "WEBHOOK") =>
                          setNewIntegration((prev) => ({
                            ...prev,
                            method: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {integrationOptions
                            .find((opt) => opt.name === newIntegration.name)
                            ?.methods.map((method) => (
                              <SelectItem key={method} value={method}>
                                <div className="flex items-center gap-2">
                                  {method === "API" && (
                                    <Zap className="w-4 h-4" />
                                  )}
                                  {method === "ICAL" && (
                                    <Calendar className="w-4 h-4" />
                                  )}
                                  {method === "WEBHOOK" && (
                                    <Activity className="w-4 h-4" />
                                  )}
                                  {method}
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="integration-details">
                      {newIntegration.method === "ICAL"
                        ? "iCal URL"
                        : newIntegration.method === "API"
                        ? "API Key"
                        : "Webhook Endpoint"}
                    </Label>
                    <Input
                      id="integration-details"
                      type={
                        newIntegration.method === "API" ? "password" : "text"
                      }
                      value={newIntegration.details}
                      onChange={(e) =>
                        setNewIntegration((prev) => ({
                          ...prev,
                          details: e.target.value,
                        }))
                      }
                      placeholder={
                        newIntegration.method === "ICAL"
                          ? "https://example.com/calendar.ics"
                          : newIntegration.method === "API"
                          ? "Enter API key"
                          : "https://your-server.com/webhook"
                      }
                    />
                    {newIntegration.details && (
                      <p className="text-xs text-gray-500 mt-1">
                        {newIntegration.method === "ICAL" &&
                          !isValidUrl(newIntegration.details) &&
                          "⚠️ Please enter a valid URL starting with http:// or https://"}
                        {newIntegration.method === "API" &&
                          !isValidApiKey(newIntegration.details) &&
                          "⚠️ API key should be at least 16 characters and contain only letters, numbers, hyphens, and underscores"}
                      </p>
                    )}
                  </div>

                  {newIntegration.method === "WEBHOOK" && (
                    <div>
                      <Label htmlFor="webhook-url">Your Webhook URL</Label>
                      <Input
                        id="webhook-url"
                        value={newIntegration.webhookUrl}
                        onChange={(e) =>
                          setNewIntegration((prev) => ({
                            ...prev,
                            webhookUrl: e.target.value,
                          }))
                        }
                        placeholder="https://your-server.com/pms-webhook"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        The platform will send booking updates to this URL
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                  <Alert>
                    <Shield className="w-4 h-4" />
                    <AlertDescription>
                      Security settings protect your integration and prevent
                      booking conflicts
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="encryption">End-to-End Encryption</Label>
                      <p className="text-sm text-gray-500">
                        Encrypt credentials in database
                      </p>
                    </div>
                    <Switch
                      id="encryption"
                      checked={newIntegration.encryptionEnabled}
                      onCheckedChange={(checked) =>
                        setNewIntegration((prev) => ({
                          ...prev,
                          encryptionEnabled: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="prevent-double">
                        Prevent Double Booking
                      </Label>
                      <p className="text-sm text-gray-500">
                        Check database for conflicts before saving
                      </p>
                    </div>
                    <Switch
                      id="prevent-double"
                      checked={newIntegration.preventDoubleBooking}
                      onCheckedChange={(checked) =>
                        setNewIntegration((prev) => ({
                          ...prev,
                          preventDoubleBooking: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="test-mode">Test Mode</Label>
                      <p className="text-sm text-gray-500">
                        Validate integration before activation
                      </p>
                    </div>
                    <Switch
                      id="test-mode"
                      checked={newIntegration.testMode}
                      onCheckedChange={(checked) =>
                        setNewIntegration((prev) => ({
                          ...prev,
                          testMode: checked,
                        }))
                      }
                    />
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-sync">Automatic Sync</Label>
                      <p className="text-sm text-gray-500">
                        Sync bookings to database automatically
                      </p>
                    </div>
                    <Switch
                      id="auto-sync"
                      checked={newIntegration.autoSync}
                      onCheckedChange={(checked) =>
                        setNewIntegration((prev) => ({
                          ...prev,
                          autoSync: checked,
                        }))
                      }
                    />
                  </div>

                  {newIntegration.autoSync && (
                    <div>
                      <Label htmlFor="sync-interval">
                        Sync Interval (minutes)
                      </Label>
                      <Select
                        value={newIntegration.syncInterval.toString()}
                        onValueChange={(value) =>
                          setNewIntegration((prev) => ({
                            ...prev,
                            syncInterval: parseInt(value),
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">Every 15 minutes</SelectItem>
                          <SelectItem value="30">Every 30 minutes</SelectItem>
                          <SelectItem value="60">Every hour</SelectItem>
                          <SelectItem value="120">Every 2 hours</SelectItem>
                          <SelectItem value="360">Every 6 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label>Field Mapping (JSON)</Label>
                    <Textarea
                      placeholder='{"guestName": "guest.name", "checkIn": "booking.startDate"}'
                      className="font-mono text-sm"
                      rows={4}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Map platform fields to your database schema
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsAddingIntegration(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddIntegration}
                  disabled={
                    isSaving || !newIntegration.name || !newIntegration.details
                  }
                >
                  {isSaving ? "Saving to Database..." : "Add Integration"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      All Status
                    </div>
                  </SelectItem>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Active
                    </div>
                  </SelectItem>
                  <SelectItem value="error">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      Error
                    </div>
                  </SelectItem>
                  <SelectItem value="syncing">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-blue-600" />
                      Syncing
                    </div>
                  </SelectItem>
                  <SelectItem value="inactive">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-gray-600" />
                      Inactive
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sortBy}
                onValueChange={(value: any) => setSortBy(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="w-4 h-4" />
                      Sort by Name
                    </div>
                  </SelectItem>
                  <SelectItem value="status">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="w-4 h-4" />
                      Sort by Status
                    </div>
                  </SelectItem>
                  <SelectItem value="lastSync">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="w-4 h-4" />
                      Sort by Last Sync
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Connected Platforms</CardTitle>
              <CardDescription>
                Manage your booking platform integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse h-32 bg-gray-200 rounded-lg"
                    />
                  ))}
                </div>
              ) : filteredIntegrations.length > 0 ? (
                <div className="space-y-4">
                  {filteredIntegrations.map((integration) => {
                    const health = healthMetrics[integration.id];
                    const progress = syncProgress[integration.id];
                    const integrationOption = integrationOptions.find(
                      (opt) => opt.name === integration.name
                    );
                    const colorClass =
                      {
                        red: "bg-red-100",
                        blue: "bg-blue-100",
                        orange: "bg-orange-100",
                        pink: "bg-pink-100",
                        yellow: "bg-yellow-100",
                        green: "bg-green-100",
                        gray: "bg-gray-100",
                      }[integrationOption?.color || "gray"] || "bg-gray-100";

                    return (
                      <div
                        key={integration.id}
                        className="border rounded-lg p-4 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedIntegrations.has(integration.id)}
                              onChange={(e) => {
                                const newSelected = new Set(
                                  selectedIntegrations
                                );
                                if (e.target.checked) {
                                  newSelected.add(integration.id);
                                } else {
                                  newSelected.delete(integration.id);
                                }
                                setSelectedIntegrations(newSelected);
                              }}
                              className="mt-1"
                            />
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${colorClass}`}
                            >
                              {integrationOption?.icon || "🔗"}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">
                                  {integration.name}
                                </h3>
                                {integration.encryptionEnabled && (
                                  <Lock
                                    className="w-4 h-4 text-gray-500"
                                  />
                                )}
                                {integration.preventDoubleBooking && (
                                  <CalendarX
                                    className="w-4 h-4 text-blue-500"
                                  />
                                )}
                                {integration.testMode && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Test Mode
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                {integration.method} Integration
                              </p>

                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Last:{" "}
                                  {new Date(
                                    integration.lastSync
                                  ).toLocaleString()}
                                </span>
                                {integration.nextSync && (
                                  <span className="flex items-center gap-1">
                                    <RefreshCw className="w-3 h-3" />
                                    Next:{" "}
                                    {new Date(
                                      integration.nextSync
                                    ).toLocaleString()}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Database className="w-3 h-3" />
                                  DB Synced
                                </span>
                              </div>

                              {integration.lastError && (
                                <Alert className="mt-2" variant="destructive">
                                  <AlertTriangle className="w-4 h-4" />
                                  <AlertDescription className="text-xs">
                                    {integration.lastError}
                                  </AlertDescription>
                                </Alert>
                              )}

                              {progress && (
                                <div className="mt-3">
                                  <div className="flex items-center justify-between text-xs mb-1">
                                    <span>{progress.status}</span>
                                    <span>
                                      {progress.processedItems}/
                                      {progress.totalItems}
                                    </span>
                                  </div>
                                  <Progress
                                    value={progress.progress}
                                    className="h-2"
                                  />
                                </div>
                              )}

                              <div className="mt-3 space-y-2">
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-gray-600">
                                    API Details:
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                      {showApiKey[integration.id]
                                        ? integration.details
                                        : maskApiKey(integration.details)}
                                    </code>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        setShowApiKey((prev) => ({
                                          ...prev,
                                          [integration.id]:
                                            !prev[integration.id],
                                        }))
                                      }
                                    >
                                      {showApiKey[integration.id] ? (
                                        <EyeOff className="w-4 h-4" />
                                      ) : (
                                        <Eye className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>

                                {health && (
                                  <div className="flex items-center gap-6 text-sm">
                                    <span className="text-gray-600">
                                      Health Score:
                                    </span>
                                    <span
                                      className={`font-semibold ${getHealthScoreColor(
                                        integration.healthScore
                                      )}`}
                                    >
                                      {integration.healthScore}%
                                    </span>
                                    <span className="text-gray-500">
                                      Uptime: {health.uptime.toFixed(1)}%
                                    </span>
                                    <span className="text-gray-500">
                                      Success: {health.successRate.toFixed(1)}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <div className="text-right mr-2">
                              <p className="text-sm font-medium">
                                {integration.bookingsCount} bookings
                              </p>
                              {integration.errorCount > 0 && (
                                <p className="text-xs text-red-600">
                                  {integration.errorCount} errors
                                </p>
                              )}
                              <div className="flex items-center gap-1 mt-1">
                                {getStatusIcon(integration.status)}
                                <Badge
                                  variant={
                                    integration.status === "active"
                                      ? "default"
                                      : integration.status === "error"
                                      ? "destructive"
                                      : integration.status === "syncing"
                                      ? "secondary"
                                      : "outline"
                                  }
                                >
                                  {integration.status}
                                </Badge>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setTestingIntegrationId(integration.id);
                                  setShowTestDialog(true);
                                }}
                                disabled={isTesting}
                              >
                                <CheckSquare className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleSyncIntegration(integration.id)
                                }
                                disabled={integration.status === "syncing"}
                              >
                                <RefreshCw
                                  className={`w-4 h-4 ${
                                    integration.status === "syncing"
                                      ? "animate-spin"
                                      : ""
                                  }`}
                                />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleDeleteIntegration(integration.id)
                                }
                                disabled={isDeleting}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Link className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">
                    {searchQuery || statusFilter !== "all"
                      ? "No integrations found"
                      : "No integrations yet"}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {searchQuery || statusFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Add your first channel integration to get started"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Database Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Database Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Connection</span>
                <Badge
                  variant={
                    databaseStatus === "connected" ? "default" : "destructive"
                  }
                >
                  {databaseStatus === "connected" ? (
                    <>
                      <Wifi className="w-3 h-3 mr-1" />
                      Connected
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 mr-1" />
                      {databaseStatus}
                    </>
                  )}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Backup</span>
                <span className="text-sm font-medium">
                  {lastBackup ? lastBackup.toLocaleString() : "Never"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Auto-save</span>
                <Badge variant="secondary">Enabled</Badge>
              </div>
              <Button
                variant="outline"
                className="w-full"
                size="sm"
                onClick={handleExportData}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Database
              </Button>
            </CardContent>
          </Card>

          {/* Booking Statistics */}
          {bookingStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="w-5 h-5" />
                  Booking Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">
                      Total Bookings
                    </span>
                    <span className="font-semibold">
                      {bookingStats.totalBookings}
                    </span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Confirmed</span>
                    <span className="font-semibold">
                      {bookingStats.confirmedBookings}
                    </span>
                  </div>
                  <Progress
                    value={
                      bookingStats.totalBookings > 0
                        ? (bookingStats.confirmedBookings /
                            bookingStats.totalBookings) *
                          100
                        : 0
                    }
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Total Revenue</span>
                    <span className="font-semibold">
                      ${bookingStats.totalRevenue.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">
                      Occupancy Rate
                    </span>
                    <span className="font-semibold">
                      {bookingStats.occupancyRate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={bookingStats.occupancyRate}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conflict Prevention */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Conflict Prevention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert>
                <CalendarX className="w-4 h-4" />
                <AlertDescription className="text-sm">
                  Double booking prevention is active on{" "}
                  {integrations.filter((i) => i.preventDoubleBooking).length}{" "}
                  integrations
                </AlertDescription>
              </Alert>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Real-time database checking
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Automatic conflict detection
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Cross-platform synchronization
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Database transaction safety
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Test Integration Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Integration</DialogTitle>
            <DialogDescription>
              Run a test to verify the integration connection and database
              access
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                This will attempt to connect to the platform and validate
                credentials without importing data.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowTestDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  testingIntegrationId &&
                  handleTestIntegration(testingIntegrationId)
                }
                disabled={isTesting}
              >
                {isTesting ? "Testing..." : "Run Test"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PMSSettings;
