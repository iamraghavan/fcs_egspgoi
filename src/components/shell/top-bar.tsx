"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, ChevronRight, LifeBuoy, Menu, PanelLeftOpen } from "lucide-react";
import { API_V1 } from "@/lib/api-url";
import { BRANDING } from "@/config/branding";
import { HELP_PATH, withUid, type PanelItem, type RailItem } from "./nav-config";
import { CommandPalette } from "./command-palette";
import { AccountMenu, UserAvatar, type ShellUser } from "./account-menu";

const iconButton =
  "relative flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function useUnreadCount(enabled: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const check = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${API_V1}/notifications?limit=50`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setCount(Number((await res.json()).unreadCount) || 0);
      } catch {
        /* the bell is non-critical */
      }
    };
    void check();
    const interval = window.setInterval(check, 60_000);
    window.addEventListener("notifications-updated", check);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("notifications-updated", check);
    };
  }, [enabled]);
  return count;
}

/** 56 px workspace bar: where am I (breadcrumb) + search, notifications, help, institution. */
export function TopBar({
  user,
  module,
  page,
  panelCollapsed,
  onShowPanel,
  onOpenMobileNav,
  onCookiePreferences,
}: {
  user: ShellUser;
  module?: RailItem;
  page?: PanelItem;
  panelCollapsed: boolean;
  onShowPanel: () => void;
  onOpenMobileNav: () => void;
  onCookiePreferences: () => void;
}) {
  const showBell = user.role !== "admin";
  const unread = useUnreadCount(showBell);
  const crumbs = [module?.label, page && page.label !== module?.label ? page.label : undefined].filter(
    Boolean,
  ) as string[];

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-3 md:px-4">
      <button
        type="button"
        className={`${iconButton} md:hidden`}
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>
      {panelCollapsed && module && module.groups.length > 0 && (
        <button
          type="button"
          className={`${iconButton} hidden md:flex`}
          onClick={onShowPanel}
          aria-label="Show navigation panel"
        >
          <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
        </button>
      )}

      <nav aria-label="Breadcrumb" className="min-w-0 shrink">
        <ol className="flex min-w-0 items-center gap-1 text-sm">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <li key={c} className="flex min-w-0 items-center gap-1">
                {i > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                {last ? (
                  <span aria-current="page" className="truncate font-semibold text-foreground">
                    {c}
                  </span>
                ) : (
                  <Link
                    href={withUid(module!.path, user.id)}
                    className="truncate text-muted-foreground hover:text-foreground"
                  >
                    {c}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="flex flex-1 justify-center px-2">
        <CommandPalette role={user.role} uid={user.id} />
      </div>

      <div className="flex items-center gap-1">
        {showBell && (
          <Link
            href={withUid("/u/portal/dashboard/notifications", user.id)}
            className={iconButton}
            aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {unread > 0 && (
              <span
                className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-caption font-semibold leading-none text-destructive-foreground"
                aria-hidden="true"
                data-numeric
              >
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
        )}
        <Link href={HELP_PATH} className={`${iconButton} hidden sm:flex`} aria-label="Help">
          <LifeBuoy className="h-5 w-5" aria-hidden="true" />
        </Link>
        <span
          className="ml-2 hidden max-w-56 truncate border-l border-border pl-3 text-caption font-medium text-muted-foreground xl:block"
          title={BRANDING.institution}
        >
          {BRANDING.institution}
        </span>
        {/* On phones the rail is hidden, so the account menu lives here. */}
        <div className="md:hidden">
          <AccountMenu
            user={user}
            side="bottom"
            onCookiePreferences={onCookiePreferences}
            trigger={
              <button
                type="button"
                aria-label={`Account menu for ${user.name}`}
                className="ml-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <UserAvatar user={user} className="h-8 w-8" />
              </button>
            }
          />
        </div>
      </div>
    </header>
  );
}
