// ============================================================
// OAuth 绑定/解绑/查询
// GET    /api/auth/oauth/accounts  → 查询已绑定账号
// POST   /api/auth/oauth/accounts  → 发起绑定（返回授权 URL）
// DELETE /api/auth/oauth/accounts  → 解绑
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  getUserOAuthAccounts,
  unbindOAuthAccount,
  type OAuthProvider,
} from '@/lib/auth/oauth';

// 查询已绑定的第三方账号
export async function GET() {
  try {
    const payload = await requireAuth();
    const accounts = await getUserOAuthAccounts(payload.userId);
    return NextResponse.json({ accounts });
  } catch (error: any) {
    if (error.statusCode) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}

// 解绑第三方账号
export async function DELETE(req: NextRequest) {
  try {
    const payload = await requireAuth();
    const { provider } = await req.json();

    if (!provider || !['github', 'google', 'twitter'].includes(provider)) {
      return NextResponse.json(
        { error: '无效的 provider' },
        { status: 400 }
      );
    }

    const result = await unbindOAuthAccount(
      payload.userId,
      provider as OAuthProvider
    );

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.statusCode) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json(
      { error: error.message || '解绑失败' },
      { status: 400 }
    );
  }
}
