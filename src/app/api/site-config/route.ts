import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    let config = await prisma.siteConfig.findUnique({ where: { id: 'site' } });
    if (!config) {
      config = await prisma.siteConfig.create({ data: { id: 'site' } });
    }
    return NextResponse.json({ config });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}
