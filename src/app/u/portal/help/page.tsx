
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import HelpPageContent from './help-page-content';


const HelpSectionLoadingSkeleton = () => (
    <div className="container mx-auto py-20 lg:py-24">
      <div className="flex flex-col gap-10">
        <div className="flex gap-4 flex-col items-start">
          <div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="flex gap-2 flex-col">
            <Skeleton className="h-12 md:h-16 w-80 md:w-[500px]" />
            <Skeleton className="h-6 w-72 md:w-[600px] mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <Skeleton className="h-60 aspect-square lg:aspect-auto lg:col-span-2" />
          <Skeleton className="h-60 aspect-square lg:aspect-auto" />
          <Skeleton className="h-60 aspect-square lg:aspect-auto" />
          <Skeleton className="h-60 aspect-square lg:aspect-auto lg:col-span-2" />
          <Skeleton className="h-60 aspect-square lg:aspect-auto" />
        </div>
      </div>
    </div>
  );

export default function HelpPage() {
  return (
    <Suspense fallback={<HelpSectionLoadingSkeleton />}>
      <HelpPageContent />
    </Suspense>
  );
}
