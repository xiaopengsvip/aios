// ============================================================
// 统一流式响应处理
// ============================================================

import type { ChatChunk } from './providers';

/**
 * 将 AsyncGenerator<ChatChunk> 转换为 ReadableStream (SSE 格式)
 * 可直接用于 Next.js Response
 */
export function chatChunkToSSEStream(
  generator: AsyncGenerator<ChatChunk>
): ReadableStream {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of generator) {
          const data = `data: ${JSON.stringify(chunk)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error: any) {
        const errorChunk = `data: ${JSON.stringify({ error: error.message })}\n\n`;
        controller.enqueue(encoder.encode(errorChunk));
        controller.close();
      }
    },
  });
}

/**
 * 从 SSE 流读取 ChatChunk
 * 用于客户端消费
 */
export async function* readSSEStream(
  response: Response
): AsyncGenerator<ChatChunk> {
  if (!response.body) return;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      if (data === '[DONE]') return;

      try {
        yield JSON.parse(data) as ChatChunk;
      } catch {
        // skip invalid JSON
      }
    }
  }
}

/**
 * 收集所有流式 chunks 并返回最终结果
 */
export async function collectStream(
  generator: AsyncGenerator<ChatChunk>
): Promise<{ content: string; usage?: ChatChunk['usage'] }> {
  const chunks: string[] = [];
  let usage: ChatChunk['usage'] | undefined;

  for await (const chunk of generator) {
    if (chunk.content) chunks.push(chunk.content);
    if (chunk.usage) usage = chunk.usage;
    if (chunk.done) break;
  }

  return { content: chunks.join(''), usage };
}
