// ============================================================
// OAuth 发起登录/绑定
// GET /api/auth/oauth/[provider]?action=login|bind
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthorizationUrl,
  generateState,
  generateCodeVerifier,
  generateCodeChallenge,
  type OAuthProvider,
} from '@/lib/auth/oauth';

function getOrigin(req: NextRequest): string {
  const allowed = (process.env.ALLOWED_ORIGINS || 'https://aios.vios.top,https://vios.top')
    .split(',').map(s => s.trim());
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const origin = `${proto}://${host}`;
  if (allowed.some(a => origin.startsWith(a))) return origin;
  return process.env.APP_URL || 'https://aios.vios.top';
}

const VALID_PROVIDERS: OAuthProvider[] = ['github', 'google', 'twitter'];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider: rawProvider } = await params;
    const provider = rawProvider.toLowerCase() as OAuthProvider;

    if (!VALID_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { error: '不支持的登录方式' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'login';

    // state = provider_randomhex，回调时解析 provider
    const state = `${provider}_${generateState()}`;

    // Twitter 需要 PKCE
    let codeVerifier: string | undefined;
    let codeChallenge: string | undefined;
    if (provider === 'twitter') {
      codeVerifier = generateCodeVerifier();
      codeChallenge = generateCodeChallenge(codeVerifier);
    }

    const origin = getOrigin(req);
    const authUrl = getAuthorizationUrl(provider, state, codeChallenge, origin);

    const response = NextResponse.redirect(authUrl);

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'lax' as const,
      maxAge: 600,
      path: '/',
    };

    response.cookies.set('oauth_state', state, cookieOptions);
    response.cookies.set('oauth_action', action, cookieOptions);

    if (codeVerifier) {
      response.cookies.set('oauth_code_verifier', codeVerifier, cookieOptions);
    }

    return response;
  } catch (error: any) {
    console.error('[OAuth Init Error]', error);
    return NextResponse.redirect(
      new URL(`/login?error=oauth_init_failed`, getOrigin(req))
    );
  }
}
