"use client";

import Link from "next/link";

import { ChevronDown, ChevronRight, LifeBuoy, Menu, PanelLeftOpen } from "lucide-react";
import { NotificationMenu } from "./notification-menu";
import { BRANDING } from "@/config/branding";
import { useApplicationSettings } from "@/lib/application-settings";
import { HELP_PATH, ROLE_LABEL, withUid, type PanelItem, type RailItem } from "./nav-config";
import { CommandPalette } from "./command-palette";
import { AccountMenu, UserAvatar, type ShellUser } from "./account-menu";

const iconButton =
  "relative flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

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
  const { settings } = useApplicationSettings();
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

      <div className="flex shrink-0 items-center gap-1">
        <NotificationMenu uid={user.id} />
        <Link
          href={settings?.supportEmail ? `mailto:${settings.supportEmail}` : HELP_PATH}
          className={`${iconButton} hidden sm:flex`}
          aria-label="Help"
        >
          <LifeBuoy className="h-5 w-5" aria-hidden="true" />
        </Link>
        <span
          className="ml-2 hidden max-w-56 truncate border-l border-border pl-3 text-caption font-medium text-muted-foreground 2xl:block"
          title={settings?.organizationName || BRANDING.institution}
        >
          {settings?.organizationName || BRANDING.institution}
        </span>

        <div className="ml-2 border-l pl-3">
          <AccountMenu
            user={user}
            side="bottom"
            onCookiePreferences={onCookiePreferences}
            trigger={
              <button
                type="button"
                aria-label={`Account menu for ${user.name}`}
                className="flex h-10 items-center gap-2 rounded-lg px-1.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <UserAvatar user={user} className="h-8 w-8" />
                <span className="hidden min-w-0 text-left sm:block">
                  <span className="block max-w-32 truncate text-sm font-medium">{user.name}</span>
                  <span className="block text-[11px] text-muted-foreground">{ROLE_LABEL[user.role]}</span>
                </span>
                <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" aria-hidden="true" />
              </button>
            }
          />
        </div>
      </div>
    </header>
  );
}
