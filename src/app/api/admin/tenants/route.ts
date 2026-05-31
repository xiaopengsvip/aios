import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { users: true } } },
    });

    return NextResponse.json({
      tenants: tenants.map(t => ({
        ...t,
        balance: Number(t.balance),
        creditLimit: Number(t.creditLimit),
        userCount: t._count.users,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, slug, domain, plan = 'free' } = await req.json();
    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug required' }, { status: 400 });
    }

    const planLimits: Record<string, { maxUsers: number; maxApiCalls: number }> = {
      free: { maxUsers: 5, maxApiCalls: 10000 },
      pro: { maxUsers: 50, maxApiCalls: 100000 },
      enterprise: { maxUsers: 500, maxApiCalls: 1000000 },
    };

    const limits = planLimits[plan] || planLimits.free;

    const tenant = await prisma.tenant.create({
      data: { name, slug, domain, plan, ...limits },
    });

    return NextResponse.json({ tenant });
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await prisma.tenant.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
