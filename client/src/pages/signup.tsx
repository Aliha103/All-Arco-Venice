import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, ArrowLeft, UserPlus, AlertCircle, CheckCircle, Gift, Copy } from "lucide-react";
import { signupSchema, type SignupData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generatedReferralCode, setGeneratedReferralCode] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch
  } = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    mode: "onChange"
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupData) => {
      const response = await apiRequest("POST", "/api/auth/signup", data);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedReferralCode(data.referralCode);
      toast({
        title: "Account created successfully!",
        description: "Your referral code has been generated. Share it with friends!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Signup failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "" };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    return { strength, label: labels[strength - 1] || "" };
  };

  const passwordStrength = getPasswordStrength(password || "");

  const copyReferralCode = () => {
    if (generatedReferralCode) {
      navigator.clipboard.writeText(generatedReferralCode);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    }
  };

  // Success screen with referral code
  if (generatedReferralCode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-0">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">Welcome to All'Arco!</CardTitle>
              <p className="text-gray-600 text-sm">Your account has been created successfully</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Gift className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Your Referral Code</span>
                </div>
                <div className="bg-white rounded-md p-3 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg font-bold text-gray-900">{generatedReferralCode}</span>
                    <Button
                      onClick={copyReferralCode}
                      variant="outline"
                      size="sm"
                      className="ml-2"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  Share this code with friends and earn rewards when they book with All'Arco!
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">What's next?</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Account created and ready to use</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Personal referral code generated</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-500 rounded-full"></div>
                    <span>Start exploring Venice accommodations</span>
                  </li>
                </ul>
              </div>

              <div className="flex space-x-3">
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  asChild
                >
                  <Link href="/login">
                    Sign In Now
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  asChild
                >
                  <Link href="/">
                    Explore Properties
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h1>
          <p className="text-gray-600">Join All'Arco to book your perfect stay in Venice</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center flex items-center justify-center space-x-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              <span>Sign Up</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((data) => signupMutation.mutate(data))} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    {...register("firstName")}
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    {...register("lastName")}
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  {...register("email")}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Referral Code */}
              <div className="space-y-2">
                <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                <Input
                  id="referralCode"
                  placeholder="Enter referral code"
                  {...register("referralCode")}
                  className="uppercase"
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                  }}
                />
                <p className="text-xs text-gray-500">
                  Have a referral code? Enter it here for exclusive benefits!
                </p>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...register("password")}
                    className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded ${
                            level <= passwordStrength.strength
                              ? level <= 2 ? "bg-red-500" : level <= 3 ? "bg-yellow-500" : "bg-green-500"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    {passwordStrength.label && (
                      <p className="text-xs text-gray-600">
                        Password strength: <span className={
                          passwordStrength.strength <= 2 ? "text-red-500" : 
                          passwordStrength.strength <= 3 ? "text-yellow-500" : "text-green-500"
                        }>{passwordStrength.label}</span>
                      </p>
                    )}
                  </div>
                )}
                
                {errors.password && (
                  <p className="text-red-500 text-sm flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    {...register("confirmPassword")}
                    className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                {/* Password Match Indicator */}
                {confirmPassword && password && (
                  <div className="flex items-center space-x-1 text-sm">
                    {password === confirmPassword ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-green-600">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 text-red-500" />
                        <span className="text-red-500">Passwords don't match</span>
                      </>
                    )}
                  </div>
                )}
                
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!isValid || signupMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5"
              >
                {signupMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating account...</span>
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>

              {/* Login Link */}
              <div className="text-center pt-4">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                    Sign in
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
          <div className="mt-4">
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
      </div>
    </div>
  );
}