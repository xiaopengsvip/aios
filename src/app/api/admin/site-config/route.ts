import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
    let config = await prisma.siteConfig.findUnique({ where: { id: 'site' } });
    if (!config) config = await prisma.siteConfig.create({ data: { id: 'site' } });
    return NextResponse.json({ config });
  } catch (error: any) {
    if (error.name === 'AuthError') return NextResponse.json({ error: error.message }, { status: error.statusCode });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const config = await prisma.siteConfig.upsert({
      where: { id: 'site' },
      update: body,
      create: { id: 'site', ...body },
    });
    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    if (error.name === 'AuthError') return NextResponse.json({ error: error.message }, { status: error.statusCode });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
