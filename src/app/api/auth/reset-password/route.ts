import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { sendMail, passwordResetEmail } from '@/lib/mail';
import { checkRateLimit } from '@/lib/security/crypto';
import { hashPassword } from '@/lib/auth';

// POST /api/auth/reset-password - 请求重置验证码 或 执行重置
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, code, newPassword } = body;

    const ip = req.headers.get('x-forwarded-for') || 'unknown';

    if (action === 'request') {
      // 请求重置验证码
      if (!email) {
        return NextResponse.json({ error: '请输入邮箱' }, { status: 400 });
      }

      // 限流
      const rateLimit = checkRateLimit(`reset:${email}`, 3, 300000);
      if (!rateLimit.allowed) {
        return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
      }

      // 检查用户是否存在
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        // 不泄露用户是否存在
        return NextResponse.json({ success: true, message: '如果该邮箱已注册，您将收到重置验证码' });
      }

      // 生成验证码
      const resetCode = Math.random().toString().slice(2, 8);

      // 保存验证码 (type=PASSWORD_RESET)
      await prisma.emailVerification.create({
        data: {
          email,
          code: resetCode,
          type: 'PASSWORD_RESET',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10分钟有效
        },
      });

      // 发送邮件
      const { subject, html } = passwordResetEmail(user.username, resetCode);
      await sendMail({ to: email, subject, html });

      return NextResponse.json({ success: true, message: '如果该邮箱已注册，您将收到重置验证码' });
    }

    if (action === 'confirm') {
      // 确认重置
      if (!email || !code || !newPassword) {
        return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: '密码至少6位' }, { status: 400 });
      }

      // 验证码校验
      const verification = await prisma.emailVerification.findFirst({
        where: {
          email,
          code,
          type: 'PASSWORD_RESET',
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!verification) {
        return NextResponse.json({ error: '验证码无效或已过期' }, { status: 400 });
      }

      // 更新密码
      const hashedPassword = await hashPassword(newPassword);
      await prisma.user.update({
        where: { email },
        data: { passwordHash: hashedPassword },
      });

      // 删除已使用的验证码
      await prisma.emailVerification.delete({
        where: { id: verification.id },
      });

      return NextResponse.json({ success: true, message: '密码已重置，请使用新密码登录' });
    }

    return NextResponse.json({ error: '无效的 action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Reset Password Error]', error);
    return NextResponse.json({ error: '操作失败，请稍后再试' }, { status: 500 });
  }
}
