import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

// User-facing API keys stored as SystemConfig entries
const CONFIG_PREFIX = 'user_api_key_';

function generateApiKey(): string {
  return 'ak_' + crypto.randomBytes(32).toString('hex');
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Load user's API keys from SystemConfig
    const configs = await prisma.systemConfig.findMany({
      where: { key: { startsWith: CONFIG_PREFIX + user.id + '_' } },
    });

    const keys = configs.map(c => {
      const data = c.value as any;
      return {
        id: c.id,
        name: data.name || 'Unnamed',
        keyPreview: data.keyPrefix + '...',
        permissions: data.permissions || 'read',
        rateLimit: data.rateLimit || 100,
        usageCount: data.usageCount || 0,
        lastUsedAt: data.lastUsedAt || null,
        expiresAt: data.expiresAt || null,
        createdAt: c.updatedAt,
        isActive: data.isActive !== false,
      };
    });

    return NextResponse.json({ keys });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, permissions = 'read', rateLimit = 100 } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

    const key = generateApiKey();
    const keyPrefix = key.substring(0, 12);
    const keyId = crypto.randomUUID();

    await prisma.systemConfig.create({
      data: {
        key: CONFIG_PREFIX + user.id + '_' + keyId,
        value: {
          name,
          keyPrefix,
          keyHash: key,
          permissions,
          rateLimit,
          usageCount: 0,
          isActive: true,
        },
        description: `API Key for user ${user.id}`,
      },
    });

    return NextResponse.json({ id: keyId, key, name });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await prisma.systemConfig.deleteMany({
      where: { key: CONFIG_PREFIX + user.id + '_' + id },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
