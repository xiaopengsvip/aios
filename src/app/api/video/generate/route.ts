import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { decrypt } from '@/lib/security/crypto';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const body = await req.json();
  const { prompt, modelId, duration, resolution, aspectRatio } = body;
  if (!prompt) return NextResponse.json({ error: '请输入提示词' }, { status: 400 });

  // Find a video-capable model
  let model;
  if (modelId) {
    model = await prisma.model.findUnique({ where: { id: modelId }, include: { provider: true } });
  } else {
    model = await prisma.model.findFirst({
      where: { isEnabled: true, OR: [
        { name: { contains: 'sora', mode: 'insensitive' } },
        { name: { contains: 'kling', mode: 'insensitive' } },
        { name: { contains: 'runway', mode: 'insensitive' } },
        { name: { contains: 'video', mode: 'insensitive' } },
        { name: { contains: 'cogvideo', mode: 'insensitive' } },
        { name: { contains: 'pika', mode: 'insensitive' } },
      ]},
      include: { provider: true },
    });
  }

  if (!model) {
    return NextResponse.json({
      error: '暂无可用的视频生成模型，请在管理后台配置视频模型（如 Sora、Kling、CogVideoX 等）',
    }, { status: 400 });
  }

  // Get API key
  const keys = await prisma.apiKey.findMany({
    where: { providerId: model.providerId, status: 'ACTIVE', isEnabled: true, circuitOpen: false },
    orderBy: { weight: 'desc' },
  });
  if (keys.length === 0) return NextResponse.json({ error: '无可用 API Key' }, { status: 500 });

  const apiKey = decrypt(keys[0].keyEncrypted);
  const baseUrl = model.provider.baseUrl.replace(/\/v1\/?$/, '');

  try {
    // Call provider's video generation API
    const response = await fetch(`${baseUrl}/v1/video/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model.name,
        prompt,
        duration: duration || '5s',
        resolution: resolution || '720p',
        aspect_ratio: aspectRatio || '16:9',
      }),
      signal: AbortSignal.timeout(180000), // 3 min timeout for video generation
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[Video API Error]', response.status, err);
      return NextResponse.json({ error: `视频生成失败: ${response.status}` }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      video: {
        url: data.data?.[0]?.url || data.url || data.video_url || '',
        taskId: data.id || data.task_id || null,
        status: 'completed',
      },
    });
  } catch (error: any) {
    if (error.name === 'TimeoutError') {
      return NextResponse.json({ error: '视频生成超时，请稍后重试' }, { status: 504 });
    }
    console.error('[Video Generate Error]', error);
    return NextResponse.json({ error: error.message || '生成失败' }, { status: 500 });
  }
}
