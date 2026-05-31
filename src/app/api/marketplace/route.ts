import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // agent, prompt, workflow
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Return published items from agents, prompts, workflows
    const results: any[] = [];

    if (!type || type === 'agents') {
      const agents = await prisma.agent.findMany({
        where: { isPublic: true, ...(search ? { name: { contains: search } } : {}) },
        take: limit,
        select: { id: true, name: true, description: true, createdAt: true },
      });
      results.push(...agents.map(a => ({ ...a, type: 'agent' })));
    }

    if (!type || type === 'prompts') {
      const prompts = await prisma.prompt.findMany({
        where: { isPublic: true },
        take: limit,
        select: { id: true, title: true, description: true, category: true, createdAt: true },
      });
      results.push(...prompts.map(p => ({ ...p, type: 'prompt' })));
    }

    return NextResponse.json({ items: results, total: results.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
