import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workflow = await prisma.workflow.findUnique({ where: { id } });
  if (!workflow) return NextResponse.json({ error: '不存在' }, { status: 404 });
  return NextResponse.json({ workflow });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await params;
  const wf = await prisma.workflow.findFirst({ where: { id, userId: user.id } });
  if (!wf) return NextResponse.json({ error: '无权限' }, { status: 403 });
  const body = await req.json();
  const updated = await prisma.workflow.update({ where: { id }, data: body });
  return NextResponse.json({ success: true, workflow: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await params;
  const wf = await prisma.workflow.findFirst({ where: { id, userId: user.id } });
  if (!wf) return NextResponse.json({ error: '无权限' }, { status: 403 });
  await prisma.workflow.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
