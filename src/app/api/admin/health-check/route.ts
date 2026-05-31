// ============================================================
// Provider Health Check API
// 自动检测所有有可用 Key 的 Provider 健康状态
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { decrypt } from '@/lib/security/crypto';
import { createProviderAdapter } from '@/lib/ai/providers';

// 超时时间 (ms)
const CHECK_TIMEOUT = 10000;

interface ProviderHealthResult {
  providerId: string;
  providerName: string;
  status: 'healthy' | 'error' | 'timeout';
  latencyMs: number;
  error?: string;
}

/**
 * 检测单个 Provider 的健康状态
 * 选取该 Provider 的第一个 ACTIVE + isEnabled 的 Key 进行测试
 */
async function checkProviderHealth(provider: {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
  keys: { id: string; keyEncrypted: string }[];
}): Promise<ProviderHealthResult> {
  const key = provider.keys[0];
  if (!key) {
    return {
      providerId: provider.id,
      providerName: provider.name,
      status: 'error',
      latencyMs: 0,
      error: 'No active key available',
    };
  }

  const start = Date.now();
  try {
    const decryptedKey = decrypt(key.keyEncrypted);
    const adapter = createProviderAdapter(provider.type, provider.baseUrl, decryptedKey);

    // 使用 Promise.race 实现超时控制
    const healthPromise = adapter.healthCheck();
    const timeoutPromise = new Promise<boolean>((_, reject) =>
      setTimeout(() => reject(new Error('Health check timeout')), CHECK_TIMEOUT)
    );

    const ok = await Promise.race([healthPromise, timeoutPromise]);
    const latencyMs = Date.now() - start;

    return {
      providerId: provider.id,
      providerName: provider.name,
      status: ok ? 'healthy' : 'error',
      latencyMs,
      error: ok ? undefined : 'Health check returned false',
    };
  } catch (error: any) {
    const latencyMs = Date.now() - start;
    const isTimeout = error.message?.includes('timeout');
    return {
      providerId: provider.id,
      providerName: provider.name,
      status: isTimeout ? 'timeout' : 'error',
      latencyMs,
      error: error.message,
    };
  }
}

// POST - 触发健康检查
export async function POST(req: NextRequest) {
  try {
    // 获取所有有可用 Key 的 Provider
    const providers = await prisma.provider.findMany({
      where: {
        isEnabled: true,
        keys: {
          some: {
            isEnabled: true,
            status: 'ACTIVE',
          },
        },
      },
      select: {
        id: true,
        name: true,
        type: true,
        baseUrl: true,
        keys: {
          where: {
            isEnabled: true,
            status: 'ACTIVE',
          },
          select: {
            id: true,
            keyEncrypted: true,
          },
          take: 1,
        },
      },
    });

    if (providers.length === 0) {
      return NextResponse.json({
        message: 'No providers with active keys found',
        results: [],
      });
    }

    // 并行检测所有 Provider
    const results = await Promise.allSettled(
      providers.map((p) => checkProviderHealth(p))
    );

    const healthResults: ProviderHealthResult[] = [];
    const updatePromises: Promise<any>[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const health = result.value;
        healthResults.push(health);

        // 更新 Provider 状态
        const providerStatus = health.status === 'healthy' ? 'healthy' : 'error';
        updatePromises.push(
          prisma.provider.update({
            where: { id: health.providerId },
            data: {
              status: providerStatus,
              lastHealthCheck: new Date(),
              // 只在健康时更新延迟，错误时保留上次的延迟数据
              ...(health.status === 'healthy' ? { avgLatency: health.latencyMs } : {}),
            },
          })
        );
      }
    }

    // 批量更新数据库
    await Promise.allSettled(updatePromises);

    // 统计结果
    const summary = {
      total: healthResults.length,
      healthy: healthResults.filter((r) => r.status === 'healthy').length,
      error: healthResults.filter((r) => r.status === 'error').length,
      timeout: healthResults.filter((r) => r.status === 'timeout').length,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({ summary, results: healthResults });
  } catch (error: any) {
    console.error('[Health Check POST]', error);
    return NextResponse.json(
      { error: 'Health check failed', details: error.message },
      { status: 500 }
    );
  }
}

// GET - 查询最近一次健康检查结果
export async function GET() {
  try {
    const providers = await prisma.provider.findMany({
      where: { isEnabled: true },
      select: {
        id: true,
        name: true,
        status: true,
        lastHealthCheck: true,
        avgLatency: true,
        successRate: true,
        _count: {
          select: {
            keys: {
              where: { isEnabled: true, status: 'ACTIVE' },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      providers: providers.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        lastHealthCheck: p.lastHealthCheck,
        avgLatency: p.avgLatency,
        successRate: p.successRate,
        hasActiveKeys: p._count.keys > 0,
      })),
    });
  } catch (error: any) {
    console.error('[Health Check GET]', error);
    return NextResponse.json(
      { error: 'Failed to get health status' },
      { status: 500 }
    );
  }
}
