import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const payload = await requireAuth();
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { locale: true, timezone: true, preferences: true },
    });
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

    const prefs = (user.preferences as any) || {};
    return NextResponse.json({
      locale: user.locale || 'zh-CN',
      timezone: user.timezone || 'Asia/Shanghai',
      theme: prefs.theme || 'dark',
      defaultModel: prefs.defaultModel || 'mimo-v2.5-pro',
    });
  } catch (e: any) {
    if (e?.status === 401) return NextResponse.json({ error: '未登录' }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const payload = await requireAuth();
    const body = await req.json();
    const { locale, timezone, theme, defaultModel } = body;

    // 读取现有 preferences
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { preferences: true },
    });
    const prefs = (user?.preferences as any) || {};

    if (theme !== undefined) prefs.theme = theme;
    if (defaultModel !== undefined) prefs.defaultModel = defaultModel;

    const data: any = { preferences: prefs };
    if (locale !== undefined) data.locale = locale;
    if (timezone !== undefined) data.timezone = timezone;

    await prisma.user.update({
      where: { id: payload.userId },
      data,
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e?.status === 401) return NextResponse.json({ error: '未登录' }, { status: 401 });
    console.error('[Preferences Error]', e);
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}
