// ============================================================
// OAuth 回调处理
// GET /api/auth/oauth/callback?code=xxx&state=xxx
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
const APP_URL = process.env.APP_URL || 'https://aios.allapple.top';
import {
  exchangeCodeForToken,
  fetchUserInfo,
  findOrCreateOAuthUser,
  loginOAuthUser,
  bindOAuthAccount,
  type OAuthProvider,
} from '@/lib/auth/oauth';

const VALID_PROVIDERS: OAuthProvider[] = ['github', 'google', 'twitter'];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // 用户拒绝授权
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=oauth_denied`, APP_URL)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(`/login?error=oauth_invalid`, APP_URL)
      );
    }

    // 验证 state（格式: provider_randomhex）
    const savedState = req.cookies.get('oauth_state')?.value;
    const action = req.cookies.get('oauth_action')?.value || 'login';
    const codeVerifier = req.cookies.get('oauth_code_verifier')?.value;

    if (!savedState || savedState !== state) {
      return NextResponse.redirect(
        new URL(`/login?error=oauth_state_mismatch`, APP_URL)
      );
    }

    // 从 state 解析 provider
    const underscoreIdx = state.indexOf('_');
    const provider = state.substring(0, underscoreIdx) as OAuthProvider;

    if (!provider || !VALID_PROVIDERS.includes(provider)) {
      return NextResponse.redirect(
        new URL(`/login?error=oauth_invalid_state`, APP_URL)
      );
    }

    // 用授权码换 Token
    const accessToken = await exchangeCodeForToken(
      provider,
      code,
      provider === 'twitter' ? codeVerifier : undefined
    );

    // 获取用户信息
    const userInfo = await fetchUserInfo(provider, accessToken);

    // 清理 OAuth cookies
    const cleanCookies = () => {
      const r = NextResponse.redirect(
        new URL(action === 'bind' ? '/settings/account' : '/chat', APP_URL)
      );
      r.cookies.delete('oauth_state');
      r.cookies.delete('oauth_action');
      r.cookies.delete('oauth_code_verifier');
      return r;
    };

    if (action === 'bind') {
      // 绑定到当前登录用户
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        const r = cleanCookies();
        r.headers.set('Location', '/login?error=not_logged_in');
        return r;
      }

      await bindOAuthAccount(currentUser.id, provider, userInfo, accessToken);

      const r = cleanCookies();
      r.headers.set('Location', '/settings?oauth_bind=success');
      return r;
    }

    // 登录/注册
    const { user, isNewUser } = await findOrCreateOAuthUser(
      provider,
      userInfo,
      accessToken
    );

    await loginOAuthUser(user);

    // 记录审计日志
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: isNewUser ? 'REGISTER' : 'LOGIN',
        resource: 'oauth',
        details: { provider, isNewUser },
        ip,
        userAgent: req.headers.get('user-agent'),
      },
    });

    const r = cleanCookies();
    if (isNewUser) {
      r.headers.set('Location', '/chat?welcome=1');
    }
    return r;
  } catch (error: any) {
    console.error('[OAuth Callback Error]', error);
    return NextResponse.redirect(
      new URL(`/login?error=oauth_failed`, APP_URL)
    );
  }
}
