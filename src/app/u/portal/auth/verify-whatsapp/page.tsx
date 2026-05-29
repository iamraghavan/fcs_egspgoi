"use client";

import { useState, useEffect, Suspense } from"react";
import { useRouter, useSearchParams } from"next/navigation";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { Label } from"@/components/ui/label";
import { MessageCircle, Loader2 } from"lucide-react";
import Image from"next/image";
import { useAlert } from"@/context/alert-context";
import EgspgoiLogo from '@/app/egspgoi_logo_tr.png';
import EngineeringCollegeImage from '@/app/engineering_college.webp';
import { MuiTelInput, matchIsValidTel } from 'mui-tel-input';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

const muiTheme = createTheme({
 components: {
 MuiTextField: {
 styleOverrides: {
 root: {
 '--TextField-brandBorderColor': 'hsl(var(--input))',
 '--TextField-brandBorderHoverColor': 'hsl(var(--ring))',
 '--TextField-brandBorderFocusedColor': 'hsl(var(--ring))',
 '& label.Mui-focused': {
 color: 'hsl(var(--foreground))',
 },
 },
 },
 },
 MuiOutlinedInput: {
 styleOverrides: {
 root: {
 fontFamily: 'inherit',
 color: 'hsl(var(--foreground))',
 borderRadius: 'var(--radius)',
 '&:hover .MuiOutlinedInput-notchedOutline': {
 borderColor: 'var(--TextField-brandBorderHoverColor)',
 },
 '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
 borderColor: 'var(--TextField-brandBorderFocusedColor)',
 borderWidth: '2px',
 },
 },
 notchedOutline: {
 borderColor: 'var(--TextField-brandBorderColor)',
 }
 },
 },
 MuiMenu: {
 styleOverrides: {
 paper: {
 backgroundColor: 'hsl(var(--card))',
 color: 'hsl(var(--card-foreground))',
 }
 }
 }
 },
});

type UserProfile = {
 _id: string;
 name: string;
 whatsappNumber: string | null;
 whatsappVerified: boolean;
 role: 'faculty' | 'admin' | 'oa';
};

