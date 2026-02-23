
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

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && messaging()) {
            setIsSupported(true);
            setPermission(Notification.permission);
            // Check current subscription status
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
            
            // Construct the service worker URL with config as query parameters
            const firebaseConfig = {
                apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
                messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
                appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
            };

            const queryString = new URLSearchParams(firebaseConfig as any).toString();
            const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${queryString}`);
            await navigator.serviceWorker.ready;
            
            const fcmToken = await getToken(messagingInstance, {
                vapidKey: PUBLIC_VAPID_KEY,
                serviceWorkerRegistration: registration
            });

            console.log('FCM Token:', fcmToken);
            
            if (fcmToken) {
                // Send token to backend
                const response = await fetch(`${API_BASE_URL}/api/v1/notifications/device-token`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userToken}`,
                    },
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
                throw new Error('Could not get FCM token. Please try again.');
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
