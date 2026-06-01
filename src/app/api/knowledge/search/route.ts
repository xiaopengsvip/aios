import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { searchKnowledge } from '@/lib/knowledge/engine';

// POST /api/knowledge/search — TF-IDF vector search with keyword fallback
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { query, knowledgeBaseId, limit = 10 } = await req.json();
    if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

    if (!knowledgeBaseId) {
      return NextResponse.json({ error: 'Missing knowledgeBaseId' }, { status: 400 });
    }

    const results = await searchKnowledge(knowledgeBaseId, query, limit);

    return NextResponse.json({
      results: results.map(r => ({
        id: r.documentId,
        content: r.content,
        document: r.documentTitle || 'Unknown',
        score: Math.round(r.score * 1000) / 1000,
      })),
      searchMethod: results.length > 0 && results[0].score > 0.1 ? 'vector' : 'keyword',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
