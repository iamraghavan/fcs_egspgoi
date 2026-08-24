"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, Bell, CheckCircle2, ChevronDown, Clock3, Info, Megaphone, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://faculty-credit-system.vercel.app";
type NotificationItem = { _id: string; type: string; title: string; message: string; url?: string | null; read: boolean; createdAt: string };
type Filter = "all" | "read" | "unread";

const iconFor = (type: string) => {
  if (type.includes("negative") || type.includes("remark")) return AlertTriangle;
  if (type.includes("approved") || type.includes("success")) return CheckCircle2;
  if (type.includes("rejected") || type.includes("failed")) return XCircle;
  if (type.includes("pending")) return Clock3;
  if (type.includes("broadcast")) return Megaphone;
  return Info;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const { toast } = useToast();
  const request = useCallback(async (path: string, init?: RequestInit) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/api/v1/notifications${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init?.headers || {}) } });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || "Notification request failed");
    return body;
  }, []);
  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try { const body = await request("?limit=200"); setItems(body.items || []); }
    catch (error) { toast({ title: "Notifications unavailable", description: error instanceof Error ? error.message : "Please retry", variant: "destructive" }); }
    finally { setLoading(false); }
  }, [request, toast]);

  useEffect(() => { load(); const timer = window.setInterval(() => load(true), 60000); return () => window.clearInterval(timer); }, [load]);
  const visible = useMemo(() => items.filter(item => filter === "all" || (filter === "read" ? item.read : !item.read)), [items, filter]);
  const unread = items.filter(item => !item.read).length;
  const markRead = async (id: string) => {
    const current = items.find(item => item._id === id); if (!current || current.read) return;
    setItems(values => values.map(item => item._id === id ? { ...item, read: true } : item));
    try { await request(`/${id}/read`, { method: "PATCH" }); window.dispatchEvent(new Event("notifications-updated")); }
    catch { setItems(values => values.map(item => item._id === id ? { ...item, read: false } : item)); }
  };
  const markAll = async () => {
    const before = items; setItems(values => values.map(item => ({ ...item, read: true })));
    try { await request("/read-all", { method: "PATCH" }); window.dispatchEvent(new Event("notifications-updated")); }
    catch { setItems(before); toast({ title: "Could not update notifications", variant: "destructive" }); }
  };

  return <section className="mx-auto w-full max-w-5xl space-y-5 px-0 sm:px-2">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><div className="flex items-center gap-2"><Bell className="h-6 w-6 text-primary"/><h1 className="text-2xl font-semibold sm:text-3xl">Notifications</h1>{unread > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">{unread}</span>}</div><p className="mt-1 text-sm text-muted-foreground">Credit decisions, remarks and institutional announcements.</p></div>
      <Button className="w-full sm:w-auto" variant="outline" disabled={!unread} onClick={markAll}>Mark all as read</Button>
    </header>
    <div className="flex items-center justify-between border-y py-3"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="min-w-32 justify-between capitalize">{filter}<ChevronDown className="ml-2 h-4 w-4"/></Button></DropdownMenuTrigger><DropdownMenuContent align="start">{(["all", "unread", "read"] as Filter[]).map(value => <DropdownMenuItem key={value} onClick={() => setFilter(value)} className="capitalize">{value}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu><span className="text-xs text-muted-foreground">Refreshes automatically</span></div>
    <div className="space-y-3" aria-live="polite">{loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl"/>) : visible.length ? visible.map(item => { const Icon = iconFor(item.type); const warning = item.type.includes("negative") || item.type.includes("remark") || item.type.includes("rejected"); return <article key={item._id} tabIndex={0} role="button" onClick={() => markRead(item._id)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") markRead(item._id); }} className={`grid cursor-pointer grid-cols-[auto_1fr] gap-3 rounded-xl border p-4 transition hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary sm:grid-cols-[auto_1fr_auto] sm:gap-4 ${item.read ? "bg-card" : "border-primary/30 bg-primary/5"}`}>
      <div className={`relative flex h-11 w-11 items-center justify-center rounded-full ${warning ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" : "bg-primary/10 text-primary"}`}><Icon className="h-5 w-5" aria-hidden="true"/>{!item.read && <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background"/>}</div>
      <div className="min-w-0"><h2 className="break-words text-sm font-semibold sm:text-base">{item.title}</h2><p className="mt-1 break-words text-sm leading-5 text-muted-foreground">{item.message}</p><time className="mt-2 block text-xs text-muted-foreground" dateTime={item.createdAt}>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</time></div>
      {!item.read && <span className="col-start-2 self-start whitespace-nowrap text-xs font-medium text-primary sm:col-start-auto">New</span>}
    </article>; }) : <div className="rounded-xl border border-dashed px-6 py-16 text-center"><Bell className="mx-auto h-10 w-10 text-muted-foreground/50"/><h2 className="mt-4 font-medium">No {filter === "all" ? "" : filter} notifications</h2><p className="mt-1 text-sm text-muted-foreground">New activity will appear here automatically.</p></div>}</div>
  </section>;
}
