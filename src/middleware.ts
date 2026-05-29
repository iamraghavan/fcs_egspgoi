import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
 // Check if maintenance mode is enabled via environment variable.
 // This check will not run on paths excluded by the matcher below.
 if (process.env.MAINTENANCE_MODE ==="true") {
 // To avoid redirect loops, we allow access to the maintenance page.
 // All other paths are redirected.
 if (request.nextUrl.pathname !== '/maintenance') {
 return NextResponse.redirect(new URL('/maintenance', request.url));
 }
 }

 // Continue with the request if maintenance mode is off.
 return NextResponse.next();
}

export const config = {
 // The matcher ensures this middleware runs on all paths
 // EXCEPT for API routes and static files/images needed for the maintenance page to render.
 matcher: [
 '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.webp$).*)',
 ],
};
