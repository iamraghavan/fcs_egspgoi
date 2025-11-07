
"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';
import { gsap } from 'gsap';

export default function Home() {
  const router = useRouter();
  const [timestamp, setTimestamp] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(containerRef.current, 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
    );

    const updateTimestamp = () => {
      setTimestamp(format(new Date(), 'HH:mm:ss'));
    };
    updateTimestamp();
    const timer = setInterval(updateTimestamp, 1000);

    const redirectTimer = setTimeout(() => {
      router.push('/u/portal/auth?faculty_login');
    }, 2000); 

    return () => {
      clearInterval(timer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-grow flex flex-col items-center justify-center text-center p-4">
        <div className="space-y-4" ref={containerRef}>
            <div className="flex justify-center items-center">
                 <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Loading CreditWise</h1>
            <p className="text-muted-foreground">Please wait while we prepare the application for you...</p>
        </div>
      </main>
      <footer className="w-full bg-background border-t border-border p-4">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground gap-2">
            <span>App Version: 1.0.0</span>
            <span suppressHydrationWarning>Session Time: {timestamp || 'Loading...'}</span>
            <div className="flex gap-4">
              <Link href="/u/portal/auth?faculty_login" className="text-primary hover:underline font-medium">
                  Faculty Login
              </Link>
              <Link href="/u/portal/auth?admin" className="text-primary hover:underline font-medium">
                  Admin Login
              </Link>
            </div>
        </div>
      </footer>
    </div>
  );
}
