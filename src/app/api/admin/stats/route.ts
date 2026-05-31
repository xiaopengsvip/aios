import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const [totalUsers, activeUsers, totalModels, totalConversations, totalMessages, totalFiles, recentLogs] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.model.count({ where: { isEnabled: true } }),
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.file.count(),
      prisma.usageLog.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    ]);

    const providers = await prisma.provider.count({ where: { isEnabled: true } });
    const apiKeys = await prisma.apiKey.count();
    const activeKeys = await prisma.apiKey.count({ where: { status: 'ACTIVE' } });

    // Revenue last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const revenue = await prisma.transaction.aggregate({
      where: { createdAt: { gte: thirtyDaysAgo }, type: 'CHARGE' },
      _sum: { amount: true },
    });

    // Daily signups last 7 days
    const dailySignups: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const count = await prisma.user.count({ where: { createdAt: { gte: start, lt: end } } });
      dailySignups.push({ date: start.toISOString().split('T')[0], count });
    }

    // Top models by usage
    const topModels = await prisma.usageLog.groupBy({
      by: ['modelId'],
      _count: { id: true },
      _sum: { totalTokens: true, cost: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const topModelDetails = await Promise.all(
      topModels.map(async (m) => {
        const model = await prisma.model.findUnique({ where: { id: m.modelId || '' } });
        return {
          modelId: m.modelId,
          modelName: model?.name || 'Unknown',
          requestCount: m._count.id,
          totalTokens: m._sum.totalTokens || 0,
          totalCost: Number(m._sum.cost) || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers },
        models: { total: totalModels },
        providers: { total: providers },
        apiKeys: { total: apiKeys, active: activeKeys },
        conversations: { total: totalConversations },
        messages: { total: totalMessages },
        files: { total: totalFiles },
        requestsLast24h: recentLogs,
        revenueLast30Days: revenue._sum.amount || 0,
        dailySignups,
        topModels: topModelDetails,
      },
    });
  } catch (error: any) {
    console.error('[Admin Stats Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
