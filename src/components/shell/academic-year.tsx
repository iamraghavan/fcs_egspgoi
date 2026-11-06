"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarRange } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_YEARS, academicYearOptions, getCurrentAcademicYear, isAcademicYear } from "@/lib/academic-year";
import { ALL_YEARS_PATHS } from "./nav-config";
import { useApplicationSettings } from "@/lib/application-settings";

const STORAGE_KEY = "shell.academicYear";

type Ctx = { year: string; setYear: (y: string) => void; options: string[]; allowAll: boolean };
const AcademicYearContext = createContext<Ctx | null>(null);

/**
 * One academic year for the whole workspace (Tesler: the system remembers it).
 * Source of truth: `?ay=` in the URL (shareable), then localStorage, then the current year.
 */
export function AcademicYearProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { settings } = useApplicationSettings();
  const options = useMemo(
    () =>
      settings
        ? settings.academicYears
            .map((year) => year.id)
            .sort()
            .reverse()
        : academicYearOptions(5),
    [settings],
  );
  const defaultYear = settings?.currentAcademicYear || getCurrentAcademicYear();
  const allowAll = ALL_YEARS_PATHS.includes(pathname);
  const [stored, setStored] = useState<string | null>(null);

  useEffect(() => {
    try {
      setStored(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      /* ignore */
    }
  }, []);

  const fromUrl = searchParams.get("ay");
  const candidate = fromUrl ?? stored ?? defaultYear;
  const valid =
    (isAcademicYear(candidate) && options.includes(candidate)) || candidate === ALL_YEARS ? candidate : defaultYear;
  const year = valid === ALL_YEARS && !allowAll ? defaultYear : valid;

  const setYear = useCallback(
    (y: string) => {
      setStored(y);
      try {
        window.localStorage.setItem(STORAGE_KEY, y);
      } catch {
        /* ignore */
      }
      const params = new URLSearchParams(searchParams.toString());
      params.set("ay", y);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const value = useMemo(() => ({ year, setYear, options, allowAll }), [year, setYear, options, allowAll]);
  return <AcademicYearContext.Provider value={value}>{children}</AcademicYearContext.Provider>;
}

/** Pages read the workspace year here. Outside the shell it falls back to local state. */
export function useAcademicYear(): Ctx {
  const ctx = useContext(AcademicYearContext);
  const [local, setLocal] = useState(getCurrentAcademicYear());
  return ctx ?? { year: local, setYear: setLocal, options: academicYearOptions(5), allowAll: false };
}

export function AcademicYearSwitcher({ className }: { className?: string }) {
  const { year, setYear, options, allowAll } = useAcademicYear();
  return (
    <Select value={year} onValueChange={setYear}>
      <SelectTrigger aria-label="Academic year" className={className}>
        <span className="flex min-w-0 items-center gap-2">
          <CalendarRange className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent>
        {allowAll && <SelectItem value={ALL_YEARS}>All years</SelectItem>}
        {options.map((y) => (
          <SelectItem key={y} value={y}>
            AY {y}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
