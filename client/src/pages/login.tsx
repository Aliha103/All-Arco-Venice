import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowLeft, LogIn, AlertCircle } from "lucide-react";
import { loginSchema, type LoginData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminVerification from "@/components/AdminVerification";
import FuturisticAuthenticator from "@/components/FuturisticAuthenticator";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [showMFA, setShowMFA] = useState(false);
  const [showTOTPSetup, setShowTOTPSetup] = useState(false);
  const [showTOTPVerification, setShowTOTPVerification] = useState(false);
  const [showEmergencyLogin, setShowEmergencyLogin] = useState(false);
  const [showTOTPReset, setShowTOTPReset] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange"
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: async (data) => {
      if (data.requiresTOTPSetup) {
        // Admin user needs TOTP setup
        toast({
          title: "TOTP Setup Required",
          description: "Please set up Google Authenticator to continue.",
        });
        setAdminUser(data.user);
        setShowTOTPSetup(true);
      } else if (data.requiresTOTPVerification) {
        // Admin user needs TOTP verification
        toast({
          title: "TOTP Verification Required",
          description: "Please enter your Google Authenticator code to continue.",
        });
        setAdminUser(data.user);
        setShowTOTPVerification(true);
      } else if (data.requiresMFA) {
        // Admin user needs MFA verification
        toast({
          title: "MFA Required",
          description: "Please complete SMS verification to continue.",
        });
        setShowMFA(true);
      } else {
        // Regular user login successful
        toast({
          title: "Welcome back!",
          description: "You have been successfully logged in.",
        });
        
        // Complete page reload to ensure authentication state is properly updated
        // Use the redirectTo field from backend response, default to homepage
        const redirectPath = data.redirectTo || "/";
        window.location.href = redirectPath;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleMFAVerified = () => {
    toast({
      title: "Welcome back!",
      description: "Admin verification successful.",
    });
    
    // Complete page reload to ensure authentication state is properly updated
    window.location.href = "/";
  };

  const handleMFACancel = () => {
    // Clear MFA state and redirect to login
    setShowMFA(false);
    toast({
      title: "Verification cancelled",
      description: "Please log in again to continue.",
      variant: "destructive",
    });
    
    // Ensure user session is cleared
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    }).then(() => {
      window.location.href = "/login";
    });
  };

  const handleTOTPSetupComplete = () => {
    toast({
      title: "Setup Complete!",
      description: "Google Authenticator has been set up successfully.",
    });
    
    // Invalidate auth cache to refresh user data
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    
    // Complete page reload to ensure authentication state is properly updated
    window.location.href = "/admin";
  };

  const handleTOTPSetupCancel = () => {
    // Clear TOTP state and redirect to login
    setShowTOTPSetup(false);
    setAdminUser(null);
    toast({
      title: "Setup cancelled",
      description: "Please log in again to continue.",
      variant: "destructive",
    });
    
    // Ensure user session is cleared
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    }).then(() => {
      window.location.href = "/login";
    });
  };

  const handleTOTPVerificationComplete = () => {
    toast({
      title: "Welcome back!",
      description: "Authentication successful.",
    });
    
    // Invalidate auth cache to refresh user data
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    
    // Complete page reload to ensure authentication state is properly updated
    window.location.href = "/admin";
  };

  const handleTOTPVerificationCancel = () => {
    // Clear TOTP state and redirect to login
    setShowTOTPVerification(false);
    setAdminUser(null);
    toast({
      title: "Verification cancelled",
      description: "Please log in again to continue.",
      variant: "destructive",
    });
    
    // Ensure user session is cleared
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    }).then(() => {
      window.location.href = "/login";
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center space-x-2 mb-4 cursor-pointer group">
              <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              <span className="text-sm text-gray-600 group-hover:text-gray-800">Back to All'Arco</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-600">Sign in to your All'Arco account</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center flex items-center justify-center space-x-2">
              <LogIn className="w-5 h-5 text-blue-600" />
              <span>Sign In</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((data) => loginMutation.mutate(data))} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  {...register("email")}
                  className={errors.email ? "border-red-500" : ""}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...register("password")}
                    className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <input
                  id="remember"
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label htmlFor="remember" className="text-sm text-gray-700 cursor-pointer">
                  Remember me for 30 days
                </Label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!isValid || loginMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5"
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>

              {/* Emergency Admin Login */}
              <div className="text-center pt-2 space-y-1">
                <button
                  type="button"
                  onClick={() => setShowEmergencyLogin(true)}
                  className="text-xs text-gray-400 hover:text-gray-600 underline block mx-auto"
                >
                  Emergency Admin Access
                </button>
                <button
                  type="button"
                  onClick={() => setShowTOTPReset(true)}
                  className="text-xs text-gray-400 hover:text-gray-600 underline block mx-auto"
                >
                  Reset Google Authenticator
                </button>
              </div>

              {/* Signup Link */}
              <div className="text-center pt-4">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                    Create one
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Additional Options */}
        <div className="mt-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <Button variant="outline" className="w-full" asChild>
              <a href="/api/auth/google" className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </a>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <a href="/api/login" className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/>
                </svg>
                <span>Continue with Replit</span>
              </a>
            </Button>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy.
            Your data is protected with industry-standard encryption.
          </p>
        </div>
      </div>
      
      {/* MFA Verification Modal */}
      {showMFA && (
        <AdminVerification onVerified={handleMFAVerified} onCancel={handleMFACancel} />
      )}
      
      {/* TOTP Setup Modal */}
      {showTOTPSetup && adminUser && (
        <FuturisticAuthenticator 
          mode="setup"
          onSetupComplete={(secret) => {
            // Setup completed successfully
            handleTOTPSetupComplete();
          }}
          onVerificationComplete={handleTOTPSetupComplete}
          onCancel={handleTOTPSetupCancel}
        />
      )}

      {/* TOTP Verification Modal */}
      {showTOTPVerification && adminUser && (
        <FuturisticAuthenticator 
          mode="verify"
          onSetupComplete={(secret) => {
            // This shouldn't be called in verify mode
            handleTOTPVerificationComplete();
          }}
          onVerificationComplete={handleTOTPVerificationComplete}
          onCancel={handleTOTPVerificationCancel}
        />
      )}

      {/* Emergency Login Modal */}
      {showEmergencyLogin && (
        <EmergencyLoginModal 
          onSuccess={() => {
            setShowEmergencyLogin(false);
            toast({
              title: "Emergency Access Granted",
              description: "Admin access granted via emergency login.",
            });
            window.location.href = "/admin";
          }}
          onCancel={() => setShowEmergencyLogin(false)}
        />
      )}

      {/* TOTP Reset Modal */}
      {showTOTPReset && (
        <TOTPResetModal 
          onSuccess={(data) => {
            setShowTOTPReset(false);
            if (data.requiresTOTPSetup) {
              setAdminUser(data.user);
              setShowTOTPSetup(true);
              toast({
                title: "TOTP Reset Successful",
                description: "Please set up Google Authenticator again.",
              });
            }
          }}
          onCancel={() => setShowTOTPReset(false)}
        />
      )}
    </div>
  );
}

