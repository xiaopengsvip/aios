import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { decrypt } from '@/lib/security/crypto';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const body = await req.json();
  const { text, voice, speed, format, modelId, style } = body;
  if (!text) return NextResponse.json({ error: '请输入文本' }, { status: 400 });

  // Find TTS model (mimo-v2.5-tts series)
  let model;
  if (modelId) {
    model = await prisma.model.findUnique({ where: { id: modelId }, include: { provider: true } });
  } else {
    // 优先小米 MiMo TTS，再 fallback 其他
    const ttsPriority = ['mimo-v2.5-tts', 'mimo-v2.5-tts-voiceclone', 'mimo-v2.5-tts-voicedesign'];
    for (const ttsName of ttsPriority) {
      model = await prisma.model.findFirst({
        where: { isEnabled: true, name: ttsName },
        include: { provider: true },
      });
      if (model) break;
    }
    // Fallback: 任意 TTS 模型
    if (!model) {
      model = await prisma.model.findFirst({
        where: { isEnabled: true, name: { contains: 'tts', mode: 'insensitive' } },
        include: { provider: true },
      });
    }
  }

  if (!model) {
    return NextResponse.json({
      error: '暂无可用的语音合成服务',
      hint: '需要接入 MiMo V2.5 TTS 或 OpenAI TTS。请在管理后台配置。',
    }, { status: 400 });
  }

  const keys = await prisma.apiKey.findMany({
    where: { providerId: model.providerId, status: 'ACTIVE', isEnabled: true, circuitOpen: false },
    orderBy: { weight: 'desc' },
  });
  if (keys.length === 0) return NextResponse.json({ error: '无可用 API Key' }, { status: 500 });

  const apiKey = decrypt(keys[0].keyEncrypted);
  const baseUrl = model.provider.baseUrl.replace(/\/v1\/?$/, '');

  try {
    // MiMo TTS 使用 chat completions 端点
    // target text 放在 assistant message, style instruction 放在 user message
    const messages: any[] = [];

    if (style) {
      messages.push({ role: 'user', content: style });
    }

    messages.push({ role: 'assistant', content: text.slice(0, 4096) });

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        model: model.name,
        messages,
        stream: false,
        audio: {
          format: format || 'wav',
          voice: voice || 'Chloe',
        },
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[TTS API Error]', response.status, err);
      return NextResponse.json({ error: `语音生成失败: ${response.status}` }, { status: 502 });
    }

    const data = await response.json();
    const audioBase64 = data.choices?.[0]?.message?.audio?.data;
    const audioUrl = data.choices?.[0]?.message?.audio?.url;

    if (audioUrl) {
      // Return URL directly
      return NextResponse.json({ url: audioUrl, model: model.name });
    }

    if (audioBase64) {
      // Decode base64 and return as audio
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': format === 'wav' ? 'audio/wav' : 'audio/mpeg',
          'Content-Length': audioBuffer.length.toString(),
        },
      });
    }

    return NextResponse.json({ error: '未返回音频数据' }, { status: 502 });
  } catch (error: any) {
    if (error.name === 'TimeoutError') {
      return NextResponse.json({ error: '语音生成超时' }, { status: 504 });
    }
    console.error('[TTS Generate Error]', error);
    return NextResponse.json({ error: error.message || '生成失败' }, { status: 500 });
  }
}
