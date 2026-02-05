import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Twitter, Instagram, Facebook } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import EgspgoiLogo from '@/app/egspgoi_logo_tr.png';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function MaintenancePage() {
  const maintenanceImage = PlaceHolderImages.find(img => img.id === 'maintenance-car');

  const maintenanceEndDate = new Date();
  maintenanceEndDate.setDate(maintenanceEndDate.getDate() + 14);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDF9F0] p-4 sm:p-6 relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute top-0 -left-20 w-60 h-60 bg-blue-200/50 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-20 w-72 h-72 bg-yellow-200/50 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-200/50 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

        <main className="z-10 w-full max-w-4xl">
            <Card className="w-full bg-white/80 backdrop-blur-lg border-gray-200/50 shadow-2xl shadow-yellow-100/50">
                <CardHeader className="p-8 sm:p-12">
                    <div className="flex justify-between items-center">
                        <Image src={EgspgoiLogo} alt="CreditWise Logo" width={60} height={60} />
                        <div className="flex items-center gap-4">
                           <Link href="#" aria-label="Twitter"><Twitter className="w-5 h-5 text-gray-500 hover:text-primary" /></Link>
                           <Link href="#" aria-label="Facebook"><Facebook className="w-5 h-5 text-gray-500 hover:text-primary" /></Link>
                           <Link href="#" aria-label="Instagram"><Instagram className="w-5 h-5 text-gray-500 hover:text-primary" /></Link>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-8 sm:px-12 text-center">
                    <h1 className="text-3xl md:text-5xl font-bold text-gray-800">
                        We're improving your Experience
                    </h1>
                    <p className="mt-4 text-base md:text-lg text-gray-600">
                        We'll be back up and running again shortly, around {maintenanceEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                         Please check out our social channels for further updates.
                    </p>
                    <div className="mt-8">
                         {maintenanceImage ? (
                            <Image
                                src={maintenanceImage.imageUrl}
                                alt={maintenanceImage.description}
                                data-ai-hint={maintenanceImage.imageHint}
                                width={800}
                                height={400}
                                className="mx-auto rounded-lg object-cover"
                            />
                         ) : (
                             <div className="w-full h-[400px] bg-gray-200 rounded-lg flex items-center justify-center">
                                <p className="text-gray-500">Illustration loading...</p>
                            </div>
                         )}
                    </div>
                </CardContent>
                <div className="flex justify-between items-center p-8 sm:p-12 text-sm">
                     <p className="text-gray-500">
                        Contact: <a href="mailto:web@egspec.org" className="text-primary hover:underline">web@egspec.org</a>
                    </p>
                     <p className="text-gray-400">© {new Date().getFullYear()} CreditWise</p>
                </div>
            </Card>
        </main>
    </div>
  );
}
