"use client";

import { Header } from "@/components/header";
import { SidebarNav } from "@/components/sidebar-nav";
import React, { useState, useEffect, type ReactNode } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAlert } from "@/context/alert-context";
import Link from "next/link";
import { Skeleton } from "./ui/skeleton";
import dynamic from "next/dynamic";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";

const CookiePreferencesDialog = dynamic(() =>
  import("@/components/cookie-preferences-dialog").then((mod) => mod.CookiePreferencesDialog)
);
const WhatsAppVerificationModal = dynamic(() =>
  import("@/components/whatsapp-verification-modal").then((mod) => mod.WhatsAppVerificationModal)
);

const API_BASE_URL = 'https://faculty-credit-system.vercel.app/api/v1';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'faculty' | 'admin' | 'oa';
  avatar: string;
  whatsappVerified: boolean;
}

const getPageMetadata = (pathname: string, userName: string) => {
    const baseTitle = `${userName} - CreditWise`;
    let pageName = "Dashboard";
    if (pathname.includes('/admin/users')) pageName = 'Faculty Accounts';
    else if (pathname.includes('/admin/credits')) pageName = 'Credit Titles';
    else if (pathname.includes('/admin/review')) pageName = 'Review Submissions';
    else if (pathname.includes('/admin/remarks')) pageName = 'Manage Remarks';
    else if (pathname.includes('/admin/appeals')) pageName = 'Review Appeals';
    else if (pathname.includes('/admin/reports')) pageName = 'Reports';
    else if (pathname.includes('/good-works')) pageName = 'Good Works';
    else if (pathname.includes('/settings')) pageName = 'Settings';

    return { title: `${baseTitle} - ${pageName}` };
};

const LoadingSkeleton = () => (
    <div className="flex h-screen w-full bg-background overflow-hidden">
        <div className="w-64 h-full border-r bg-sidebar p-4 hidden md:block">
            <Skeleton className="h-8 w-32 mb-8" />
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            <header className="h-16 border-b bg-background px-6 flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-10 rounded-full" />
            </header>
            <main className="flex-1 p-8 space-y-6 overflow-auto">
                <Skeleton className="h-12 w-1/3" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
                <Skeleton className="h-96 w-full" />
            </main>
        </div>
    </div>
);

export default function DashboardClientWrapper({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showAlert } = useAlert();
  const { toast } = useToast();
  const [isCookiePrefsOpen, setIsCookiePrefsOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [userForVerification, setUserForVerification] = useState<any | null>(null);

  const { permission, subscribeUser, isSupported } = usePushNotifications();

  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        setLoading(false);
        router.push("/u/portal/auth?faculty_login");
        return;
    }
      try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.status === 401 || response.status === 403) {
          localStorage.clear();
          router.replace("/u/portal/auth?faculty_login&reason=unauthorized");
          return;
        }

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const responseData = await response.json();
        if (!responseData.success) throw new Error(responseData.message || "Session expired");

        const userData = responseData.user || responseData.data;
        const getAvatarUrl = (u: any) => {
            if (u.profileImage) {
                return u.profileImage.startsWith('http') ? u.profileImage : `https://faculty-credit-system.vercel.app${u.profileImage.startsWith('/') ? '' : '/'}${u.profileImage}`;
            }
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`;
        };

        const userPayload: User = {
          id: userData.id || userData._id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          avatar: getAvatarUrl(userData),
          whatsappVerified: userData.whatsappVerified
        };
        
        setUser(userPayload);
        
        if ((userData.role === 'faculty' || userData.role === 'admin') && !userData.whatsappVerified) {
             setUserForVerification(userData);
             setIsVerificationModalOpen(true);
        } else {
            setIsVerificationModalOpen(false);
            const uid = searchParams.get('uid');
            if (userPayload.id !== uid) {
              const prefix = userPayload.role === 'admin' ? '/u/portal/dashboard/admin' : userPayload.role === 'oa' ? '/u/portal/dashboard/oa' : '/u/portal/dashboard';
              router.replace(`${prefix}?uid=${userPayload.id}`);
            }
        }
      } catch (error: any) {
        showAlert("Session Error", error.message);
        localStorage.clear();
        router.push("/u/portal/auth?faculty_login");
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    if (user) {
        const { title } = getPageMetadata(pathname, user.name);
        document.title = title;
    }
  }, [pathname, user]);

  useEffect(() => { fetchUser(); }, [pathname, searchParams]);

  useEffect(() => {
    if (user && isSupported && permission === 'default') {
        const timer = setTimeout(() => {
            toast({
                title: "Enable updates",
                description: "Stay informed with real-time push notifications.",
                action: <Button variant="outline" size="sm" onClick={() => subscribeUser()}>Enable</Button>,
                duration: 10000,
            });
        }, 5000); 
        return () => clearTimeout(timer);
    }
  }, [user, isSupported, permission, subscribeUser, toast]);

  if (loading || !user) return <LoadingSkeleton />;
  
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      <SidebarNav role={user.role} />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto w-full p-4 md:p-6 lg:p-8 scroll-smooth">
            <div className="max-w-[1600px] mx-auto w-full pb-20">
                {children}
            </div>
        </main>
        <footer className="h-12 shrink-0 bg-cds-ui-01 border-t border-sidebar-border px-6 flex items-center justify-between text-[11px] text-cds-text-05">
            <span>© {new Date().getFullYear()} E.G.S. Pillay Group of Institutions</span>
            <div className="flex items-center gap-4">
                <Link href="/u/portal/privacy-policy" className="hover:text-primary transition-colors">Privacy</Link>
                <Link href="/u/portal/terms" className="hover:text-primary transition-colors">Terms</Link>
                <button onClick={() => setIsCookiePrefsOpen(true)} className="hover:text-primary transition-colors">Cookies</button>
            </div>
        </footer>
      </div>
      {isCookiePrefsOpen && <CookiePreferencesDialog open={isCookiePrefsOpen} onOpenChange={setIsCookiePrefsOpen} />}
      {isVerificationModalOpen && <WhatsAppVerificationModal isOpen={isVerificationModalOpen} user={userForVerification} onSuccess={() => { setIsVerificationModalOpen(false); if (user) setUser({ ...user, whatsappVerified: true }); }} />}
    </div>
  );
}
