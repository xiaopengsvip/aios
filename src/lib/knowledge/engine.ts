// ============================================================
// 知识库引擎 - 文档分块 + 相似度搜索
// ============================================================

import prisma from '@/lib/db';

// 文本分块
export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
    if (start >= text.length) break;
  }
  return chunks;
}

// 处理文档 - 分块并存储
export async function processDocument(documentId: string): Promise<void> {
  const doc = await prisma.knowledgeDocument.findUnique({ where: { id: documentId } });
  if (!doc) return;

  await prisma.knowledgeDocument.update({ where: { id: documentId }, data: { status: 'processing' } });

  try {
    const kb = await prisma.knowledgeBase.findUnique({ where: { id: doc.knowledgeBaseId } });
    const chunkSize = kb?.chunkSize || 1000;
    const chunkOverlap = kb?.chunkOverlap || 200;

    const chunks = chunkText(doc.content, chunkSize, chunkOverlap);

    // 存储分块
    for (let i = 0; i < chunks.length; i++) {
      await prisma.knowledgeChunk.create({
        data: {
          documentId,
          content: chunks[i],
          chunkIndex: i,
        },
      });
    }

    // 更新文档状态
    await prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: { status: 'ready', chunkCount: chunks.length },
    });

    // 更新知识库统计
    await prisma.knowledgeBase.update({
      where: { id: doc.knowledgeBaseId },
      data: { chunkCount: { increment: chunks.length } },
    });
  } catch (error: any) {
    await prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: { status: 'error', errorMessage: error.message },
    });
  }
}

// 简单文本相似度搜索 (cosine similarity on TF-IDF)
export async function searchKnowledge(
  knowledgeBaseId: string,
  query: string,
  topK: number = 5
): Promise<{ content: string; score: number; documentId: string }[]> {
  const chunks = await prisma.knowledgeChunk.findMany({
    where: { document: { knowledgeBaseId, status: 'ready' } },
    include: { document: { select: { id: true, title: true } } },
    take: 500, // 限制扫描范围
  });

  // 简单关键词匹配评分 (生产环境应使用向量相似度)
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 1);

  const scored = chunks.map((chunk) => {
    const content = chunk.content.toLowerCase();
    let score = 0;
    for (const word of queryWords) {
      const regex = new RegExp(word, 'gi');
      const matches = content.match(regex);
      if (matches) score += matches.length;
    }
    // 归一化
    score = score / (queryWords.length || 1);
    return { content: chunk.content, score, documentId: chunk.documentId };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
