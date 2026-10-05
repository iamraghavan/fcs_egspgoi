import {
  Award,
  Bell,
  ClipboardCheck,
  Coins,
  FilePlus2,
  History,
  House,
  LifeBuoy,
  MessageSquareWarning,
  PieChart,
  Settings2,
  Users,
  type LucideIcon,
} from "lucide-react";

export type Role = "faculty" | "admin" | "oa";

export type PanelItem = { label: string; path: string };
export type PanelGroup = { label: string; items: PanelItem[] };
export type RailItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Where the rail icon goes (first page of the module). */
  path: string;
  /** Paths (prefixes) that belong to this module, for the active state. */
  match: string[];
  groups: PanelGroup[];
  /** Pages outside the dashboard shell (Help) are opened as normal links. */
  external?: boolean;
};

const D = "/u/portal/dashboard";
export const HELP_PATH = "/u/portal/help";

const help: RailItem = {
  id: "help",
  label: "Help",
  icon: LifeBuoy,
  path: HELP_PATH,
  match: [HELP_PATH],
  groups: [],
  external: true,
};

/**
 * Primary rail (≤ 7 items per role) and the secondary panel under each item.
 * Every page that exists today is reachable in ≤ 2 clicks. Labels keep the agreed terms.
 */
export const NAV: Record<Role, RailItem[]> = {
  faculty: [
    {
      id: "home",
      label: "Home",
      icon: House,
      path: D,
      match: [D, `${D}/profile`, `${D}/settings`],
      groups: [
        { label: "Overview", items: [{ label: "Dashboard", path: D }] },
        {
          label: "Account",
          items: [
            { label: "Professional profile", path: `${D}/profile` },
            { label: "Settings", path: `${D}/settings` },
          ],
        },
      ],
    },
    {
      id: "good-works",
      label: "Good Works",
      icon: Award,
      path: `${D}/good-works`,
      match: [`${D}/good-works`],
      groups: [
        {
          label: "Good Works",
          items: [
            { label: "All Good Works", path: `${D}/good-works` },
            { label: "Submit Good Work", path: `${D}/good-works/submit` },
          ],
        },
      ],
    },
    {
      id: "remarks",
      label: "Remarks & Appeals",
      icon: MessageSquareWarning,
      path: `${D}/remarks`,
      match: [`${D}/remarks`, `${D}/appeals`],
      groups: [
        { label: "Remarks", items: [{ label: "My Remarks", path: `${D}/remarks` }] },
        { label: "Appeals", items: [{ label: "My Appeals", path: `${D}/appeals` }] },
      ],
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      path: `${D}/notifications`,
      match: [`${D}/notifications`],
      groups: [{ label: "Inbox", items: [{ label: "All notifications", path: `${D}/notifications` }] }],
    },
    help,
  ],
  oa: [
    {
      id: "issue",
      label: "Issue",
      icon: FilePlus2,
      path: `${D}/oa`,
      match: [`${D}/oa`],
      groups: [
        {
          label: "Issue",
          items: [
            { label: "Issue Remark", path: `${D}/oa` },
            { label: "Issue positive credit", path: `${D}/oa/positive` },
          ],
        },
      ],
    },
    {
      id: "history",
      label: "History",
      icon: History,
      path: `${D}/oa/history`,
      match: [`${D}/oa/history`],
      groups: [{ label: "History", items: [{ label: "Issued by me", path: `${D}/oa/history` }] }],
    },
    {
      id: "people",
      label: "People",
      icon: Users,
      path: `${D}/admin/users`,
      match: [`${D}/admin/users`],
      groups: [{ label: "People", items: [{ label: "Faculty accounts", path: `${D}/admin/users` }] }],
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      path: `${D}/notifications`,
      match: [`${D}/notifications`],
      groups: [{ label: "Inbox", items: [{ label: "All notifications", path: `${D}/notifications` }] }],
    },
    help,
  ],
  admin: [
    {
      id: "home",
      label: "Home",
      icon: House,
      path: `${D}/admin`,
      match: [`${D}/admin`],
      groups: [{ label: "Overview", items: [{ label: "Dashboard", path: `${D}/admin` }] }],
    },
    {
      id: "review",
      label: "Review",
      icon: ClipboardCheck,
      path: `${D}/admin/review`,
      match: [`${D}/admin/review`, `${D}/admin/appeals`],
      groups: [
        {
          label: "Queues",
          items: [
            { label: "Good Works queue", path: `${D}/admin/review` },
            { label: "Appeals queue", path: `${D}/admin/appeals` },
          ],
        },
      ],
    },
    {
      id: "credits",
      label: "Credits",
      icon: Coins,
      path: `${D}/admin/positive-remarks`,
      match: [
        `${D}/admin/positive-remarks`,
        `${D}/admin/remarks`,
        `${D}/admin/faculty-ledger`,
        `${D}/admin/credits`,
        `${D}/admin/policies`,
      ],
      groups: [
        {
          label: "Records",
          items: [
            { label: "Good Works", path: `${D}/admin/positive-remarks` },
            { label: "Remarks", path: `${D}/admin/remarks` },
            { label: "Faculty ledger", path: `${D}/admin/faculty-ledger` },
          ],
        },
        {
          label: "Configuration",
          items: [
            { label: "Credit Templates", path: `${D}/admin/credits` },
            { label: "Credit Policies", path: `${D}/admin/policies` },
          ],
        },
      ],
    },
    {
      id: "people",
      label: "People",
      icon: Users,
      path: `${D}/admin/users`,
      match: [`${D}/admin/users`],
      groups: [
        {
          label: "People",
          items: [
            { label: "Faculty accounts", path: `${D}/admin/users` },
            { label: "Bulk import", path: `${D}/admin/users/bulk-add` },
          ],
        },
      ],
    },
    {
      id: "reports",
      label: "Reports",
      icon: PieChart,
      path: `${D}/admin/reports`,
      match: [`${D}/admin/reports`],
      groups: [{ label: "Reports", items: [{ label: "Report builder", path: `${D}/admin/reports` }] }],
    },
    {
      id: "setup",
      label: "Setup",
      icon: Settings2,
      path: `${D}/admin/settings`,
      match: [`${D}/admin/settings`],
      groups: [{ label: "Setup", items: [{ label: "Account & security", path: `${D}/admin/settings` }] }],
    },
    help,
  ],
};

