
"use client"

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/user-nav";
import { Button } from "./ui/button";
import Link from 'next/link';
import { Input } from './ui/input';
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const READ_NOTIFICATIONS_KEY = 'readNotificationIds';
const SESSION_DURATION_SECONDS = 10 * 60; // 10 minutes
const TIMEOUT_WARNING_SECONDS = 60; // 1 minute

type User = {
  name: string;
  email: string;
  avatar: string;
  role: "faculty" | "admin" | "oa";
}

export function Header({ user }: { user: User }) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [hasUnread, setHasUnread] = useState(false);
    const [timeLeft, setTimeLeft] = useState(SESSION_DURATION_SECONDS);
    const [isTimeoutWarningOpen, setIsTimeoutWarningOpen] = useState(false);
    
    const uid = searchParams.get('uid') || '';
    const notificationsHref = user.role === 'admin' 
        ? `/u/portal/dashboard/admin/notifications?uid=${uid}`
        : `/u/portal/dashboard/notifications?uid=${uid}`;

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('sessionExpiresAt');
        router.push('/u/portal/auth?faculty_login&reason=session_expired');
    };
    
    const resetSession = () => {
        const newExpiryTime = Date.now() + SESSION_DURATION_SECONDS * 1000;
        localStorage.setItem('sessionExpiresAt', newExpiryTime.toString());
        setTimeLeft(SESSION_DURATION_SECONDS);
        setIsTimeoutWarningOpen(false);
    };

    useEffect(() => {
        resetSession(); // Reset on initial load/navigation
    }, [pathname]);

    useEffect(() => {
        const interval = setInterval(() => {
            const expiresAt = parseInt(localStorage.getItem('sessionExpiresAt') || '0', 10);
            const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
            setTimeLeft(remaining);

            if (remaining <= TIMEOUT_WARNING_SECONDS && remaining > 0 && !isTimeoutWarningOpen) {
                setIsTimeoutWarningOpen(true);
            }

            if (remaining <= 0) {
                logout();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isTimeoutWarningOpen]);
    
    useEffect(() => {
        const checkNotifications = async () => {
            const token = localStorage.getItem("token");
            const facultyId = searchParams.get('uid');

            if (!token || !facultyId || user.role === 'admin' || user.role === 'oa') {
                setHasUnread(false);
                return;
            }

            try {
                const url = `${API_BASE_URL}/api/v1/credits/credits/faculty/${facultyId}/negative`;
                const response = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
                
                if (response.status === 401) {
                    logout();
                    return;
                }

                if (!response.ok) {
                    console.error(`Failed to check notifications. Status: ${response.status}`);
                    return;
                }

                const data = await response.json();
                
                if (data.success && data.items.length > 0) {
                    const storedReadIds = JSON.parse(localStorage.getItem(READ_NOTIFICATIONS_KEY) || '[]');
                    const readIdsSet = new Set(storedReadIds);
                    const hasNew = data.items.some((item: any) => !readIdsSet.has(item._id));
                    setHasUnread(hasNew);
                } else {
                    setHasUnread(false);
                }
            } catch (error: any) {
                console.error("Failed to check notifications:", error.message);
                setHasUnread(false);
            }
        };

        checkNotifications();
        const interval = setInterval(checkNotifications, 60000);
        return () => clearInterval(interval);

    }, [pathname, searchParams, user.role, toast]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

  return (
    <>
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-sidebar text-sidebar-foreground px-4 md:px-6 col-span-2">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden text-sidebar-foreground hover:bg-sidebar-accent" />
         <Link href="#" className="font-bold text-lg hidden md:block">
             CreditWise
         </Link>
      </div>
      <div className="flex w-full items-center justify-center">
         <div className="hidden md:flex relative w-full max-w-sm items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="w-full bg-background/20 text-sidebar-foreground placeholder:text-muted-foreground/80 pl-10 border-sidebar-border"
            />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
          {(user.role === 'faculty') && (
            <Link href={notificationsHref}>
                <Button variant="ghost" size="icon" className="rounded-full relative text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/80">
                    <span className="material-symbols-outlined">notifications</span>
                    {hasUnread && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                    )}
                    <span className="sr-only">Toggle notifications</span>
                </Button>
            </Link>
          )}
          <Button variant="ghost" size="icon" className="rounded-full text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/80">
              <span className="material-symbols-outlined">help</span>
          </Button>
          <Link href={user.role === 'admin' ? `/u/portal/dashboard/admin/settings?uid=${uid}` : `/u/portal/dashboard/settings?uid=${uid}`}>
            <Button variant="ghost" size="icon" className="rounded-full text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/80">
                <span className="material-symbols-outlined">settings</span>
            </Button>
          </Link>

        <UserNav user={user} logout={logout} />
      </div>
    </header>
    <AlertDialog open={isTimeoutWarningOpen} onOpenChange={setIsTimeoutWarningOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Your session is about to expire!</AlertDialogTitle>
            <AlertDialogDescription>
                You've been inactive for a while. For your security, you'll be logged out automatically in {formatTime(timeLeft)}.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={logout}>Logout</AlertDialogCancel>
            <AlertDialogAction onClick={resetSession}>Continue Session</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
