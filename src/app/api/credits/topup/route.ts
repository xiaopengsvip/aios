import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount, paymentMethod = 'manual' } = await req.json();
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Update balance and create transaction
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: user.id },
        data: { balance: { increment: amount } },
        select: { balance: true },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'topup',
          amount,
          balanceAfter: updated.balance,
          description: `充值 ¥${amount}`,
          paymentMethod,
          paymentStatus: 'SUCCESS',
        },
      });

      return { balance: Number(updated.balance), transactionId: transaction.id };
    });

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
