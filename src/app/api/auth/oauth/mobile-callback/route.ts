import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { signToken } from '@/lib/auth';

// GET /api/auth/oauth/mobile-callback
// Mobile clients open this after OAuth redirect
// Returns a page that deep-links back to the app with the token
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse(
        buildMobilePage('登录失败', '未获取到用户信息，请重试'),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      tenantId: user.tenantId || undefined,
    });

    // Return HTML that deep-links to the app
    return new NextResponse(
      buildMobilePage('登录成功', '正在返回应用...', token, user.username),
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    return new NextResponse(
      buildMobilePage('登录失败', '发生错误，请重试'),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

function buildMobilePage(title: string, message: string, token?: string, username?: string): string {
  const deepLink = token
    ? `aios://callback?token=${encodeURIComponent(token)}&username=${encodeURIComponent(username || '')}`
    : 'aios://callback?error=login_failed';

  return `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, system-ui, sans-serif; background: #0a0a0f; color: #fff;
      display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { text-align: center; padding: 40px 24px; max-width: 360px; }
    .icon { font-size: 64px; margin-bottom: 16px; }
    h1 { font-size: 24px; margin-bottom: 8px; }
    p { color: #888; font-size: 14px; margin-bottom: 24px; }
    a { display: inline-block; padding: 12px 32px; background: #6366f1; color: #fff;
      text-decoration: none; border-radius: 8px; font-size: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${token ? '✅' : '❌'}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    ${token ? `<a href="${deepLink}">返回 AIOS</a>
    <script>setTimeout(() => window.location.href = '${deepLink}', 1000);</script>` : ''}
  </div>
</body>
</html>`;
}
