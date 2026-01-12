/**
 * Clerk Authentication Middleware
 * Protects routes and redirects unauthorized users
 *
 * This middleware runs on EVERY request to enforce authentication
 * according to the security protocols in MASTER_BLUEPRINT.md
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Define public routes that don't require authentication
 */
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhook(.*)',
]);

/**
 * Clerk middleware configuration
 * Automatically protects all routes except those marked as public
 */
export default clerkMiddleware(async (auth, request) => {
  // If the route is not public, require authentication
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

/**
 * Matcher configuration
 * Run middleware on all routes except static files and Next.js internals
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
