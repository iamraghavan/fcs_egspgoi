
"use client";

import dynamic from"next/dynamic";
import { Skeleton } from"@/components/ui/skeleton";

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

const LoginScreen = dynamic(
 () => import("@/components/ui/login-1").then((mod) => mod.LoginScreen),
 {
 ssr: false,
 loading: () => <LoginLoadingSkeleton />,
 }
);


export default function LoginPageContent() {
 return <LoginScreen />;
}
