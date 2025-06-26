import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserProfileSchema, type UpdateUserProfile } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Gift, Users, ArrowLeft, CreditCard, Shield, Calendar } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Settings() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dateInputFocused, setDateInputFocused] = useState(false);
  const [ageDisplay, setAgeDisplay] = useState("");

  // Calculate age from date of birth
  const calculateAge = useCallback((dateOfBirth: string) => {
    if (!dateOfBirth) return "";
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 0) return "Invalid date";
    if (age === 0) return "Less than 1 year";
    return `${age} years old`;
  }, []);

  // Update age display when date changes
  useEffect(() => {
    if (user?.dateOfBirth) {
      setAgeDisplay(calculateAge(user.dateOfBirth));
    }
  }, [user?.dateOfBirth, calculateAge]);

  const form = useForm<UpdateUserProfile>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      dateOfBirth: "",
      country: "",
      mobileNumber: "",
    },
  });

  // Populate form with user data when available
  useEffect(() => {
    if (user) {
      form.reset({
        dateOfBirth: user.dateOfBirth || "",
        country: user.country || "",
        mobileNumber: user.mobileNumber || "",
      });
    }
  }, [user, form]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateUserProfile) => {
      return await apiRequest("PUT", "/api/auth/user", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateUserProfile) => {
    updateProfileMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600 text-sm">Manage your account settings</p>
            </div>
          </div>
          
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="flex items-center space-x-3 p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Account Type</p>
                <p className="font-semibold text-gray-900 capitalize">{user.role}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="flex items-center space-x-3 p-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Credit Balance</p>
                <p className="font-semibold text-green-600">0€</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="flex items-center space-x-3 p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Referrals</p>
                <p className="font-semibold text-gray-900">{user.totalReferrals || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-gray-900">Personal Information</CardTitle>
                <CardDescription className="text-gray-600">
                  Update your profile details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Security Notice */}
                <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <h4 className="font-medium text-green-800">Private & Secure</h4>
                  </div>
                  <p className="text-sm text-green-700">Your personal information is encrypted and only visible to you. Date of birth is kept private for security.</p>
                </div>

                {/* Current Info Display with Privacy Controls */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.firstName} {user.lastName}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>DOB: {user.dateOfBirth || "Not set"}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>Country: {user.country || "Not set"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                              <Calendar className="w-4 h-4 text-blue-500" />
                              <span>Date of Birth</span>
                              <Lock className="w-3 h-3 text-gray-400" />
                            </FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <Input 
                                  type="date" 
                                  {...field}
                                  max={new Date().toISOString().split('T')[0]}
                                  min="1900-01-01"
                                  onFocus={() => setDateInputFocused(true)}
                                  onBlur={() => setDateInputFocused(false)}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    setAgeDisplay(calculateAge(e.target.value));
                                  }}
                                  className={`rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300 pl-10 pr-20 ${
                                    dateInputFocused ? 'shadow-lg scale-[1.02]' : 'shadow-sm'
                                  }`}
                                />
                                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors duration-200 group-hover:text-blue-500" />
                                
                                {/* Age Display */}
                                {field.value && ageDisplay && (
                                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                                      {ageDisplay}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            
                            
                            
                            
                            
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">Country</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200">
                                  <SelectValue placeholder="Select your country" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-60">
                                <SelectItem value="AD">🇦🇩 Andorra</SelectItem>
                                <SelectItem value="AE">🇦🇪 United Arab Emirates</SelectItem>
                                <SelectItem value="AF">🇦🇫 Afghanistan</SelectItem>
                                <SelectItem value="AG">🇦🇬 Antigua and Barbuda</SelectItem>
                                <SelectItem value="AI">🇦🇮 Anguilla</SelectItem>
                                <SelectItem value="AL">🇦🇱 Albania</SelectItem>
                                <SelectItem value="AM">🇦🇲 Armenia</SelectItem>
                                <SelectItem value="AO">🇦🇴 Angola</SelectItem>
                                <SelectItem value="AQ">🇦🇶 Antarctica</SelectItem>
                                <SelectItem value="AR">🇦🇷 Argentina</SelectItem>
                                <SelectItem value="AS">🇦🇸 American Samoa</SelectItem>
                                <SelectItem value="AT">🇦🇹 Austria</SelectItem>
                                <SelectItem value="AU">🇦🇺 Australia</SelectItem>
                                <SelectItem value="AW">🇦🇼 Aruba</SelectItem>
                                <SelectItem value="AX">🇦🇽 Åland Islands</SelectItem>
                                <SelectItem value="AZ">🇦🇿 Azerbaijan</SelectItem>
                                <SelectItem value="BA">🇧🇦 Bosnia and Herzegovina</SelectItem>
                                <SelectItem value="BB">🇧🇧 Barbados</SelectItem>
                                <SelectItem value="BD">🇧🇩 Bangladesh</SelectItem>
                                <SelectItem value="BE">🇧🇪 Belgium</SelectItem>
                                <SelectItem value="BF">🇧🇫 Burkina Faso</SelectItem>
                                <SelectItem value="BG">🇧🇬 Bulgaria</SelectItem>
                                <SelectItem value="BH">🇧🇭 Bahrain</SelectItem>
                                <SelectItem value="BI">🇧🇮 Burundi</SelectItem>
                                <SelectItem value="BJ">🇧🇯 Benin</SelectItem>
                                <SelectItem value="BL">🇧🇱 Saint Barthélemy</SelectItem>
                                <SelectItem value="BM">🇧🇲 Bermuda</SelectItem>
                                <SelectItem value="BN">🇧🇳 Brunei</SelectItem>
                                <SelectItem value="BO">🇧🇴 Bolivia</SelectItem>
                                <SelectItem value="BR">🇧🇷 Brazil</SelectItem>
                                <SelectItem value="BS">🇧🇸 Bahamas</SelectItem>
                                <SelectItem value="BT">🇧🇹 Bhutan</SelectItem>
                                <SelectItem value="BV">🇧🇻 Bouvet Island</SelectItem>
                                <SelectItem value="BW">🇧🇼 Botswana</SelectItem>
                                <SelectItem value="BY">🇧🇾 Belarus</SelectItem>
                                <SelectItem value="BZ">🇧🇿 Belize</SelectItem>
                                <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                                <SelectItem value="CC">🇨🇨 Cocos Islands</SelectItem>
                                <SelectItem value="CD">🇨🇩 Democratic Republic of the Congo</SelectItem>
                                <SelectItem value="CF">🇨🇫 Central African Republic</SelectItem>
                                <SelectItem value="CG">🇨🇬 Republic of the Congo</SelectItem>
                                <SelectItem value="CH">🇨🇭 Switzerland</SelectItem>
                                <SelectItem value="CI">🇨🇮 Côte d'Ivoire</SelectItem>
                                <SelectItem value="CK">🇨🇰 Cook Islands</SelectItem>
                                <SelectItem value="CL">🇨🇱 Chile</SelectItem>
                                <SelectItem value="CM">🇨🇲 Cameroon</SelectItem>
                                <SelectItem value="CN">🇨🇳 China</SelectItem>
                                <SelectItem value="CO">🇨🇴 Colombia</SelectItem>
                                <SelectItem value="CR">🇨🇷 Costa Rica</SelectItem>
                                <SelectItem value="CU">🇨🇺 Cuba</SelectItem>
                                <SelectItem value="CV">🇨🇻 Cape Verde</SelectItem>
                                <SelectItem value="CW">🇨🇼 Curaçao</SelectItem>
                                <SelectItem value="CX">🇨🇽 Christmas Island</SelectItem>
                                <SelectItem value="CY">🇨🇾 Cyprus</SelectItem>
                                <SelectItem value="CZ">🇨🇿 Czech Republic</SelectItem>
                                <SelectItem value="DE">🇩🇪 Germany</SelectItem>
                                <SelectItem value="DJ">🇩🇯 Djibouti</SelectItem>
                                <SelectItem value="DK">🇩🇰 Denmark</SelectItem>
                                <SelectItem value="DM">🇩🇲 Dominica</SelectItem>
                                <SelectItem value="DO">🇩🇴 Dominican Republic</SelectItem>
                                <SelectItem value="DZ">🇩🇿 Algeria</SelectItem>
                                <SelectItem value="EC">🇪🇨 Ecuador</SelectItem>
                                <SelectItem value="EE">🇪🇪 Estonia</SelectItem>
                                <SelectItem value="EG">🇪🇬 Egypt</SelectItem>
                                <SelectItem value="EH">🇪🇭 Western Sahara</SelectItem>
                                <SelectItem value="ER">🇪🇷 Eritrea</SelectItem>
                                <SelectItem value="ES">🇪🇸 Spain</SelectItem>
                                <SelectItem value="ET">🇪🇹 Ethiopia</SelectItem>
                                <SelectItem value="FI">🇫🇮 Finland</SelectItem>
                                <SelectItem value="FJ">🇫🇯 Fiji</SelectItem>
                                <SelectItem value="FK">🇫🇰 Falkland Islands</SelectItem>
                                <SelectItem value="FM">🇫🇲 Micronesia</SelectItem>
                                <SelectItem value="FO">🇫🇴 Faroe Islands</SelectItem>
                                <SelectItem value="FR">🇫🇷 France</SelectItem>
                                <SelectItem value="GA">🇬🇦 Gabon</SelectItem>
                                <SelectItem value="GB">🇬🇧 United Kingdom</SelectItem>
                                <SelectItem value="GD">🇬🇩 Grenada</SelectItem>
                                <SelectItem value="GE">🇬🇪 Georgia</SelectItem>
                                <SelectItem value="GF">🇬🇫 French Guiana</SelectItem>
                                <SelectItem value="GG">🇬🇬 Guernsey</SelectItem>
                                <SelectItem value="GH">🇬🇭 Ghana</SelectItem>
                                <SelectItem value="GI">🇬🇮 Gibraltar</SelectItem>
                                <SelectItem value="GL">🇬🇱 Greenland</SelectItem>
                                <SelectItem value="GM">🇬🇲 Gambia</SelectItem>
                                <SelectItem value="GN">🇬🇳 Guinea</SelectItem>
                                <SelectItem value="GP">🇬🇵 Guadeloupe</SelectItem>
                                <SelectItem value="GQ">🇬🇶 Equatorial Guinea</SelectItem>
                                <SelectItem value="GR">🇬🇷 Greece</SelectItem>
                                <SelectItem value="GS">🇬🇸 South Georgia</SelectItem>
                                <SelectItem value="GT">🇬🇹 Guatemala</SelectItem>
                                <SelectItem value="GU">🇬🇺 Guam</SelectItem>
                                <SelectItem value="GW">🇬🇼 Guinea-Bissau</SelectItem>
                                <SelectItem value="GY">🇬🇾 Guyana</SelectItem>
                                <SelectItem value="HK">🇭🇰 Hong Kong</SelectItem>
                                <SelectItem value="HM">🇭🇲 Heard Island</SelectItem>
                                <SelectItem value="HN">🇭🇳 Honduras</SelectItem>
                                <SelectItem value="HR">🇭🇷 Croatia</SelectItem>
                                <SelectItem value="HT">🇭🇹 Haiti</SelectItem>
                                <SelectItem value="HU">🇭🇺 Hungary</SelectItem>
                                <SelectItem value="ID">🇮🇩 Indonesia</SelectItem>
                                <SelectItem value="IE">🇮🇪 Ireland</SelectItem>
                                <SelectItem value="IL">🇮🇱 Israel</SelectItem>
                                <SelectItem value="IM">🇮🇲 Isle of Man</SelectItem>
                                <SelectItem value="IN">🇮🇳 India</SelectItem>
                                <SelectItem value="IO">🇮🇴 British Indian Ocean Territory</SelectItem>
                                <SelectItem value="IQ">🇮🇶 Iraq</SelectItem>
                                <SelectItem value="IR">🇮🇷 Iran</SelectItem>
                                <SelectItem value="IS">🇮🇸 Iceland</SelectItem>
                                <SelectItem value="IT">🇮🇹 Italy</SelectItem>
                                <SelectItem value="JE">🇯🇪 Jersey</SelectItem>
                                <SelectItem value="JM">🇯🇲 Jamaica</SelectItem>
                                <SelectItem value="JO">🇯🇴 Jordan</SelectItem>
                                <SelectItem value="JP">🇯🇵 Japan</SelectItem>
                                <SelectItem value="KE">🇰🇪 Kenya</SelectItem>
                                <SelectItem value="KG">🇰🇬 Kyrgyzstan</SelectItem>
                                <SelectItem value="KH">🇰🇭 Cambodia</SelectItem>
                                <SelectItem value="KI">🇰🇮 Kiribati</SelectItem>
                                <SelectItem value="KM">🇰🇲 Comoros</SelectItem>
                                <SelectItem value="KN">🇰🇳 Saint Kitts and Nevis</SelectItem>
                                <SelectItem value="KP">🇰🇵 North Korea</SelectItem>
                                <SelectItem value="KR">🇰🇷 South Korea</SelectItem>
                                <SelectItem value="KW">🇰🇼 Kuwait</SelectItem>
                                <SelectItem value="KY">🇰🇾 Cayman Islands</SelectItem>
                                <SelectItem value="KZ">🇰🇿 Kazakhstan</SelectItem>
                                <SelectItem value="LA">🇱🇦 Laos</SelectItem>
                                <SelectItem value="LB">🇱🇧 Lebanon</SelectItem>
                                <SelectItem value="LC">🇱🇨 Saint Lucia</SelectItem>
                                <SelectItem value="LI">🇱🇮 Liechtenstein</SelectItem>
                                <SelectItem value="LK">🇱🇰 Sri Lanka</SelectItem>
                                <SelectItem value="LR">🇱🇷 Liberia</SelectItem>
                                <SelectItem value="LS">🇱🇸 Lesotho</SelectItem>
                                <SelectItem value="LT">🇱🇹 Lithuania</SelectItem>
                                <SelectItem value="LU">🇱🇺 Luxembourg</SelectItem>
                                <SelectItem value="LV">🇱🇻 Latvia</SelectItem>
                                <SelectItem value="LY">🇱🇾 Libya</SelectItem>
                                <SelectItem value="MA">🇲🇦 Morocco</SelectItem>
                                <SelectItem value="MC">🇲🇨 Monaco</SelectItem>
                                <SelectItem value="MD">🇲🇩 Moldova</SelectItem>
                                <SelectItem value="ME">🇲🇪 Montenegro</SelectItem>
                                <SelectItem value="MF">🇲🇫 Saint Martin</SelectItem>
                                <SelectItem value="MG">🇲🇬 Madagascar</SelectItem>
                                <SelectItem value="MH">🇲🇭 Marshall Islands</SelectItem>
                                <SelectItem value="MK">🇲🇰 North Macedonia</SelectItem>
                                <SelectItem value="ML">🇲🇱 Mali</SelectItem>
                                <SelectItem value="MM">🇲🇲 Myanmar</SelectItem>
                                <SelectItem value="MN">🇲🇳 Mongolia</SelectItem>
                                <SelectItem value="MO">🇲🇴 Macao</SelectItem>
                                <SelectItem value="MP">🇲🇵 Northern Mariana Islands</SelectItem>
                                <SelectItem value="MQ">🇲🇶 Martinique</SelectItem>
                                <SelectItem value="MR">🇲🇷 Mauritania</SelectItem>
                                <SelectItem value="MS">🇲🇸 Montserrat</SelectItem>
                                <SelectItem value="MT">🇲🇹 Malta</SelectItem>
                                <SelectItem value="MU">🇲🇺 Mauritius</SelectItem>
                                <SelectItem value="MV">🇲🇻 Maldives</SelectItem>
                                <SelectItem value="MW">🇲🇼 Malawi</SelectItem>
                                <SelectItem value="MX">🇲🇽 Mexico</SelectItem>
                                <SelectItem value="MY">🇲🇾 Malaysia</SelectItem>
                                <SelectItem value="MZ">🇲🇿 Mozambique</SelectItem>
                                <SelectItem value="NA">🇳🇦 Namibia</SelectItem>
                                <SelectItem value="NC">🇳🇨 New Caledonia</SelectItem>
                                <SelectItem value="NE">🇳🇪 Niger</SelectItem>
                                <SelectItem value="NF">🇳🇫 Norfolk Island</SelectItem>
                                <SelectItem value="NG">🇳🇬 Nigeria</SelectItem>
                                <SelectItem value="NI">🇳🇮 Nicaragua</SelectItem>
                                <SelectItem value="NL">🇳🇱 Netherlands</SelectItem>
                                <SelectItem value="NO">🇳🇴 Norway</SelectItem>
                                <SelectItem value="NP">🇳🇵 Nepal</SelectItem>
                                <SelectItem value="NR">🇳🇷 Nauru</SelectItem>
                                <SelectItem value="NU">🇳🇺 Niue</SelectItem>
                                <SelectItem value="NZ">🇳🇿 New Zealand</SelectItem>
                                <SelectItem value="OM">🇴🇲 Oman</SelectItem>
                                <SelectItem value="PA">🇵🇦 Panama</SelectItem>
                                <SelectItem value="PE">🇵🇪 Peru</SelectItem>
                                <SelectItem value="PF">🇵🇫 French Polynesia</SelectItem>
                                <SelectItem value="PG">🇵🇬 Papua New Guinea</SelectItem>
                                <SelectItem value="PH">🇵🇭 Philippines</SelectItem>
                                <SelectItem value="PK">🇵🇰 Pakistan</SelectItem>
                                <SelectItem value="PL">🇵🇱 Poland</SelectItem>
                                <SelectItem value="PM">🇵🇲 Saint Pierre and Miquelon</SelectItem>
                                <SelectItem value="PN">🇵🇳 Pitcairn</SelectItem>
                                <SelectItem value="PR">🇵🇷 Puerto Rico</SelectItem>
                                <SelectItem value="PS">🇵🇸 Palestine</SelectItem>
                                <SelectItem value="PT">🇵🇹 Portugal</SelectItem>
                                <SelectItem value="PW">🇵🇼 Palau</SelectItem>
                                <SelectItem value="PY">🇵🇾 Paraguay</SelectItem>
                                <SelectItem value="QA">🇶🇦 Qatar</SelectItem>
                                <SelectItem value="RE">🇷🇪 Réunion</SelectItem>
                                <SelectItem value="RO">🇷🇴 Romania</SelectItem>
                                <SelectItem value="RS">🇷🇸 Serbia</SelectItem>
                                <SelectItem value="RU">🇷🇺 Russia</SelectItem>
                                <SelectItem value="RW">🇷🇼 Rwanda</SelectItem>
                                <SelectItem value="SA">🇸🇦 Saudi Arabia</SelectItem>
                                <SelectItem value="SB">🇸🇧 Solomon Islands</SelectItem>
                                <SelectItem value="SC">🇸🇨 Seychelles</SelectItem>
                                <SelectItem value="SD">🇸🇩 Sudan</SelectItem>
                                <SelectItem value="SE">🇸🇪 Sweden</SelectItem>
                                <SelectItem value="SG">🇸🇬 Singapore</SelectItem>
                                <SelectItem value="SH">🇸🇭 Saint Helena</SelectItem>
                                <SelectItem value="SI">🇸🇮 Slovenia</SelectItem>
                                <SelectItem value="SJ">🇸🇯 Svalbard and Jan Mayen</SelectItem>
                                <SelectItem value="SK">🇸🇰 Slovakia</SelectItem>
                                <SelectItem value="SL">🇸🇱 Sierra Leone</SelectItem>
                                <SelectItem value="SM">🇸🇲 San Marino</SelectItem>
                                <SelectItem value="SN">🇸🇳 Senegal</SelectItem>
                                <SelectItem value="SO">🇸🇴 Somalia</SelectItem>
                                <SelectItem value="SR">🇸🇷 Suriname</SelectItem>
                                <SelectItem value="SS">🇸🇸 South Sudan</SelectItem>
                                <SelectItem value="ST">🇸🇹 São Tomé and Príncipe</SelectItem>
                                <SelectItem value="SV">🇸🇻 El Salvador</SelectItem>
                                <SelectItem value="SX">🇸🇽 Sint Maarten</SelectItem>
                                <SelectItem value="SY">🇸🇾 Syria</SelectItem>
                                <SelectItem value="SZ">🇸🇿 Eswatini</SelectItem>
                                <SelectItem value="TC">🇹🇨 Turks and Caicos Islands</SelectItem>
                                <SelectItem value="TD">🇹🇩 Chad</SelectItem>
                                <SelectItem value="TF">🇹🇫 French Southern Territories</SelectItem>
                                <SelectItem value="TG">🇹🇬 Togo</SelectItem>
                                <SelectItem value="TH">🇹🇭 Thailand</SelectItem>
                                <SelectItem value="TJ">🇹🇯 Tajikistan</SelectItem>
                                <SelectItem value="TK">🇹🇰 Tokelau</SelectItem>
                                <SelectItem value="TL">🇹🇱 Timor-Leste</SelectItem>
                                <SelectItem value="TM">🇹🇲 Turkmenistan</SelectItem>
                                <SelectItem value="TN">🇹🇳 Tunisia</SelectItem>
                                <SelectItem value="TO">🇹🇴 Tonga</SelectItem>
                                <SelectItem value="TR">🇹🇷 Turkey</SelectItem>
                                <SelectItem value="TT">🇹🇹 Trinidad and Tobago</SelectItem>
                                <SelectItem value="TV">🇹🇻 Tuvalu</SelectItem>
                                <SelectItem value="TW">🇹🇼 Taiwan</SelectItem>
                                <SelectItem value="TZ">🇹🇿 Tanzania</SelectItem>
                                <SelectItem value="UA">🇺🇦 Ukraine</SelectItem>
                                <SelectItem value="UG">🇺🇬 Uganda</SelectItem>
                                <SelectItem value="UM">🇺🇲 United States Minor Outlying Islands</SelectItem>
                                <SelectItem value="US">🇺🇸 United States</SelectItem>
                                <SelectItem value="UY">🇺🇾 Uruguay</SelectItem>
                                <SelectItem value="UZ">🇺🇿 Uzbekistan</SelectItem>
                                <SelectItem value="VA">🇻🇦 Vatican City</SelectItem>
                                <SelectItem value="VC">🇻🇨 Saint Vincent and the Grenadines</SelectItem>
                                <SelectItem value="VE">🇻🇪 Venezuela</SelectItem>
                                <SelectItem value="VG">🇻🇬 British Virgin Islands</SelectItem>
                                <SelectItem value="VI">🇻🇮 U.S. Virgin Islands</SelectItem>
                                <SelectItem value="VN">🇻🇳 Vietnam</SelectItem>
                                <SelectItem value="VU">🇻🇺 Vanuatu</SelectItem>
                                <SelectItem value="WF">🇼🇫 Wallis and Futuna</SelectItem>
                                <SelectItem value="WS">🇼🇸 Samoa</SelectItem>
                                <SelectItem value="YE">🇾🇪 Yemen</SelectItem>
                                <SelectItem value="YT">🇾🇹 Mayotte</SelectItem>
                                <SelectItem value="ZA">🇿🇦 South Africa</SelectItem>
                                <SelectItem value="ZM">🇿🇲 Zambia</SelectItem>
                                <SelectItem value="ZW">🇿🇼 Zimbabwe</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="mobileNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Mobile Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="+1 (555) 123-4567" 
                              {...field} 
                              className="rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="pt-4">
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        {updateProfileMutation.isPending ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Updating...</span>
                          </div>
                        ) : (
                          "Update Profile"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Referral Section */}
          <div>
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg text-gray-900">
                  <Gift className="w-5 h-5 text-purple-600" />
                  <span>Referral Code</span>
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Share and earn rewards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                  <div className="mb-2">
                    <Input
                      value={user.referralCode || ""}
                      readOnly
                      type="text"
                      className="font-mono text-center border-0 bg-white/70 text-gray-900 font-semibold"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (user.referralCode) {
                        navigator.clipboard.writeText(user.referralCode);
                        toast({
                          title: "Copied!",
                          description: "Referral code copied to clipboard",
                        });
                      }
                    }}
                    className="w-full mt-2 bg-white/80 hover:bg-white border-purple-200 text-purple-700 hover:text-purple-800"
                  >
                    Copy Code
                  </Button>
                </div>

                {user.referrerName && (
                  <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                      <span className="font-medium">Referred by:</span> {user.referrerName}
                    </p>
                  </div>
                )}

                <div className="pt-2 text-center">
                  <p className="text-xs text-gray-500">
                    Member since {user.createdAt ? new Date(user.createdAt as unknown as string).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}