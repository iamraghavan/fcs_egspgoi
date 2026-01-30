
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import EgspgoiLogo from '@/app/egspgoi_logo_tr.png';

export default function MaintenancePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 text-center p-4 sm:p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
            <Image src={EgspgoiLogo} alt="EGS Pillay Group of Institutions Logo" width={80} height={80} className="mx-auto mb-4" />
          <CardTitle className="text-2xl md:text-3xl font-bold text-foreground">
            Application Under Maintenance
          </CardTitle>
          <CardDescription className="text-base">
            The Faculty Credit System is temporarily unavailable.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-left space-y-4 text-sm sm:text-base">
            <p>
                This is to inform you that due to scheduled Application / Server Maintenance, the Faculty Credit System will be temporarily shut down as per the details below.
            </p>
            <div className="p-4 bg-muted border rounded-lg space-y-3">
                <h3 className="font-semibold text-center">Maintenance Schedule</h3>
                 <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 bg-primary/10 text-primary p-2 rounded-full">
                        <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="font-medium">Start</p>
                        <p className="text-muted-foreground">Friday, 30-01-2026 at 5:30 PM</p>
                    </div>
                </div>
                 <div className="flex items-center gap-4">
                     <div className="flex-shrink-0 bg-primary/10 text-primary p-2 rounded-full">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="font-medium">End</p>
                        <p className="text-muted-foreground">Monday, 02-02-2026 at 10:30 AM</p>
                    </div>
                </div>
            </div>
            <p>
                During this period, the system will be unavailable. We request you to plan your work accordingly.
            </p>
            <p>
                We regret any inconvenience caused and appreciate your cooperation and understanding.
            </p>
        </CardContent>
        <CardFooter className="flex flex-col items-start pt-6 border-t text-left">
            <p className="font-semibold">Regards,</p>
            <p>Raghavan Jeeva</p>
            <p className="text-sm text-muted-foreground">Coordinator - Branding & Social Media</p>
            <p className="text-sm text-muted-foreground">
              Contact: <a href="mailto:web@egspec.org" className="text-primary hover:underline">web[at]egspec[dot]org</a>
            </p>
        </CardFooter>
      </Card>
       <footer className="mt-8 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} E.G.S. Pillay Group of Institutions. All rights reserved.
      </footer>
    </div>
  );
}
