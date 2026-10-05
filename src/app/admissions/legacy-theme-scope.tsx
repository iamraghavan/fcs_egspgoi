"use client";

import { useEffect } from "react";

/**
 * Also scopes <html> while an admissions page is open, so dialogs/popovers that
 * render in portals (outside the layout div) keep the legacy look too.
 */
export function LegacyThemeScope({ fontClass }: { fontClass: string }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("legacy-theme", fontClass);
    return () => root.classList.remove("legacy-theme", fontClass);
  }, [fontClass]);
  return null;
}
