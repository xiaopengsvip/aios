// ============================================================
// 知识库引擎 - 文档分块 + TF-IDF 向量搜索 + Embedding 回退
// ============================================================

import prisma from '@/lib/db';

// ─── 文本分块 ───────────────────────────────────────────────

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

// ─── TF-IDF 向量化 ─────────────────────────────────────────

/** 简单分词: 中文按字, 英文按词 */
function tokenize(text: string): string[] {
  const lower = text.toLowerCase();
  // 英文单词 + 中文单字 + 数字
  const tokens = lower.match(/[\u4e00-\u9fff]|[a-z]+|[0-9]+/g) || [];
  return tokens;
}

/** 计算 TF (term frequency) 向量 */
function computeTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) {
    tf.set(t, (tf.get(t) || 0) + 1);
  }
  // 归一化
  const len = tokens.length || 1;
  for (const [k, v] of tf) tf.set(k, v / len);
  return tf;
}

/** 计算 IDF (inverse document frequency) */
function computeIDF(documents: string[][]): Map<string, number> {
  const df = new Map<string, number>();
  const n = documents.length;
  for (const doc of documents) {
    const seen = new Set(doc);
    for (const t of seen) df.set(t, (df.get(t) || 0) + 1);
  }
  const idf = new Map<string, number>();
  for (const [t, freq] of df) {
    idf.set(t, Math.log((n + 1) / (freq + 1)) + 1);
  }
  return idf;
}

/** 将 TF 向量转为稀疏 JSON 存储 */
function tfToEmbedding(tf: Map<string, number>, idf: Map<string, number>): Record<string, number> {
  const embedding: Record<string, number> = {};
  for (const [term, tfVal] of tf) {
    const idfVal = idf.get(term) || 1;
    embedding[term] = tfVal * idfVal;
  }
  return embedding;
}

/** 余弦相似度 (稀疏向量) */
function cosineSimilarity(a: Record<string, number>, b: Record<string, number>): number {
  let dot = 0, normA = 0, normB = 0;
  for (const [k, v] of Object.entries(a)) {
    normA += v * v;
    if (b[k]) dot += v * b[k];
  }
  for (const v of Object.values(b)) normB += v * v;
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ─── 文档处理 ───────────────────────────────────────────────

export async function processDocument(documentId: string): Promise<void> {
  const doc = await prisma.knowledgeDocument.findUnique({ where: { id: documentId } });
  if (!doc) return;

  await prisma.knowledgeDocument.update({ where: { id: documentId }, data: { status: 'processing' } });

  try {
    const kb = await prisma.knowledgeBase.findUnique({ where: { id: doc.knowledgeBaseId } });
    const chunkSize = kb?.chunkSize || 1000;
    const chunkOverlap = kb?.chunkOverlap || 200;

    const chunks = chunkText(doc.content, chunkSize, chunkOverlap);
    const tokenizedChunks = chunks.map(c => tokenize(c));

    // 计算全局 IDF
    const idf = computeIDF(tokenizedChunks);

    // 为每个 chunk 计算 TF-IDF embedding 并存储
    for (let i = 0; i < chunks.length; i++) {
      const tf = computeTF(tokenizedChunks[i]);
      const embedding = tfToEmbedding(tf, idf);

      await prisma.knowledgeChunk.create({
        data: {
          documentId,
          content: chunks[i],
          chunkIndex: i,
          embedding: embedding as any, // Json field
        },
      });
    }

    await prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: { status: 'ready', chunkCount: chunks.length },
    });

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

// ─── 向量搜索 ───────────────────────────────────────────────

export async function searchKnowledge(
  knowledgeBaseId: string,
  query: string,
  topK: number = 5
): Promise<{ content: string; score: number; documentId: string; documentTitle?: string }[]> {
  const chunks = await prisma.knowledgeChunk.findMany({
    where: { document: { knowledgeBaseId, status: 'ready' } },
    include: { document: { select: { id: true, title: true } } },
    take: 2000,
  });

  if (chunks.length === 0) return [];

  // 检查是否有 embedding 数据
  const hasEmbeddings = chunks.some(c => c.embedding && Object.keys(c.embedding as object).length > 0);

  if (hasEmbeddings) {
    // ── TF-IDF 向量搜索 ──
    const queryTokens = tokenize(query);
    // 用已有 chunk 的词汇构建 query 的 TF-IDF 向量
    const idf = new Map<string, number>();
    const df = new Map<string, number>();
    const n = chunks.length;

    for (const chunk of chunks) {
      const emb = chunk.embedding as Record<string, number> || {};
      for (const t of Object.keys(emb)) {
        df.set(t, (df.get(t) || 0) + 1);
      }
    }
    for (const [t, freq] of df) {
      idf.set(t, Math.log((n + 1) / (freq + 1)) + 1);
    }

    const queryTF = computeTF(queryTokens);
    const queryEmbedding = tfToEmbedding(queryTF, idf);

    const scored = chunks.map(chunk => {
      const emb = (chunk.embedding as Record<string, number>) || {};
      const score = cosineSimilarity(queryEmbedding, emb);
      return {
        content: chunk.content,
        score,
        documentId: chunk.documentId,
        documentTitle: chunk.document?.title,
      };
    });

    return scored
      .filter(s => s.score > 0.01)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  // ── 回退: 关键词搜索 ──
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);

  const scored = chunks.map(chunk => {
    const content = chunk.content.toLowerCase();
    let score = 0;
    for (const word of queryWords) {
      const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = content.match(regex);
      if (matches) score += matches.length;
    }
    score = score / (queryWords.length || 1);
    return {
      content: chunk.content,
      score,
      documentId: chunk.documentId,
      documentTitle: chunk.document?.title,
    };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// ─── 重新计算所有 chunk 的 embedding ────────────────────────

export async function recomputeEmbeddings(knowledgeBaseId: string): Promise<number> {
  const chunks = await prisma.knowledgeChunk.findMany({
    where: { document: { knowledgeBaseId } },
    orderBy: { chunkIndex: 'asc' },
  });

  if (chunks.length === 0) return 0;

  const tokenizedChunks = chunks.map(c => tokenize(c.content));
  const idf = computeIDF(tokenizedChunks);

  let updated = 0;
  for (let i = 0; i < chunks.length; i++) {
    const tf = computeTF(tokenizedChunks[i]);
    const embedding = tfToEmbedding(tf, idf);
    await prisma.knowledgeChunk.update({
      where: { id: chunks[i].id },
      data: { embedding: embedding as any },
    });
    updated++;
  }

  return updated;
}
