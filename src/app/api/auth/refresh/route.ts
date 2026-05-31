import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, signToken, signRefreshToken, setAuthCookie } from '@/lib/auth';

const REFRESH_COOKIE_NAME = 'aios_refresh';

// POST /api/auth/refresh - 刷新 access token
export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: '无 refresh token' }, { status: 401 });
    }

    const payload = verifyToken(refreshToken, 'refresh');
    if (!payload) {
      return NextResponse.json({ error: 'refresh token 已过期，请重新登录' }, { status: 401 });
    }

    // 生成新的 token 对
    const tokenPayload = {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
      tenantId: payload.tenantId,
    };
    const newAccessToken = signToken(tokenPayload);
    const newRefreshToken = signRefreshToken(tokenPayload);

    await setAuthCookie(newAccessToken, newRefreshToken);

    return NextResponse.json({ success: true, message: 'Token 已刷新' });
  } catch (error: any) {
    console.error('[Refresh Error]', error);
    return NextResponse.json({ error: '刷新失败' }, { status: 500 });
  }
}
