
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAlert } from "@/context/alert-context";
import EgspgoiLogo from '@/app/egspgoi_logo_tr.png';
import EngineeringCollegeImage from '@/app/engineering_college.webp';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export default function ForgotPasswordPage() {
  const { showAlert } = useAlert();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // We don't care about the response status for security reasons,
      // just that it completed.
      setIsSubmitted(true);

    } catch (error: any) {
      // Still show the success message to prevent email enumeration
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
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
                    Forgot Password
                </h2>
                <p className="text-muted-foreground">
                    Enter your email to receive a password reset link.
                </p>
            </div>
            
            {isSubmitted ? (
                <div className="text-center p-8 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                    <h3 className="text-xl font-semibold text-green-800">Check your email</h3>
                    <p className="text-green-700 mt-2">
                        If an account with that email exists, we have sent a password reset link to it.
                    </p>
                     <Button asChild className="mt-6">
                        <Link href="/u/portal/auth?faculty_login">Back to Login</Link>
                    </Button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                        Your email
                        </Label>
                        <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10"
                            placeholder="Enter your email"
                            required
                        />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full"
                    >
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                    <div className="text-center">
                        <Link href="/u/portal/auth?faculty_login" className="text-sm text-primary hover:text-primary/80 font-medium">
                            Remembered your password? Sign in
                        </Link>
                    </div>
                </form>
            )}
        </div>
      </div>
    </div>
  );
}
