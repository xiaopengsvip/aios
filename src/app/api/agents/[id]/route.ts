import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await params;
  const agent = await prisma.agent.findFirst({ where: { id, OR: [{ userId: user.id }, { isPublic: true }] } });
  if (!agent) return NextResponse.json({ error: '不存在' }, { status: 404 });
  return NextResponse.json({ agent });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const agent = await prisma.agent.findFirst({ where: { id, userId: user.id } });
  if (!agent) return NextResponse.json({ error: '无权限' }, { status: 403 });
  const updated = await prisma.agent.update({ where: { id }, data: body });
  return NextResponse.json({ success: true, agent: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await params;
  const agent = await prisma.agent.findFirst({ where: { id, userId: user.id } });
  if (!agent) return NextResponse.json({ error: '无权限' }, { status: 403 });
  await prisma.agent.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
