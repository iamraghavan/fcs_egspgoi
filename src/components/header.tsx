"use client"

import { API_ORIGIN, API_V1 } from '@/lib/api-url';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/user-nav";
import { Button } from "./ui/button";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { GlobalSearch } from './global-search';
import { Bell, HelpCircle, Settings, Menu } from 'lucide-react';
import { format } from 'date-fns';

const API_BASE_URL = API_ORIGIN;

type User = {
  name: string;
  email: string;
  avatar: string;
  role: "faculty" | "admin" | "oa";
}

export function Header({ user }: { user: User }) {
    const searchParams = useSearchParams();
    const [hasUnread, setHasUnread] = useState(false);
    const [currentTime, setCurrentTime] = useState<string>("");
    
    const uid = searchParams.get('uid') || '';
    const settingsHref = user.role === 'admin' 
        ? `/u/portal/dashboard/admin/settings?uid=${uid}`
        : `/u/portal/dashboard/settings?uid=${uid}`;

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            // Format: DD/MM/YYYY - HH:MM:SS AM/PM IST
            setCurrentTime(format(now, 'dd/MM/yyyy - hh:mm:ss a') + ' IST');
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const checkNotifications = async () => {
            const token = localStorage.getItem("token");
            if (!token || user.role === 'admin' || user.role === 'oa') return;

            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/notifications?limit=50`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setHasUnread((data.unreadCount || 0) > 0);
                }
            } catch (e) {}
        };
        checkNotifications();
        const interval = window.setInterval(checkNotifications, 60000);
        window.addEventListener('notifications-updated', checkNotifications);
        return () => { window.clearInterval(interval); window.removeEventListener('notifications-updated', checkNotifications); };
    }, [searchParams, user.role]);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden">
            <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
            </Button>
        </SidebarTrigger>
        <div className="hidden md:flex items-center gap-2">
            <span className="text-primary font-bold tracking-tight text-xl">CreditWise</span>
            <span className="h-4 w-[1px] bg-border mx-2" />
            <span className="text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-tight tabular-nums" suppressHydrationWarning>
                {currentTime || 'Initializing...'}
            </span>
        </div>
      </div>

      <div className="flex-1 max-w-xl px-4">
         <GlobalSearch />
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
          {/* Icon-only links need a readable name for screen readers (WCAG 4.1.2). */}
          {user.role === 'faculty' && (
            <Button asChild variant="ghost" size="icon" className="relative rounded-none hover:bg-cds-ui-01 h-10 w-10">
                <Link href={`/u/portal/dashboard/notifications?uid=${uid}`} aria-label={hasUnread ? "Notifications (unread)" : "Notifications"}>
                    <Bell className="h-5 w-5 text-cds-text-02" aria-hidden="true" />
                    {hasUnread && <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-primary ring-2 ring-background animate-pulse" aria-hidden="true" />}
                </Link>
            </Button>
          )}
          <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex rounded-none hover:bg-cds-ui-01 h-10 w-10">
            <Link href="/u/portal/help" aria-label="Help">
                <HelpCircle className="h-5 w-5 text-cds-text-02" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex rounded-none hover:bg-cds-ui-01 h-10 w-10">
            <Link href={settingsHref} aria-label="Settings">
                <Settings className="h-5 w-5 text-cds-text-02" aria-hidden="true" />
            </Link>
          </Button>
          <div className="h-8 w-[1px] bg-border mx-1 hidden sm:block" />
          <UserNav user={user} logout={async () => {
              // End the session on the server too, so a copied token stops working (SEC-10).
              const token = localStorage.getItem("token");
              if (token) {
                await fetch(`${API_V1}/auth/logout`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` },
                }).catch(() => { /* still sign out locally */ });
              }
              localStorage.clear();
              window.location.href = '/u/portal/auth?faculty_login';
          }} />
      </div>
    </header>
  );
}
