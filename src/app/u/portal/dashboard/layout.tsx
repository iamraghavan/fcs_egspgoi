import { SidebarProvider } from "@/components/ui/sidebar";
import React, { Suspense, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardClientWrapper from "@/components/dashboard-client-wrapper";

const LoadingSkeleton = () => (
    <div className="grid min-h-screen w-full grid-rows-[auto_1fr_auto] md:grid-cols-[auto_1fr]">
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
        <footer className="shrink-0 bg-sidebar text-sidebar-foreground/60 border-t border-sidebar-border px-6 py-4 col-span-2">
            <div className="flex items-center justify-between text-xs">
                <Skeleton className="h-4 w-1/3 bg-sidebar-accent" />
                 <Skeleton className="h-4 w-1/4 bg-sidebar-accent" />
            </div>
        </footer>
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
