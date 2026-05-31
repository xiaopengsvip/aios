import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public paths that don't need auth
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/register/complete',
  '/forgot-password',
  '/docs',
  '/demo',
  '/marketplace',
  '/api-platform',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/send-code',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/me',
  '/api/auth/reset-password',
  '/v1/chat/completions',
  '/v1/models',
];

// Auth pages — logged-in users should be redirected away
const AUTH_PAGES = ['/login', '/register', '/forgot-password'];

// Admin-only path prefixes
const ADMIN_PATHS = ['/admin'];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/api/auth/')) return true;
  if (pathname.startsWith('/api/v1/')) return true;
  if (pathname.startsWith('/api/pages/')) return true;
  if (pathname.startsWith('/p/')) return true;
  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon')) return true;
  if (pathname.includes('.')) return true; // static files
  return false;
}

function isAdminPath(pathname: string): boolean {
  return ADMIN_PATHS.some(p => pathname.startsWith(p));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public paths and static assets
  if (isPublicPath(pathname)) {
    // But redirect logged-in users away from auth pages
    if (AUTH_PAGES.includes(pathname)) {
      const hasToken = request.cookies.get('aios_token')?.value || request.cookies.get('aios_refresh')?.value;
      if (hasToken) {
        return NextResponse.redirect(new URL('/chat', request.url));
      }
    }
    return NextResponse.next();
  }

  // Check auth token
  const accessToken = request.cookies.get('aios_token')?.value;
  const refreshToken = request.cookies.get('aios_refresh')?.value;

  // No auth at all → redirect to login
  if (!accessToken && !refreshToken) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Has token but trying to access admin → will check role in page component
  // (middleware can't decode JWT without jose library, role check is done server-side)

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and api auth
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
