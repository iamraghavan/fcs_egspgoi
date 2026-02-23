
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const PUBLIC_VAPID_KEY = 'BLrsFHmq1niUPGhfcviZiDTdf1Kc64jci92HlSno45R2BdbFuyKTMxh0H2OtH-iCP6ftG46dL5dssJaoeYg0bLc';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
    const { toast } = useToast();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isProcessing, setIsProcessing] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
            navigator.serviceWorker.ready.then(reg => {
                reg.pushManager.getSubscription().then(subscription => {
                    setIsSubscribed(!!subscription);
                    setIsProcessing(false);
                });
            });
        } else {
            setIsSupported(false);
            setIsProcessing(false);
        }
    }, []);

    const subscribeUser = useCallback(async () => {
        if (!isSupported) {
            toast({ variant: 'destructive', title: 'Unsupported', description: 'Push notifications are not supported in your browser.' });
            return;
        }

        setIsProcessing(true);
        const userToken = localStorage.getItem('token');
        if (!userToken) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to enable notifications.' });
            setIsProcessing(false);
            return;
        }

        try {
            let currentPermission = Notification.permission;
            if (currentPermission === 'default') {
                currentPermission = await Notification.requestPermission();
                setPermission(currentPermission);
            }

            if (currentPermission !== 'granted') {
                toast({
                    variant: 'destructive',
                    title: 'Permission Denied',
                    description: 'Please enable push notifications in your browser settings.'
                });
                setIsProcessing(false);
                return;
            }

            const register = await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
            const subscription = await register.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
            });

            const response = await fetch(`${API_BASE_URL}/api/v1/notifications/subscribe`, {
                method: 'POST',
                body: JSON.stringify(subscription),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                }
            });

            if (response.ok) {
                toast({ title: 'Notifications Enabled', description: 'You will now receive updates via push notifications.' });
                setIsSubscribed(true);
            } else {
                 const errorData = await response.json();
                 throw new Error(errorData.message || 'Failed to subscribe on the server.');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Subscription Failed', description: error.message });
            console.error('Failed to subscribe user: ', error);
            setIsSubscribed(false);
        } finally {
            setIsProcessing(false);
        }
    }, [isSupported, toast]);
    
    return { isSupported, isSubscribed, permission, isProcessing, subscribeUser };
}
