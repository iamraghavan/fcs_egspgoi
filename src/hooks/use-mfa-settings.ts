
"use client";

import { useState } from"react";
import { useToast } from"./use-toast";
import { useAlert } from"@/context/alert-context";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export function useMfaSettings() {
 const [isLoading, setIsLoading] = useState(false);
 const [qrCode, setQrCode] = useState<string | null>(null);
 const { toast } = useToast();
 const { showAlert } = useAlert();

 const setupAppMfa = async () => {
 setIsLoading(true);
 const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
 try {
 const res = await fetch(`${API_BASE_URL}/users/me/mfa/setup`, {
 headers: {"Authorization": `Bearer ${token}` }
 });
 const data = await res.json();
 if (!res.ok || !data.success) throw new Error(data.message ||"Failed to setup MFA");
 setQrCode(data.qrCode);
 return true;
 } catch (error: any) {
 showAlert("MFA Setup Failed", error.message);
 return false;
 } finally {
 setIsLoading(false);
 }
 };

 const enableMfa = async (type: 'app' | 'email', verificationCode: string) => {
 setIsLoading(true);
 const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
 try {
 const res = await fetch(`${API_BASE_URL}/users/me/mfa/enable`, {
 method: 'POST',
 headers: {
 'Authorization': `Bearer ${token}`,
 'Content-Type': 'application/json',
 },
 body: JSON.stringify({ type, token: verificationCode }),
 });
 const data = await res.json();
 if (!res.ok || !data.success) throw new Error(data.message ||"Failed to enable MFA");
 toast({ title:"Success", description: `${type === 'app' ? 'Authenticator app' : 'Email MFA'} has been enabled.` });
 return true;
 } catch (error: any) {
 showAlert("Operation Failed", error.message);
 return false;
 } finally {
 setIsLoading(false);
 }
 };

 const disableMfa = async (verificationCode: string) => {
 setIsLoading(true);
 const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
 try {
 const res = await fetch(`${API_BASE_URL}/users/me/mfa/disable`, {
 method: 'POST',
 headers: {
 'Authorization': `Bearer ${token}`,
 'Content-Type': 'application/json',
 },
 body: JSON.stringify({ token: verificationCode }),
 });
 const data = await res.json();
 if (!res.ok || !data.success) throw new Error(data.message ||"Failed to disable MFA");
 toast({ title:"Success", description:"MFA has been disabled."});
 return true;
 } catch (error: any) {
 showAlert("Operation Failed", error.message);
 return false;
 } finally {
 setIsLoading(false);
 }
 };

 return {
 isLoading,
 qrCode,
 setQrCode,
 setupAppMfa,
 enableMfa,
 disableMfa,
 };
}
