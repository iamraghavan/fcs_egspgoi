
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { messaging } from '@/lib/firebase';
import { getToken } from 'firebase/messaging';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const PUBLIC_VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';

export function usePushNotifications() {
    const { toast } = useToast();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isProcessing, setIsProcessing] = useState(true);

    const subscribeUser = useCallback(async () => {
        const messagingInstance = messaging();
        if (!isSupported || !messagingInstance) {
            toast({ variant: 'destructive', title: 'Unsupported', description: 'Push notifications are not supported in this browser.' });
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
                console.log("Requesting notification permission...");
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
            
            console.log("Permission granted. Proceeding with service worker registration.");
            
            const firebaseConfig = {
                apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
                messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
                appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
            };

            if (!firebaseConfig.apiKey) {
                throw new Error("Client-side Firebase config is missing. Check environment variables.");
            }

            const swUrl = `/firebase-messaging-sw.js?firebaseConfig=${encodeURIComponent(JSON.stringify(firebaseConfig))}`;

            console.log(`Registering service worker from: ${swUrl}`);
            const registration = await navigator.serviceWorker.register(swUrl);
            
            console.log("Service worker registered. Waiting for it to be ready...");
            await navigator.serviceWorker.ready;
            console.log("Service Worker is active and ready.");
            
            console.log("Attempting to get FCM token...");
            getToken(messagingInstance, {
                vapidKey: PUBLIC_VAPID_KEY,
                serviceWorkerRegistration: registration
            }).then(async (fcmToken) => {
                if (fcmToken) {
                    console.log('FCM TOKEN IS:', fcmToken);
                    
                    const response = await fetch(`${API_BASE_URL}/api/v1/notifications/device-token`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
                        body: JSON.stringify({ fcmToken }),
                    });
                    
                    if (response.ok) {
                        toast({ title: 'Notifications Enabled', description: 'You will now receive updates via push notifications.' });
                        setIsSubscribed(true);
                    } else {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to register token on the server.');
                    }
                } else {
                     console.error('Could not retrieve FCM token. getToken() returned a falsy value.');
                     toast({
                        variant: 'destructive',
                        title: 'Subscription Failed',
                        description: 'Could not get notification token. Ensure third-party cookies are not blocked in your browser settings.'
                     });
                     setIsSubscribed(false);
                }
            }).catch((error: any) => {
                console.error('Full error during push subscription:', error);
                
                let errorMessage = 'An unknown error occurred while setting up notifications.';
                let errorTitle = 'Subscription Failed';

                if (error.name === 'AbortError') {
                    errorTitle = 'Push Service Error';
                    errorMessage = 'The browser push service failed to subscribe. This might be a temporary network issue or a problem with your browser. Please try again later.';
                } else if (error.code === 'messaging/permission-blocked' || error.code === 'messaging/notifications-blocked') {
                    errorMessage = 'Notification permission was blocked. Please enable it in your browser settings.';
                } else if (error.code === 'messaging/unsupported-browser') {
                    errorMessage = 'This browser does not support push notifications.';
                } else {
                    errorMessage = error.message || errorMessage;
                }
                
                toast({ variant: 'destructive', title: errorTitle, description: errorMessage });
                setIsSubscribed(false);
            }).finally(() => {
                setIsProcessing(false);
            });

        } catch (error: any) {
            console.error('Error during service worker registration:', error);
            toast({ variant: 'destructive', title: 'Setup Failed', description: error.message });
            setIsSubscribed(false);
            setIsProcessing(false);
        }
    }, [isSupported, toast]);
    
     useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && messaging()) {
            setIsSupported(true);
            setPermission(Notification.permission);
            
            const checkSubscription = async () => {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    const subscription = await registration.pushManager.getSubscription();
                    setIsSubscribed(!!subscription);
                } catch (error) {
                    console.error("Error checking push manager subscription:", error);
                    setIsSubscribed(false);
                } finally {
                    setIsProcessing(false);
                }
            };
            checkSubscription();
        } else {
            setIsSupported(false);
            setIsProcessing(false);
        }
    }, []);
    
    return { isSupported, isSubscribed, permission, isProcessing, subscribeUser };
}
