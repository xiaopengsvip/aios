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
      'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo',
      'claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022', 'claude-3-opus',
      'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-pro',
      'qwen-vl-max', 'qwen-vl-plus',
    ];

    // 先尝试 vision 模型，再 fallback 到指定 modelId
    const model = await prisma.model.findFirst({
      where: {
        OR: [
          ...(modelId ? [{ id: modelId }] : []),
          ...visionModels.map(name => ({ name, isEnabled: true })),
          { name: 'mimo-v2.5-pro' },
        ],
        isEnabled: true,
      },
      include: { provider: true },
      orderBy: { name: 'asc' },  // 稳定排序
    });

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

    // 调用 MiMo API
    const baseUrl = model.provider.baseUrl.replace(/\/v1\/?$/, '');
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': decryptedKey,
      },
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
