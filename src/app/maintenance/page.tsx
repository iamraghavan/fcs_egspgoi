
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Twitter, Instagram, Facebook, Mail, Globe, Hammer } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import EgspgoiLogo from '@/app/egspgoi_logo_tr.png';
import CarMechanicImage from '@/app/car-mechanic-rolling-tire-change-it_3446-270.jpg';

export default function MaintenancePage() {
  const maintenanceEndDate = new Date();
  maintenanceEndDate.setDate(maintenanceEndDate.getDate() + 7);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 relative overflow-hidden font-display">
        {/* Background depth effects */}
        <div className="absolute top-[-10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] -right-[10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse delay-700"></div>

        <main className="z-10 w-full max-w-3xl">
            <div className="flex justify-center mb-8">
                <div className="bg-white p-4 rounded-2xl shadow-xl border border-white/50 backdrop-blur-sm">
                    <Image src={EgspgoiLogo} alt="EGS Pillay Group of Institutions" width={120} height={120} className="h-auto w-auto" priority />
                </div>
            </div>

            <Card className="w-full bg-white/90 backdrop-blur-md border-slate-200/60 shadow-2xl shadow-slate-200/50 overflow-hidden rounded-3xl">
                {/* Decorative Progress Strip */}
                <div className="h-2 w-full bg-primary/20">
                    <div className="h-full w-[65%] bg-primary animate-pulse transition-all"></div>
                </div>
                
                <CardContent className="p-8 sm:p-12 text-center space-y-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                            <Hammer className="w-3 h-3" />
                            System Upgrade in Progress
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                            Enhancing Your <span className="text-primary">Faculty Portal</span>
                        </h1>
                        <p className="text-lg text-slate-600 max-w-xl mx-auto font-medium">
                            We are currently implementing critical updates to resolve Faculty portal issues and improve remark accuracy.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="text-primary font-bold text-lg uppercase">Upgraded</div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">System Security</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="text-primary font-bold text-lg">2x Fast</div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Response Speed</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="text-primary font-bold text-lg">Fixed</div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Remark Logic</div>
                        </div>
                    </div>

                    <div className="space-y-3 max-w-md mx-auto">
                        <div className="flex justify-between text-sm font-bold text-slate-600 px-1">
                            <span>Optimization Progress</span>
                            <span>65%</span>
                        </div>
                        <Progress value={65} className="h-3" />
                        <p className="text-xs text-slate-400 font-medium italic">
                            Estimated Completion: {maintenanceEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>

                    <div className="relative group rounded-2xl overflow-hidden aspect-[21/9] shadow-inner">
                        <Image
                            src={CarMechanicImage}
                            alt="Maintenance in Progress"
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
                    </div>

                    <div className="pt-4 space-y-6">
                        <div className="flex flex-wrap justify-center gap-6">
                            <Link href="mailto:web@egspec.org" className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-sm font-semibold">
                                <Mail className="w-4 h-4" /> web@egspec.org
                            </Link>
                            <Link href="https://egspec.org" className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-sm font-semibold" target="_blank">
                                <Globe className="w-4 h-4" /> egspec.org
                            </Link>
                        </div>
                        
                        <div className="flex justify-center gap-4">
                           <Link href="#" className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-primary hover:text-white transition-all shadow-sm"><Twitter className="w-5 h-5" /></Link>
                           <Link href="#" className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-primary hover:text-white transition-all shadow-sm"><Facebook className="w-5 h-5" /></Link>
                           <Link href="#" className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-primary hover:text-white transition-all shadow-sm"><Instagram className="w-5 h-5" /></Link>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <p className="mt-8 text-center text-slate-400 text-xs font-semibold uppercase tracking-widest opacity-80">
                © {new Date().getFullYear()} CreditWise System • E.G.S. Pillay Group of Institutions
            </p>
        </main>
    </div>
  );
}
