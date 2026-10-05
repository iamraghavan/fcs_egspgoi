"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Palette, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ACCENTS, ACCENT_KEY, type Accent } from "@/lib/accent";

function applyAccent(a: Accent) {
  const root = document.documentElement;
  if (a === "blue") root.removeAttribute("data-accent");
  else root.setAttribute("data-accent", a);
  try {
    window.localStorage.setItem(ACCENT_KEY, a);
  } catch {
    /* ignore */
  }
}

export function useAccent(): [Accent, (a: Accent) => void] {
  const [accent, setAccent] = useState<Accent>("blue");
  useEffect(() => {
    try {
      const a = window.localStorage.getItem(ACCENT_KEY) as Accent | null;
      if (a && ACCENTS.includes(a)) setAccent(a);
    } catch {
      /* ignore */
    }
  }, []);
  return [
    accent,
    (a) => {
      setAccent(a);
      applyAccent(a);
    },
  ];
}

const MODES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Match system", icon: Monitor },
] as const;

/**
 * Appearance: mode (light / dark / system, via next-themes) + accent theme.
 * Only primary-* colours change with the accent; status colours never do.
 */
export function AppearanceMenu({ trigger, side = "right" }: { trigger: ReactNode; side?: "right" | "bottom" | "top" }) {
  const { theme, setTheme } = useTheme();
  const [accent, setAccent] = useAccent();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent side={side} align="end" className="w-60">
        <DropdownMenuLabel className="text-caption font-medium text-muted-foreground">Mode</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={mounted ? theme : undefined} onValueChange={setTheme}>
          {MODES.map(({ value, label, icon: Icon }) => (
            <DropdownMenuRadioItem key={value} value={value} className="gap-2">
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-caption font-medium text-muted-foreground">Accent colour</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={accent} onValueChange={(v) => setAccent(v as Accent)}>
          {ACCENTS.map((a) => (
            <DropdownMenuRadioItem key={a} value={a} className="gap-2 capitalize">
              <span
                className="h-4 w-4 rounded-full ring-1 ring-border"
                style={{ backgroundColor: `hsl(var(--swatch-${a}))` }}
                aria-hidden="true"
              />
              {a}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const AppearanceIcon = Palette;