function VerifyWhatsApp() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const { showAlert } = useAlert();

 const [step, setStep] = useState<'initial' | 'enter-phone' | 'verify-otp'>('initial');
 const [phone, setPhone] = useState('');
 const [otp, setOtp] = useState('');
 const [isLoading, setIsLoading] = useState(true);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const uid = searchParams.get('uid');

 useEffect(() => {
 const fetchProfile = async () => {
 setIsLoading(true);
 const token = localStorage.getItem("token");
 if (!token) {
 router.push('/u/portal/auth?faculty_login&reason=unauthenticated');
 return;
 }
 try {
 const res = await fetch(`${API_BASE_URL}/api/v1/auth/profile`, {
 headers: { Authorization: `Bearer ${token}` },
 });
 const data = await res.json();
 if (!res.ok || !data.success) {
 throw new Error(data.message || 'Failed to fetch user profile.');
 }
 if (data.user.whatsappNumber) {
 setPhone(data.user.whatsappNumber);
 }
 setStep('enter-phone');
 } catch (error: any) {
 showAlert('Error', error.message);
 router.push('/u/portal/auth?faculty_login&reason=error');
 } finally {
 setIsLoading(false);
 }
 };
 fetchProfile();
 }, [router, showAlert]);

 const handleSendOtp = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!matchIsValidTel(phone)) {
 showAlert('Invalid Phone Number', 'Please enter a valid phone number.');
 return;
 }
 setIsSubmitting(true);
 const token = localStorage.getItem("token");
 try {
 const res = await fetch(`${API_BASE_URL}/api/v1/auth/whatsapp/send-otp`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify({ phone }),
 });
 const data = await res.json();
 if (!res.ok || !data.success) {
 throw new Error(data.message || 'Failed to send OTP.');
 }
 setStep('verify-otp');
 } catch (error: any) {
 showAlert('Failed to Send OTP', error.message);
 } finally {
 setIsSubmitting(false);
 }
 };
 
 const handleVerifyOtp = async (e: React.FormEvent) => {
 e.preventDefault();
 if (otp.length < 6) {
 showAlert('Invalid Code', 'Please enter the 6-digit verification code.');
 return;
 }
 setIsSubmitting(true);
 const token = localStorage.getItem("token");
 try {
 const res = await fetch(`${API_BASE_URL}/api/v1/auth/whatsapp/verify-otp`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify({ otp }),
 });
 const data = await res.json();
 if (!res.ok || !data.success) {
 throw new Error(data.message || 'OTP Verification failed.');
 }
 
 setStep('initial');
 showAlert('Success!', 'Your WhatsApp number has been verified.');
 
 const role = localStorage.getItem("userRole");
 let redirectUrl = `/u/portal/dashboard?uid=${uid}`;
 if (role === 'admin') redirectUrl = `/u/portal/dashboard/admin?uid=${uid}`;
 if (role === 'oa') redirectUrl = `/u/portal/dashboard/oa?uid=${uid}`;

 router.push(redirectUrl);
 
 } catch (error: any) {
 showAlert('Verification Failed', error.message);
 } finally {
 setIsSubmitting(false);
 }
 };

 const renderContent = () => {
 if (isLoading || step === 'initial') {
 return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin"/></div>;
 }

 if (step === 'enter-phone') {
 return (
 <form onSubmit={handleSendOtp} className="space-y-6">
 <div>
 <Label htmlFor="phone">WhatsApp Number</Label>
 <div className="relative mt-2">
 <MuiTelInput
 id="phone"
 value={phone}
 onChange={(newValue) => setPhone(newValue)}
 defaultCountry="IN"
 onlyCountries={['IN', 'US', 'GB', 'AU', 'AE']}
 fullWidth
 variant="outlined"
 required
 aria-required="true"
 />
 </div>
 </div>
 <Button type="submit"disabled={isSubmitting} className="w-full">
 {isSubmitting ? 'Sending...' : 'Send Verification Code'}
 </Button>
 </form>
 );
 }

 if (step === 'verify-otp') {
 return (
 <form onSubmit={handleVerifyOtp} className="space-y-6">
 <p className="text-center text-muted-foreground text-sm">
 Enter the 6-digit code we sent to your WhatsApp number: <strong>{phone}</strong>.
 </p>
 <div>
 <Label htmlFor="otp">Verification Code</Label>
 <div className="relative mt-2">
 <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
 <Input
 id="otp"
 value={otp}
 onChange={(e) => setOtp(e.target.value)}
 className="pl-10 text-center tracking-[0.5em]"
 placeholder="_ _ _ _ _ _"
 maxLength={6}
 required
 />
 </div>
 </div>
 <Button type="submit"disabled={isSubmitting} className="w-full">
 {isSubmitting ? 'Verifying...' : 'Verify Number'}
 </Button>
 <Button variant="link"size="sm"className="w-full"onClick={() => setStep('enter-phone')}>
 Use a different number?
 </Button>
 </form>
 )
 }
 };

 return (
 <div className="w-full min-h-screen flex flex-col md:flex-row">
 <div className="hidden md:flex flex-1 relative bg-cds-ui-05">
 <Image
 src={EngineeringCollegeImage}
 alt="EGS Pillay Engineering College"
 fill
 className="object-cover brightness-[0.4]"
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
 className="mx-auto mb-4 h-auto w-auto"
 priority
 />
 <h2 className="text-3xl font-bold text-foreground mb-2">
 Verify Your WhatsApp
 </h2>
 <p className="text-muted-foreground">
 For enhanced security and communication, please verify your WhatsApp number.
 </p>
 </div>
 <ThemeProvider theme={muiTheme}>
 {renderContent()}
 </ThemeProvider>
 </div>
 </div>
 </div>
 );
}

export default function VerifyWhatsAppPage() {
 return (
 <Suspense fallback={<div>Loading...</div>}>
 <VerifyWhatsApp />
 </Suspense>
 );
}
