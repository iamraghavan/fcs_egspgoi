
"use client";

import { useState } from "react";
import { useToast } from "./use-toast";
import { useAlert } from "@/context/alert-context";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export function useMfaSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const { toast } = useToast();
  const { showAlert } = useAlert();

  const makeMfaRequest = async (endpoint: string, body: object, successMessage: string) => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      showAlert("Authentication Error", "Please log in again.");
      setIsLoading(false);
      return { success: false, data: null };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/mfa/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || `Failed to update MFA settings.`);
      }
      
      toast({ title: "Success", description: successMessage });
      return { success: true, data: responseData };
    } catch (error: any) {
      showAlert("Operation Failed", error.message);
      return { success: false, data: null };
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEmailMfa = async (enable: boolean) => {
    await makeMfaRequest(
      "toggle-email",
      { enable },
      `Email-based MFA has been ${enable ? 'enabled' : 'disabled'}.`
    );
  };

  const enableAppMfa = async () => {
    const { success, data } = await makeMfaRequest(
      "enable-app",
      {},
      "Scan the QR code with your authenticator app."
    );
    if (success && data?.qrCodeDataURL) {
      setQrCode(data.qrCodeDataURL);
    }
    return success;
  };

  const verifyAppSetup = async (token: string) => {
    const { success } = await makeMfaRequest(
      "verify-app-setup",
      { token },
      "Authenticator app has been successfully set up."
    );
    return success;
  };
  
  const disableAllMfa = async () => {
    await makeMfaRequest(
      "disable-all",
      {},
      "All MFA methods have been disabled."
    );
  };

  return {
    isLoading,
    qrCode,
    setQrCode,
    toggleEmailMfa,
    enableAppMfa,
    verifyAppSetup,
    disableAllMfa,
  };
}
