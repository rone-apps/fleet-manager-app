import { NextResponse } from 'next/server';

/**
 * Check if JWT token is expired
 */
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp && payload.exp < now;
  } catch (err) {
    return true; // If we can't parse, treat as expired
  }
}

export function middleware(request) {
  const path = request.nextUrl.pathname;

  // Public paths that don't require authentication
  const publicPaths = ['/signin'];
  const isPublicPath = publicPaths.includes(path);

  // Get token from localStorage (via cookies for middleware)
  // Note: Middleware runs on server, so we need to check cookies if set
  const token = request.cookies.get('token')?.value;

  // If trying to access protected route without token or with expired token
  if (!isPublicPath) {
    if (!token) {
      console.log('No token found, redirecting to signin');
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    // Check if token is expired
    if (isTokenExpired(token)) {
      console.log('Token expired, redirecting to signin');
      const response = NextResponse.redirect(new URL('/signin', request.url));
      // Clear the expired token cookie
      response.cookies.delete('token');
      return response;
    }
  }

  // If logged in and trying to access auth pages
  if (isPublicPath && token && !isTokenExpired(token)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
