import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [logs, aggregate] = await Promise.all([
      prisma.usageLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { model: { select: { name: true, provider: { select: { name: true } } } } },
      }),
      prisma.usageLog.aggregate({
        where: { userId: user.id },
        _sum: { totalTokens: true, cost: true },
        _count: true,
        _avg: { latency: true },
      }),
    ]);

    return NextResponse.json({
      logs: logs.map(l => ({
        id: l.id,
        endpoint: l.endpoint,
        promptTokens: l.promptTokens,
        completionTokens: l.completionTokens,
        totalTokens: l.totalTokens,
        cost: Number(l.cost),
        latency: l.latency,
        modelName: l.model?.name || '',
        providerName: l.model?.provider?.name || '',
        createdAt: l.createdAt,
      })),
      stats: {
        totalTokens: Number(aggregate._sum.totalTokens || 0),
        totalCost: Number(aggregate._sum.cost || 0),
        totalCalls: aggregate._count,
        avgLatency: Math.round(aggregate._avg.latency || 0),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
