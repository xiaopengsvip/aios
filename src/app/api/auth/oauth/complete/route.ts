// ============================================================
// OAuth 补填邮箱+密码（GitHub/X 无邮箱时）
// POST /api/auth/oauth/complete
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { loginOAuthUser } from '@/lib/auth/oauth';

export async function POST(req: NextRequest) {
  try {
    const pending = req.cookies.get('oauth_pending')?.value;
    if (!pending) {
      return NextResponse.json({ error: '注册会话已过期，请重新登录' }, { status: 400 });
    }

    const { userId, provider, username } = JSON.parse(pending);
    const { email, password, code } = await req.json();

    if (!email || !password || !code) {
      return NextResponse.json({ error: '请填写邮箱、密码和验证码' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: '密码至少 8 位' }, { status: 400 });
    }

    // 验证验证码
    const validCode = await prisma.emailVerification.findFirst({
      where: {
        email,
        code,
        type: 'REGISTER',
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!validCode) {
      return NextResponse.json({ error: '验证码无效或已过期' }, { status: 400 });
    }

    // 标记验证码已使用
    await prisma.emailVerification.update({
      where: { id: validCode.id },
      data: { usedAt: new Date() },
    });

    // 检查邮箱是否已被使用
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail && existingEmail.id !== userId) {
      return NextResponse.json({ error: '该邮箱已被其他账号使用' }, { status: 400 });
    }

    // 更新用户：设置邮箱 + 密码
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        email,
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });

    // 记录审计日志
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'REGISTER',
        resource: 'oauth_complete',
        details: { provider, email },
        ip,
        userAgent: req.headers.get('user-agent'),
      },
    });

    // 自动登录
    const token = await loginOAuthUser(user);

    const response = NextResponse.json({ success: true });
    response.cookies.delete('oauth_pending');
    return response;
  } catch (error: any) {
    console.error('[OAuth Complete Error]', error);
    return NextResponse.json({ error: error.message || '注册失败' }, { status: 500 });
  }
}
