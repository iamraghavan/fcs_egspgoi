"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { 
  Award, 
  LayoutDashboard, 
  ShieldCheck, 
  Users, 
  Files, 
  Settings, 
  Bell, 
  History, 
  MessageSquareWarning, 
  FolderKanban, 
  ShieldAlert, 
  ListPlus, 
  UploadCloud,
  BarChart3
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";

type SidebarNavProps = {
  role: "faculty" | "admin" | "oa";
};

const navMap = {
  faculty: (uid: string) => [
    { name: "Dashboard", href: `/u/portal/dashboard?uid=${uid}`, icon: LayoutDashboard },
    { name: "Good Works", href: `/u/portal/dashboard/good-works?uid=${uid}`, icon: Award },
    { name: "Submit Work", href: `/u/portal/dashboard/good-works/submit?uid=${uid}`, icon: Files },
    { name: "Negative Remarks", href: `/u/portal/dashboard/remarks?uid=${uid}`, icon: MessageSquareWarning },
    { name: "My Appeals", href: `/u/portal/dashboard/appeals?uid=${uid}`, icon: ShieldCheck },
    { name: "Notifications", href: `/u/portal/dashboard/notifications?uid=${uid}`, icon: Bell },
  ],
  admin: (uid: string) => [
    { name: "Admin Dashboard", href: `/u/portal/dashboard/admin?uid=${uid}`, icon: LayoutDashboard },
    { name: "Faculty Accounts", href: `/u/portal/dashboard/admin/users?uid=${uid}`, icon: Users },
    { name: "Bulk Import", href: `/u/portal/dashboard/admin/users/bulk-add?uid=${uid}`, icon: UploadCloud },
    { name: "Credit Templates", href: `/u/portal/dashboard/admin/credits?uid=${uid}`, icon: ListPlus },
    { name: "Review Queue", href: `/u/portal/dashboard/admin/review?uid=${uid}`, icon: FolderKanban },
    { name: "Manage Remarks", href: `/u/portal/dashboard/admin/remarks?uid=${uid}`, icon: MessageSquareWarning },
    { name: "Positive Credits", href: `/u/portal/dashboard/admin/positive-remarks?uid=${uid}`, icon: Award },
    { name: "Review Appeals", href: `/u/portal/dashboard/admin/appeals?uid=${uid}`, icon: ShieldAlert },
    { name: "System Reports", href: `/u/portal/dashboard/admin/reports?uid=${uid}`, icon: BarChart3 },
  ],
  oa: (uid: string) => [
    { name: "Issue Positive", href: `/u/portal/dashboard/oa/positive?uid=${uid}`, icon: Award },
    { name: "Issue Remark", href: `/u/portal/dashboard/oa?uid=${uid}`, icon: MessageSquareWarning },
    { name: "Transaction History", href: `/u/portal/dashboard/oa/history?uid=${uid}`, icon: History },
  ]
};

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const uid = searchParams.get('uid') || '';
  const items = navMap[role](uid);

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar h-full">
      <SidebarHeader className="h-16 flex items-center px-6 border-b border-sidebar-border md:hidden">
        <span className="text-primary font-bold text-lg">CreditWise</span>
      </SidebarHeader>
      <SidebarContent className="p-2 pt-4">
        <SidebarMenu className="gap-1">
          {items.map((item) => {
            const isActive = pathname === item.href.split('?')[0];
            return (
                <SidebarMenuItem key={item.name}>
                    <Link href={item.href} className="w-full">
                        <SidebarMenuButton
                            isActive={isActive}
                            tooltip={item.name}
                            className={cn(
                                "h-10 px-4 flex items-center gap-3 transition-all rounded-none relative",
                                isActive ? "bg-primary/10 text-primary font-semibold" : "text-cds-text-02 hover:bg-cds-ui-01"
                            )}
                        >
                            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                            <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-cds-text-05")} />
                            <span className="text-[13px] tracking-wide">{item.name}</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t border-sidebar-border">
         <SidebarMenu>
            {role !== 'oa' && (
                <SidebarMenuItem>
                    <Link href={role === 'admin' ? `/u/portal/dashboard/admin/settings?uid=${uid}` : `/u/portal/dashboard/settings?uid=${uid}`} className="w-full">
                        <SidebarMenuButton 
                            tooltip="Account Settings" 
                            className={cn(
                                "h-10 px-4 flex items-center gap-3 transition-all rounded-none",
                                pathname.includes('/settings') ? "bg-primary/10 text-primary font-semibold" : "text-cds-text-02 hover:bg-cds-ui-01"
                            )}
                        >
                            <Settings className="h-5 w-5" />
                            <span className="text-[13px] tracking-wide">Settings</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            )}
         </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}