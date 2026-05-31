import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const u = await prisma.user.findUnique({
      where: { id: user.id },
      select: { balance: true, creditLimit: true, dailyLimit: true, monthlyLimit: true, totalSpent: true },
    });

    return NextResponse.json({
      balance: Number(u?.balance || 0),
      creditLimit: Number(u?.creditLimit || 0),
      dailyLimit: Number(u?.dailyLimit || 0),
      monthlyLimit: Number(u?.monthlyLimit || 0),
      totalSpent: Number(u?.totalSpent || 0),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
