import '@/lib/bigint-polyfill';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET - List models
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId') || '';

    const where: any = {};
    if (providerId) where.providerId = providerId;

    const models = await prisma.model.findMany({
      where,
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            lastHealthCheck: true,
            avgLatency: true,
            successRate: true,
            keys: {
              where: { isEnabled: true, status: 'ACTIVE' },
              select: { id: true },
            },
          },
        },
      },
      orderBy: [{ provider: { name: 'asc' } }, { name: 'asc' }],
    });

    // 附加状态信息
    const modelsWithStatus = models.map((model) => {
      const provider = model.provider;
      const hasActiveKeys = (provider as any).keys?.length > 0;
      const isOnline =
        hasActiveKeys &&
        (provider.status === 'healthy' ||
          (provider.lastHealthCheck &&
            Date.now() - new Date(provider.lastHealthCheck).getTime() < 10 * 60 * 1000));
      const { keys, ...providerRest } = provider as any;
      return {
        ...model,
        provider: providerRest,
        providerStatus: isOnline ? 'online' : hasActiveKeys ? 'unknown' : 'no_keys',
      };
    });

    return NextResponse.json({ models: modelsWithStatus });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[Admin Models GET]', error);
    return NextResponse.json({ error: '获取模型列表失败' }, { status: 500 });
  }
}

// POST - Create model
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const {
      name, displayName, providerId, type,
      maxTokens, contextWindow, inputPrice, outputPrice,
      supportsStreaming, supportsVision, supportsToolUse,
    } = body;

    if (!name || !providerId) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    // Check provider exists
    const provider = await prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider) {
      return NextResponse.json({ error: '供应商不存在' }, { status: 404 });
    }

    // Check duplicate
    const existing = await prisma.model.findUnique({
      where: { providerId_name: { providerId, name } },
    });
    if (existing) {
      return NextResponse.json({ error: '该供应商下已存在同名模型' }, { status: 409 });
    }

    const model = await prisma.model.create({
      data: {
        name,
        displayName: displayName || {},
        providerId,
        type: type || 'CHAT',
        maxTokens: maxTokens || 4096,
        contextWindow: contextWindow || 128000,
        inputPrice: inputPrice || 0,
        outputPrice: outputPrice || 0,
        supportsStreaming: supportsStreaming !== false,
        supportsVision: supportsVision || false,
        supportsToolUse: supportsToolUse || false,
      },
      include: {
        provider: { select: { id: true, name: true, type: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.userId,
        action: 'MODEL_UPDATE',
        resource: 'model',
        resourceId: model.id,
        details: { action: 'create', name, providerId },
        ip: req.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({ success: true, model });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[Admin Models POST]', error);
    return NextResponse.json({ error: '创建模型失败' }, { status: 500 });
  }
}

// PATCH - Update model
export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { modelId, ...updateFields } = body;

    if (!modelId) {
      return NextResponse.json({ error: '缺少模型 ID' }, { status: 400 });
    }

    // Only allow specific fields to be updated
    const allowedFields = [
      'displayName', 'type', 'maxTokens', 'contextWindow',
      'inputPrice', 'outputPrice', 'isEnabled', 'isPublic',
      'supportsStreaming', 'supportsVision', 'supportsToolUse', 'supportsJson', 'config',
    ];
    const data: any = {};
    for (const key of allowedFields) {
      if (updateFields[key] !== undefined) {
        data[key] = updateFields[key];
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: '没有需要更新的字段' }, { status: 400 });
    }

    const model = await prisma.model.update({
      where: { id: modelId },
      data,
      include: {
        provider: { select: { id: true, name: true, type: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.userId,
        action: 'MODEL_UPDATE',
        resource: 'model',
        resourceId: modelId,
        details: { changes: data },
        ip: req.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({ success: true, model });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[Admin Models PATCH]', error);
    return NextResponse.json({ error: '更新模型失败' }, { status: 500 });
  }
}
