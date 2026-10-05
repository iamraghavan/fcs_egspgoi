import React, { Suspense, type ReactNode } from "react";
import DashboardClientWrapper from "@/components/dashboard-client-wrapper";

// The wrapper renders its own shell-shaped skeleton while the profile loads;
// this fallback only covers the moment before the search params are available.
const Fallback = () => <div className="h-dvh w-full bg-background" aria-busy="true" />;

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<Fallback />}>
      <DashboardClientWrapper>{children}</DashboardClientWrapper>
    </Suspense>
  );
}
