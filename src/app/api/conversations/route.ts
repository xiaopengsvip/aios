import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
  const search = searchParams.get('search') || '';
  const archived = searchParams.get('archived') === 'true';

  const where: any = {
    userId: user.id,
    isArchived: archived,
  };

  if (search) {
    where.title = { contains: search, mode: 'insensitive' };
  }

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
          },
        },
        model: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
      },
    }),
    prisma.conversation.count({ where }),
  ]);

  const result = conversations.map((conv) => ({
    id: conv.id,
    title: conv.title,
    modelId: conv.modelId,
    modelName: conv.model?.name || null,
    modelDisplayName: conv.model?.displayName || null,
    messageCount: conv.messageCount,
    totalTokens: conv.totalTokens.toString(),
    isPinned: conv.isPinned,
    isArchived: conv.isArchived,
    lastMessage: conv.messages[0]
      ? {
          id: conv.messages[0].id,
          role: conv.messages[0].role,
          content: conv.messages[0].content?.slice(0, 100) || '',
          createdAt: conv.messages[0].createdAt,
        }
      : null,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
  }));

  return NextResponse.json({
    conversations: result,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
