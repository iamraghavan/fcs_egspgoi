
"use client";

import { useState, useEffect } from"react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from"@/components/ui/dialog";
import { Button } from"@/components/ui/button";
import { Input } from"@/components/ui/input";
import { Label } from"@/components/ui/label";
import { MessageCircle, Loader2 } from"lucide-react";
import { useAlert } from"@/context/alert-context";
import { MuiTelInput, matchIsValidTel } from 'mui-tel-input';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import { API_BASE_URL } from "@/lib/config";

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

type User = {
 _id: string;
 name: string;
 whatsappNumber: string | null;
 role: 'faculty' | 'admin' | 'oa';
};

type WhatsAppVerificationModalProps = {
 isOpen: boolean;
 user: User | null;
 onSuccess: () => void;
};

export function WhatsAppVerificationModal({ isOpen, user, onSuccess }: WhatsAppVerificationModalProps) {
 const { showAlert } = useAlert();
 const [step, setStep] = useState<'enter-phone' | 'verify-otp'>('enter-phone');
 const [phone, setPhone] = useState('');
 const [otp, setOtp] = useState('');
 const [isSubmitting, setIsSubmitting] = useState(false);

 useEffect(() => {
 if (user) {
 setPhone(user.whatsappNumber || '');
 setStep('enter-phone');
 setOtp('');
 }
 }, [user]);

 const handleSendOtp = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!matchIsValidTel(phone)) {
 showAlert('Invalid Phone Number', 'Please enter a valid phone number with a country code.');
 return;
 }
 setIsSubmitting(true);
 const token = localStorage.getItem("token");
 try {
 // The backend expects a 10-digit number, so we strip non-digit characters and take the last 10.
 const digitsOnly = phone.replace(/\D/g, '');
 const last10Digits = digitsOnly.slice(-10);

 const res = await fetch(`${API_BASE_URL}/auth/whatsapp/send-otp`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify({ phone: last10Digits }),
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
 const res = await fetch(`${API_BASE_URL}/auth/whatsapp/verify-otp`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify({ otp }),
 });
 const data = await res.json();
 if (!res.ok || !data.success) {
 throw new Error(data.message || 'OTP Verification failed.');
 }
 showAlert('Success!', 'Your WhatsApp number has been verified.');
 onSuccess();
 } catch (error: any) {
 showAlert('Verification Failed', error.message);
 } finally {
 setIsSubmitting(false);
 }
 };
 
 return (
 <Dialog open={isOpen} onOpenChange={() => {}}>
 <DialogContent className="sm:max-w-md"onInteractOutside={(e) => e.preventDefault()}>
 <DialogHeader>
 <DialogTitle>Verify Your WhatsApp Number</DialogTitle>
 <DialogDescription>
 For enhanced security and communication, please verify your WhatsApp number.
 </DialogDescription>
 </DialogHeader>
 <ThemeProvider theme={muiTheme}>
 {step === 'enter-phone' ? (
 <form onSubmit={handleSendOtp} className="space-y-6 pt-4">
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
 <DialogFooter>
 <Button type="submit"disabled={isSubmitting} className="w-full">
 {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Sending...</> : 'Send Verification Code'}
 </Button>
 </DialogFooter>
 </form>
 ) : (
 <form onSubmit={handleVerifyOtp} className="space-y-6 pt-4">
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
 <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
 <Button type="submit"disabled={isSubmitting} className="w-full">
 {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Verifying...</> : 'Verify Number'}
 </Button>
 <Button type="button"variant="link"size="sm"onClick={() => setStep('enter-phone')} disabled={isSubmitting}>
 Use a different number?
 </Button>
 </DialogFooter>
 </form>
 )}
 </ThemeProvider>
 </DialogContent>
 </Dialog>
 )
}
