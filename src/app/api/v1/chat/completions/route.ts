import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { aiGateway } from '@/lib/ai/gateway';
import { checkRateLimit } from '@/lib/security/crypto';

// POST /v1/chat/completions — OpenAI Compatible API
export async function POST(req: NextRequest) {
  try {
    // Authenticate via Bearer token
    const authHeader = req.headers.get('authorization') || '';
    const apiKey = authHeader.replace(/^Bearer\s+/i, '');
    if (!apiKey) {
      return Response.json({ error: { message: 'Missing API key', type: 'authentication_error' } }, { status: 401 });
    }

    // Find API key in SystemConfig (user keys stored as user_api_key_*)
    const userKeys = await prisma.systemConfig.findMany({
      where: { key: { contains: 'user_api_key_' } },
    });

    let userId: string | null = null;
    for (const cfg of userKeys) {
      const data = cfg.value as any;
      if (data.keyHash === apiKey && data.isActive !== false) {
        userId = cfg.key.split('_')[3]; // user_api_key_{userId}_{keyId}
        break;
      }
    }

    // Also check provider API keys
    if (!userId) {
      const providerKey = await prisma.apiKey.findFirst({
        where: { keyHash: apiKey, status: 'ACTIVE' },
      });
      if (providerKey) {
        userId = 'system';
      }
    }

    if (!userId) {
      return Response.json({ error: { message: 'Invalid API key', type: 'authentication_error' } }, { status: 401 });
    }

    // Rate limiting
    const { allowed } = checkRateLimit(`api:${userId}`, 60, 60000);
    if (!allowed) {
      return Response.json({ error: { message: 'Rate limit exceeded', type: 'rate_limit_error' } }, { status: 429 });
    }

    const body = await req.json();
    const { model, messages, stream = false, temperature = 0.7, max_tokens = 4096 } = body;

    if (!model || !messages?.length) {
      return Response.json({ error: { message: 'Missing model or messages', type: 'invalid_request_error' } }, { status: 400 });
    }

    // Find model in DB
    const dbModel = await prisma.model.findFirst({
      where: { OR: [{ name: model }, { id: model }], isEnabled: true },
    });

    if (!dbModel) {
      return Response.json({ error: { message: `Model '${model}' not found`, type: 'invalid_request_error' } }, { status: 404 });
    }

    const uid = userId === 'system' ? (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))?.id : userId;
    if (!uid) {
      return Response.json({ error: { message: 'No user found', type: 'server_error' } }, { status: 500 });
    }

    if (stream) {
      // Streaming response
      const encoder = new TextEncoder();
      const streamResp = new ReadableStream({
        async start(controller) {
          try {
            const gen = aiGateway.chatStream({
              modelId: dbModel.id,
              userId: uid,
              model: dbModel.name,
              messages,
              temperature,
              maxTokens: max_tokens,
              stream: true,
            });

            for await (const chunk of gen) {
              const sseChunk = {
                id: `chatcmpl-${Date.now()}`,
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model,
                choices: [{ index: 0, delta: { content: chunk.content || '' }, finish_reason: chunk.done ? 'stop' : null }],
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(sseChunk)}\n\n`));
              if (chunk.done) break;
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (e: any) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: { message: e.message } })}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(streamResp, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
      });
    } else {
      // Non-streaming response
      const result = await aiGateway.chat({
        modelId: dbModel.id,
        userId: uid,
        model: dbModel.name,
        messages,
        temperature,
        maxTokens: max_tokens,
      });

      return Response.json({
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [{ index: 0, message: { role: 'assistant', content: result.content }, finish_reason: 'stop' }],
        usage: { prompt_tokens: result.usage.promptTokens, completion_tokens: result.usage.completionTokens, total_tokens: result.usage.totalTokens },
      });
    }
  } catch (error: any) {
    console.error('[v1/chat/completions Error]', error);
    return Response.json({ error: { message: error.message || 'Internal server error', type: 'server_error' } }, { status: 500 });
  }
}
