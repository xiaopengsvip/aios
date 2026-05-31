import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { decrypt } from '@/lib/security/crypto';
import { checkRateLimit } from '@/lib/security/crypto';

// POST /api/images/generate
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const ip = req.headers.get('x-forwarded-for') || 'unknown';

  if (!user) {
    const { allowed } = checkRateLimit(`imggen:${ip}`, 3, 60000);
    if (!allowed) return NextResponse.json({ error: '请求过于频繁' }, { status: 429 });
  }

  try {
    const { prompt, size = '1024x1024', style = 'vivid', model = 'dall-e-3' } = await req.json();
    if (!prompt) return NextResponse.json({ error: '缺少 prompt' }, { status: 400 });

    // Find a provider with image generation support (look for DALL-E or compatible)
    const provider = await prisma.provider.findFirst({
      where: { isEnabled: true, type: { in: ['OPENAI', 'CUSTOM'] } },
      include: { keys: { where: { status: 'ACTIVE', isEnabled: true }, take: 1 } },
    });

    if (!provider || provider.keys.length === 0) {
      return NextResponse.json({ error: '没有可用的图片生成服务' }, { status: 503 });
    }

    const decryptedKey = decrypt(provider.keys[0].keyEncrypted);
    const baseUrl = provider.baseUrl.replace(/\/v1\/?$/, '');

    const response = await fetch(`${baseUrl}/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${decryptedKey}`,
      },
      body: JSON.stringify({ model, prompt, n: 1, size, style, response_format: 'url' }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Image Gen Error]', error);
      return NextResponse.json({ error: `图片生成失败: ${response.status}` }, { status: 502 });
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url || '';
    const revisedPrompt = data.data?.[0]?.revised_prompt || prompt;

    // Log usage
    if (user) {
      await prisma.usageLog.create({
        data: {
          userId: user.id,
          modelId: provider.keys[0].id,
          requestId: crypto.randomUUID(),
          endpoint: 'images/generate',
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          cost: 0,
          providerCost: 0,
          latency: 0,
          apiKeyId: provider.keys[0].id,
          statusCode: 200,
        },
      });
    }

    return NextResponse.json({ url: imageUrl, revised_prompt: revisedPrompt, model });
  } catch (error: any) {
    console.error('[Image Gen Error]', error);
    return NextResponse.json({ error: error.message || '图片生成失败' }, { status: 500 });
  }
}
