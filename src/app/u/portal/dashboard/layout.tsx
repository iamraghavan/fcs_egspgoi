import { SidebarProvider } from "@/components/ui/sidebar";
import React, { Suspense, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardClientWrapper from "@/components/dashboard-client-wrapper";

const LoadingSkeleton = () => (
    <div className="flex h-screen flex-col bg-background">
        {/* Header Skeleton */}
        <div className="flex h-16 shrink-0 items-center border-b bg-sidebar px-4">
             <Skeleton className="h-8 w-32 bg-sidebar-accent" />
             <div className="ml-auto flex items-center space-x-4">
                <Skeleton className="h-8 w-8 rounded-full bg-sidebar-accent" />
             </div>
        </div>
        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Skeleton */}
            <div className="hidden md:flex flex-col w-64 border-r bg-sidebar p-2">
                <div className="p-2 space-y-2">
                    <Skeleton className="h-9 w-full bg-sidebar-accent" />
                    <Skeleton className="h-9 w-full bg-sidebar-accent" />
                    <Skeleton className="h-9 w-full bg-sidebar-accent" />
                    <Skeleton className="h-9 w-full bg-sidebar-accent" />
                </div>
            </div>
            {/* Main Content Skeleton */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-8 space-y-4">
                    <Skeleton className="h-16 w-1/2" />
                    <Skeleton className="h-96 w-full" />
                </div>
                 {/* Footer Skeleton */}
                <div className="sticky bottom-0 w-full bg-sidebar border-t border-sidebar-border px-6 py-4">
                    <Skeleton className="h-4 w-1/3" />
                </div>
            </div>
        </div>
    </div>
);


export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
        <Suspense fallback={<LoadingSkeleton />}>
            <DashboardClientWrapper>
                {children}
            </DashboardClientWrapper>
        </Suspense>
    </SidebarProvider>
  );
}
