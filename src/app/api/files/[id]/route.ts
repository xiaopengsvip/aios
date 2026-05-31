import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { unlink } from 'fs/promises';

// DELETE /api/files/[id] - 删除文件
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;

  const file = await prisma.file.findFirst({
    where: { id, userId: user.id },
  });

  if (!file) {
    return NextResponse.json({ error: '文件不存在' }, { status: 404 });
  }

  // 删除物理文件
  try {
    await unlink(file.path);
  } catch {
    // 文件可能已被删除，忽略错误
  }

  // 删除数据库记录
  await prisma.file.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
