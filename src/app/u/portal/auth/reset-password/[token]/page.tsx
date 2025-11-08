
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAlert } from "@/context/alert-context";
import { useToast } from "@/hooks/use-toast";
import EgspgoiLogo from '@/app/egspgoi_logo_tr.png';
import EngineeringCollegeImage from '@/app/engineering_college.webp';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { showAlert } = useAlert();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = params.token as string;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const responseData = await response.json();
      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || "Failed to reset password. The link may be invalid or expired.");
      }

      setIsSuccess(true);
      toast({
        title: "Password Reset Successful",
        description: "You can now log in with your new password.",
      });
      // Delay redirect to allow user to see success message
      setTimeout(() => {
        router.push('/u/portal/auth?faculty_login');
      }, 3000);

    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row">
      <div className="hidden md:flex flex-1 relative">
        <Image
          src={EngineeringCollegeImage}
          alt="EGS Pillay Engineering College"
          layout="fill"
          objectFit="cover"
          quality={90}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
      </div>
      <div className="flex-1 bg-background flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
            <div className="text-center mb-8">
                 <Image
                    src={EgspgoiLogo}
                    alt="College Logo"
                    width={100}
                    height={100}
                    className="mx-auto mb-4"
                />
                <h2 className="text-3xl font-bold text-foreground mb-2">
                    Reset Your Password
                </h2>
                <p className="text-muted-foreground">
                    Choose a new, strong password for your account.
                </p>
            </div>
            
            {isSuccess ? (
                 <div className="text-center p-8 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                    <h3 className="text-xl font-semibold text-green-800">Password Reset!</h3>
                    <p className="text-green-700 mt-2">
                        Your password has been successfully updated. Redirecting you to the login page...
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Label htmlFor="password">New Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 pr-10"
                                placeholder="Enter your new password"
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={togglePasswordVisibility}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground h-full"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </Button>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                         <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                type={showPassword ? "text" : "password"}
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="pl-10 pr-10"
                                placeholder="Confirm your new password"
                                required
                            />
                        </div>
                    </div>
                    
                    {error && (
                         <div className="flex items-start text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                            <XCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full"
                    >
                        {isLoading ? 'Resetting Password...' : 'Reset Password'}
                    </Button>
                </form>
            )}
        </div>
      </div>
    </div>
  );
}
