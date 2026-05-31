import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { decrypt } from '@/lib/security/crypto';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const body = await req.json();
  const { text, voice, speed, format, modelId } = body;
  if (!text) return NextResponse.json({ error: '请输入文本' }, { status: 400 });

  // Find TTS model
  let model;
  if (modelId) {
    model = await prisma.model.findUnique({ where: { id: modelId }, include: { provider: true } });
  } else {
    model = await prisma.model.findFirst({
      where: { isEnabled: true, OR: [
        { name: { contains: 'tts', mode: 'insensitive' } },
        { name: { contains: 'speech', mode: 'insensitive' } },
        { name: { contains: 'audio', mode: 'insensitive' } },
      ]},
      include: { provider: true },
    });
    // Fallback to OpenAI-compatible provider
    if (!model) {
      model = await prisma.model.findFirst({
        where: { isEnabled: true, provider: { baseUrl: { contains: 'openai', mode: 'insensitive' } } },
        include: { provider: true },
      });
    }
  }

  if (!model) {
    return NextResponse.json({
      error: '暂无可用的 TTS 模型，请在管理后台配置语音模型',
    }, { status: 400 });
  }

  const keys = await prisma.apiKey.findMany({
    where: { providerId: model.providerId, status: 'ACTIVE', isEnabled: true, circuitOpen: false },
    orderBy: { weight: 'desc' },
  });
  if (keys.length === 0) return NextResponse.json({ error: '无可用 API Key' }, { status: 500 });

  const apiKey = decrypt(keys[0].keyEncrypted);
  const baseUrl = model.provider.baseUrl.replace(/\/v1\/?$/, '');
  const ttsModel = model.name.includes('tts') ? model.name : 'tts-1';

  try {
    const response = await fetch(`${baseUrl}/v1/audio/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: ttsModel,
        input: text.slice(0, 4096),
        voice: voice || 'alloy',
        speed: speed || 1.0,
        response_format: format || 'mp3',
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[TTS API Error]', response.status, err);
      return NextResponse.json({ error: `语音生成失败: ${response.status}` }, { status: 500 });
    }

    const audioBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'audio/mpeg';

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error: any) {
    if (error.name === 'TimeoutError') {
      return NextResponse.json({ error: '语音生成超时' }, { status: 504 });
    }
    console.error('[TTS Generate Error]', error);
    return NextResponse.json({ error: error.message || '生成失败' }, { status: 500 });
  }
}
