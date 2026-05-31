import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET /api/auth/profile - 获取当前用户详细资料
export async function GET() {
  try {
    const payload = await requireAuth();
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatar: true,
        bio: true,
        locale: true,
        timezone: true,
        role: true,
        twoFactorEnabled: true,
        balance: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }
}

// PATCH /api/auth/profile - 更新当前用户资料
export async function PATCH(req: NextRequest) {
  try {
    const payload = await requireAuth();
    const body = await req.json();
    const { displayName, username, email, bio, locale, timezone } = body;

    const data: Record<string, any> = {};
    if (displayName !== undefined) data.displayName = displayName;
    if (bio !== undefined) data.bio = bio;
    if (locale !== undefined) data.locale = locale;
    if (timezone !== undefined) data.timezone = timezone;

    // username 唯一性检查
    if (username !== undefined) {
      const existing = await prisma.user.findFirst({
        where: { username, id: { not: payload.userId } },
      });
      if (existing) return NextResponse.json({ error: '用户名已存在' }, { status: 409 });
      data.username = username;
    }

    // email 唯一性检查
    if (email !== undefined && email !== '') {
      const existing = await prisma.user.findFirst({
        where: { email, id: { not: payload.userId } },
      });
      if (existing) return NextResponse.json({ error: '邮箱已被使用' }, { status: 409 });
      data.email = email;
    }

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatar: true,
        bio: true,
        locale: true,
        timezone: true,
      },
    });

    return NextResponse.json({ user });
  } catch (e: any) {
    if (e?.status === 401) return NextResponse.json({ error: '未登录' }, { status: 401 });
    console.error('[Profile Update Error]', e);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
