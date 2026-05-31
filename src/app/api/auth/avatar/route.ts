import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const payload = await requireAuth();
    const formData = await req.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: '请选择头像文件' }, { status: 400 });
    }

    // 限制 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: '头像文件不能超过 5MB' }, { status: 400 });
    }

    // 只允许图片
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: '只支持 JPG/PNG/GIF/WEBP 格式' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${payload.userId}-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');

    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;

    await prisma.user.update({
      where: { id: payload.userId },
      data: { avatar: avatarUrl },
    });

    return NextResponse.json({ avatar: avatarUrl });
  } catch (e: any) {
    if (e?.status === 401) return NextResponse.json({ error: '未登录' }, { status: 401 });
    console.error('[Avatar Upload Error]', e);
    return NextResponse.json({ error: '上传失败' }, { status: 500 });
  }
}
