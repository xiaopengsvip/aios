import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword, signToken, signRefreshToken, setAuthCookie } from '@/lib/auth';
import { sendMail, verificationEmail, welcomeEmail } from '@/lib/mail';
import { checkRateLimit } from '@/lib/security/crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password, code } = body;

    // 参数验证
    if (!username || !email || !password || !code) {
      return NextResponse.json(
        { error: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: '密码至少8位' },
        { status: 400 }
      );
    }

    // 限流
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(`register:${ip}`, 5, 300000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: '注册请求过于频繁，请稍后再试' },
        { status: 429 }
      );
    }

    // 检查用户名/邮箱是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: existingUser.username === username ? '用户名已存在' : '邮箱已注册' },
        { status: 409 }
      );
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
      return NextResponse.json(
        { error: '验证码无效或已过期' },
        { status: 400 }
      );
    }

    // 标记验证码已使用
    await prisma.emailVerification.update({
      where: { id: validCode.id },
      data: { usedAt: new Date() },
    });

    // 创建用户
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        emailVerifiedAt: new Date(),
        locale: req.headers.get('accept-language')?.includes('en') ? 'en-US' : 'zh-CN',
      },
    });

    // 发送欢迎邮件
    const locale = user.locale || 'zh-CN';
    const { subject, html } = welcomeEmail(username, locale);
    await sendMail({ to: email, subject, html });

    // 生成 JWT 并设置 Cookie (access + refresh)
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };
    const accessToken = signToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);
    await setAuthCookie(accessToken, refreshToken);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('[Register Error]', error);
    return NextResponse.json(
      { error: '注册失败，请稍后再试' },
      { status: 500 }
    );
  }
}
