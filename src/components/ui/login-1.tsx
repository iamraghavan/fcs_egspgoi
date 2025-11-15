
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import Turnstile from "react-turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAlert } from '@/context/alert-context';
import { gsap } from 'gsap';
import EgspgoiLogo from '@/app/egspgoi_logo_tr.png';
import EngineeringCollegeImage from '@/app/engineering_college.webp';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const SESSION_DURATION_SECONDS = 10 * 60; // 10 minutes

type MfaState = {
    mfaRequired: boolean;
    mfaType: 'email' | 'app' | null;
    userId: string | null;
    userRole: 'faculty' | 'admin' | 'oa' | null;
    message: string;
};

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
  const [mfaState, setMfaState] = useState<MfaState>({ mfaRequired: false, mfaType: null, userId: null, userRole: null, message: "" });
  const [mfaCode, setMfaCode] = useState("");

  const formRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
    const isAdmin = searchParams.has('admin');
    const urlEmail = searchParams.get('email');
    
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
    } else if (urlEmail) {
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
  
  const processSuccessfulLogin = (loginData: {token: string, role: string, id: string}) => {
    const { token, role, id } = loginData;
    if (!token || !role || !id) {
      showAlert("Login Error", "Incomplete login data received from server.");
      return;
    }

    if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
    } else {
        localStorage.removeItem("rememberedEmail");
    }

    localStorage.setItem("token", token);
    localStorage.setItem("userRole", role);
    
    const sessionExpiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000;
    localStorage.setItem("sessionExpiresAt", sessionExpiresAt.toString());

    let redirectUrl;
    switch (role) {
      case 'admin':
        redirectUrl = `/u/portal/dashboard/admin?uid=${id}`;
        break;
      case 'oa':
        redirectUrl = `/u/portal/dashboard/oa?uid=${id}`;
        break;
      default:
        redirectUrl = `/u/portal/dashboard?uid=${id}`;
    }
    
    router.push(redirectUrl);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (email === process.env.NEXT_PUBLIC_OA_USERNAME && password === process.env.NEXT_PUBLIC_OA_PASSWORD) {
      // OA login logic
      const oaUser = {
        token: 'mock_oa_token',
        role: 'oa',
        id: 'oa_user_01'
      };
      processSuccessfulLogin(oaUser);
      return;
    }

    if (!mfaState.mfaRequired && !turnstileToken) {
        showAlert("Verification Failed", "Please complete the security check.");
        setIsLoading(false);
        return;
    }

    try {
      const body: any = { email, password };
      if (mfaState.mfaType === 'app') {
        body.token = mfaCode;
      } else {
        body.turnstileToken = turnstileToken;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || "Login failed");
      }
      
      if (responseData.mfaRequired) {
        setMfaState({
          mfaRequired: true,
          mfaType: responseData.mfaType,
          userId: responseData.data.id,
          userRole: responseData.data.role, // Store role from initial response
          message: responseData.message,
        });
      } else {
        processSuccessfulLogin(responseData.data);
      }

    } catch (error: any) {
        showAlert("Login Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaVerification = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      if (mfaState.mfaType === 'app') {
          await handleLogin(e);
          return;
      }
      
      if (mfaState.mfaType === 'email') {
          try {
              const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-mfa`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: mfaState.userId, code: mfaCode }),
              });

              const responseData = await response.json();
              if (!response.ok || !responseData.success) {
                  throw new Error(responseData.message || 'MFA verification failed.');
              }
              
              // Correctly process the response from /verify-mfa
              processSuccessfulLogin({
                  token: responseData.token, // Token is at the root
                  id: mfaState.userId!,
                  role: mfaState.userRole!,
              });

          } catch (error: any) {
              showAlert('Verification Failed', error.message);
          } finally {
              setIsLoading(false);
          }
      }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const showTurnstile = email && password && !mfaState.mfaRequired;

  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="space-y-6">
      <div>
        <Label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
          Your email
        </Label>
          <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <Input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            placeholder="Enter your email"
            required
            aria-required="true"
            autoComplete="email"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <Input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10"
            placeholder="Enter your password"
            required
            aria-required="true"
            autoComplete="current-password"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground h-full"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
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
  );

  const renderMfaForm = () => (
      <form onSubmit={handleMfaVerification} className="space-y-6">
          <p className="text-center text-sm text-muted-foreground">{mfaState.message}</p>
          <div>
              <Label htmlFor="mfa-code">
                  {mfaState.mfaType === 'email' ? '6-Digit Code from Email' : '6-Digit Code from Authenticator App'}
              </Label>
              <div className="relative mt-2">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  <Input
                      type="text"
                      id="mfa-code"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      className="pl-10 text-center tracking-[0.5em]"
                      placeholder="_ _ _ _ _ _"
                      maxLength={6}
                      required
                      aria-required="true"
                      autoComplete="one-time-code"
                  />
              </div>
          </div>
          <Button type="submit" disabled={isLoading || mfaCode.length < 6} className="w-full">
              {isLoading ? 'Verifying...' : 'Verify'}
          </Button>
          <Button variant="link" className="w-full" onClick={() => setMfaState({ mfaRequired: false, mfaType: null, userId: null, userRole: null, message: "" })}>
              Back to Login
          </Button>
      </form>
  );

  return (
    <>
    <div className="w-full min-h-screen flex flex-col md:flex-row">
       <div className="hidden md:flex flex-1 relative">
          <Image
            src={EngineeringCollegeImage}
            alt="EGS Pillay Engineering College campus building"
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
                  alt="EGS Pillay Group of Institutions Logo"
                  width={100}
                  height={100}
                  className="mx-auto mb-4"
              />
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {mfaState.mfaRequired ? 'Two-Factor Authentication' : 'Welcome Back'}
            </h2>
            <p className="text-muted-foreground">
              {mfaState.mfaRequired ? 'Enter the code to complete your login.' : 'Welcome back to CreditWise — Continue your journey'}
            </p>
          </div>

          {mfaState.mfaRequired ? renderMfaForm() : renderLoginForm()}
        </div>
      </div>
    </div>
    </>
  );
}
