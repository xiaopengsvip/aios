import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'all'; // agents | prompts | workflows | all
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');

  const results: any[] = [];

  // Fetch public agents
  if (type === 'all' || type === 'agents') {
    const where: any = { isPublic: true };
    if (search) where.name = { contains: search, mode: 'insensitive' };
    const agents = await prisma.agent.findMany({
      where,
      orderBy: { runCount: 'desc' },
      take: type === 'agents' ? pageSize : 10,
      skip: type === 'agents' ? (page - 1) * pageSize : 0,
      select: {
        id: true, name: true, description: true, tools: true,
        runCount: true, createdAt: true, userId: true,
        user: { select: { username: true, displayName: true } },
      },
    });
    results.push(...agents.map(a => ({
      id: a.id,
      type: 'agents',
      name: a.name,
      description: a.description && typeof a.description === 'object' ? (a.description as any)['zh-CN'] || (a.description as any)['en-US'] || '' : String(a.description || ''),
      category: '智能体',
      author: a.user?.displayName || a.user?.username || 'Anonymous',
      downloads: Number(a.runCount || 0),
      rating: 4.5,
      icon: '🤖',
      tags: Array.isArray(a.tools) ? (a.tools as string[]).slice(0, 3) : [],
      createdAt: a.createdAt,
    })));
  }

  // Fetch public prompts
  if (type === 'all' || type === 'prompts') {
    const where: any = { OR: [{ isPublic: true }, { isBuiltin: true }] };
    if (category && category !== '全部') where.category = category;
    if (search) where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
    const prompts = await prisma.prompt.findMany({
      where,
      orderBy: { useCount: 'desc' },
      take: type === 'prompts' ? pageSize : 10,
      skip: type === 'prompts' ? (page - 1) * pageSize : 0,
      select: {
        id: true, title: true, description: true, category: true,
        tags: true, useCount: true, likeCount: true, createdAt: true, userId: true,
      },
    });
    results.push(...prompts.map(p => ({
      id: p.id,
      type: 'prompts',
      name: p.title && typeof p.title === 'object' ? (p.title as any)['zh-CN'] || '' : String(p.title || ''),
      description: p.description && typeof p.description === 'object' ? (p.description as any)['zh-CN'] || '' : String(p.description || ''),
      category: p.category || '通用',
      author: 'AIOS',
      downloads: Number(p.useCount || 0),
      rating: 4.5 + Math.min(Number(p.likeCount || 0) * 0.01, 0.5),
      icon: '📝',
      tags: p.tags || [],
      createdAt: p.createdAt,
    })));
  }

  // Fetch public workflows
  if (type === 'all' || type === 'workflows') {
    const where: any = { isPublic: true };
    if (search) where.name = { contains: search, mode: 'insensitive' };
    const workflows = await prisma.workflow.findMany({
      where,
      orderBy: { runCount: 'desc' },
      take: type === 'workflows' ? pageSize : 10,
      skip: type === 'workflows' ? (page - 1) * pageSize : 0,
      select: {
        id: true, name: true, description: true,
        runCount: true, createdAt: true, userId: true,
        user: { select: { username: true, displayName: true } },
      },
    });
    results.push(...workflows.map(w => ({
      id: w.id,
      type: 'workflows',
      name: w.name,
      description: w.description && typeof w.description === 'object' ? (w.description as any)['zh-CN'] || '' : String(w.description || ''),
      category: '工作流',
      author: w.user?.displayName || w.user?.username || 'Anonymous',
      downloads: Number(w.runCount || 0),
      rating: 4.5,
      icon: '⚡',
      tags: [],
      createdAt: w.createdAt,
    })));
  }

  // Sort by downloads desc
  results.sort((a, b) => b.downloads - a.downloads);

  return NextResponse.json({ items: results, total: results.length });
}
