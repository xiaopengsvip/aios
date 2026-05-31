import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, verifyPassword } from '@/lib/auth';
import prisma from '@/lib/db';
import { clearAuthCookie } from '@/lib/auth';

// 内置保护的数字账号列表 — 不可删除
const BUILTIN_ACCOUNTS = ['000', '0'];

export async function DELETE(req: NextRequest) {
  try {
    const payload = await requireAuth();
    const { password } = await req.json();

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

    // 内置账号不允许删除
    if (user.numericAccount && BUILTIN_ACCOUNTS.includes(user.numericAccount)) {
      return NextResponse.json({ error: '内置系统账号不允许删除' }, { status: 403 });
    }

    if (user.passwordHash) {
      if (!password) return NextResponse.json({ error: '请输入密码确认' }, { status: 400 });
      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) return NextResponse.json({ error: '密码错误' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        action: 'USER_UPDATE',
        resource: 'account_deleted',
        details: { username: user.username, email: user.email },
        ip,
        userAgent: req.headers.get('user-agent'),
      },
    });

    await prisma.user.delete({ where: { id: payload.userId } });
    await clearAuthCookie();

    return NextResponse.json({ success: true, message: '账号已删除' });
  } catch (e: any) {
    if (e?.status === 401) return NextResponse.json({ error: '未登录' }, { status: 401 });
    console.error('[Delete Account Error]', e);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}

// POST = 清除用户数据（保留账号）
export async function POST(req: NextRequest) {
  try {
    const payload = await requireAuth();
    const { password } = await req.json();

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

    if (user.passwordHash) {
      if (!password) return NextResponse.json({ error: '请输入密码确认' }, { status: 400 });
      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) return NextResponse.json({ error: '密码错误' }, { status: 400 });
    }

    await prisma.conversation.deleteMany({ where: { userId: payload.userId } });
    await prisma.file.deleteMany({ where: { userId: payload.userId } });
    await prisma.knowledgeBase.deleteMany({ where: { userId: payload.userId } });

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        action: 'USER_UPDATE',
        resource: 'data_cleared',
        details: {},
        ip,
        userAgent: req.headers.get('user-agent'),
      },
    });

    return NextResponse.json({ success: true, message: '数据已清除' });
  } catch (e: any) {
    if (e?.status === 401) return NextResponse.json({ error: '未登录' }, { status: 401 });
    console.error('[Clear Data Error]', e);
    return NextResponse.json({ error: '清除失败' }, { status: 500 });
  }
}
