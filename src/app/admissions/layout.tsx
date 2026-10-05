import type { ReactNode } from "react";
import { IBM_Plex_Sans } from "next/font/google";
import { LegacyThemeScope } from "./legacy-theme-scope";

// The admissions microsite is out of scope for the UI redesign and keeps its
// previous look: old colour values, square corners, IBM Plex, always light.
// See the `.legacy-theme` block in src/app/globals.css.
const plexSans = IBM_Plex_Sans({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex-sans",
});

export default function AdmissionsLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`legacy-theme ${plexSans.variable} min-h-screen`}>
      <LegacyThemeScope fontClass={plexSans.variable} />
      {children}
    </div>
  );
}
