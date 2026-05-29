import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AlertProvider } from '@/context/alert-context';
import { GlobalAlert } from '@/components/ui/global-alert';
import { Inter, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';

const inter = Inter({
 subsets: ['latin'],
 display: 'swap',
 variable: '--font-inter',
});

const plexSans = IBM_Plex_Sans({
 weight: ['300', '400', '500', '600', '700'],
 subsets: ['latin'],
 display: 'swap',
 variable: '--font-plex-sans',
});

const plexMono = IBM_Plex_Mono({
 weight: ['400', '500'],
 subsets: ['latin'],
 display: 'swap',
 variable: '--font-plex-mono',
});

export const metadata: Metadata = {
  title: "Faculty Credit System",
  description: "A comprehensive credit management system for faculty.",
  manifest: "/site.webmanifest",
  themeColor: "#ffffff",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FCS",
  },
};

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <html lang="en"className={`${inter.variable} ${plexSans.variable} ${plexMono.variable}`} suppressHydrationWarning>
 <head>
 <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"rel="stylesheet"/>
 </head>
  <body className="antialiased" suppressHydrationWarning>
    {children}
    <Toaster />
    <GlobalAlert />
  </body>
 </html>
 );
}
