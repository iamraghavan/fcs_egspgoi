
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
  role: 'faculty' | 'admin';
  avatar: string;
}

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
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/u/portal/auth?faculty_login");
      return;
    }

    const fetchUser = async () => {
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
        const expectedPathPrefix = userPayload.role === 'admin' ? '/u/portal/dashboard/admin' : '/u/portal/dashboard';
        const expectedUrl = userPayload.role === 'admin' ? `/u/portal/dashboard/admin?uid=${userPayload.id}`: `/u/portal/dashboard?uid=${userPayload.id}`;

        if (userPayload.id !== uid) {
          router.replace(expectedUrl);
        } else if (userPayload.role === 'admin' && !pathname.startsWith(expectedPathPrefix)) {
          router.replace(expectedUrl);
        } else if (userPayload.role === 'faculty' && pathname.includes('/admin')) {
           router.replace(`/u/portal/dashboard?uid=${userPayload.id}`);
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
