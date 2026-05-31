import '@/lib/bigint-polyfill';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET - List providers with model/key stats
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const providers = await prisma.provider.findMany({
      include: {
        _count: {
          select: { keys: true, models: true },
        },
        models: {
          select: { type: true, isEnabled: true, name: true },
        },
        keys: {
          select: {
            status: true,
            isEnabled: true,
            totalCalls: true,
            totalTokens: true,
            expiresAt: true,
            quotaTotal: true,
            quotaRemaining: true,
            lastHealthCheck: true,
            circuitOpen: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Enrich with aggregated stats
    const enriched = providers.map((p) => {
      const modelTypes: Record<string, number> = {};
      for (const m of p.models) {
        modelTypes[m.type] = (modelTypes[m.type] || 0) + 1;
      }

      const activeKeys = p.keys.filter((k) => k.status === 'ACTIVE' && k.isEnabled).length;
      const totalCalls = p.keys.reduce((s, k) => s + Number(k.totalCalls), 0);
      const totalTokens = p.keys.reduce((s, k) => s + Number(k.totalTokens), 0);

      // Check if any key is expiring soon (7 days)
      const expiringKeys = p.keys.filter((k) => {
        if (!k.expiresAt) return false;
        const daysLeft = (new Date(k.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return daysLeft > 0 && daysLeft < 7;
      }).length;

      return {
        id: p.id,
        name: p.name,
        type: p.type,
        baseUrl: p.baseUrl,
        isEnabled: p.isEnabled,
        dashboardUrl: p.dashboardUrl,
        status: p.status,
        lastHealthCheck: p.lastHealthCheck,
        avgLatency: p.avgLatency,
        successRate: p.successRate,
        rateLimit: p.rateLimit,
        concurrencyLimit: p.concurrencyLimit,
        createdAt: p.createdAt,
        _count: p._count,
        // New enriched fields
        modelTypes,
        activeKeys,
        totalCalls,
        totalTokens,
        expiringKeys,
      };
    });

    return NextResponse.json({ providers: enriched });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[Admin Providers GET]', error);
    return NextResponse.json({ error: '获取供应商列表失败' }, { status: 500 });
  }
}

// POST - Create provider
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const { name, type, baseUrl, rateLimit, concurrencyLimit, dashboardUrl } = body;

    if (!name || !type || !baseUrl) {
      return NextResponse.json({ error: '缺少必填字段 (name, type, baseUrl)' }, { status: 400 });
    }

    // CUSTOM 类型允许多个 provider（如 Nous Portal、Xiaomi MiMo 等）
    if (type !== 'CUSTOM') {
      const existing = await prisma.provider.findFirst({ where: { type } });
      if (existing) {
        return NextResponse.json({ error: `供应商类型 ${type} 已存在` }, { status: 409 });
      }
    }

    const provider = await prisma.provider.create({
      data: {
        name,
        type,
        baseUrl,
        rateLimit: rateLimit || null,
        concurrencyLimit: concurrencyLimit || null,
        dashboardUrl: dashboardUrl || null,
      },
      include: {
        _count: { select: { keys: true, models: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.userId,
        action: 'PROVIDER_UPDATE',
        resource: 'provider',
        resourceId: provider.id,
        details: { action: 'create', name, type, baseUrl },
        ip: req.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({ success: true, provider });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[Admin Providers POST]', error);
    return NextResponse.json({ error: '创建供应商失败' }, { status: 500 });
  }
}

// PATCH - Update provider
export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { providerId, baseUrl, isEnabled, rateLimit, concurrencyLimit, dashboardUrl } = body;

    if (!providerId) {
      return NextResponse.json({ error: '缺少供应商 ID' }, { status: 400 });
    }

    const data: any = {};
    if (baseUrl !== undefined) data.baseUrl = baseUrl;
    if (isEnabled !== undefined) data.isEnabled = isEnabled;
    if (rateLimit !== undefined) data.rateLimit = rateLimit;
    if (concurrencyLimit !== undefined) data.concurrencyLimit = concurrencyLimit;
    if (dashboardUrl !== undefined) data.dashboardUrl = dashboardUrl;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: '没有需要更新的字段' }, { status: 400 });
    }

    const provider = await prisma.provider.update({
      where: { id: providerId },
      data,
      include: {
        _count: { select: { keys: true, models: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.userId,
        action: 'PROVIDER_UPDATE',
        resource: 'provider',
        resourceId: providerId,
        details: { changes: data },
        ip: req.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({ success: true, provider });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[Admin Providers PATCH]', error);
    return NextResponse.json({ error: '更新供应商失败' }, { status: 500 });
  }
}
