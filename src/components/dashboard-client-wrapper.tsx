
"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Header } from "@/components/header";
import { SidebarNav } from "@/components/sidebar-nav";
import React, { useState, useEffect, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAlert } from "@/context/alert-context";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'faculty' | 'admin' | 'oa';
  avatar: string;
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
    <div className="flex min-h-screen">
        <div className="hidden md:block w-64 h-full bg-white dark:bg-card border-r">
            <div className="p-4 space-y-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-96" />
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
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    if (!token) {
      router.push("/u/portal/auth?faculty_login");
      return;
    }

    const fetchUser = async () => {
      // Special handling for hardcoded OA user to prevent API call
      if (role === 'oa' && token === 'mock_oa_token') {
          const oaUser: User = {
              id: 'oa_user_01',
              name: 'Office Assistant',
              email: process.env.NEXT_PUBLIC_OA_USERNAME || 'oa@egspec.org',
              role: 'oa',
              avatar: `https://ui-avatars.com/api/?name=OA&background=random`,
          };
          setUser(oaUser);
          setLoading(false);
          const uid = searchParams.get('uid');
          if (uid !== oaUser.id || !pathname.startsWith('/u/portal/dashboard/oa')) {
              router.replace(`/u/portal/dashboard/oa?uid=${oaUser.id}`);
          }
          return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
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

        const userData = responseData.data;
        
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
          id: userData._id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          avatar: getAvatarUrl(userData)
        };
        
        setUser(userPayload);
        
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
        const expectedUrl = `${expectedPathPrefix}?uid=${userPayload.id}`;

        // Enforce strict routing for roles
        if (userPayload.id !== uid) {
          router.replace(expectedUrl);
        } else if (userPayload.role === 'oa' && !pathname.startsWith('/u/portal/dashboard/oa')) {
            router.replace(`/u/portal/dashboard/oa?uid=${userPayload.id}`);
        } else if (userPayload.role === 'faculty' && (pathname.includes('/admin') || pathname.includes('/oa'))) {
           router.replace(`/u/portal/dashboard?uid=${userPayload.id}`);
        } else if (userPayload.role === 'admin' && !pathname.startsWith('/u/portal/dashboard/admin')) {
           router.replace(`/u/portal/dashboard/admin?uid=${userPayload.id}`);
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

    fetchUser();
  }, [router, pathname, searchParams, showAlert]);

  if (loading || !user) {
    return <LoadingSkeleton />;
  }
  
  return (
    <>
      <SidebarNav role={user.role} />
      <SidebarInset className="flex flex-col h-screen">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
