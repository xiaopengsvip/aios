import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/search?q=xxx - 全局搜索
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  if (!q) return NextResponse.json({ results: [] });

  const [conversations, files, prompts, agents] = await Promise.all([
    prisma.conversation.findMany({
      where: { userId: user.id, title: { contains: q, mode: 'insensitive' } },
      take: 5, orderBy: { updatedAt: 'desc' },
    }),
    prisma.file.findMany({
      where: { userId: user.id, originalName: { contains: q, mode: 'insensitive' } },
      take: 5, orderBy: { createdAt: 'desc' },
    }),
    prisma.prompt.findMany({
      where: { OR: [{ isPublic: true }, { isBuiltin: true }], title: { contains: q, mode: 'insensitive' } as any },
      take: 5, orderBy: { useCount: 'desc' },
    }),
    prisma.agent.findMany({
      where: { OR: [{ userId: user.id }, { isPublic: true }], name: { contains: q, mode: 'insensitive' } },
      take: 5, orderBy: { runCount: 'desc' },
    }),
  ]);

  const results = [
    ...conversations.map((c) => ({ type: 'conversation', id: c.id, title: c.title, updatedAt: c.updatedAt })),
    ...files.map((f) => ({ type: 'file', id: f.id, title: f.originalName, size: Number(f.size), createdAt: f.createdAt })),
    ...prompts.map((p) => ({ type: 'prompt', id: p.id, title: p.title, category: p.category })),
    ...agents.map((a) => ({ type: 'agent', id: a.id, title: a.name, runCount: Number(a.runCount) })),
  ];

  return NextResponse.json({ results, total: results.length });
}
