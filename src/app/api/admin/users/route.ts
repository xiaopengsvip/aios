import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET - List users (paginated, filterable)
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          displayName: true,
          avatar: true,
          balance: true,
          creditLimit: true,
          totalSpent: true,
          lastLoginAt: true,
          lastLoginIp: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, page, pageSize });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[Admin Users GET]', error);
    return NextResponse.json({ error: '获取用户列表失败' }, { status: 500 });
  }
}

// PATCH - Update user role/status
export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { userId, role, status } = body;

    if (!userId) {
      return NextResponse.json({ error: '缺少用户 ID' }, { status: 400 });
    }

    // Prevent self-modification of role
    if (userId === admin.userId && role && role !== admin.role) {
      return NextResponse.json({ error: '不能修改自己的角色' }, { status: 400 });
    }

    // Only SUPER_ADMIN can promote to ADMIN/SUPER_ADMIN
    if (role && (role === 'ADMIN' || role === 'SUPER_ADMIN') && admin.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: '只有超级管理员可以设置管理员角色' }, { status: 403 });
    }

    const updateData: any = {};
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.userId,
        action: 'USER_UPDATE',
        resource: 'user',
        resourceId: userId,
        details: { changes: updateData },
        ip: req.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[Admin Users PATCH]', error);
    return NextResponse.json({ error: '更新用户失败' }, { status: 500 });
  }
}
