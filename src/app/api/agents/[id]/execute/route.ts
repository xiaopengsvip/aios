import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { runAgent } from '@/lib/agent/engine';

// POST /api/agents/[id]/execute - 执行 Agent
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { message, maxSteps } = body;

  if (!message) {
    return NextResponse.json({ error: '消息不能为空' }, { status: 400 });
  }

  // 验证 Agent 存在且用户有权限
  const agent = await prisma.agent.findFirst({
    where: {
      id,
      OR: [{ userId: user.id }, { isPublic: true }],
    },
  });

  if (!agent) {
    return NextResponse.json({ error: 'Agent 不存在' }, { status: 404 });
  }

  try {
    const result = await runAgent(id, user.id, message, maxSteps || 10);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Agent Execute Error]', error);
    return NextResponse.json({ error: error.message || '执行失败' }, { status: 500 });
  }
}
