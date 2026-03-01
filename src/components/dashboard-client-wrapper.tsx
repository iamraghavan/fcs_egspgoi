
"use client";

import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/header";
import { SidebarNav } from "@/components/sidebar-nav";
import React, { useState, useEffect, type ReactNode, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAlert } from "@/context/alert-context";
import Link from "next/link";
import { Skeleton } from "./ui/skeleton";
import dynamic from "next/dynamic";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { BellRing } from "lucide-react";


const CookiePreferencesDialog = dynamic(() =>
  import("@/components/cookie-preferences-dialog").then((mod) => mod.CookiePreferencesDialog)
);
const WhatsAppVerificationModal = dynamic(() =>
  import("@/components/whatsapp-verification-modal").then((mod) => mod.WhatsAppVerificationModal)
);


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

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
    let usecase = "Overview of your activities and credits.";

    if (pathname.includes('/admin/users/bulk-add')) {
        pageName = 'Bulk Import';
        usecase = 'Bulk import new users.';
    } else if (pathname.includes('/admin/users')) {
        pageName = 'Faculty Accounts';
        usecase = 'Manage faculty accounts.';
    } else if (pathname.includes('/admin/credits')) {
        pageName = 'Credit Titles';
        usecase = 'Manage credit titles.';
    } else if (pathname.includes('/admin/review')) {
        pageName = 'Review Submissions';
        usecase = 'Review faculty submissions.';
    } else if (pathname.includes('/admin/remarks')) {
        pageName = 'Manage Remarks';
        usecase = 'Manage negative remarks.';
    } else if (pathname.includes('/admin/appeals')) {
        pageName = 'Review Appeals';
        usecase = 'Review faculty appeals.';
    } else if (pathname.includes('/admin/reports')) {
        pageName = 'Reports';
        usecase = 'Generate and view reports.';
    } else if (pathname.startsWith('/u/portal/dashboard/admin')) {
        pageName = 'Admin Dashboard';
        usecase = 'Administrative overview.';
    } else if (pathname.includes('/good-works/submit')) {
        pageName = 'Submit Good Work';
        usecase = 'Submit a new achievement.';
    } else if (pathname.includes('/good-works')) {
        pageName = 'Good Works';
        usecase = 'View your submitted good works.';
    } else if (pathname.includes('/remarks')) {
        pageName = 'Negative Remarks';
        usecase = 'View your negative remarks.';
    } else if (pathname.includes('/appeals')) {
        pageName = 'My Appeals';
        usecase = 'Track your appeals.';
    } else if (pathname.includes('/notifications')) {
        pageName = 'Notifications';
        usecase = 'View your notifications.';
    } else if (pathname.includes('/settings')) {
        pageName = 'Settings';
        usecase = 'Manage your account settings.';
    } else if (pathname.includes('/oa')) {
        pageName = 'OA Dashboard';
        usecase = 'Office Assistant Dashboard.';
    }

    return {
        title: `${baseTitle} - ${pageName}`,
        description: `${pageName}: ${usecase}`
    };
};

const LoadingSkeleton = () => (
    <div className="grid min-h-screen w-full grid-rows-[auto_1fr_auto]">
        {/* Header Skeleton */}
        <header className="flex h-16 shrink-0 items-center border-b bg-sidebar px-4 col-span-2">
             <Skeleton className="h-8 w-32 bg-sidebar-accent" />
             <div className="ml-auto flex items-center space-x-4">
                <Skeleton className="h-8 w-8 rounded-full bg-sidebar-accent" />
             </div>
        </header>
        {/* Sidebar Skeleton */}
        <aside className="hidden md:flex flex-col border-r bg-sidebar p-2">
            <div className="p-2 space-y-2">
                <Skeleton className="h-9 w-full bg-sidebar-accent" />
                <Skeleton className="h-9 w-full bg-sidebar-accent" />
                <Skeleton className="h-9 w-full bg-sidebar-accent" />
            </div>
        </aside>
        {/* Main Content Skeleton */}
        <main className="flex flex-col overflow-y-auto">
            <div className="flex-1 p-8 space-y-4">
                <Skeleton className="h-16 w-1/2" />
                <Skeleton className="h-96 w-full" />
            </div>
        </main>
        {/* Footer Skeleton */}
        <footer className="shrink-0 bg-sidebar text-sidebar-foreground opacity-60 border-t border-sidebar-border px-6 py-4 col-span-2">
            <div className="flex items-center justify-between text-xs">
                <Skeleton className="h-4 w-1/3 bg-sidebar-accent" />
                 <Skeleton className="h-4 w-1/4 bg-sidebar-accent" />
            </div>
        </footer>
    </div>
);

