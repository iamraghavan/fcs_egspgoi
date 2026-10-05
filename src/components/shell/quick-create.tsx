"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  Award,
  FilePlus2,
  FileSpreadsheet,
  ListPlus,
  MessageSquareWarning,
  PieChart,
  Scale,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { withUid, type Role } from "./nav-config";

const D = "/u/portal/dashboard";
type Action = { label: string; hint: string; path: string; icon: LucideIcon };

/** Create-from-anywhere actions per role (each opens the existing form page). */
export const QUICK_CREATE: Record<Role, Action[]> = {
  faculty: [
    {
      label: "Submit Good Work",
      hint: "Claim credits for an achievement",
      path: `${D}/good-works/submit`,
      icon: Award,
    },
    { label: "Appeal a remark", hint: "Open your remarks to start an appeal", path: `${D}/remarks`, icon: Scale },
  ],
  oa: [
    {
      label: "Issue Remark",
      hint: "Record a remark for a faculty member",
      path: `${D}/oa`,
      icon: MessageSquareWarning,
    },
    {
      label: "Issue positive credit",
      hint: "Award credits to a faculty member",
      path: `${D}/oa/positive`,
      icon: FilePlus2,
    },
  ],
  admin: [
    { label: "Add faculty", hint: "Create a faculty account", path: `${D}/admin/users`, icon: UserPlus },
    {
      label: "Bulk import",
      hint: "Add many accounts from a spreadsheet",
      path: `${D}/admin/users/bulk-add`,
      icon: FileSpreadsheet,
    },
    {
      label: "New Credit Template",
      hint: "Define a credit and its points",
      path: `${D}/admin/credits`,
      icon: ListPlus,
    },
    { label: "Generate report", hint: "Build and export a report", path: `${D}/admin/reports`, icon: PieChart },
  ],
};

export function QuickCreateMenu({
  role,
  uid,
  trigger,
  side = "right",
}: {
  role: Role;
  uid: string;
  trigger: ReactNode;
  side?: "right" | "bottom" | "top";
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent side={side} align="start" className="w-72">
        <DropdownMenuLabel className="text-caption font-medium text-muted-foreground">Create</DropdownMenuLabel>
        {QUICK_CREATE[role].map(({ label, hint, path, icon: Icon }) => (
          <DropdownMenuItem key={label} asChild className="items-start gap-3 py-2">
            <Link href={withUid(path, uid)}>
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-text">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{label}</span>
                <span className="text-caption text-muted-foreground">{hint}</span>
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
