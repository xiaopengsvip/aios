import '@/lib/bigint-polyfill';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');

  const where: any = { OR: [{ isPublic: true }, { isBuiltin: true }] };
  if (category) where.category = category;
  if (search) where.OR = [
    { title: { contains: search, mode: 'insensitive' } },
    { description: { contains: search, mode: 'insensitive' } },
  ];

  const [prompts, total] = await Promise.all([
    prisma.prompt.findMany({ where, orderBy: { useCount: 'desc' }, skip: (page-1)*pageSize, take: pageSize }),
    prisma.prompt.count({ where }),
  ]);
  return NextResponse.json({ prompts, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const body = await req.json();
  const { title, content, description, category, tags, isPublic } = body;
  if (!title || !content) return NextResponse.json({ error: '标题和内容必填' }, { status: 400 });
  const prompt = await prisma.prompt.create({
    data: { userId: user.id, title, content, description, category, tags: tags || [], isPublic: isPublic || false },
  });
  return NextResponse.json({ success: true, prompt });
}
