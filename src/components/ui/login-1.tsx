"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from"next/navigation";
import { Turnstile } from"@marsidev/react-turnstile";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { Checkbox } from"@/components/ui/checkbox";
import { Label } from"@/components/ui/label";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, AlertTriangle, Info, ArrowRight } from"lucide-react";
import Link from"next/link";
import Image from"next/image";
import { useAlert } from '@/context/alert-context';
import { gsap } from 'gsap';
import EgspgoiLogo from '@/app/egspgoi_logo_tr.png';
import EngineeringCollegeImage from '@/app/engineering_college.webp';
import { useRemoteConfig } from '@/hooks/use-remote-config';
import { cn } from '@/lib/utils';
import { API_BASE_URL, BASE_DOMAIN } from "@/lib/config";


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
 showAlert("Login Error","Authentication token is missing from the server response.");
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
 const userId = userData.id || decodedToken?.id || userData.user?._id;
 const userRole = userData.role || decodedToken?.role || userData.user?.role;
 
 if (!userId || !userRole) {
 showAlert("Login Error","Session profile could not be identified.");
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

 if (!turnstileToken && email !== process.env.NEXT_PUBLIC_OA_USERNAME) {
 showAlert("Security Check Required","Please complete the verification below.");
 setIsLoading(false);
 return;
 }

 try {
 const body = { email, password };

 const response = await fetch(`${API_BASE_URL}/auth/login`, {
 method:"POST",
 headers: {"Content-Type":"application/json", 'Cache-Control': 'no-cache' },
 body: JSON.stringify(body),
 });
 
 if (!response.ok) {
 const errData = await response.json().catch(() => ({ message: 'Invalid credentials provided.' }));
 throw new Error(errData.message ||"Access denied.");
 }

 const responseData = await response.json();
 
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
 throw new Error(responseData.message ||"Access denied.");
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

 const response = await fetch(`${API_BASE_URL}/auth/verify-mfa`, {
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
 <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-sans">
 <div className="space-y-2">
 <h2 className="text-3xl font-bold tracking-tight text-cds-text-01">Sign in</h2>
 <p className="text-sm text-cds-text-02">Continue to the Faculty Performance Portal.</p>
 </div>

 {loginAnnouncement && (
 <div className="flex items-start gap-3 p-4 bg-cds-support-04/10 border-l-4 border-cds-support-04 rounded-r-sm">
 <Info className="h-5 w-5 text-cds-support-04 shrink-0 mt-0.5"/>
 <div className="space-y-1">
 <p className="text-xs font-bold tracking-wider text-cds-support-04">System Announcement</p>
 <p className="text-sm text-cds-text-01 leading-relaxed">{loginAnnouncement}</p>
 </div>
 </div>
 )}

 <form onSubmit={handleLogin} className="space-y-6">
 <div className="space-y-4">
 <div className="space-y-1.5">
 <Label htmlFor="email"className="text-[12px] font-medium text-cds-text-02 tracking-wider">Email address</Label>
 <div className="relative group">
 <Input
 type="email"
 id="email"
 name="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="rounded-none border-0 border-b border-cds-ui-04 bg-cds-ui-01 px-4 h-12 w-full focus:ring-0 focus:border-b-2 focus:border-cds-interactive-01 transition-all placeholder:text-cds-text-03 text-cds-text-01"
 placeholder="name@egspec.org"
 required
 autoComplete="email"
 />
 </div>
 </div>

 <div className="space-y-1.5">
 <div className="flex items-center justify-between">
 <Label htmlFor="password"className="text-[12px] font-medium text-cds-text-02 tracking-wider">Password</Label>
 <Link href="/u/portal/auth/forgot-password"tabIndex={-1} className="text-xs text-cds-interactive-01 hover:underline font-medium">
 Forgot password?
 </Link>
 </div>
 <div className="relative group">
 <Input
 type={showPassword ?"text":"password"}
 id="password"
 name="password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 className="rounded-none border-0 border-b border-cds-ui-04 bg-cds-ui-01 px-4 h-12 w-full focus:ring-0 focus:border-b-2 focus:border-cds-interactive-01 transition-all placeholder:text-cds-text-03 text-cds-text-01"
 placeholder="••••••••"
 required
 autoComplete="current-password"
 />
 <Button
 type="button"
 variant="ghost"
 size="icon"
 onClick={togglePasswordVisibility}
 className="absolute inset-y-0 right-0 flex items-center pr-3 text-cds-text-05 hover:text-cds-text-01 h-full"
 >
 {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
 </Button>
 </div>
 {isCapsOn && (
 <div className="flex items-center text-cds-support-03 text-xs font-bold tracking-tight"role="alert">
 <AlertTriangle className="h-3.5 w-3.5 mr-1.5"/>
 Caps Lock is active
 </div>
 )}
 </div>
 </div>

 {isClient && showTurnstile && email !== process.env.NEXT_PUBLIC_OA_USERNAME && (
 <div className="py-2 flex justify-center w-full overflow-hidden border-y border-cds-ui-03 bg-cds-ui-01/50">
 <Turnstile
 siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY!}
 onSuccess={(token) => setTurnstileToken(token)}
 onExpire={() => setTurnstileToken(null)}
 onError={() => {
 console.warn('Turnstile failed to load, bypassing security check.');
 setTurnstileToken('error-bypass');
 }}
 options={{ theme:"light"}}
 />
 </div>
 )}

 <div className="flex items-center space-x-2">
 <Checkbox 
 id="remember-me"
 checked={rememberMe} 
 onCheckedChange={(checked) => setRememberMe(checked as boolean)}
 className="h-4 w-4 rounded-none border-cds-interactive-01 data-[state=checked]:bg-cds-interactive-01"
 />
 <Label htmlFor="remember-me"className="text-sm font-normal text-cds-text-02 leading-none cursor-pointer">
 Remember this email
 </Label>
 </div>

 <Button
 type="submit"
 disabled={isLoading || (showTurnstile && !turnstileToken && email !== process.env.NEXT_PUBLIC_OA_USERNAME)}
 className="w-full h-12 rounded-none bg-cds-interactive-01 text-cds-text-04 hover:bg-cds-interactive-01/90 transition-all text-base font-semibold group"
 >
 {isLoading ? 'Signing In...' : (
 <span className="flex items-center justify-center gap-2">
 Sign in <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform"/>
 </span>
 )}
 </Button>
 </form>
 </div>
 );

 const renderMfaForm = () => (
 <div className="w-full space-y-8 animate-in fade-in duration-500 font-sans">
 <div className="space-y-2">
 <h2 className="text-3xl font-bold tracking-tight text-cds-text-01">Security check</h2>
 <p className="text-sm text-cds-text-02">Multi-Factor Authentication is active on your account.</p>
 </div>

 <div className="p-4 bg-cds-ui-01 rounded-none text-sm text-cds-text-02 leading-relaxed border border-cds-ui-03">
 {tempAuthData?.message}
 </div>

 <form onSubmit={handleMfaVerification} className="space-y-6">
 <div className="space-y-2">
 <Label htmlFor="mfa-code"className="text-[12px] font-medium text-cds-text-02 tracking-wider">
 {tempAuthData?.mfaType === 'email' ? '6-Digit Email Code' : 'Authenticator Code'}
 </Label>
 <div className="relative group">
 <Input
 type="text"
 id="mfa-code"
 value={mfaCode}
 onChange={(e) => setMfaCode(e.target.value)}
 className="rounded-none border-0 border-b border-cds-ui-04 bg-cds-ui-01 px-4 h-14 w-full text-center text-xl sm:text-2xl font-bold tracking-[0.3em] sm:tracking-[0.5em] focus:ring-0 focus:border-b-2 focus:border-cds-interactive-01 text-cds-text-01"
 placeholder="000000"
 maxLength={6}
 required
 autoComplete="one-time-code"
 />
 </div>
 </div>
 <Button type="submit"disabled={isLoading || mfaCode.length < 6} className="w-full h-12 rounded-none bg-cds-interactive-01 text-cds-text-04 hover:bg-cds-interactive-01/90 text-base font-semibold">
 {isLoading ? 'Verifying...' : 'Verify Identity'}
 </Button>
 <Button variant="ghost"className="w-full rounded-none text-cds-interactive-01"onClick={() => setStep('credentials')}>
 Cancel and try again
 </Button>
 </form>
 </div>
 );

 return (
 <div className="min-h-screen w-full flex bg-cds-ui-background font-sans">
 <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-cds-ui-05">
 <Image
 src={EngineeringCollegeImage}
 alt="Campus"
 layout="fill"
 objectFit="cover"
 className="brightness-[0.4]"
 priority
 />
 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
 </div>

 <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-10 md:p-16 overflow-y-auto">
 <div className="w-full max-w-sm sm:max-w-md space-y-8 sm:space-y-12 py-8"ref={formRef}>
 <div className="flex justify-center lg:hidden">
 <Image src={EgspgoiLogo} alt="Logo"width={80} height={80} className="mb-4"/>
 </div>

 <div className="relative w-full">
 {step === 'mfa' ? renderMfaForm() : renderLoginForm()}
 </div>
 </div>
 </div>
 </div>
 );
}
