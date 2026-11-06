"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NAV, withUid, type RailItem, type Role } from "./nav-config";
import { QuickCreateMenu } from "./quick-create";
import { AppearanceIcon, AppearanceMenu } from "./appearance-menu";
import type { ShellUser } from "./account-menu";

const railButton =
  "flex h-11 w-11 items-center justify-center rounded-lg text-rail-icon transition-colors duration-fast hover:bg-rail-hover hover:text-rail-icon-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rail-icon-active/70";

/**
 * Global navigation (level 1). Icon + 12 px label, ≤ 7 items per role (Hick),
 * 44 px targets (Fitts). The active module gets a filled pill in the accent colour.
 */
export function PrimaryRail({ user, active }: { user: ShellUser; active?: RailItem; onCookiePreferences: () => void }) {
  const items = NAV[user.role as Role];
  return (
    <nav
      aria-label="Main"
      className="hidden h-full w-[88px] shrink-0 flex-col items-center bg-rail-bg py-3 text-rail-icon md:flex"
    >
      <Link
        href={withUid(items[0].path, user.id)}
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-rail-active text-sm font-bold text-rail-icon-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rail-icon-active/70"
        aria-label="CreditWise home"
      >
        CW
      </Link>

      <ul className="flex w-full flex-1 flex-col items-center gap-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = active?.id === item.id;
          const Icon = item.icon;
          return (
            <li key={item.id} className="w-full">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={withUid(item.path, user.id)}
                    aria-current={isActive ? "page" : undefined}
                    className="group flex w-full flex-col items-center gap-1 rounded-lg px-0.5 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rail-icon-active/70"
                  >
                    <span
                      className={cn(
                        "flex h-8 w-11 items-center justify-center rounded-full transition-colors duration-fast",
                        isActive
                          ? "bg-rail-active text-rail-icon-active"
                          : "text-rail-icon group-hover:bg-rail-hover group-hover:text-rail-icon-active",
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span
                      className={cn(
                        "w-full text-center text-caption leading-tight",
                        isActive
                          ? "font-semibold text-rail-icon-active"
                          : "text-rail-icon group-hover:text-rail-icon-active",
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            </li>
          );
        })}
      </ul>

      <div className="mt-2 flex flex-col items-center gap-2 border-t border-rail-hover pt-3">
        <QuickCreateMenu
          role={user.role}
          uid={user.id}
          trigger={
            <button
              type="button"
              aria-label="Create new"
              className={cn(railButton, "bg-rail-active text-rail-icon-active hover:bg-rail-active/90")}
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
            </button>
          }
        />
        <AppearanceMenu
          trigger={
            <button type="button" aria-label="Appearance" className={railButton}>
              <AppearanceIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          }
        />
      </div>
    </nav>
  );
}
