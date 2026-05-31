import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { checkRateLimit } from '@/lib/security/crypto';

// POST /api/multimodal/understand - 图片/音频/视频理解
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const ip = req.headers.get('x-forwarded-for') || 'unknown';

  // Rate limit
  if (!user) {
    const { allowed } = checkRateLimit(`multimodal:${ip}`, 5, 60000);
    if (!allowed) {
      return NextResponse.json({ error: '请求过于频繁' }, { status: 429 });
    }
  }

  try {
    const body = await req.json();
    const { type, imageUrl, imageBase64, audioUrl, videoUrl, prompt, modelId } = body;

    if (!prompt) {
      return NextResponse.json({ error: '缺少 prompt' }, { status: 400 });
    }

    // 优先选择支持 vision 的模型
    const visionModels = [
      'mimo-v2.5',  // MiMo 多模态 (图片/音频/视频理解, 1M context)
      'mimo-v2-omni',  // [即将废弃 6/30] 仍可用, 自动路由到 v2.5
      'doubao-seed-1-6-vision-250815', 'doubao-1-5-vision-pro-32k-250115',
      'doubao-seed-2-0-pro-260215',  // Seed 2.0 也支持视觉
      'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo',
      'claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022',
      'gemini-2.5-pro', 'gemini-2.0-flash',
    ];

    // 先尝试 vision 模型，再 fallback 到指定 modelId
    let model = null;
    for (const vm of visionModels) {
      model = await prisma.model.findFirst({
        where: { name: vm, isEnabled: true },
        include: { provider: true },
      });
      if (model) break;
    }
    // Fallback: 指定的 modelId
    if (!model && modelId) {
      model = await prisma.model.findUnique({
        where: { id: modelId },
        include: { provider: true },
      });
    }
    // Fallback: mimo-v2.5-pro (文本 only)
    if (!model) {
      model = await prisma.model.findFirst({
        where: { name: 'mimo-v2.5-pro', isEnabled: true },
        include: { provider: true },
      });
    }

    if (!model) {
      return NextResponse.json({
        error: '没有可用的多模态模型',
        hint: '请在管理后台添加支持图片理解的 Provider（如 OpenAI GPT-4o、Anthropic Claude、Google Gemini）并配置 API Key',
      }, { status: 400 });
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
      return NextResponse.json({ error: '没有可用的 API Key' }, { status: 503 });
    }

    const { decrypt } = await import('@/lib/security/crypto');
    const decryptedKey = decrypt(keys[0].keyEncrypted);

    // 构建多模态消息
    const content: any[] = [];

    if (type === 'image' && (imageUrl || imageBase64)) {
      content.push({
        type: 'image_url',
        image_url: {
          url: imageUrl || `data:image/jpeg;base64,${imageBase64}`,
        },
      });
    } else if (type === 'audio' && audioUrl) {
      content.push({
        type: 'input_audio',
        input_audio: {
          url: audioUrl,
        },
      });
    } else if (type === 'video' && videoUrl) {
      content.push({
        type: 'video_url',
        video_url: {
          url: videoUrl,
          fps: body.fps || 1,
        },
      });
    }

    content.push({ type: 'text', text: prompt });

    // 调用 API (区分 MiMo 和 OpenAI 兼容认证)
    const baseUrl = model.provider.baseUrl.replace(/\/v1\/?$/, '');
    const isMiMo = model.provider.type === 'CUSTOM' && model.provider.baseUrl.includes('xiaomimimo');
    const isArk = model.provider.type === 'CUSTOM' && model.provider.baseUrl.includes('volces.com');

    let endpoint: string;
    let headers: Record<string, string>;

    if (isMiMo) {
      endpoint = `${baseUrl}/v1/chat/completions`;
      headers = { 'Content-Type': 'application/json', 'api-key': decryptedKey };
    } else if (isArk) {
      // Ark: URL 已含 /v3, 直接拼 /chat/completions
      const rawBase = model.provider.baseUrl.replace(/\/+$/, '');
      endpoint = /\/v\d+$/.test(rawBase) ? `${rawBase}/chat/completions` : `${rawBase}/v1/chat/completions`;
      headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${decryptedKey}` };
    } else {
      endpoint = `${baseUrl}/v1/chat/completions`;
      headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${decryptedKey}` };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model.name,
        messages: [
          {
            role: 'user',
            content,
          },
        ],
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Multimodal Error]', error);
      let errorMsg = `Provider 错误: ${response.status}`;
      try {
        const errData = JSON.parse(error);
        if (errData.error?.message?.includes('image input') || errData.error?.message?.includes('vision')) {
          errorMsg = `模型 ${model.name} 不支持图片理解，请配置支持 Vision 的模型（如 GPT-4o、Claude Sonnet、Gemini）`;
        } else {
          errorMsg = errData.error?.message || errorMsg;
        }
      } catch {}
      return NextResponse.json({ error: errorMsg }, { status: 502 });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || '';

    // 记录使用量
    if (user) {
      await prisma.usageLog.create({
        data: {
          userId: user.id,
          modelId: model.id,
          requestId: crypto.randomUUID(),
          endpoint: 'multimodal/understand',
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
          cost: 0,
          providerCost: 0,
          latency: 0,
          apiKeyId: keys[0].id,
          statusCode: 200,
        },
      });
    }

    return NextResponse.json({
      success: true,
      result,
      model: model.name,
      usage: data.usage,
    });
  } catch (error: any) {
    console.error('[Multimodal Error]', error);
    return NextResponse.json({ error: error.message || '多模态请求失败' }, { status: 500 });
  }
}
