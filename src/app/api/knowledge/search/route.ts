import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// POST /api/knowledge/search — keyword-based search (vector search requires pgvector setup)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { query, knowledgeBaseId, limit = 10 } = await req.json();
    if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

    const where: any = {
      knowledgeBase: { userId: user.id },
      content: { contains: query, mode: 'insensitive' },
    };
    if (knowledgeBaseId) where.knowledgeBaseId = knowledgeBaseId;

    const chunks = await prisma.knowledgeChunk.findMany({
      where,
      take: limit,
      include: { document: { select: { title: true, mimeType: true } } },
    });

    return NextResponse.json({
      results: chunks.map((c) => ({
        id: c.id,
        content: c.content,
        document: c.document.title,
        source: c.document.mimeType,
        chunkIndex: c.chunkIndex,
        score: 0.5 + Math.random() * 0.5, // Placeholder score
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
