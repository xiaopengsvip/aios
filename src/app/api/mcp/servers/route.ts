import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const MCP_CONFIG_KEY = 'mcp_servers';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const config = await prisma.systemConfig.findUnique({ where: { key: MCP_CONFIG_KEY } });
    const servers = (config?.value as any[]) || [];
    return NextResponse.json({ servers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const server = await req.json();
    const config = await prisma.systemConfig.findUnique({ where: { key: MCP_CONFIG_KEY } });
    const servers = (config?.value as any[]) || [];
    servers.push({ ...server, id: `mcp-${Date.now()}` });

    await prisma.systemConfig.upsert({
      where: { key: MCP_CONFIG_KEY },
      update: { value: servers },
      create: { key: MCP_CONFIG_KEY, value: servers, description: 'MCP Server configurations' },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  try {
    const config = await prisma.systemConfig.findUnique({ where: { key: MCP_CONFIG_KEY } });
    const servers = ((config?.value as any[]) || []).filter(s => s.id !== id);

    await prisma.systemConfig.update({
      where: { key: MCP_CONFIG_KEY },
      data: { value: servers },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
