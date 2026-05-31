// ============================================================
// API Key 到期提醒邮件发送
// POST /api/admin/keys/send-expiry-alert
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { sendMail, keyExpirationEmail } from '@/lib/mail';

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { daysBefore = 7 } = body;

    // 查询即将到期的 Key
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysBefore * 24 * 60 * 60 * 1000);

    const expiringKeys = await prisma.apiKey.findMany({
      where: {
        isEnabled: true,
        expiresAt: {
          not: null,
          lte: futureDate,
          gte: now,
        },
      },
      include: {
        provider: { select: { name: true } },
      },
    });

    if (expiringKeys.length === 0) {
      return NextResponse.json({
        message: 'No expiring keys found',
        sent: 0,
      });
    }

    // 获取管理员邮箱
    const admin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
      select: { email: true },
    });

    if (!admin?.email) {
      return NextResponse.json({ error: 'No admin email found' }, { status: 400 });
    }

    // 发送邮件
    let sent = 0;
    for (const key of expiringKeys) {
      const daysLeft = Math.ceil(
        (new Date(key.expiresAt!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      const email = keyExpirationEmail(
        key.provider.name,
        key.keyMask,
        daysLeft
      );

      const success = await sendMail({
        to: admin.email,
        subject: email.subject,
        html: email.html,
      });

      if (success) sent++;
    }

    return NextResponse.json({
      message: `Sent ${sent} expiry alerts`,
      total: expiringKeys.length,
      sent,
      keys: expiringKeys.map(k => ({
        provider: k.provider.name,
        mask: k.keyMask,
        expiresAt: k.expiresAt,
      })),
    });
  } catch (error: any) {
    if (error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[Send Expiry Alert]', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
