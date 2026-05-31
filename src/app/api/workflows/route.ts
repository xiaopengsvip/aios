import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const where = { OR: [{ userId: user.id }, { isPublic: true }] };
  const workflows = await prisma.workflow.findMany({ where, orderBy: { updatedAt: 'desc' } });
  return NextResponse.json({ workflows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const body = await req.json();
  const { name, description, nodes, edges, variables } = body;
  if (!name) return NextResponse.json({ error: '名称必填' }, { status: 400 });
  const workflow = await prisma.workflow.create({
    data: { userId: user.id, name, description: description || {}, nodes: nodes || [], edges: edges || [], variables: variables || [] },
  });
  return NextResponse.json({ success: true, workflow });
}
