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
  title: 'CreditWise',
  description: 'A comprehensive faculty performance management system for E.G.S. Pillay Engineering College.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${plexSans.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
          <AlertProvider>
            {children}
            <Toaster />
            <GlobalAlert />
          </AlertProvider>
      </body>
    </html>
  );
}
