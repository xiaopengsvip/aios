import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { sendMail, verificationEmail } from '@/lib/mail';
import { checkRateLimit, generateToken } from '@/lib/security/crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, type = 'REGISTER' } = body;

    if (!email) {
      return NextResponse.json({ error: '请输入邮箱' }, { status: 400 });
    }

    // 限流
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(`code:${email}`, 3, 300000); // 5分钟3次
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: '验证码发送过于频繁，请稍后再试' },
        { status: 429 }
      );
    }

    // 生成6位验证码
    const code = Math.random().toString().slice(2, 8);

    // 保存验证码
    await prisma.emailVerification.create({
      data: {
        email,
        code,
        type,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5分钟有效
      },
    });

    // 发送邮件
    const locale = req.headers.get('accept-language')?.includes('en')
      ? 'en-US'
      : 'zh-CN';
    const { subject, html } = verificationEmail(code, locale);
    const sent = await sendMail({ to: email, subject, html });

    if (!sent) {
      return NextResponse.json(
        { error: '邮件发送失败，请稍后再试' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: '验证码已发送' });
  } catch (error: any) {
    console.error('[Send Code Error]', error);
    return NextResponse.json(
      { error: '发送失败，请稍后再试' },
      { status: 500 }
    );
  }
}
