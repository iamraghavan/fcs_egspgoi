
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import EgspgoiLogo from '@/app/egspgoi_logo_tr.png';
import { useState, useEffect } from 'react';

export default function MaintenancePage() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isMaintenanceOver, setIsMaintenanceOver] = useState(false);

  useEffect(() => {
    const maintenanceEndDate = new Date('2026-02-03T18:00:00').getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = maintenanceEndDate - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsMaintenanceOver(true);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const TimerBox = ({ value, label }: { value: number, label: string }) => (
    <div className="text-center bg-primary/5 p-3 rounded-lg flex-1">
        <div className="text-3xl md:text-4xl font-bold text-primary">{String(value).padStart(2, '0')}</div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );

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
        <CardContent className="text-left space-y-6 text-sm sm:text-base">
            {!isMaintenanceOver && (
                <div className="text-center space-y-3">
                    <h3 className="font-semibold">Time until service resumes:</h3>
                    <div className="flex justify-center gap-2 sm:gap-4">
                        <TimerBox value={timeLeft.days} label="Days" />
                        <TimerBox value={timeLeft.hours} label="Hours" />
                        <TimerBox value={timeLeft.minutes} label="Minutes" />
                        <TimerBox value={timeLeft.seconds} label="Seconds" />
                    </div>
                </div>
            )}
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
                        <p className="text-muted-foreground">Tuesday, 03-02-2026 at 6:00 PM</p>
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
