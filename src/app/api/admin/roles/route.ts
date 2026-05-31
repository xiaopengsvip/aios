import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'aios-jwt-secret-change-me';

async function getUser(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('aios_token')?.value;
  if (!token) return null;
  
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    return payload;
  } catch {
    return null;
  }
}

// GET /api/admin/roles - 获取所有角色
export async function GET(request: NextRequest) {
  const user = await getUser(request);
  if (!user || !['SUPER_ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  try {
    const roles = await prisma.roleDefinition.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    return NextResponse.json({ error: '获取角色失败' }, { status: 500 });
  }
}

// POST /api/admin/roles - 创建新角色
export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user || user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: '仅超级管理员可创建角色' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, label, description, permissions, color } = body;

    if (!name || !label) {
      return NextResponse.json({ error: '角色标识和名称必填' }, { status: 400 });
    }

    // Validate name format (lowercase, numbers, underscores)
    if (!/^[a-z][a-z0-9_]*$/.test(name)) {
      return NextResponse.json({ error: '角色标识只能包含小写字母、数字和下划线' }, { status: 400 });
    }

    // Check if name already exists
    const existing = await prisma.roleDefinition.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json({ error: '角色标识已存在' }, { status: 409 });
    }

    const role = await prisma.roleDefinition.create({
      data: {
        name,
        label,
        description: description || null,
        permissions: permissions || [],
        color: color || 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        isSystem: false,
        sortOrder: 100,
      },
    });

    return NextResponse.json({ role }, { status: 201 });
  } catch (error) {
    console.error('Failed to create role:', error);
    return NextResponse.json({ error: '创建角色失败' }, { status: 500 });
  }
}

// PUT /api/admin/roles - 更新角色
export async function PUT(request: NextRequest) {
  const user = await getUser(request);
  if (!user || user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: '仅超级管理员可修改角色' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, label, description, permissions, color, sortOrder } = body;

    if (!id) {
      return NextResponse.json({ error: '角色ID必填' }, { status: 400 });
    }

    const existing = await prisma.roleDefinition.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: '角色不存在' }, { status: 404 });
    }

    if (existing.isSystem) {
      return NextResponse.json({ error: '系统内置角色不可修改' }, { status: 403 });
    }

    const role = await prisma.roleDefinition.update({
      where: { id },
      data: {
        label: label || existing.label,
        description: description !== undefined ? description : existing.description,
        permissions: permissions || existing.permissions,
        color: color || existing.color,
        sortOrder: sortOrder !== undefined ? sortOrder : existing.sortOrder,
      },
    });

    return NextResponse.json({ role });
  } catch (error) {
    console.error('Failed to update role:', error);
    return NextResponse.json({ error: '更新角色失败' }, { status: 500 });
  }
}

// DELETE /api/admin/roles - 删除角色 (软删除)
export async function DELETE(request: NextRequest) {
  const user = await getUser(request);
  if (!user || user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: '仅超级管理员可删除角色' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '角色ID必填' }, { status: 400 });
    }

    const existing = await prisma.roleDefinition.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: '角色不存在' }, { status: 404 });
    }

    if (existing.isSystem) {
      return NextResponse.json({ error: '系统内置角色不可删除' }, { status: 403 });
    }

    // Check if role has users
    const userCount = await prisma.user.count({
      where: { customRoleId: id },
    });

    if (userCount > 0) {
      return NextResponse.json({ error: `该角色下还有 ${userCount} 个用户，请先移除用户` }, { status: 409 });
    }

    // Soft delete
    await prisma.roleDefinition.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete role:', error);
    return NextResponse.json({ error: '删除角色失败' }, { status: 500 });
  }
}
