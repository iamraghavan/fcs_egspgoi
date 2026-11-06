"use client";

import Link from "next/link";
import { PanelLeftClose } from "lucide-react";
import { cn } from "@/lib/utils";
import { withUid, type PanelItem, type RailItem } from "./nav-config";
import { AcademicYearSwitcher } from "./academic-year";

/** Contextual navigation (level 2): pages of the selected module, grouped. */
export function SecondaryPanel({
  module,
  activeItem,
  uid,
  onCollapse,
}: {
  module: RailItem;
  activeItem?: PanelItem;
  uid: string;
  onCollapse: () => void;
}) {
  return (
    <aside
      aria-label={`${module.label} pages`}
      className="hidden h-full w-60 shrink-0 flex-col border-r border-panel-border bg-panel-bg md:flex"
    >
      <div className="flex h-14 items-center justify-between gap-2 border-b border-panel-border px-4">
        <p className="truncate text-title-sm font-semibold text-foreground">{module.label}</p>
        <button
          type="button"
          onClick={onCollapse}
          aria-label="Hide navigation panel"
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-panel-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {!["setup", "account"].includes(module.id) && (
        <div className="px-3 pt-3">
          <p className="mb-1 px-1 text-caption font-medium text-muted-foreground">Academic year</p>
          <AcademicYearSwitcher className="h-9 w-full" />
        </div>
      )}

      <nav aria-label={module.label} className="flex-1 overflow-y-auto px-3 py-4">
        {module.groups.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            {/* Group labels are the one place where small caps are allowed (brief). */}
            <p className="mb-1 px-3 text-caption font-semibold uppercase tracking-wide text-muted-foreground">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = activeItem?.path === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      href={withUid(item.path, uid)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex h-9 items-center rounded-md px-3 text-sm transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive
                          ? "bg-panel-active-bg font-semibold text-panel-active-text"
                          : "text-foreground-2 hover:bg-panel-hover hover:text-foreground",
                      )}
                    >
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
