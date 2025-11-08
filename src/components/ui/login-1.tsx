
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import Turnstile from "react-turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAlert } from '@/context/alert-context';
import { gsap } from 'gsap';
import EgspgoiLogo from '@/app/egspgoi_logo_tr.png';
import EngineeringCollegeImage from '@/app/engineering_college.webp';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const SESSION_DURATION_SECONDS = 10 * 60; // 10 minutes

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useAlert();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const formRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
    const isAdmin = searchParams.has('admin');
    const urlEmail = searchParams.get('email');
    if (urlEmail) {
      setEmail(urlEmail);
    }
    setIsLogin(!isAdmin);

     if (formRef.current) {
      gsap.fromTo(formRef.current, 
        { opacity: 0, y: 30 }, 
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.2 }
      );
    }
  }, [searchParams]);

  const showTurnstile = email && password;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Hardcoded OA login check
    if (email === process.env.NEXT_PUBLIC_OA_USERNAME && password === process.env.NEXT_PUBLIC_OA_PASSWORD) {
        const oaUser = {
            id: 'oa_user_01', // mock ID
            role: 'oa',
            token: 'mock_oa_token' // mock token
        };

        localStorage.setItem("token", oaUser.token);
        localStorage.setItem("userRole", oaUser.role);
        
        const sessionExpiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000;
        localStorage.setItem("sessionExpiresAt", sessionExpiresAt.toString());

        const redirectUrl = `/u/portal/dashboard/oa?uid=${oaUser.id}`;
        router.push(redirectUrl);
        setIsLoading(false);
        return;
    }


    if (!turnstileToken) {
        showAlert(
            "Verification Failed",
            "Please complete the security check before logging in.",
        );
        setIsLoading(false);
        return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, turnstileToken }),
      });

      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Login failed");
        } else {
          const errorText = await response.text();
          throw new Error(errorText || "An unknown server error occurred.");
        }
      }

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(responseData.message || "Login failed");
      }
      
      const { token, role, id } = responseData.data;

      localStorage.setItem("token", token);
      localStorage.setItem("userRole", role);
      
      const sessionExpiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000;
      localStorage.setItem("sessionExpiresAt", sessionExpiresAt.toString());

      const redirectUrl = role === 'admin' 
        ? `/u/portal/dashboard/admin?uid=${id}`
        : `/u/portal/dashboard?uid=${id}`;
      
      router.push(redirectUrl);

    } catch (error: any) {
        showAlert(
            "Login Failed",
            error.message || "An unexpected error occurred. Please check your credentials and try again.",
        );
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
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
        <div className="w-full max-w-md" ref={formRef}>
          <div className="text-center mb-8">
             <Image
                  src={EgspgoiLogo}
                  alt="College Logo"
                  width={100}
                  height={100}
                  className="mx-auto mb-4"
              />
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Welcome Back
            </h2>
            <p className="text-muted-foreground">
              Welcome back to CreditWise — Continue your journey
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
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

            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  placeholder="Enter your password"
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

             {isClient && showTurnstile && email !== process.env.NEXT_PUBLIC_OA_USERNAME && (
                <div className="flex justify-center">
                    <Turnstile
                        sitekey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY!}
                        onVerify={(token) => setTurnstileToken(token)}
                        onExpire={() => setTurnstileToken(null)}
                        theme="light"
                    />
                </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked as boolean)} />
                <Label htmlFor="remember-me" className="ml-2 block text-sm text-foreground">Remember me</Label>
              </div>
              <Link href="/u/portal/auth/forgot-password" className="text-sm text-primary hover:text-primary/80 font-medium">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading || (showTurnstile && !turnstileToken && email !== process.env.NEXT_PUBLIC_OA_USERNAME)}
              className="w-full"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
    </>
  );
}