// Emergency Login Modal Component
function EmergencyLoginModal({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [email, setEmail] = useState("admin@allarco.com");
  const [password, setPassword] = useState("");
  const [emergencyCode, setEmergencyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleEmergencyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/auth/emergency-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, emergencyCode })
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        toast({
          title: "Emergency Login Failed",
          description: data.message || "Invalid credentials or emergency code.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4 text-red-600">🚨 Emergency Admin Access</h2>
        <form onSubmit={handleEmergencyLogin} className="space-y-4">
          <div>
            <Label htmlFor="emergency-email">Email</Label>
            <Input
              id="emergency-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="emergency-password">Password</Label>
            <Input
              id="emergency-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="emergency-code">Emergency Code</Label>
            <Input
              id="emergency-code"
              type="text"
              placeholder="EMERGENCY2025"
              value={emergencyCode}
              onChange={(e) => setEmergencyCode(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Default: EMERGENCY2025 (for development)
            </p>
          </div>
          <div className="flex space-x-3">
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {loading ? "Logging in..." : "Emergency Login"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// TOTP Reset Modal Component
function TOTPResetModal({ onSuccess, onCancel }: { onSuccess: (data: any) => void; onCancel: () => void }) {
  const [email, setEmail] = useState("admin@allarco.com");
  const [password, setPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTOTPReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/auth/reset-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, resetCode })
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess(data);
      } else {
        toast({
          title: "TOTP Reset Failed",
          description: data.message || "Invalid credentials or reset code.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Reset Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4 text-orange-600">🔄 Reset Google Authenticator</h2>
        <p className="text-sm text-gray-600 mb-4">
          This will clear your current TOTP setup and allow you to register a new Google Authenticator.
        </p>
        <form onSubmit={handleTOTPReset} className="space-y-4">
          <div>
            <Label htmlFor="reset-email">Email</Label>
            <Input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="reset-password">Password</Label>
            <Input
              id="reset-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="reset-code">Reset Code</Label>
            <Input
              id="reset-code"
              type="text"
              placeholder="RESET2025"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Default: RESET2025 (for development)
            </p>
          </div>
          <div className="flex space-x-3">
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {loading ? "Resetting..." : "Reset TOTP"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
