import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - 获取当前用户的 numericAccount
export async function GET() {
  try {
    const payload = await requireAuth();
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { numericAccount: true, role: true },
    });
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    return NextResponse.json({ numericAccount: user.numericAccount, role: user.role });
  } catch (e: any) {
    if (e?.status === 401) return NextResponse.json({ error: '未登录' }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH - 超级管理员分配 numericAccount
export async function PATCH(req: NextRequest) {
  try {
    const payload = await requireAuth();
    const caller = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true },
    });
    const { userId: targetUserId, numericAccount } = await req.json();
    if (!numericAccount) return NextResponse.json({ error: '请输入数字账号' }, { status: 400 });
    if (!/^\d{1,16}$/.test(numericAccount)) return NextResponse.json({ error: '数字账号为纯数字' }, { status: 400 });
    if (numericAccount.length <= 4 && caller?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: '3-4 位数字账号仅超级管理员可分配' }, { status: 403 });
    }
    const existing = await prisma.user.findFirst({
      where: { numericAccount, id: { not: targetUserId || payload.userId } },
    });
    if (existing) return NextResponse.json({ error: '该数字账号已被使用' }, { status: 409 });
    await prisma.user.update({
      where: { id: targetUserId || payload.userId },
      data: { numericAccount },
    });
    return NextResponse.json({ success: true, numericAccount });
  } catch (e: any) {
    if (e?.status === 401) return NextResponse.json({ error: '未登录' }, { status: 401 });
    return NextResponse.json({ error: '分配失败' }, { status: 500 });
  }
}
