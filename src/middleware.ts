/**
 * Authentication Middleware
 *
 * Handles authentication checks and redirects for protected routes.
 * Uses JWT session cookies for authentication.
 *
 * @description Next.js middleware for route protection and authentication
 */

import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || 'your-secret-key-change-in-production'
);

/**
 * Verify JWT session token
 */
async function verifySession(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, SECRET_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Middleware function to handle authentication
 *
 * @param request - Next.js request object
 * @returns NextResponse with appropriate redirects or pass-through
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get session token from cookie
  const sessionToken = request.cookies.get('jobai_session')?.value;
  const isAuthenticated = sessionToken ? await verifySession(sessionToken) : false;

  // Define protected routes
  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/saved-jobs',
    '/applications',
    '/settings',
    '/premium',
  ];

  // Define auth routes (should redirect if already logged in)
  const authRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/signup',
  ];

  // Define premium-only routes
  const premiumRoutes = [
    '/premium/ai-insights',
    '/premium/resume-builder',
    '/premium/interview-prep',
    '/premium/salary-analysis',
  ];

  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Check if current route is auth-related
  const isAuthRoute = authRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Check if current route requires premium
  const isPremiumRoute = premiumRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Handle authentication logic
  if (!isAuthenticated) {
    // User is not authenticated
    if (isProtectedRoute || isPremiumRoute) {
      // Redirect to login with return URL
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  } else {
    // User is authenticated
    if (isAuthRoute) {
      // Redirect authenticated users away from auth pages
      const redirectUrl = request.nextUrl.searchParams.get('redirect');
      return NextResponse.redirect(
        new URL(redirectUrl || '/dashboard', request.url)
      );
    }

    // Check premium access for premium routes
    if (isPremiumRoute) {
      // Note: Premium check is disabled for now
      // Users can access premium routes if authenticated
      // TODO: Re-enable when needed by checking user subscription status from database
    }
  }

  return NextResponse.next();
}

/**
 * Middleware configuration
 *
 * Defines which routes the middleware should run on.
 * Excludes static files, API routes that don't need auth, and internal Next.js routes.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Public files (images, etc.)
     * - API routes that don't require auth
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
