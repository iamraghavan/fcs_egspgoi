"use client";

import { Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function MaintenancePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
      <div className="space-y-6 max-w-lg">
        <Wrench className="mx-auto h-16 w-16 text-primary animate-pulse" />
        <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
          Under Maintenance
        </h1>
        <p className="text-lg text-muted-foreground">
          Our site is currently undergoing scheduled maintenance to improve your experience. We should be back online shortly. Thank you for your patience!
        </p>
        <div className="flex justify-center">
            <Link href="mailto:support@egspgroup.in">
                <Button variant="outline">Contact Support</Button>
            </Link>
        </div>
      </div>
       <footer className="absolute bottom-4 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} E.G.S. Pillay Group of Institutions. All rights reserved.
      </footer>
    </div>
  );
}
