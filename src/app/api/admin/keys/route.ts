import '@/lib/bigint-polyfill';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { encrypt, maskApiKey } from '@/lib/security/crypto';

// GET - List keys with quota info
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId') || '';

    const where: any = {};
    if (providerId) where.providerId = providerId;

    const keys = await prisma.apiKey.findMany({
      where,
      include: {
        provider: {
          select: { id: true, name: true, type: true, baseUrl: true, dashboardUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ keys });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[Admin Keys GET]', error);
    return NextResponse.json({ error: '获取密钥列表失败' }, { status: 500 });
  }
}

// POST - Create key (encrypt before save)
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const { providerId, key, weight, expiresAt, quotaTotal } = body;

    if (!providerId || !key) {
      return NextResponse.json({ error: '缺少必填字段 (providerId, key)' }, { status: 400 });
    }

    const provider = await prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider) {
      return NextResponse.json({ error: '供应商不存在' }, { status: 404 });
    }

    const keyHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(key)
    ).then((buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join(''));

    const existing = await prisma.apiKey.findUnique({ where: { keyHash } });
    if (existing) {
      return NextResponse.json({ error: '该 Key 已存在' }, { status: 409 });
    }

    const keyEncrypted = encrypt(key);
    const keyMask = maskApiKey(key);

    const apiKey = await prisma.apiKey.create({
      data: {
        providerId,
        keyEncrypted,
        keyHash,
        keyMask,
        weight: weight || 1,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        quotaTotal: quotaTotal ? BigInt(quotaTotal) : null,
        quotaRemaining: quotaTotal ? BigInt(quotaTotal) : null,
      },
      include: {
        provider: { select: { id: true, name: true, type: true, baseUrl: true, dashboardUrl: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.userId,
        action: 'KEY_CREATE',
        resource: 'apiKey',
        resourceId: apiKey.id,
        details: { providerId, keyMask },
        ip: req.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({ success: true, key: apiKey });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[Admin Keys POST]', error);
    return NextResponse.json({ error: '创建密钥失败' }, { status: 500 });
  }
}

// PATCH - Update key status, test key, or update quota
export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { keyId, status, isEnabled, weight, expiresAt, quotaTotal, quotaRemaining, action } = body;

    if (!keyId) {
      return NextResponse.json({ error: '缺少密钥 ID' }, { status: 400 });
    }

    // Test key action
    if (action === 'test') {
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: keyId },
        include: { provider: true },
      });

      if (!apiKey) {
        return NextResponse.json({ error: '密钥不存在' }, { status: 404 });
      }

      try {
        const { decrypt } = await import('@/lib/security/crypto');
        const decryptedKey = decrypt(apiKey.keyEncrypted);

        // Test based on provider type
        let testUrl = `${apiKey.provider.baseUrl}/v1/models`;
        if (apiKey.provider.type === 'ANTHROPIC') {
          testUrl = 'https://api.anthropic.com/v1/models';
        }

        const response = await fetch(testUrl, {
          headers: apiKey.provider.type === 'ANTHROPIC'
            ? { 'x-api-key': decryptedKey, 'anthropic-version': '2023-06-01' }
            : { Authorization: `Bearer ${decryptedKey}` },
          signal: AbortSignal.timeout(10000),
        });

        const valid = response.ok;
        let models: any[] = [];

        if (valid) {
          try {
            const data = await response.json();
            models = (data.data || data.models || []).map((m: any) => ({ id: m.id, name: m.name || m.id }));
          } catch {}
        }

        await prisma.apiKey.update({
          where: { id: keyId },
          data: {
            status: valid ? 'ACTIVE' : 'INVALID',
            consecutiveErrors: valid ? 0 : { increment: 1 },
            circuitOpen: false,
            circuitOpenUntil: null,
            lastHealthCheck: new Date(),
          },
        });

        return NextResponse.json({
          valid,
          status: response.status,
          modelCount: models.length,
          error: valid ? null : `HTTP ${response.status}`,
        });
      } catch (testError: any) {
        await prisma.apiKey.update({
          where: { id: keyId },
          data: {
            status: 'INVALID',
            lastError: testError.message,
            consecutiveErrors: { increment: 1 },
            lastHealthCheck: new Date(),
          },
        });

        return NextResponse.json({
          valid: false,
          error: testError.message,
        });
      }
    }

    // Regular update
    const data: any = {};
    if (status !== undefined) data.status = status;
    if (isEnabled !== undefined) data.isEnabled = isEnabled;
    if (weight !== undefined) data.weight = weight;
    if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (quotaTotal !== undefined) data.quotaTotal = quotaTotal ? BigInt(quotaTotal) : null;
    if (quotaRemaining !== undefined) data.quotaRemaining = quotaRemaining ? BigInt(quotaRemaining) : null;

    if (isEnabled === true || status === 'ACTIVE') {
      data.circuitOpen = false;
      data.circuitOpenUntil = null;
      data.consecutiveErrors = 0;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: '没有需要更新的字段' }, { status: 400 });
    }

    const apiKey = await prisma.apiKey.update({
      where: { id: keyId },
      data,
      include: {
        provider: { select: { id: true, name: true, type: true, baseUrl: true, dashboardUrl: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.userId,
        action: 'KEY_UPDATE',
        resource: 'apiKey',
        resourceId: keyId,
        details: { changes: data },
        ip: req.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({ success: true, key: apiKey });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[Admin Keys PATCH]', error);
    return NextResponse.json({ error: '更新密钥失败' }, { status: 500 });
  }
}

// DELETE - Delete key
export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get('id');

    if (!keyId) {
      return NextResponse.json({ error: '缺少密钥 ID' }, { status: 400 });
    }

    const key = await prisma.apiKey.findUnique({ where: { id: keyId } });
    if (!key) {
      return NextResponse.json({ error: '密钥不存在' }, { status: 404 });
    }

    await prisma.apiKey.delete({ where: { id: keyId } });

    await prisma.auditLog.create({
      data: {
        userId: admin.userId,
        action: 'KEY_DELETE',
        resource: 'apiKey',
        resourceId: keyId,
        details: { keyMask: key.keyMask, providerId: key.providerId },
        ip: req.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[Admin Keys DELETE]', error);
    return NextResponse.json({ error: '删除密钥失败' }, { status: 500 });
  }
}
