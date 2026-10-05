"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { activePanelItem, activeRailItem } from "./nav-config";
import { AcademicYearProvider } from "./academic-year";
import { PrimaryRail } from "./primary-rail";
import { SecondaryPanel } from "./secondary-panel";
import { TopBar } from "./top-bar";
import { MobileNav } from "./mobile-nav";
import type { ShellUser } from "./account-menu";

function useMinWidth(px: number) {
  const [matches, setMatches] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${px}px)`);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [px]);
  return matches;
}

/**
 * Three-level layout: primary rail (global) → secondary panel (module pages) → workspace.
 * Panel collapse is remembered on wide screens and starts collapsed below 1280 px.
 */
export function AppShell({
  user,
  children,
  onCookiePreferences,
}: {
  user: ShellUser;
  children: ReactNode;
  onCookiePreferences: () => void;
}) {
  const pathname = usePathname();
  const activeModule = activeRailItem(user.role, pathname);
  const page = activePanelItem(activeModule, pathname);

  const wide = useMinWidth(1280);
  const [collapsedPref, setCollapsedPref] = usePersistedState("shell.panelCollapsed", false);
  const [narrowOpen, setNarrowOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = wide ? collapsedPref : !narrowOpen;
  const setCollapsed = (c: boolean) => (wide ? setCollapsedPref(c) : setNarrowOpen(!c));

  // Close the temporary (narrow-screen) panel and the phone sheet after navigating.
  useEffect(() => {
    setNarrowOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  const hasPanel = !!activeModule && activeModule.groups.length > 0;

  return (
    <TooltipProvider delayDuration={300}>
      <AcademicYearProvider>
        <div className="flex h-dvh w-full overflow-hidden bg-background">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:shadow-md"
          >
            Skip to content
          </a>
          <PrimaryRail user={user} active={activeModule} onCookiePreferences={onCookiePreferences} />
          {hasPanel && !collapsed && (
            <SecondaryPanel
              module={activeModule!}
              activeItem={page}
              uid={user.id}
              onCollapse={() => setCollapsed(true)}
            />
          )}
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar
              user={user}
              module={activeModule}
              page={page}
              panelCollapsed={collapsed}
              onShowPanel={() => setCollapsed(false)}
              onOpenMobileNav={() => setMobileOpen(true)}
              onCookiePreferences={onCookiePreferences}
            />
            <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto focus:outline-none">
              <div className="mx-auto w-full max-w-[1600px] p-4 pb-16 md:p-6 lg:p-8">{children}</div>
            </main>
          </div>
          <MobileNav
            open={mobileOpen}
            onOpenChange={setMobileOpen}
            user={user}
            active={activeModule}
            activeItem={page}
          />
        </div>
      </AcademicYearProvider>
    </TooltipProvider>
  );
}
