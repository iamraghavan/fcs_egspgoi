
import { Suspense } from"react";
import { Metadata } from"next";
import { Skeleton } from"@/components/ui/skeleton";
import LoginPageContent from"./login-page-content";

const LoginLoadingSkeleton = () => (
 <div className="w-full min-h-screen flex flex-col md:flex-row">
 <div className="hidden md:flex flex-1 relative">
 <Skeleton className="w-full h-full"/>
 </div>
 <div className="flex-1 bg-background flex items-center justify-center p-6 md:p-12">
 <div className="w-full max-w-md space-y-8">
 <div className="text-center">
 <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4"/>
 <Skeleton className="h-8 w-64 mx-auto mb-2"/>
 <Skeleton className="h-5 w-80 mx-auto"/>
 </div>
 <div className="space-y-6">
 <div className="space-y-2"><Skeleton className="h-4 w-20"/><Skeleton className="h-10 w-full"/></div>
 <div className="space-y-2"><Skeleton className="h-4 w-20"/><Skeleton className="h-10 w-full"/></div>
 <Skeleton className="h-10 w-full"/>
 </div>
 </div>
 </div>
 </div>
);

export const metadata: Metadata = {
 title:"Login - CreditWise",
 description:"Login to the Faculty Credit System.",
};

export default function LoginPage() {
 return (
 <Suspense fallback={<LoginLoadingSkeleton />}>
 <LoginPageContent />
 </Suspense>
 );
}
