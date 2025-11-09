import { SidebarProvider } from "@/components/ui/sidebar";
import React, { Suspense, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardClientWrapper from "@/components/dashboard-client-wrapper";

const LoadingSkeleton = () => (
    <div className="flex h-screen flex-col">
        <div className="flex h-16 items-center border-b px-4">
             <Skeleton className="h-8 w-32" />
             <div className="ml-auto flex items-center space-x-4">
                <Skeleton className="h-8 w-8 rounded-full" />
             </div>
        </div>
        <div className="flex flex-1">
            <div className="hidden md:block w-64 border-r p-4">
                <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            </div>
            <div className="flex-1 p-8 space-y-4">
                <Skeleton className="h-16" />
                <Skeleton className="h-96" />
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
