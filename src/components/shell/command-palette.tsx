"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { API_ORIGIN } from "@/lib/api-url";
import { NAV, withUid, type Role } from "./nav-config";
import { QUICK_CREATE } from "./quick-create";

type SearchItem = { id: string; title: string; subtitle: string; url: string };
type SearchCategory = { category: string; items: SearchItem[] };

/**
 * ⌘K / Ctrl+K command palette: jump to any page, start a create action, or search
 * records through the existing /api/v1/search endpoint (3+ characters).
 */
export function CommandPalette({ role, uid }: { role: Role; uid: string }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchCategory[]>([]);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    if (query.trim().length <= 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_ORIGIN}/api/v1/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const data = await res.json();
        setResults(data.success ? data.results || [] : []);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [query]);

  const go = React.useCallback(
    (url: string) => {
      setOpen(false);
      setQuery("");
      router.push(url.startsWith("http") ? url : withUid(url.replace(/[?&]uid=[^&]*/, ""), uid));
    },
    [router, uid],
  );

  const pages = NAV[role].flatMap((m) =>
    m.groups.length
      ? m.groups.flatMap((g) =>
          g.items.map((i) => ({ key: `${m.id}-${i.path}`, label: i.label, context: m.label, path: i.path })),
        )
      : [{ key: m.id, label: m.label, context: "", path: m.path }],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-9 w-full max-w-md items-center gap-2 rounded-md border border-border bg-muted/60 px-3 text-sm text-muted-foreground transition-colors hover:border-border-strong hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex"
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="flex-1 truncate text-left">Search or jump to…</span>
        <kbd className="pointer-events-none hidden select-none items-center gap-0.5 rounded border border-border bg-card px-1.5 font-sans text-caption font-medium text-muted-foreground lg:inline-flex">
          Ctrl K
        </kbd>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-muted md:hidden"
      >
        <Search className="h-5 w-5" aria-hidden="true" />
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages, actions, people and records…" value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>{loading ? "Searching…" : `No results for "${query}".`}</CommandEmpty>
          <CommandGroup heading="Create">
            {QUICK_CREATE[role].map((a) => (
              <CommandItem key={a.label} value={`create ${a.label}`} onSelect={() => go(a.path)}>
                <a.icon className="mr-2 h-4 w-4 text-primary" aria-hidden="true" />
                {a.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Go to">
            {pages.map((p) => (
              <CommandItem key={p.key} value={`go ${p.context} ${p.label}`} onSelect={() => go(p.path)}>
                <ArrowRight className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span>{p.label}</span>
                {p.context && p.context !== p.label && (
                  <span className="ml-auto text-caption text-muted-foreground">{p.context}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
          {loading && (
            <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Searching records…
            </div>
          )}
          {results.map((group) => (
            <React.Fragment key={group.category}>
              <CommandSeparator />
              <CommandGroup heading={group.category}>
                {group.items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${query} ${item.title} ${item.subtitle} ${group.category}`}
                    onSelect={() => go(item.url)}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground">{item.title}</span>
                      <span className="line-clamp-1 text-caption text-muted-foreground">{item.subtitle}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </React.Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
