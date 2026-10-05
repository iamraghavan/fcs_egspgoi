"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Cookie, FileText, LifeBuoy, LogOut, Settings, ShieldCheck, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { API_V1 } from "@/lib/api-url";
import { HELP_PATH, ROLE_LABEL, withUid, type Role } from "./nav-config";

export type ShellUser = { id: string; name: string; email: string; avatar: string; role: Role };

/** Device preferences that survive sign-out (not personal data). */
const KEEP_ON_SIGN_OUT = ["theme", "accent", "shell.panelCollapsed"];

export async function signOut() {
  // End the session on the server too, so a copied token stops working (SEC-10).
  const token = localStorage.getItem("token");
  if (token) {
    await fetch(`${API_V1}/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(
      () => {
        /* still sign out locally */
      },
    );
  }
  const kept = KEEP_ON_SIGN_OUT.map((k) => [k, localStorage.getItem(k)] as const);
  localStorage.clear();
  for (const [k, v] of kept) if (v !== null) localStorage.setItem(k, v);
  window.location.href = "/u/portal/auth?faculty_login";
}

export function UserAvatar({ user, className = "h-9 w-9" }: { user: ShellUser; className?: string }) {
  return (
    <Avatar className={className}>
      <AvatarImage src={user.avatar} alt="" />
      <AvatarFallback className="bg-primary-100 text-caption font-semibold text-primary-text">
        {user.name.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

export function AccountMenu({
  user,
  trigger,
  side = "right",
  onCookiePreferences,
}: {
  user: ShellUser;
  trigger: ReactNode;
  side?: "right" | "bottom" | "top";
  onCookiePreferences: () => void;
}) {
  const profileHref =
    user.role === "faculty"
      ? withUid("/u/portal/dashboard/profile", user.id)
      : user.role === "admin"
        ? withUid("/u/portal/dashboard/admin/settings", user.id)
        : null;
  const settingsHref =
    user.role === "faculty"
      ? withUid("/u/portal/dashboard/settings", user.id)
      : user.role === "admin"
        ? withUid("/u/portal/dashboard/admin/settings", user.id)
        : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent side={side} align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3">
            <UserAvatar user={user} className="h-10 w-10" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
              <p className="truncate text-caption text-muted-foreground">{user.email}</p>
              <p className="text-caption text-muted-foreground">{ROLE_LABEL[user.role]}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {profileHref && (
            <DropdownMenuItem asChild>
              <Link href={profileHref}>
                <UserRound aria-hidden="true" /> Profile
              </Link>
            </DropdownMenuItem>
          )}
          {settingsHref && (
            <DropdownMenuItem asChild>
              <Link href={settingsHref}>
                <Settings aria-hidden="true" /> Settings
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href={HELP_PATH}>
              <LifeBuoy aria-hidden="true" /> Help &amp; feedback
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/u/portal/privacy-policy">
              <ShieldCheck aria-hidden="true" /> Privacy
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/u/portal/terms">
              <FileText aria-hidden="true" /> Terms
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onCookiePreferences}>
            <Cookie aria-hidden="true" /> Cookie preferences
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()} className="text-danger-text focus:text-danger-text">
          <LogOut aria-hidden="true" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
