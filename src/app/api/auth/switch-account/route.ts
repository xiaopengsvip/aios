import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: '缺少用户 ID' }, { status: 400 });
    }

    // Verify the target user exists and is active
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true, role: true, username: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    if (targetUser.status === 'BANNED') {
      return NextResponse.json({ error: '该账号已被封禁' }, { status: 403 });
    }

    if (targetUser.status === 'SUSPENDED') {
      return NextResponse.json({ error: '该账号已被暂停' }, { status: 403 });
    }

    // Sign a new JWT for the target user
    const token = signToken({
      userId: targetUser.id,
      username: targetUser.username,
      role: targetUser.role,
    });

    // Set the new JWT cookie
    const cookieStore = await cookies();
    cookieStore.set('aios_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Switch account error:', error);
    return NextResponse.json({ error: '切换失败，请重试' }, { status: 500 });
  }
}
