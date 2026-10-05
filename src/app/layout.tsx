import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AlertProvider } from "@/context/alert-context";
import { GlobalAlert } from "@/components/ui/global-alert";
import { ThemeProvider } from "@/components/theme-provider";
import { Inter } from "next/font/google";
import { ACCENT_BOOT_SCRIPT } from "@/lib/accent";

// Inter is the only UI font (weights 400/500/600 per the design system).
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CreditWise",
  description: "A comprehensive faculty performance management system for E.G.S. Pillay Engineering College.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Apply the saved accent colour before first paint (Appearance menu). */}
        <script dangerouslySetInnerHTML={{ __html: ACCENT_BOOT_SCRIPT }} />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <AlertProvider>
            {children}
            <Toaster />
            <GlobalAlert />
          </AlertProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
