import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          role: true,
          content: true,
          promptTokens: true,
          completionTokens: true,
          totalTokens: true,
          modelName: true,
          providerName: true,
          status: true,
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
  });

  if (!conversation) {
    return NextResponse.json({ error: '对话不存在' }, { status: 404 });
  }

  return NextResponse.json({
    id: conversation.id,
    title: conversation.title,
    modelId: conversation.modelId,
    modelName: conversation.model?.name || null,
    modelDisplayName: conversation.model?.displayName || null,
    systemPrompt: conversation.systemPrompt,
    messageCount: conversation.messageCount,
    totalTokens: conversation.totalTokens.toString(),
    isPinned: conversation.isPinned,
    isArchived: conversation.isArchived,
    messages: conversation.messages.map((msg) => ({
      ...msg,
      totalTokens: msg.totalTokens,
    })),
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: '对话不存在' }, { status: 404 });
  }

  await prisma.conversation.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
