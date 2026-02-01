
"use client";

import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { BellRing, CheckCircle } from 'lucide-react';

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

export function PushNotificationManager() {
    const { toast } = useToast();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [isPermissionGranted, setIsPermissionGranted] = useState(Notification.permission);
    const [isProcessing, setIsProcessing] = useState(true);


    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            navigator.serviceWorker.ready.then(reg => {
                reg.pushManager.getSubscription().then(subscription => {
                    if (subscription) {
                        setIsSubscribed(true);
                    }
                    setIsProcessing(false);
                });
            });
        } else {
            setIsProcessing(false);
        }
    }, []);

    const subscribeUser = async () => {
        if (Notification.permission === 'denied') {
            toast({
                variant: 'destructive',
                title: 'Permission Denied',
                description: 'Please enable push notifications in your browser settings.'
            });
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
            const register = await navigator.serviceWorker.register('/service-worker.js', {
                scope: '/'
            });

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
                setIsPermissionGranted('granted');
            } else {
                 const errorData = await response.json();
                 throw new Error(errorData.message || 'Failed to subscribe on the server.');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Subscription Failed', description: error.message });
            console.error('Failed to subscribe user: ', error);
        } finally {
            setIsProcessing(false);
        }
    };
    
    if (!isSupported) {
        return <p className="text-sm text-muted-foreground">Push notifications are not supported in your browser.</p>;
    }

    if (isSubscribed || isPermissionGranted === 'granted') {
        return (
             <div className="flex items-center gap-3 text-sm text-green-700 p-3 rounded-md bg-green-50 border border-green-200">
                <CheckCircle className="h-5 w-5" />
                <span>Push notifications are active on this device.</span>
            </div>
        );
    }
    
    if (isPermissionGranted === 'denied') {
        return <p className="text-sm text-destructive">You have blocked notifications. Please enable them in your browser settings.</p>;
    }

    return (
        <div className="space-y-3">
            <Button onClick={subscribeUser} disabled={isProcessing}>
                <BellRing className="mr-2 h-4 w-4" />
                {isProcessing ? 'Processing...' : 'Enable Push Notifications'}
            </Button>
            <p className="text-xs text-muted-foreground">
                Your browser will ask for permission. Please select "Allow" to receive updates.
            </p>
        </div>
    );
}
