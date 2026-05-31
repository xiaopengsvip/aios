import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyPassword, signToken, signRefreshToken, setAuthCookie } from '@/lib/auth';
import { checkRateLimit } from '@/lib/security/crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: '请填写账号和密码' },
        { status: 400 }
      );
    }

    // 限流
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(`login:${ip}`, 10, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: '登录请求过于频繁，请稍后再试' },
        { status: 429 }
      );
    }

    // 查找用户: 支持邮箱、AI账号(数字账号)登录
    const trimmedInput = email.trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: trimmedInput },
          { numericAccount: trimmedInput },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: '该账号未注册', userNotFound: true },
        { status: 401 }
      );
    }

    // 检查账号状态
    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: '账号已被暂停使用，请联系管理员' },
        { status: 403 }
      );
    }
    if (user.status === 'BANNED') {
      return NextResponse.json(
        { error: '账号已被封禁，请联系管理员' },
        { status: 403 }
      );
    }

    // 检查锁定
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json(
        { error: '账号已锁定，请稍后再试' },
        { status: 423 }
      );
    }

    // 验证密码
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: '该账号未设置密码，请使用第三方登录（GitHub/Google/X），或前往设置页面绑定邮箱后设置密码', noPassword: true },
        { status: 400 }
      );
    }
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      // 增加失败次数
      const attempts = user.loginAttempts + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: attempts,
          lockedUntil: attempts >= 5
            ? new Date(Date.now() + 15 * 60 * 1000) // 15分钟锁定
            : undefined,
        },
      });

      return NextResponse.json(
        { error: `邮箱或密码错误${attempts >= 3 ? `（已失败${attempts}次）` : ''}` },
        { status: 401 }
      );
    }

    // 登录成功，重置失败次数
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ip,
      },
    });

    // 生成 JWT (access + refresh)
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      tenantId: user.tenantId || undefined,
    };
    const accessToken = signToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    await setAuthCookie(accessToken, refreshToken);

    // 记录审计日志
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        ip,
        userAgent: req.headers.get('user-agent'),
      },
    });

    return NextResponse.json({
      success: true,
      token: accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        avatar: user.avatar,
        locale: user.locale,
      },
    });
  } catch (error: any) {
    console.error('[Login Error]', error);
    return NextResponse.json(
      { error: '登录失败，请稍后再试' },
      { status: 500 }
    );
  }
}
