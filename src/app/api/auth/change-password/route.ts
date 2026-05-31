import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, verifyPassword, hashPassword } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const payload = await requireAuth();
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: '请填写当前密码和新密码' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: '新密码至少 8 位' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: '该账号未设置密码（第三方登录用户请先绑定邮箱）' }, { status: 400 });
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: '当前密码错误' }, { status: 400 });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: payload.userId },
      data: { passwordHash },
    });

    // 记录审计日志
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        action: 'PASSWORD_CHANGE',
        resource: 'user',
        details: {},
        ip,
        userAgent: req.headers.get('user-agent'),
      },
    });

    return NextResponse.json({ success: true, message: '密码已更新' });
  } catch (e: any) {
    if (e?.status === 401) return NextResponse.json({ error: '未登录' }, { status: 401 });
    console.error('[Change Password Error]', e);
    return NextResponse.json({ error: '修改失败' }, { status: 500 });
  }
}
