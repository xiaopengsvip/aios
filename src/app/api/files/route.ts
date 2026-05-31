import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// GET /api/files - 获取文件列表
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const type = searchParams.get('type'); // image, video, audio, etc.
  const search = searchParams.get('search');

  const where: any = { userId: user.id };
  if (type) {
    where.mimeType = { startsWith: type };
  }
  if (search) {
    where.originalName = { contains: search, mode: 'insensitive' };
  }

  const [files, total] = await Promise.all([
    prisma.file.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.file.count({ where }),
  ]);

  return NextResponse.json({
    files: files.map((f) => ({
      ...f,
      size: Number(f.size),
    })),
    total,
    page,
    pageSize,
  });
}

// POST /api/files - 上传文件
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: '没有文件' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '文件超过50MB限制' }, { status: 400 });
    }

    // 生成唯一文件名
    const ext = file.name.split('.').pop() || '';
    const filename = `${randomUUID()}.${ext}`;
    const userDir = join(UPLOAD_DIR, user.id);
    const filePath = join(userDir, filename);

    // 确保用户目录存在
    await mkdir(userDir, { recursive: true });

    // 写入文件
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // 保存到数据库
    const url = `/uploads/${user.id}/${filename}`;
    const savedFile = await prisma.file.create({
      data: {
        userId: user.id,
        filename,
        originalName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: BigInt(file.size),
        path: filePath,
        url,
        storageType: 'local',
      },
    });

    return NextResponse.json({
      success: true,
      file: {
        ...savedFile,
        size: Number(savedFile.size),
      },
    });
  } catch (error: any) {
    console.error('[File Upload Error]', error);
    return NextResponse.json({ error: error.message || '上传失败' }, { status: 500 });
  }
}
