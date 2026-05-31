// ============================================================
// API Key Pool - 独立的 Key 管理模块
// 增强 gateway.ts 的 getKey，增加健康检查、自动恢复、统计
// ============================================================

import prisma from '@/lib/db';

/* ─── Key Status Transitions ─── */
// ACTIVE → RATE_LIMITED (5 consecutive errors)
// RATE_LIMITED → ACTIVE (auto after cooldown, or manual)
// ACTIVE → INVALID (key rejected by provider)
// INVALID → ACTIVE (manual re-enable)
// ACTIVE → FROZEN (manual freeze)
// FROZEN → ACTIVE (manual unfreeze)

/* ─── Key Pool Stats ─── */
export async function getKeyPoolStats(providerId?: string) {
  const where = providerId ? { providerId } : {};

  const [total, active, rateLimited, invalid, frozen, disabled] = await Promise.all([
    prisma.apiKey.count({ where }),
    prisma.apiKey.count({ where: { ...where, status: 'ACTIVE', isEnabled: true } }),
    prisma.apiKey.count({ where: { ...where, status: 'RATE_LIMITED' } }),
    prisma.apiKey.count({ where: { ...where, status: 'INVALID' } }),
    prisma.apiKey.count({ where: { ...where, status: 'FROZEN' } }),
    prisma.apiKey.count({ where: { ...where, isEnabled: false } }),
  ]);

  const topKeys = await prisma.apiKey.findMany({
    where,
    orderBy: { totalCalls: 'desc' },
    take: 10,
    include: { provider: { select: { name: true, type: true } } },
  });

  return {
    total,
    active,
    rateLimited,
    invalid,
    frozen,
    disabled,
    topKeys: topKeys.map((k) => ({
      id: k.id,
      mask: k.keyMask,
      provider: k.provider.name,
      status: k.status,
      totalCalls: Number(k.totalCalls),
      totalTokens: Number(k.totalTokens),
      errorCount: k.errorCount,
      lastUsedAt: k.lastUsedAt,
      weight: k.weight,
    })),
  };
}

/* ─── Auto-Recovery: Reset RATE_LIMITED keys after cooldown ─── */
export async function recoverRateLimitedKeys() {
  const now = new Date();

  // Find keys where circuit has expired
  const keys = await prisma.apiKey.findMany({
    where: {
      status: 'RATE_LIMITED',
      circuitOpen: true,
      circuitOpenUntil: { lte: now },
    },
  });

  if (keys.length === 0) return { recovered: 0 };

  const result = await prisma.apiKey.updateMany({
    where: {
      id: { in: keys.map((k) => k.id) },
    },
    data: {
      status: 'ACTIVE',
      circuitOpen: false,
      circuitOpenUntil: null,
      consecutiveErrors: 0,
    },
  });

  return { recovered: result.count };
}

/* ─── Health Check: Test a specific key ─── */
export async function healthCheckKey(keyId: string): Promise<{
  ok: boolean;
  latencyMs: number;
  error?: string;
}> {
  const key = await prisma.apiKey.findUnique({
    where: { id: keyId },
    include: { provider: true },
  });

  if (!key) throw new Error('Key not found');

  const { decrypt } = await import('@/lib/security/crypto');
  const { createProviderAdapter } = await import('./providers');

  const decryptedKey = decrypt(key.keyEncrypted);
  const adapter = createProviderAdapter(key.provider.type, key.provider.baseUrl, decryptedKey);

  const start = Date.now();
  try {
    const ok = await adapter.healthCheck();
    const latencyMs = Date.now() - start;

    // Update key health status
    await prisma.apiKey.update({
      where: { id: keyId },
      data: {
        lastHealthCheck: new Date(),
        healthCheckLatency: latencyMs,
        consecutiveErrors: ok ? 0 : { increment: 1 },
      },
    });

    return { ok, latencyMs };
  } catch (error: any) {
    const latencyMs = Date.now() - start;
    await prisma.apiKey.update({
      where: { id: keyId },
      data: {
        lastHealthCheck: new Date(),
        healthCheckLatency: latencyMs,
        lastError: error.message,
        errorCount: { increment: 1 },
        consecutiveErrors: { increment: 1 },
      },
    });
    return { ok: false, latencyMs, error: error.message };
  }
}

/* ─── Batch Health Check: Test all active keys ─── */
export async function healthCheckAll(providerId?: string) {
  const keys = await prisma.apiKey.findMany({
    where: {
      isEnabled: true,
      status: { in: ['ACTIVE', 'RATE_LIMITED'] },
      ...(providerId ? { providerId } : {}),
    },
    select: { id: true },
  });

  const results = await Promise.allSettled(
    keys.map((k) => healthCheckKey(k.id))
  );

  const summary = {
    total: keys.length,
    healthy: 0,
    unhealthy: 0,
    errors: 0,
  };

  results.forEach((r) => {
    if (r.status === 'fulfilled') {
      if (r.value.ok) summary.healthy++;
      else summary.unhealthy++;
    } else {
      summary.errors++;
    }
  });

  return summary;
}

/* ─── Reset key error counters ─── */
export async function resetKeyErrors(keyId: string) {
  await prisma.apiKey.update({
    where: { id: keyId },
    data: {
      status: 'ACTIVE',
      circuitOpen: false,
      circuitOpenUntil: null,
      consecutiveErrors: 0,
      errorCount: 0,
      lastError: null,
    },
  });
}

/* ─── Update key weight ─── */
export async function updateKeyWeight(keyId: string, weight: number) {
  if (weight < 0 || weight > 100) throw new Error('Weight must be 0-100');
  await prisma.apiKey.update({
    where: { id: keyId },
    data: { weight },
  });
}

/* ─── Toggle key enabled/disabled ─── */
export async function toggleKeyEnabled(keyId: string, enabled: boolean) {
  await prisma.apiKey.update({
    where: { id: keyId },
    data: {
      isEnabled: enabled,
      status: enabled ? 'ACTIVE' : undefined,
      circuitOpen: enabled ? false : undefined,
      consecutiveErrors: enabled ? 0 : undefined,
    },
  });
}
