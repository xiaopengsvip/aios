import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// 用户名规则
const USERNAME_MIN = 3;
const USERNAME_MAX = 20;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const COOLDOWN_DAYS = 30;   // 改名冷却期
const FREEZE_DAYS = 7;      // 旧用户名冻结期

export async function GET() {
  try {
    const payload = await requireAuth();
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        numericAccount: true,
        username: true,
        email: true,
        displayName: true,
        avatar: true,
        bio: true,
        locale: true,
        timezone: true,
        role: true,
        twoFactorEnabled: true,
        balance: true,
        createdAt: true,
        lastLoginAt: true,
        usernameChangedAt: true,
      },
    });
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

    // 计算冷却信息
    let usernameCooldown: { until: string; remainingDays: number } | null = null;
    if (user.usernameChangedAt) {
      const cooldownEnd = new Date(user.usernameChangedAt);
      cooldownEnd.setDate(cooldownEnd.getDate() + COOLDOWN_DAYS);
      const now = new Date();
      if (cooldownEnd > now) {
        const remainingMs = cooldownEnd.getTime() - now.getTime();
        usernameCooldown = {
          until: cooldownEnd.toISOString(),
          remainingDays: Math.ceil(remainingMs / (1000 * 60 * 60 * 24)),
        };
      }
    }

    return NextResponse.json({ user, usernameCooldown });
  } catch {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const payload = await requireAuth();
    const body = await req.json();
    const { displayName, username, email, bio, locale, timezone } = body;

    const data: Record<string, any> = {};
    if (displayName !== undefined) data.displayName = displayName;
    if (bio !== undefined) data.bio = bio;
    if (locale !== undefined) data.locale = locale;
    if (timezone !== undefined) data.timezone = timezone;

    if (username !== undefined) {
      // 1. 格式校验
      if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
        return NextResponse.json(
          { error: `用户名长度需 ${USERNAME_MIN}-${USERNAME_MAX} 位` },
          { status: 400 }
        );
      }
      if (!USERNAME_REGEX.test(username)) {
        return NextResponse.json(
          { error: '用户名只能包含字母、数字和下划线' },
          { status: 400 }
        );
      }
      // 禁止纯数字（和 numericAccount 冲突）
      if (/^\d+$/.test(username)) {
        return NextResponse.json(
          { error: '用户名不能是纯数字' },
          { status: 400 }
        );
      }

      // 2. 冷却期校验（30 天）
      const currentUser = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { username: true, usernameChangedAt: true },
      });

      if (currentUser?.usernameChangedAt) {
        const cooldownEnd = new Date(currentUser.usernameChangedAt);
        cooldownEnd.setDate(cooldownEnd.getDate() + COOLDOWN_DAYS);
        if (cooldownEnd > new Date()) {
          const remainingDays = Math.ceil(
            (cooldownEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          return NextResponse.json(
            { error: `用户名 ${COOLDOWN_DAYS} 天内只能修改一次，还需等待 ${remainingDays} 天` },
            { status: 429 }
          );
        }
      }

      // 3. 重复校验（当前用户表）
      if (username !== currentUser?.username) {
        const existing = await prisma.user.findFirst({
          where: { username, id: { not: payload.userId } },
        });
        if (existing) {
          return NextResponse.json({ error: '用户名已被占用' }, { status: 409 });
        }

        // 4. 冻结期校验（旧用户名 90 天内不可用）
        const frozen = await prisma.usernameHistory.findFirst({
          where: {
            username,
            releasedAt: { gt: new Date() },
          },
        });
        if (frozen) {
          const releaseDate = frozen.releasedAt.toLocaleDateString('zh-CN');
          return NextResponse.json(
            { error: `该用户名正在冻结中，${releaseDate} 后可使用` },
            { status: 409 }
          );
        }

        // 5. 记录旧用户名到冻结列表
        if (currentUser?.username && currentUser.username !== username) {
          const releasedAt = new Date();
          releasedAt.setDate(releasedAt.getDate() + FREEZE_DAYS);

          await prisma.$transaction([
            prisma.usernameHistory.upsert({
              where: { username: currentUser.username },
              update: { releasedAt, userId: payload.userId },
              create: { username: currentUser.username, releasedAt, userId: payload.userId },
            }),
          ]);
        }

        data.username = username;
        data.usernameChangedAt = new Date();
      }
    }

    if (email !== undefined && email !== '') {
      const existing = await prisma.user.findFirst({
        where: { email, id: { not: payload.userId } },
      });
      if (existing) return NextResponse.json({ error: '邮箱已被使用' }, { status: 409 });
      data.email = email;
    }

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data,
      select: {
        id: true,
        numericAccount: true,
        username: true,
        email: true,
        displayName: true,
        avatar: true,
        bio: true,
        locale: true,
        timezone: true,
        usernameChangedAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (e: any) {
    if (e?.status === 401) return NextResponse.json({ error: '未登录' }, { status: 401 });
    console.error('[Profile Update Error]', e);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
