"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * useState that is remembered in localStorage (per browser). Storage can be blocked
 * (private mode), so every access is guarded and the default is used instead.
 * The stored value is read after mount to keep server and client HTML identical.
 */
export function usePersistedState<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* storage unavailable or bad JSON: keep the default */
    }
    setLoaded(true);
  }, [key]);

  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [key],
  );

  return [value, set, loaded];
}
