
"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { BellRing, CheckCircle, Send, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/use-push-notifications';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export function PushNotificationManager() {
    const { toast } = useToast();
    const { isSupported, isSubscribed, permission, isProcessing, subscribeUser } = usePushNotifications();
    const [isTestProcessing, setIsTestProcessing] = useState(false);

    const sendTestNotification = async () => {
        const userToken = localStorage.getItem('token');
        if (!userToken) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to send a test notification.' });
            return;
        }
        
        setIsTestProcessing(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/notifications/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                }
            });

            if (response.ok) {
                toast({ title: 'Test Sent', description: 'If notifications are set up correctly, you should receive a test notification shortly.' });
            } else {
                 const errorData = await response.json();
                 throw new Error(errorData.message || 'Failed to send test notification.');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Test Failed', description: error.message });
            console.error('Failed to send test notification: ', error);
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
        )
    }

    if (!isSupported) {
        return <p className="text-sm text-muted-foreground">Push notifications are not supported in your browser.</p>;
    }

    if (isSubscribed) {
        return (
             <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-green-700 p-3 rounded-md bg-green-50 border border-green-200">
                    <CheckCircle className="h-5 w-5" />
                    <span>Push notifications are active on this device.</span>
                </div>
                <Button onClick={sendTestNotification} variant="outline" disabled={isTestProcessing}>
                    <Send className="mr-2 h-4 w-4" />
                    {isTestProcessing ? 'Sending...' : 'Send Test Notification'}
                </Button>
            </div>
        );
    }
    
    if (permission === 'denied') {
        return <p className="text-sm text-destructive">You have blocked notifications. Please enable them in your browser settings to receive updates.</p>;
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
