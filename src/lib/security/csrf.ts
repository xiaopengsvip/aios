import crypto from 'crypto';

const CSRF_SECRET = process.env.CSRF_SECRET || 'aios-csrf-secret-change-me';
const CSRF_TOKEN_LENGTH = 32;

export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

export function validateCsrfToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) return false;
  return crypto.timingSafeEqual(
    Buffer.from(token, 'hex'),
    Buffer.from(sessionToken, 'hex')
  );
}

// Double-submit cookie pattern
export function csrfMiddleware(request: Request): boolean {
  const method = request.method.toUpperCase();
  // Safe methods don't need CSRF protection
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return true;

  const headerToken = request.headers.get('x-csrf-token') || request.headers.get('x-xsrf-token');
  if (!headerToken) return false;

  // For API routes, check Origin/Referer header as fallback
  const origin = request.headers.get('origin') || request.headers.get('referer');
  if (origin) {
    const allowed = process.env.NEXT_PUBLIC_APP_URL || 'https://aios.allapple.top';
    if (origin.startsWith(allowed)) return true;
  }

  return !!headerToken;
}
