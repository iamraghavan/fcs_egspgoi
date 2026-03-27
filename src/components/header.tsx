"use client"

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/user-nav";
import { Button } from "./ui/button";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { GlobalSearch } from './global-search';
import { Bell, HelpCircle, Settings, Menu } from 'lucide-react';
import { format } from 'date-fns';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const READ_NOTIFICATIONS_KEY = 'readNotificationIds';

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
            const facultyId = searchParams.get('uid');
            if (!token || !facultyId || user.role === 'admin' || user.role === 'oa') return;

            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/credits/credits/faculty/${facultyId}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const storedReadIds = JSON.parse(localStorage.getItem(READ_NOTIFICATIONS_KEY) || '[]');
                    const readIdsSet = new Set(storedReadIds);
                    setHasUnread(data.items?.some((item: any) => !readIdsSet.has(item._id)));
                }
            } catch (e) {}
        };
        checkNotifications();
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
          {user.role === 'faculty' && (
            <Link href={`/u/portal/dashboard/notifications?uid=${uid}`}>
                <Button variant="ghost" size="icon" className="relative rounded-none hover:bg-cds-ui-01 h-10 w-10">
                    <Bell className="h-5 w-5 text-cds-text-02" />
                    {hasUnread && <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-primary ring-2 ring-background animate-pulse" />}
                </Button>
            </Link>
          )}
          <Link href="/u/portal/help" className="hidden sm:block">
            <Button variant="ghost" size="icon" className="rounded-none hover:bg-cds-ui-01 h-10 w-10">
                <HelpCircle className="h-5 w-5 text-cds-text-02" />
            </Button>
          </Link>
          <Link href={settingsHref} className="hidden sm:block">
            <Button variant="ghost" size="icon" className="rounded-none hover:bg-cds-ui-01 h-10 w-10">
                <Settings className="h-5 w-5 text-cds-text-02" />
            </Button>
          </Link>
          <div className="h-8 w-[1px] bg-border mx-1 hidden sm:block" />
          <UserNav user={user} logout={() => {
              localStorage.clear();
              window.location.href = '/u/portal/auth?faculty_login';
          }} />
      </div>
    </header>
  );
}