const Footer = ({ onCookiePreferencesClick }: { onCookiePreferencesClick: () => void }) => (
    <footer className="shrink-0 bg-sidebar text-sidebar-foreground border-t border-sidebar-border px-6 py-4 col-span-full">
        <div className="flex flex-col md:flex-row items-center justify-between text-xs gap-4 md:gap-0 opacity-60">
            <span className="text-center md:text-left">© {new Date().getFullYear()} E.G.S. Pillay Group of Institutions. All rights reserved.</span>
            <div className="flex items-center gap-4">
                <Link href="/u/portal/privacy-policy" className="hover:text-sidebar-foreground">Privacy Policy</Link>
                <Link href="/u/portal/terms" className="hover:text-sidebar-foreground">Terms</Link>
                <button onClick={onCookiePreferencesClick} className="hover:text-sidebar-foreground">Cookie preferences</button>
            </div>
        </div>
    </footer>
)

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
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/profile`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("userRole");
          router.push("/u/portal/auth?faculty_login");
          return;
        }

        const responseData = await response.json();
        
        if (!response.ok || !responseData.success) {
          throw new Error(responseData.message || "Failed to fetch user data");
        }

        const userData = responseData.user || responseData.data;

        if (!userData) {
          throw new Error("User data not found in server response.");
        }
        
        const getAvatarUrl = (user: any) => {
            if (user.profileImage) {
                if (user.profileImage.startsWith('http')) {
                    return user.profileImage;
                }
                return `${API_BASE_URL}${user.profileImage.startsWith('/') ? '' : '/'}${user.profileImage}`;
            }
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
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
        
        const needsVerification = (userData.role === 'faculty' || userData.role === 'admin') && !userData.whatsappVerified;
        
        if (needsVerification) {
             setUserForVerification(userData);
             setIsVerificationModalOpen(true);
        } else {
            setIsVerificationModalOpen(false);
            setUserForVerification(null);
            
            const uid = searchParams.get('uid');
            const getExpectedPath = () => {
                switch (userPayload.role) {
                    case 'admin':
                        return '/u/portal/dashboard/admin';
                    case 'oa':
                        return '/u/portal/dashboard/oa';
                    default:
                        return '/u/portal/dashboard';
                }
            }
            
            const expectedPathPrefix = getExpectedPath();
            
            if (userPayload.id !== uid) {
              const expectedUrl = `${expectedPathPrefix}?uid=${userPayload.id}`;
              router.replace(expectedUrl);
            } else if (userPayload.role === 'oa' && !pathname.startsWith('/u/portal/dashboard/oa')) {
                router.replace(`/u/portal/dashboard/oa?uid=${userPayload.id}`);
            } else if (userPayload.role === 'faculty' && (pathname.includes('/admin') || pathname.includes('/oa'))) {
               router.replace(`/u/portal/dashboard?uid=${userPayload.id}`);
            } else if (userPayload.role === 'admin' && !pathname.startsWith('/u/portal/dashboard/admin')) {
               router.replace(`/u/portal/dashboard/admin?uid=${userPayload.id}`);
            }
        }


      } catch (error: any) {
        showAlert("Session Error", error.message);
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        router.push("/u/portal/auth?faculty_login");
      } finally {
        setLoading(false);
      }
  };


  useEffect(() => {
    if (user) {
        const { title, description } = getPageMetadata(pathname, user.name);
        document.title = title;
        
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.setAttribute('name', 'description');
            document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', description);
    }
  }, [pathname, user]);

  useEffect(() => {
    fetchUser();
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!user || !isSupported) {
        return;
    }

    if (permission === 'granted') {
        console.log("Notification permission already granted. Refreshing token.");
        subscribeUser();
    } else if (permission === 'default') {
        const PROMPT_DISMISSED_KEY = 'notificationPromptDismissedAt';
        const PROMPT_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

        const lastDismissed = localStorage.getItem(PROMPT_DISMISSED_KEY);
        if (lastDismissed && (Date.now() - parseInt(lastDismissed, 10) < PROMPT_COOLDOWN_MS)) {
            return;
        }

        const timer = setTimeout(() => {
            toast({
                title: "Get instant updates",
                description: "Enable push notifications to stay informed about your account.",
                action: (
                    <Button variant="outline" size="sm" onClick={async () => {
                        await subscribeUser();
                    }}>
                        <BellRing className="mr-2" />
                        Enable
                    </Button>
                ),
                duration: 15000,
                onOpenChange: (open) => {
                    if (!open) {
                        localStorage.setItem(PROMPT_DISMISSED_KEY, Date.now().toString());
                    }
                }
            });
        }, 7000); // 7 seconds after dashboard loads

        return () => clearTimeout(timer);
    }
  }, [user, isSupported, permission, subscribeUser, toast]);

  if (loading || !user) {
    return <LoadingSkeleton />;
  }
  
  return (
    <>
    <div className="grid min-h-screen w-full grid-rows-[auto_1fr_auto] md:grid-cols-[auto_1fr]">
      <Header user={user} />
      <SidebarNav role={user.role} />
      <main className="overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
      </main>
      <Footer onCookiePreferencesClick={() => setIsCookiePrefsOpen(true)} />
    </div>
    {isCookiePrefsOpen && <CookiePreferencesDialog open={isCookiePrefsOpen} onOpenChange={setIsCookiePrefsOpen} />}
    {isVerificationModalOpen && <WhatsAppVerificationModal
        isOpen={isVerificationModalOpen}
        user={userForVerification}
        onSuccess={() => {
            setIsVerificationModalOpen(false);
            setUserForVerification(null);
            if (user) {
                setUser({ ...user, whatsappVerified: true });
            }
        }}
    />}
    </>
  );
}
