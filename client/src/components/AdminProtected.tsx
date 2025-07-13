import React, { useEffect, useState } from "react";
import {
  Loader2,
  Shield,
  AlertCircle,
  Lock,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import AdminVerification from "./AdminVerification";
import { useAdminAuth } from "@/hooks/useAdminAuth";

// Button component implementation
const Button = ({
  children,
  onClick,
  className = "",
  variant = "default",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-4 py-2";

  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline:
      "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  };

  return (
    <button
      className={`${baseStyles} ${
        variant === "outline" ? variants.outline : variants.default
      } ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Card components implementation
const Card = ({ children, className = "", ...props }) => {
  return (
    <div
      className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const CardContent = ({ children, className = "", ...props }) => {
  return (
    <div className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
};

// Real useAdminAuth hook is now imported at the top

interface AdminProtectedProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AdminProtected({
  children,
  fallback,
}: AdminProtectedProps) {
  const {
    isLoading,
    isAuthenticated,
    isAdmin,
    isValidating,
    hasValidated,
    error,
    refetch,
  } = useAdminAuth();
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  // Check if admin needs SMS verification
  useEffect(() => {
    const checkAdminVerification = async () => {
      try {
        const response = await fetch('/api/admin/dashboard', {
          credentials: 'include'
        });
        
        if (response.status === 403) {
          const data = await response.json();
          if (data.requiresVerification) {
            setShowVerification(true);
          }
        }
      } catch (error) {
        // Ignore network errors
      }
    };

    if (isAuthenticated && isAdmin && hasValidated) {
      checkAdminVerification();
    }
  }, [isAuthenticated, isAdmin, hasValidated]);

  useEffect(() => {
    if (isLoading || isValidating) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      setProgress(100);
      setTimeout(() => setShowContent(true), 300);
    }
  }, [isLoading, isValidating]);

  // Show loading state
  if (isLoading || isValidating || !hasValidated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div
            className="absolute top-40 right-20 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
            style={{ animationDelay: "4s" }}
          ></div>
        </div>

        <div className="w-full max-w-md mx-4 backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl relative z-10 rounded-lg">
          <div className="p-8 text-center">
            <div className="mb-6 relative">
              <div className="w-24 h-24 mx-auto relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-2 bg-gray-900 rounded-full flex items-center justify-center">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-white/50 animate-spin"></div>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-3 opacity-0 animate-fade-in">
              Validating Admin Access
            </h3>

            <p
              className="text-sm text-white/70 mb-6 opacity-0 animate-fade-in"
              style={{ animationDelay: "200ms" }}
            >
              Verifying your credentials and permissions...
            </p>

            {/* Progress bar */}
            <div className="w-full bg-white/10 rounded-full h-2 mb-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-center space-x-2 text-white/50 text-xs">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Establishing secure connection...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-orange-900 to-yellow-900 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.5'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        <div className="w-full max-w-md mx-4 backdrop-blur-lg bg-white/10 border border-red-500/20 shadow-2xl relative z-10 rounded-lg animate-shake">
          <div className="p-8 text-center">
            <div className="mb-6 relative">
              <div className="w-20 h-20 mx-auto relative">
                <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-3">
              Authentication Failed
            </h3>

            <p className="text-sm text-white/70 mb-6">
              We couldn't verify your credentials. This might be a temporary
              issue.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => refetch()}
                className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-md shadow-lg transform transition hover:scale-105 inline-flex items-center justify-center font-medium"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Authentication
              </button>

              <button
                onClick={() => (window.location.href = "/")}
                className="w-full px-4 py-2 border border-white/20 text-white hover:bg-white/10 rounded-md transition inline-flex items-center justify-center font-medium"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-900 to-red-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`,
              }}
            />
          ))}
        </div>

        <div className="w-full max-w-md mx-4 backdrop-blur-lg bg-white/10 border border-amber-500/20 shadow-2xl relative z-10 rounded-lg">
          <div className="p-8 text-center">
            <div className="mb-6 relative">
              <div className="w-24 h-24 mx-auto relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-red-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-2 bg-gray-900 rounded-full flex items-center justify-center">
                  <Lock className="w-12 h-12 text-white animate-bounce" />
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-3">
              Access Restricted
            </h3>

            <div className="mb-6">
              <p className="text-lg text-white/90 mb-2">
                {!isAuthenticated
                  ? "Authentication Required"
                  : "Insufficient Privileges"}
              </p>
              <p className="text-sm text-white/60">
                {!isAuthenticated
                  ? "Please log in to continue."
                  : "Admin access is required for this area."}
              </p>
            </div>

            <div className="bg-white/10 rounded-lg p-4 mb-6 border border-white/20">
              <div className="flex items-center justify-between text-white/80 text-sm">
                <span>Redirecting in 5 seconds...</span>
                <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
              </div>
            </div>

            <button
              onClick={() => (window.location.href = "/")}
              className="w-full px-4 py-2 bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white rounded-md shadow-lg transform transition hover:scale-105 inline-flex items-center justify-center font-medium"
            >
              Go to Main Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show SMS verification if required
  if (showVerification) {
    return (
      <AdminVerification 
        onVerified={() => {
          setShowVerification(false);
          setShowContent(true);
        }} 
      />
    );
  }

  // Show admin dashboard with entrance animation
  return (
    <div
      className={`transition-all duration-500 ${
        showContent ? "opacity-100" : "opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

// CSS animations as a style tag
const AnimationStyles = () => (
  <style>{`
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
      20%, 40%, 60%, 80% { transform: translateX(2px); }
    }
    
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .animate-shake {
      animation: shake 0.5s ease-in-out;
    }
    
    .animate-fade-in {
      animation: fade-in 0.5s ease-out forwards;
    }
  `}</style>
);

// Include the styles
AdminProtected.Styles = AnimationStyles;