export const HOME: Record<Role, string> = { faculty: D, oa: `${D}/oa`, admin: `${D}/admin` };
export const ROLE_LABEL: Record<Role, string> = { faculty: "Faculty", oa: "Office Assistant", admin: "Administrator" };

/** Pages whose data supports "All years" in the academic-year switcher. */
export const ALL_YEARS_PATHS = [`${D}/good-works`];

/** Longest-prefix match: which rail item owns this path. */
export function activeRailItem(role: Role, pathname: string): RailItem | undefined {
  let best: RailItem | undefined;
  let bestLen = -1;
  for (const item of NAV[role]) {
    for (const m of item.match) {
      const hit = pathname === m || pathname.startsWith(`${m}/`);
      if (hit && m.length > bestLen) {
        best = item;
        bestLen = m.length;
      }
    }
  }
  return best;
}

/** The panel item for this exact path (falls back to the closest parent page). */
export function activePanelItem(item: RailItem | undefined, pathname: string): PanelItem | undefined {
  if (!item) return undefined;
  const all = item.groups.flatMap((g) => g.items);
  return (
    all.find((i) => i.path === pathname) ??
    all.filter((i) => pathname.startsWith(`${i.path}/`)).sort((a, b) => b.path.length - a.path.length)[0]
  );
}

/** Role guard (G11): may this role open this dashboard path? */
export function isAllowed(role: Role, pathname: string): boolean {
  if (!pathname.startsWith(D)) return true;
  const under = (p: string) => pathname === p || pathname.startsWith(`${p}/`);
  if (role === "admin") return under(`${D}/admin`);
  if (role === "oa") return under(`${D}/oa`) || pathname === `${D}/admin/users` || under(`${D}/notifications`);
  return !under(`${D}/admin`) && !under(`${D}/oa`);
}

export function withUid(path: string, uid: string): string {
  if (!uid || path.startsWith("http") || path === HELP_PATH) return path;
  return `${path}${path.includes("?") ? "&" : "?"}uid=${uid}`;
}
