import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET - Public models list (no auth required)
export async function GET() {
  try {
    const models = await prisma.model.findMany({
      where: {
        isEnabled: true,
        isPublic: true,
        provider: {
          isEnabled: true,
          // 只返回有可用 API Key 的供应商的模型
          keys: {
            some: {
              isEnabled: true,
              status: 'ACTIVE',
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        type: true,
        maxTokens: true,
        contextWindow: true,
        supportsStreaming: true,
        supportsVision: true,
        supportsAudio: true,
        supportsVideo: true,
        supportsToolUse: true,
        supportsJson: true,
        provider: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            lastHealthCheck: true,
            avgLatency: true,
            successRate: true,
          },
        },
      },
      orderBy: [{ provider: { name: 'asc' } }, { name: 'asc' }],
    });

    // 为每个模型附加在线状态 & Xiaomi MiMo 优先排序
    const modelsWithStatus = models.map((model) => {
      const provider = model.provider;
      // 判断在线状态：provider.status 为 healthy 或有近期健康检查
      const isOnline =
        provider.status === 'healthy' ||
        (provider.lastHealthCheck &&
          Date.now() - new Date(provider.lastHealthCheck).getTime() < 10 * 60 * 1000); // 10分钟内
      return {
        ...model,
        providerStatus: isOnline ? 'online' : 'unknown',
        providerLatency: provider.avgLatency,
        providerSuccessRate: provider.successRate,
      };
    });

    // Xiaomi MiMo 模型排最前
    modelsWithStatus.sort((a, b) => {
      const aXiaomi = a.provider.name === 'Xiaomi MiMo' ? 0 : 1;
      const bXiaomi = b.provider.name === 'Xiaomi MiMo' ? 0 : 1;
      if (aXiaomi !== bXiaomi) return aXiaomi - bXiaomi;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ models: modelsWithStatus });
  } catch (error: any) {
    console.error('[Public Models GET]', error);
    return NextResponse.json({ error: '获取模型列表失败' }, { status: 500 });
  }
}
