"use client";

import { useCallback, useEffect, useState } from "react";
import { deleteToken, getToken, isSupported as firebaseMessagingSupported } from "firebase/messaging";
import { apiFetch } from "@/lib/api";
import { messaging } from "@/lib/firebase";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";

function workerUrl() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  return `/firebase-messaging-sw.js?firebaseConfig=${encodeURIComponent(JSON.stringify(config))}`;
}

async function browserToken() {
  const client = messaging();
  if (!client || !VAPID_KEY) throw new Error("Push notifications are not configured for this site.");
  const worker = await navigator.serviceWorker.register(workerUrl());
  const token = await getToken(client, { vapidKey: VAPID_KEY, serviceWorkerRegistration: worker });
  if (!token) throw new Error("The browser could not create a notification token. Please retry.");
  return { client, token };
}

export async function removeBrowserPushForCurrentUser() {
  if (typeof window === "undefined" || Notification.permission !== "granted") return;
  const client = messaging();
  if (!client || !VAPID_KEY) return;
  try {
    const { token } = await browserToken();
    try {
      await apiFetch("/notifications/device-token", { method: "DELETE", body: { fcmToken: token } });
    } finally {
      await deleteToken(client);
    }
  } catch {
    // Logout must continue if a push service or the API is unavailable.
  }
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(async () => {
    if (!localStorage.getItem("token")) throw new Error("Sign in to enable notifications.");
    const { token } = await browserToken();
    await apiFetch("/notifications/device-token", {
      method: "PUT",
      body: { fcmToken: token, platform: "web" },
    });
    setIsSubscribed(true);
    setError(null);
  }, []);

  const subscribeUser = useCallback(async () => {
    setIsProcessing(true);
    setError(null);
    try {
      let nextPermission = Notification.permission;
      if (nextPermission === "default") nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);
      if (nextPermission !== "granted")
        throw new Error("Allow notifications in your browser settings to receive updates.");
      await register();
    } catch (cause) {
      setIsSubscribed(false);
      setError(cause instanceof Error ? cause.message : "Could not enable notifications.");
    } finally {
      setIsProcessing(false);
    }
  }, [register]);

  const unsubscribeUser = useCallback(async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const { client, token } = await browserToken();
      await apiFetch("/notifications/device-token", { method: "DELETE", body: { fcmToken: token } });
      await deleteToken(client);
      setIsSubscribed(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not disable notifications.");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const supported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "Notification" in window &&
        window.isSecureContext &&
        (await firebaseMessagingSupported());
      if (!mounted) return;
      setIsSupported(supported);
      setIsConfigured(Boolean(messaging() && VAPID_KEY));
      if ("Notification" in window) setPermission(Notification.permission);
      if (supported && Notification.permission === "granted" && localStorage.getItem("token")) {
        try {
          await register();
        } catch (cause) {
          if (mounted) setError(cause instanceof Error ? cause.message : "Could not register this device.");
        }
      }
      if (mounted) setIsProcessing(false);
    };
    void check();
    return () => {
      mounted = false;
    };
  }, [register]);

  return { isSupported, isConfigured, isSubscribed, permission, isProcessing, error, subscribeUser, unsubscribeUser };
}
