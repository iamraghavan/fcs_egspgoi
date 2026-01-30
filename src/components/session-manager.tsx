"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAlert } from '@/context/alert-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Laptop, Smartphone, Tablet, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

type Session = {
  _id: string;
  device: string;
  lastIp: string;
  createdAt: string;
  isCurrent?: boolean;
};

// Simple device parser
const getDeviceIcon = (deviceString: string) => {
    const lowerDevice = deviceString.toLowerCase();
    if (lowerDevice.includes('mobile') || lowerDevice.includes('iphone') || lowerDevice.includes('android')) {
        return <Smartphone className="h-5 w-5 text-muted-foreground" />;
    }
    if (lowerDevice.includes('ipad') || lowerDevice.includes('tablet')) {
        return <Tablet className="h-5 w-5 text-muted-foreground" />;
    }
    return <Laptop className="h-5 w-5 text-muted-foreground" />;
};


export function SessionManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showAlert } = useAlert();
  const { toast } = useToast();
  
  const currentSessionId = typeof window !== 'undefined' ? localStorage.getItem('sessionId') : null;

  const fetchSessions = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      showAlert('Authentication Error', 'You are not logged in.');
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch sessions');
      }
      // Add `isCurrent` flag to each session
      const sessionsWithCurrent = data.sessions.map((s: Session) => ({
          ...s,
          isCurrent: s._id === currentSessionId
      }));
      setSessions(sessionsWithCurrent);
    } catch (err: any) {
      showAlert('Error', err.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/sessions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
       if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to revoke session');
      }
      toast({ title: 'Session Revoked', description: 'The device has been logged out.' });
      fetchSessions();
    } catch (err: any) {
      showAlert('Failed to revoke session', err.message);
    }
  };

  const handleRevokeOthers = async () => {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/sessions/others`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to revoke other sessions');
        }
        toast({ title: 'Sessions Revoked', description: 'All other devices have been logged out.' });
        fetchSessions();
    } catch (err: any) {
        showAlert('Failed to revoke sessions', err.message);
    }
  };

  useEffect(() => { 
    fetchSessions(); 
  }, []);

  return (
    <Card className="mt-6">
        <CardHeader>
            <CardTitle>Session Management</CardTitle>
            <CardDescription>View and manage devices that are logged into your account.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <p>Loading sessions...</p>
            ) : (
            <ul className="space-y-4">
                {sessions.map(session => (
                <li key={session._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-4">
                        {getDeviceIcon(session.device)}
                        <div>
                            <p className="font-semibold">{session.device}</p>
                            <p className="text-sm text-muted-foreground">
                                IP: {session.lastIp} • Logged in: {new Date(session.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <div>
                    {session.isCurrent ? (
                        <span className="text-xs font-semibold text-primary py-1 px-2 rounded-full bg-primary/10">This Device</span>
                    ) : (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                 <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">Log out</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will log the selected device out of your account immediately.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleRevoke(session._id)} className="bg-destructive hover:bg-destructive/90">
                                        Log Out Device
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    </div>
                </li>
                ))}
            </ul>
            )}
        </CardContent>
        {sessions.length > 1 && (
            <CardFooter className="border-t pt-6">
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Log Out All Other Devices
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will log you out from all devices except the one you are currently using.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleRevokeOthers} className="bg-destructive hover:bg-destructive/90">
                                Confirm & Log Out
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        )}
    </Card>
  );
}
