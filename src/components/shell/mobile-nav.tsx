"use client";

import Link from "next/link";
import { Palette, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NAV, withUid, type PanelItem, type RailItem } from "./nav-config";
import { AcademicYearSwitcher } from "./academic-year";
import { QuickCreateMenu } from "./quick-create";
import { AppearanceMenu } from "./appearance-menu";
import type { ShellUser } from "./account-menu";

/** Phones (< 768 px): rail + panel become one bottom sheet opened from the top bar. */
export function MobileNav({
  open,
  onOpenChange,
  user,
  active,
  activeItem,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  user: ShellUser;
  active?: RailItem;
  activeItem?: PanelItem;
}) {
  const close = () => onOpenChange(false);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl p-0">
        <SheetHeader className="border-b border-border px-4 py-3 text-left">
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription className="sr-only">Pages, create actions and appearance</SheetDescription>
        </SheetHeader>
        <div className="flex gap-2 px-4 pt-3">
          <QuickCreateMenu
            role={user.role}
            uid={user.id}
            side="top"
            trigger={
              <button
                type="button"
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground"
              >
                <Plus className="h-4 w-4" aria-hidden="true" /> Create
              </button>
            }
          />
          <AppearanceMenu
            side="top"
            trigger={
              <button
                type="button"
                aria-label="Appearance"
                className="flex h-11 w-11 items-center justify-center rounded-md border border-border text-muted-foreground"
              >
                <Palette className="h-5 w-5" aria-hidden="true" />
              </button>
            }
          />
        </div>
        {!["setup", "account"].includes(active?.id || "") && (
          <div className="px-4 pt-3">
            <AcademicYearSwitcher className="h-11 w-full" />
          </div>
        )}
        <nav aria-label="Main" className="px-2 py-3">
          <ul className="space-y-1">
            {NAV[user.role].map((m) => {
              const Icon = m.icon;
              const isActive = active?.id === m.id;
              const links = m.groups.length ? m.groups.flatMap((g) => g.items) : [{ label: m.label, path: m.path }];
              return (
                <li key={m.id}>
                  <p
                    className={cn(
                      "flex items-center gap-2 px-3 pb-1 pt-2 text-caption font-semibold uppercase tracking-wide",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" /> {m.label}
                  </p>
                  <ul>
                    {links.map((l) => {
                      const current = activeItem?.path === l.path;
                      return (
                        <li key={l.path}>
                          <Link
                            href={withUid(l.path, user.id)}
                            onClick={close}
                            aria-current={current ? "page" : undefined}
                            className={cn(
                              "flex min-h-11 items-center rounded-md px-3 text-sm",
                              current
                                ? "bg-panel-active-bg font-semibold text-panel-active-text"
                                : "text-foreground hover:bg-panel-hover",
                            )}
                          >
                            {l.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
