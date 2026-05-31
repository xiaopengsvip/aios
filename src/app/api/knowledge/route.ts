import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { processDocument } from '@/lib/knowledge/engine';

// GET /api/knowledge - 获取知识库列表
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const knowledgeBases = await prisma.knowledgeBase.findMany({
    where: { OR: [{ userId: user.id }, { isPublic: true }] },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { documents: true } } },
  });

  return NextResponse.json({ knowledgeBases });
}

// POST /api/knowledge - 创建知识库 或 添加文档
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  if (action === 'create_kb') {
    const { name, description, icon } = body;
    if (!name) return NextResponse.json({ error: '名称必填' }, { status: 400 });
    const kb = await prisma.knowledgeBase.create({
      data: { userId: user.id, name, description, icon },
    });
    return NextResponse.json({ success: true, knowledgeBase: kb });
  }

  if (action === 'add_document') {
    const { knowledgeBaseId, title, content, mimeType } = body;
    if (!knowledgeBaseId || !title || !content) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    const doc = await prisma.knowledgeDocument.create({
      data: {
        knowledgeBaseId,
        title,
        content,
        mimeType: mimeType || 'text/plain',
        size: content.length,
      },
    });

    // 更新文档数
    await prisma.knowledgeBase.update({
      where: { id: knowledgeBaseId },
      data: { documentCount: { increment: 1 } },
    });

    // 异步处理分块
    processDocument(doc.id).catch(console.error);

    return NextResponse.json({ success: true, document: doc });
  }

  if (action === 'search') {
    const { knowledgeBaseId, query, topK } = body;
    const { searchKnowledge } = await import('@/lib/knowledge/engine');
    const results = await searchKnowledge(knowledgeBaseId, query, topK || 5);
    return NextResponse.json({ results });
  }

  return NextResponse.json({ error: '无效的 action' }, { status: 400 });
}
