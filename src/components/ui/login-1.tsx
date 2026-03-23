
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import Turnstile from "react-turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, AlertTriangle, Info, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAlert } from '@/context/alert-context';
import { gsap } from 'gsap';
import EgspgoiLogo from '@/app/egspgoi_logo_tr.png';
import EngineeringCollegeImage from '@/app/engineering_college.webp';
import { useRemoteConfig } from '@/hooks/use-remote-config';
import { cn } from '@/lib/utils';

const API_BASE_URL = 'https://faculty-credit-system.vercel.app';
const SESSION_DURATION_SECONDS = 10 * 60 * 60; // 10 hours

type TempAuthData = {
    userId: string | null;
    email: string | null;
    mfaType: 'email' | 'app' | null;
    message: string;
};

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useAlert();

  const loginAnnouncement = useRemoteConfig('login_announcement')?.asString();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsOn, setIsCapsOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials');
  const [tempAuthData, setTempAuthData] = useState<TempAuthData | null>(null);
  const [mfaCode, setMfaCode] = useState("");

  const formRef = useRef(null);

  useEffect(() => {
    const handleCapsLock = (event: KeyboardEvent) => {
        if (event.getModifierState) {
            setIsCapsOn(event.getModifierState("CapsLock"));
        }
    };
    window.addEventListener('keydown', handleCapsLock);
    window.addEventListener('keyup', handleCapsLock);
    return () => {
        window.removeEventListener('keydown', handleCapsLock);
        window.removeEventListener('keyup', handleCapsLock);
    };
  }, []);

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
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.1 }
      );
    }
  }, [searchParams]);
  
  const processSuccessfulLogin = (loginResponse: any) => {
    const userData = loginResponse.data || loginResponse;
    const token = userData.token || loginResponse.token;
    const sessionId = userData.sessionId || loginResponse.sessionId;

    if (!token) {
      showAlert("Login Error", "Authentication token is missing from the server response.");
      return;
    }

    const parseJwt = (token: string) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error("Failed to parse JWT", e);
            return null;
        }
    };
    
    localStorage.setItem("token", token);
    if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
    } else {
        localStorage.removeItem("rememberedEmail");
    }
    if (sessionId) {
      localStorage.setItem("sessionId", sessionId);
    }

    const decodedToken = parseJwt(token);
    const userId = userData.id || decodedToken?.id;
    const userRole = userData.role || decodedToken?.role;
    
    if (!userId || !userRole) {
       showAlert("Login Error", "Session profile could not be identified.");
       localStorage.removeItem("token");
       return;
    }
    
    localStorage.setItem("userRole", userRole);
    
    const sessionExpiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000;
    localStorage.setItem("sessionExpiresAt", sessionExpiresAt.toString());

    let redirectUrl;
    switch (userRole) {
      case 'admin':
        redirectUrl = `/u/portal/dashboard/admin?uid=${userId}`;
        break;
      case 'oa':
        redirectUrl = `/u/portal/dashboard/oa?uid=${userId}`;
        break;
      default:
        redirectUrl = `/u/portal/dashboard?uid=${userId}`;
    }
    
    router.push(redirectUrl);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (email === process.env.NEXT_PUBLIC_OA_USERNAME && password === process.env.NEXT_PUBLIC_OA_PASSWORD) {
      const oaUser = {
        token: 'mock_oa_token', 
        role: 'oa',
        id: 'oa_user_01',
        sessionId: 'mock_session_id_oa',
      };
      localStorage.setItem("token", oaUser.token);
      localStorage.setItem("userRole", oaUser.role);
      localStorage.setItem("sessionId", oaUser.sessionId);
      const sessionExpiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000;
      localStorage.setItem("sessionExpiresAt", sessionExpiresAt.toString());
      router.push(`/u/portal/dashboard/oa?uid=${oaUser.id}`);
      return;
    }

    if (!turnstileToken) {
        showAlert("Security Check Required", "Please complete the verification below.");
        setIsLoading(false);
        return;
    }

    try {
      const body = { email, password };

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", 'Cache-Control': 'no-cache' },
        body: JSON.stringify(body),
      });
      
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Invalid credentials provided.");
      }
      
      if (responseData.success && responseData.mfaRequired) {
        setTempAuthData({
          userId: responseData.userId,
          email: email,
          mfaType: responseData.mfaType,
          message: responseData.message || `Secure code sent to your ${responseData.mfaType === 'app' ? 'authenticator' : 'email'}.`,
        });
        setStep('mfa');
      } else if (responseData.success && !responseData.mfaRequired) {
        processSuccessfulLogin(responseData);
      } else {
        throw new Error(responseData.message || "Access denied.");
      }

    } catch (error: any) {
        showAlert("Sign-in Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaVerification = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      try {
          if (!tempAuthData || !tempAuthData.email || !tempAuthData.mfaType) {
              throw new Error("MFA session expired. Please log in again.");
          }

          const body = {
            email: tempAuthData.email,
            code: mfaCode.trim(),
            type: tempAuthData.mfaType,
          };

          const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-mfa`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
          });

          const responseData = await response.json();
          if (!response.ok || !responseData.success) {
              throw new Error(responseData.message || 'MFA verification failed.');
          }
          
          processSuccessfulLogin(responseData);

      } catch (error: any) {
          showAlert('Verification Failed', error.message);
      } finally {
          setIsLoading(false);
      }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const showTurnstile = !!email && !!password && step === 'credentials';

  const renderLoginForm = () => (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Sign in</h2>
        <p className="text-sm text-muted-foreground">Continue to the Faculty Performance Portal.</p>
      </div>

      {loginAnnouncement && (
        <div className="flex items-start gap-3 p-4 bg-primary/5 border-l-4 border-primary rounded-r-sm">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">System Announcement</p>
                <p className="text-sm text-foreground leading-relaxed">{loginAnnouncement}</p>
            </div>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 w-full bg-muted/30 border-sidebar-border focus:ring-primary focus:border-primary"
                        placeholder="e.g. name@egspec.org"
                        required
                        autoComplete="email"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/u/portal/auth/forgot-password" tabIndex={-1} className="text-xs text-primary hover:underline">
                        Forgot?
                    </Link>
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-12 w-full bg-muted/30 border-sidebar-border focus:ring-primary focus:border-primary"
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={togglePasswordVisibility}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground h-full"
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
                {isCapsOn && (
                    <div className="flex items-center text-orange-600 text-xs font-medium" role="alert">
                        <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                        Caps Lock is active
                    </div>
                )}
            </div>
        </div>

        {isClient && showTurnstile && email !== process.env.NEXT_PUBLIC_OA_USERNAME && (
            <div className="py-2 flex justify-center w-full">
                <div className="w-full flex justify-center overflow-hidden">
                    <Turnstile
                        sitekey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY!}
                        onVerify={(token) => setTurnstileToken(token)}
                        onExpire={() => setTurnstileToken(null)}
                        theme="light"
                    />
                </div>
            </div>
        )}

        <div className="flex items-center space-x-2">
            <Checkbox 
                id="remember-me" 
                checked={rememberMe} 
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="h-4 w-4 rounded-none border-primary data-[state=checked]:bg-primary"
            />
            <Label htmlFor="remember-me" className="text-sm font-normal text-muted-foreground leading-none cursor-pointer">
                Remember this email for next time
            </Label>
        </div>

        <Button
            type="submit"
            disabled={isLoading || (showTurnstile && !turnstileToken && email !== process.env.NEXT_PUBLIC_OA_USERNAME)}
            className="w-full h-12 text-base font-semibold group"
        >
            {isLoading ? 'Signing In...' : (
                <span className="flex items-center justify-center gap-2">
                    Sign in <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
            )}
        </Button>
      </form>
    </div>
  );

  const renderMfaForm = () => (
      <div className="w-full space-y-8 animate-in fade-in duration-500">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Security check</h2>
            <p className="text-sm text-muted-foreground">Multi-Factor Authentication is active on your account.</p>
          </div>

          <div className="p-4 bg-muted/50 rounded-sm text-sm text-muted-foreground leading-relaxed border border-sidebar-border">
              {tempAuthData?.message}
          </div>

          <form onSubmit={handleMfaVerification} className="space-y-6">
              <div className="space-y-2">
                  <Label htmlFor="mfa-code">
                      {tempAuthData?.mfaType === 'email' ? '6-Digit Email Code' : 'Authenticator Code'}
                  </Label>
                  <div className="relative">
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                      <Input
                          type="text"
                          id="mfa-code"
                          value={mfaCode}
                          onChange={(e) => setMfaCode(e.target.value)}
                          className="pl-10 h-14 w-full text-center text-2xl font-bold tracking-[0.5em] focus:ring-primary focus:border-primary"
                          placeholder="000000"
                          maxLength={6}
                          required
                          autoComplete="one-time-code"
                      />
                  </div>
              </div>
              <Button type="submit" disabled={isLoading || mfaCode.length < 6} className="w-full h-12 text-base font-semibold">
                  {isLoading ? 'Verifying...' : 'Verify Identity'}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setStep('credentials')}>
                  Cancel and try again
              </Button>
          </form>
      </div>
  );

  return (
    <div className="min-h-screen w-full flex bg-background">
       <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-sidebar">
          <Image
            src={EngineeringCollegeImage}
            alt="Campus"
            layout="fill"
            objectFit="cover"
            className="brightness-75"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 via-transparent to-transparent"></div>
          <div className="absolute bottom-12 left-12 max-w-lg space-y-4">
              <div className="bg-white/90 p-4 rounded-sm inline-block shadow-lg">
                  <Image src={EgspgoiLogo} alt="Logo" width={140} height={140} />
              </div>
              <div className="space-y-2">
                  <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-md">Performance & Credit Management</h1>
                  <p className="text-lg text-white/90 font-medium drop-shadow-sm">Transparent, measurable, and impactful career growth for our esteemed faculty.</p>
              </div>
          </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-[400px] space-y-8 sm:space-y-12 py-8" ref={formRef}>
          <div className="flex justify-center lg:hidden">
             <Image src={EgspgoiLogo} alt="Logo" width={100} height={100} className="mb-4" />
          </div>

          <div className="relative w-full">
            {step === 'mfa' ? renderMfaForm() : renderLoginForm()}
          </div>

          <div className="pt-8 text-center text-[10px] sm:text-xs text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} E.G.S. Pillay Group of Institutions.</p>
              <p className="mt-1">Authorized personnel only. Sessions are monitored for security.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
