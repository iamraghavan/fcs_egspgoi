"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { BellRing, CheckCircle, Send, Loader2 } from "lucide-react";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { apiFetch } from "@/lib/api";

export function PushNotificationManager() {
  const { toast } = useToast();
  const { isSupported, isConfigured, isSubscribed, permission, isProcessing, error, subscribeUser, unsubscribeUser } =
    usePushNotifications();
  const [isTestProcessing, setIsTestProcessing] = useState(false);

  const sendTestNotification = async () => {
    setIsTestProcessing(true);
    try {
      const result = await apiFetch("/notifications/test", { method: "POST" });
      toast({
        title: "Test processed",
        description:
          result.channels?.fcm === "delivered"
            ? "A push was sent to this device."
            : "The test is in your inbox. Push delivery is unavailable; check Firebase setup.",
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Test Failed", description: error.message });
      console.error("Failed to send test notification: ", error);
    } finally {
      setIsTestProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Checking notification status...</span>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <p className="text-sm text-muted-foreground">
        This browser cannot receive push notifications. Your in-app inbox is still available.
      </p>
    );
  }

  if (!isConfigured) {
    return (
      <p className="text-sm text-destructive">
        Browser push is not configured for this site. Ask an administrator to check Firebase settings.
      </p>
    );
  }

  if (isSubscribed) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-sm text-success-text p-3 rounded-md bg-success-bg border border-success/40">
          <CheckCircle className="h-5 w-5" />
          <span>Push notifications are active on this device.</span>
        </div>
        <Button onClick={sendTestNotification} variant="outline" disabled={isTestProcessing}>
          <Send className="mr-2 h-4 w-4" />
          {isTestProcessing ? "Sending..." : "Send Test Notification"}
        </Button>
        <Button onClick={() => void unsubscribeUser()} variant="ghost" disabled={isProcessing}>
          Disable on this device
        </Button>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <p className="text-sm text-destructive">
        You have blocked notifications. Please enable them in your browser settings to receive updates.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <Button onClick={() => void subscribeUser()} disabled={isProcessing}>
        <BellRing className="mr-2 h-4 w-4" />
        {isProcessing ? "Processing..." : "Enable Push Notifications"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Your browser will ask for permission. Please select "Allow" to receive updates.
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
