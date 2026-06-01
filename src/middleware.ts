import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── CORS ──
const ALLOWED_ORIGINS = [
  'https://aios.vios.top',
  'https://aios.allapple.top',
  'http://localhost:1420',      // Tauri dev
  'http://localhost:3000',      // Next.js dev
  'tauri://localhost',          // Tauri production (macOS/Windows)
  'https://tauri.localhost',    // Tauri production (Linux)
  'https://ionic.github.io',    // Tauri internal
];

function corsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin') || '';
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };
  // Allow Tauri custom origins and same-origin
  if (ALLOWED_ORIGINS.includes(origin) || origin === '' || origin.startsWith('tauri://') || origin.startsWith('https://tauri.')) {
    headers['Access-Control-Allow-Origin'] = origin || '*';
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  return headers;
}

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
  '/api/app/version',
  '/api/app/upload',
  '/api/app/install',
  '/api/app/stats',
  '/api/auth/oauth',
  '/api/models',
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

  // ── CORS preflight ──
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
  }

  // Skip public paths and static assets
  if (isPublicPath(pathname)) {
    // But redirect logged-in users away from auth pages
    if (AUTH_PAGES.includes(pathname)) {
      const hasToken = request.cookies.get('aios_token')?.value || request.cookies.get('aios_refresh')?.value;
      if (hasToken) {
        return NextResponse.redirect(new URL('/chat', request.url));
      }
    }
    const res = NextResponse.next();
    // Add CORS headers to all responses
    const ch = corsHeaders(request);
    for (const [k, v] of Object.entries(ch)) res.headers.set(k, v);
    return res;
  }

  // Check auth token
  const accessToken = request.cookies.get('aios_token')?.value;
  const refreshToken = request.cookies.get('aios_refresh')?.value;

  // No auth at all → 401 for API, redirect for pages
  if (!accessToken && !refreshToken) {
    if (pathname.startsWith('/api/')) {
      const res = NextResponse.json({ error: '未登录' }, { status: 401 });
      const ch = corsHeaders(request);
      for (const [k, v] of Object.entries(ch)) res.headers.set(k, v);
      return res;
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const res = NextResponse.next();
  const ch = corsHeaders(request);
  for (const [k, v] of Object.entries(ch)) res.headers.set(k, v);
  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
