import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { checkRateLimit } from '@/lib/security/crypto';

// Guest rate limit: 10 requests per minute per IP
const GUEST_RPM = 10;

export async function POST(req: NextRequest) {
  // Try auth, allow guest
  const user = await getCurrentUser();
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  // Guest rate limit
  if (!user) {
    const { allowed } = checkRateLimit(`guest:${ip}`, GUEST_RPM, 60000);
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: '请求过于频繁，请登录后使用' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  try {
    const body = await req.json();
    const { modelId, messages, conversationId } = body;

    if (!modelId || !messages?.length) {
      return new Response(
        JSON.stringify({ error: '缺少必要参数' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 查找模型 — support both DB id and model name
    const model = await prisma.model.findFirst({
      where: { OR: [{ id: modelId }, { name: modelId }], isEnabled: true },
      include: { provider: true },
    });

    if (!model) {
      return new Response(
        JSON.stringify({ error: '模型不可用' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Helper: extract text from multimodal content
    const extractText = (content: any): string => {
      if (typeof content === 'string') return content;
      if (Array.isArray(content)) {
        const textPart = content.find((p: any) => p.type === 'text');
        return textPart?.text || '[附件]';
      }
      return '';
    };

    // 创建或获取会话 (logged-in users only)
    let convId = conversationId;
    if (user && !convId) {
      const lastMsg = messages[messages.length - 1];
      const title = extractText(lastMsg?.content).slice(0, 50) || '新对话';
      const conv = await prisma.conversation.create({
        data: {
          userId: user.id,
          modelId: model.id,
          title,
        },
      });
      convId = conv.id;
    }

    // 保存用户消息 (logged-in only)
    const lastUserMsg = messages[messages.length - 1];
    if (user && convId && lastUserMsg?.role === 'user') {
      await prisma.message.create({
        data: {
          conversationId: convId,
          role: 'USER',
          content: extractText(lastUserMsg.content),
        },
      });
    }

    // 语言跟随
    const locale = user?.locale || 'zh-CN';
    const langHint =
      locale === 'zh-CN'
        ? '请默认使用简体中文回答用户。'
        : 'Please answer in English by default.';

    const fullMessages = [...messages];
    if (fullMessages[0]?.role === 'system') {
      fullMessages[0] = {
        ...fullMessages[0],
        content: `${fullMessages[0].content}\n\n${langHint}`,
      };
    } else {
      fullMessages.unshift({ role: 'system', content: langHint });
    }

    // 获取 API Key
    const keys = await prisma.apiKey.findMany({
      where: {
        providerId: model.providerId,
        status: 'ACTIVE',
        isEnabled: true,
        circuitOpen: false,
      },
      orderBy: { weight: 'desc' },
    });

    if (keys.length === 0) {
      return new Response(
        JSON.stringify({ error: '没有可用的 API Key' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 权重选择
    const totalWeight = keys.reduce((sum, k) => sum + k.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedKey = keys[0];
    for (const key of keys) {
      random -= key.weight;
      if (random <= 0) {
        selectedKey = key;
        break;
      }
    }

    // 解密 Key
    const { decrypt } = await import('@/lib/security/crypto');
    const decryptedKey = decrypt(selectedKey.keyEncrypted);

    // SSE 流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 智能构建 endpoint URL：已含 /v1 或 /v3 则直接拼 /chat/completions
          let endpoint: string;
          const rawBase = model.provider.baseUrl.replace(/\/+$/, '');
          if (/\/v\d+$/.test(rawBase)) {
            endpoint = `${rawBase}/chat/completions`;
          } else {
            endpoint = `${rawBase}/v1/chat/completions`;
          }
          const response = await fetch(endpoint,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${decryptedKey}`,
              },
              body: JSON.stringify({
                model: model.name,
                messages: fullMessages,
                stream: true,
                temperature: 0.7,
                max_tokens: 4096,
              }),
            }
          );

          if (!response.ok) {
            const error = await response.text();
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: `Provider 错误: ${response.status}` })}\n\n`)
            );
            controller.close();
            return;
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let fullContent = '';
          let buffer = '';
          const usageTokens = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                controller.enqueue(encoder.encode(trimmed + '\n\n'));

                if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
                  try {
                    const json = JSON.parse(trimmed.slice(6));
                    fullContent += json.choices?.[0]?.delta?.content || '';
                    if (json.usage) {
                      usageTokens.promptTokens = json.usage.prompt_tokens || 0;
                      usageTokens.completionTokens = json.usage.completion_tokens || 0;
                      usageTokens.totalTokens = json.usage.total_tokens || 0;
                    }
                  } catch {}
                }
              }
            }

            if (buffer.trim()) {
              controller.enqueue(encoder.encode(buffer.trim() + '\n\n'));
            }
          }

          // 保存助手消息 (logged-in only)
          if (user && convId) {
            await prisma.message.create({
              data: {
                conversationId: convId,
                role: 'ASSISTANT',
                content: fullContent,
                promptTokens: usageTokens.promptTokens,
                completionTokens: usageTokens.completionTokens,
                totalTokens: usageTokens.totalTokens,
                modelName: model.name,
                providerName: model.provider.name,
                status: 'COMPLETED',
              },
            });

            await prisma.conversation.update({
              where: { id: convId },
              data: {
                messageCount: { increment: 2 },
                totalTokens: { increment: BigInt(usageTokens.totalTokens) },
                updatedAt: new Date(),
              },
            });
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error: any) {
          console.error('[Stream Error]', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        ...(convId ? { 'X-Conversation-Id': convId } : {}),
      },
    });
  } catch (error: any) {
    console.error('[Chat Error]', error);
    return new Response(
      JSON.stringify({ error: error.message || '聊天请求失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
