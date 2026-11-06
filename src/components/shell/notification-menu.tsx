"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { withUid } from "./nav-config";

type Notification = { _id: string; title: string; message: string; read: boolean; createdAt: string; url?: string };
type Inbox = { items: Notification[]; unreadCount?: number };

export function NotificationMenu({ uid }: { uid: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  const inbox = withUid("/u/portal/dashboard/notifications", uid);
  const load = useCallback(async () => {
    try {
      const result = await apiFetch<Inbox>("/notifications?limit=6");
      setItems(result.items || []);
      setUnread(result.unreadCount ?? 0);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
    const timer = window.setInterval(load, 60000);
    const refresh = () => {
      void load();
    };
    window.addEventListener("notifications-updated", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("notifications-updated", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [load, uid]);
  const markAll = async () => {
    setUpdating(true);
    try {
      await apiFetch("/notifications/read-all", { method: "PATCH" });
      setItems((values) => values.map((item) => ({ ...item, read: true })));
      setUnread(0);
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (err) {
      toast({
        title: "Could not update notifications",
        description: err instanceof Error ? err.message : "Please retry",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };
  const visit = async (item: Notification) => {
    if (!item.read) {
      try {
        await apiFetch(`/notifications/${encodeURIComponent(item._id)}/read`, { method: "PATCH" });
        setItems((values) => values.map((value) => (value._id === item._id ? { ...value, read: true } : value)));
        setUnread((value) => Math.max(0, value - 1));
        window.dispatchEvent(new Event("notifications-updated"));
      } catch {
        toast({ title: "Could not mark notification as read", variant: "destructive" });
        return;
      }
    }
    let target = inbox;
    if (item.url) {
      try {
        const url = new URL(item.url, window.location.origin);
        if (url.origin === window.location.origin && url.pathname.startsWith("/u/portal/dashboard")) {
          url.searchParams.set("uid", uid);
          target = `${url.pathname}${url.search}`;
        }
      } catch {
        /* open inbox for an invalid destination */
      }
    }
    setOpen(false);
    router.push(target);
  };
  return (
    <Popover
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (value) void load();
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unread > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground"
            >
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={10} className="w-[min(380px,calc(100vw-24px))] p-0">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <div>
            <h2 className="font-semibold">Notifications</h2>
            <p className="text-xs text-muted-foreground">{unread} unread</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={markAll}
            disabled={!unread || updating || loading || !!error}
            aria-label="Mark all notifications as read"
          >
            <CheckCheck className="mr-1 h-4 w-4" />
            Mark all read
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <p role="status" className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading notifications…
            </p>
          ) : error ? (
            <div className="space-y-2 p-5">
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
              <Button size="sm" variant="outline" onClick={() => void load()}>
                Retry
              </Button>
            </div>
          ) : !items.length ? (
            <div className="p-8 text-center">
              <Bell className="mx-auto mb-3 h-7 w-7 text-muted-foreground" />
              <p className="text-sm font-medium">You're all caught up</p>
              <p className="mt-1 text-xs text-muted-foreground">New updates will appear here.</p>
            </div>
          ) : (
            items.map((item) => (
              <button
                type="button"
                key={item._id}
                onClick={() => void visit(item)}
                className={`flex w-full gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${!item.read ? "bg-primary/5" : ""}`}
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${!item.read ? "bg-primary" : "bg-transparent"}`}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{item.title}</span>
                  <span className="mt-1 block line-clamp-2 text-xs text-muted-foreground">{item.message}</span>
                  <time className="mt-2 block text-[11px] text-muted-foreground" dateTime={item.createdAt}>
                    {new Date(item.createdAt).toLocaleString()}
                  </time>
                </span>
              </button>
            ))
          )}
        </div>
        <Link
          href={inbox}
          onClick={() => setOpen(false)}
          className="block rounded-b-md px-4 py-3 text-center text-sm font-medium text-primary hover:bg-muted"
        >
          View all notifications
        </Link>
      </PopoverContent>
    </Popover>
  );
}
