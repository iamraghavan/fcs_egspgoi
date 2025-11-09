
"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Award, BarChart3, BotMessageSquare, GanttChart, LayoutDashboard, ShieldCheck, Users, Files, LogOut, Settings, Bell, History, MessageSquareWarning, FolderKanban, ShieldAlert, ListPlus, UploadCloud, PanelLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Logo, LogoAdmin } from "@/components/icons";

type SidebarNavProps = {
  role: "faculty" | "admin" | "oa";
};

const getFacultyNav = (uid: string) => [
  { name: "Dashboard", href: `/u/portal/dashboard?uid=${uid}`, icon: LayoutDashboard },
  { name: "Good Works", href: `/u/portal/dashboard/good-works?uid=${uid}`, icon: Award },
  { name: "Submit Work", href: `/u/portal/dashboard/good-works/submit?uid=${uid}`, icon: Files },
  { name: "Negative Remarks", href: `/u/portal/dashboard/remarks?uid=${uid}`, icon: MessageSquareWarning },
  { name: "My Appeals", href: `/u/portal/dashboard/appeals?uid=${uid}`, icon: ShieldCheck },
  { name: "Notifications", href: `/u/portal/dashboard/notifications?uid=${uid}`, icon: Bell },
];

const getAdminNav = (uid: string) => [
  { name: "Dashboard", href: `/u/portal/dashboard/admin?uid=${uid}`, icon: LayoutDashboard },
  { name: "Faculty Accounts", href: `/u/portal/dashboard/admin/users?uid=${uid}`, icon: Users },
  { name: "Bulk Import", href: `/u/portal/dashboard/admin/users/bulk-add?uid=${uid}`, icon: UploadCloud },
  { name: "Credit Titles", href: `/u/portal/dashboard/admin/credits?uid=${uid}`, icon: ListPlus },
  { name: "Submissions", href: `/u/portal/dashboard/admin/review?uid=${uid}`, icon: FolderKanban },
  { name: "Negative Remarks", href: `/u/portal/dashboard/admin/remarks?uid=${uid}`, icon: MessageSquareWarning },
  { name: "Appeals", href: `/u/portal/dashboard/admin/appeals?uid=${uid}`, icon: ShieldAlert },
  { name: "Reports", href: `/u/portal/dashboard/admin/reports?uid=${uid}`, icon: BarChart3 },
];

const getOANav = (uid: string) => [
  { name: "Issue Remark", href: `/u/portal/dashboard/oa?uid=${uid}`, icon: MessageSquareWarning },
];

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const uid = searchParams.get('uid') || '';

  const getNavItems = () => {
      switch (role) {
          case 'admin': return getAdminNav(uid);
          case 'oa': return getOANav(uid);
          default: return getFacultyNav(uid);
      }
  }

  const navItems = getNavItems();
  
  const getBaseUrl = () => {
      switch (role) {
          case 'admin': return `/u/portal/dashboard/admin?uid=${uid}`;
          case 'oa': return `/u/portal/dashboard/oa?uid=${uid}`;
          default: return `/u/portal/dashboard?uid=${uid}`;
      }
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('sessionExpiresAt');
    const loginUrl = role === 'admin' ? '/u/portal/auth?admin' : '/u/portal/auth?faculty_login';
    router.push(loginUrl);
  };
  
  const getSettingsHref = () => {
    switch(role) {
        case 'admin':
            return `/u/portal/dashboard/admin/settings?uid=${uid}`;
        case 'faculty':
            return `/u/portal/dashboard/settings?uid=${uid}`;
        default:
            return '#'; 
    }
  }
  const settingsHref = getSettingsHref();

  return (
    <Sidebar>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
                <SidebarMenuItem key={item.name}>
                <Link href={item.href}>
                    <SidebarMenuButton
                    isActive={pathname === item.href.split('?')[0]}
                    tooltip={item.name}
                    className="justify-start"
                    >
                    {Icon && <Icon className="h-5 w-5" />}
                    <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
                    </SidebarMenuButton>
                </Link>
                </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarSeparator />
         <SidebarMenu>
            {role !== 'oa' && (
                <SidebarMenuItem>
                    <Link href={settingsHref}>
                        <SidebarMenuButton tooltip="Settings" className="justify-start" isActive={pathname.includes('/settings')}>
                            <Settings className="h-5 w-5" />
                            <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            )}
         </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
