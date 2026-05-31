import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/agents - 获取 Agent 列表
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');

  const where = {
    OR: [{ userId: user.id }, { isPublic: true }],
  };

  const [agents, total] = await Promise.all([
    prisma.agent.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.agent.count({ where }),
  ]);

  return NextResponse.json({ agents, total, page, pageSize });
}

// POST /api/agents - 创建 Agent
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const body = await req.json();
  const { name, description, systemPrompt, modelId, tools, temperature, maxTokens, isPublic } = body;

  if (!name || !systemPrompt) {
    return NextResponse.json({ error: '名称和系统提示词必填' }, { status: 400 });
  }

  const agent = await prisma.agent.create({
    data: {
      userId: user.id,
      name,
      description: description || {},
      systemPrompt,
      modelId: modelId || null,
      tools: tools || ['web_search', 'calculator', 'datetime'],
      temperature: temperature || 0.7,
      maxTokens: maxTokens || 4096,
      isPublic: isPublic || false,
    },
  });

  return NextResponse.json({ success: true, agent });
}
