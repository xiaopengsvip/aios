// ============================================================
// OAuth 第三方登录工具库
// 支持: GitHub, Google, X (Twitter)
// 功能: 登录/注册、绑定、解绑
// ============================================================

import crypto from 'crypto';
import prisma from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';

// ────────────────────────────────────────────
// 类型定义
// ────────────────────────────────────────────

export type OAuthProvider = 'github' | 'google' | 'twitter';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  userinfoUrl: string;
  scope: string;
}

export interface OAuthUserInfo {
  providerAccountId: string;
  username: string;
  email: string | null;
  avatar: string | null;
  displayName: string | null;
}

// ────────────────────────────────────────────
// Provider 配置
// ────────────────────────────────────────────

const APP_URL = process.env.APP_URL || 'https://aios.vios.top';

export const OAUTH_CONFIGS: Record<OAuthProvider, OAuthConfig> = {
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userinfoUrl: 'https://api.github.com/user',
    scope: 'read:user user:email',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userinfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scope: 'openid email profile',
  },
  twitter: {
    clientId: process.env.TWITTER_CLIENT_ID || '',
    clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
    authorizeUrl: 'https://x.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    userinfoUrl: 'https://api.twitter.com/2/users/me',
    scope: 'users.read tweet.read',
  },
};

// ────────────────────────────────────────────
// PKCE (X/Twitter OAuth 2.0 要求)
// ────────────────────────────────────────────

export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

export function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}

// ────────────────────────────────────────────
// 1. 生成授权 URL
// ────────────────────────────────────────────

export function getAuthorizationUrl(
  provider: OAuthProvider,
  state: string,
  codeChallenge?: string,
  baseUrl?: string
): string {
  const config = OAUTH_CONFIGS[provider];
  if (!config.clientId) {
    throw new Error(`OAuth provider ${provider} not configured`);
  }

  const redirectUri = `${baseUrl || APP_URL}/api/auth/oauth/callback`;

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scope,
    state,
  });

  // X/Twitter OAuth 2.0 需要 PKCE
  if (provider === 'twitter' && codeChallenge) {
    params.set('code_challenge', codeChallenge);
    params.set('code_challenge_method', 'S256');
  }

  // Google 需要 access_type=offline 才能拿到 refresh_token
  if (provider === 'google') {
    params.set('access_type', 'offline');
    params.set('prompt', 'consent');
  }

  return `${config.authorizeUrl}?${params.toString()}`;
}

// ────────────────────────────────────────────
// 2. 用授权码换 Token
// ────────────────────────────────────────────

export async function exchangeCodeForToken(
  provider: OAuthProvider,
  code: string,
  codeVerifier?: string,
  baseUrl?: string
): Promise<string> {
  const config = OAUTH_CONFIGS[provider];
  const redirectUri = `${baseUrl || APP_URL}/api/auth/oauth/callback`;

  const body: Record<string, string> = {
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json',
  };

  // X/Twitter OAuth 2.0 要求 Basic Auth + PKCE
  if (provider === 'twitter') {
    if (codeVerifier) body.code_verifier = codeVerifier;
    headers['Authorization'] = `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`;
  } else {
    body.client_id = config.clientId;
    body.client_secret = config.clientSecret;
  }

  const resp = await fetch(config.tokenUrl, {
    method: 'POST',
    headers,
    body: new URLSearchParams(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`[OAuth] ${provider} token exchange failed:`, errText);
    throw new Error(`Token exchange failed: ${resp.status}`);
  }

  const data = await resp.json();

  if (data.error) {
    throw new Error(`OAuth error: ${data.error_description || data.error}`);
  }

  return data.access_token;
}

// ────────────────────────────────────────────
// 3. 获取用户信息
// ────────────────────────────────────────────

export async function fetchUserInfo(
  provider: OAuthProvider,
  accessToken: string
): Promise<OAuthUserInfo> {
  const config = OAUTH_CONFIGS[provider];

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
  };

  const resp = await fetch(config.userinfoUrl, { headers });

  if (!resp.ok) {
    throw new Error(`Failed to fetch user info: ${resp.status}`);
  }

  const data = await resp.json();

  switch (provider) {
    case 'github':
      return {
        providerAccountId: String(data.id),
        username: data.login,
        email: data.email || null,
        avatar: data.avatar_url || null,
        displayName: data.name || data.login,
      };

    case 'google':
      return {
        providerAccountId: data.id,
        username: data.email?.split('@')[0] || `google_${data.id}`,
        email: data.email || null,
        avatar: data.picture || null,
        displayName: data.name || null,
      };

    case 'twitter': {
      const user = data.data || data;
      return {
        providerAccountId: user.id,
        username: user.username,
        email: null,
        avatar: user.profile_image_url || null,
        displayName: user.name || null,
      };
    }

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// ────────────────────────────────────────────
// 4. 查找或创建用户 + OAuth 关联（登录/注册用）
// ────────────────────────────────────────────

const PROVIDER_MAP: Record<OAuthProvider, 'GITHUB' | 'GOOGLE' | 'TWITTER'> = {
  github: 'GITHUB',
  google: 'GOOGLE',
  twitter: 'TWITTER',
};

export async function findOrCreateOAuthUser(
  provider: OAuthProvider,
  userInfo: OAuthUserInfo,
  accessToken: string,
  refreshToken?: string
) {
  const dbProvider = PROVIDER_MAP[provider];

  // 1. 查找已有的 OAuth 关联
  const existingAccount = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: dbProvider,
        providerAccountId: userInfo.providerAccountId,
      },
    },
    include: { user: true },
  });

  if (existingAccount) {
    // 更新 token 信息
    await prisma.oAuthAccount.update({
      where: { id: existingAccount.id },
      data: {
        accessToken,
        refreshToken: refreshToken || undefined,
        providerUsername: userInfo.username,
        providerAvatar: userInfo.avatar,
        providerEmail: userInfo.email,
      },
    });

    if (userInfo.avatar && userInfo.avatar !== existingAccount.user.avatar) {
      await prisma.user.update({
        where: { id: existingAccount.userId },
        data: { avatar: userInfo.avatar },
      });
    }

    return { user: existingAccount.user, isNewUser: false, needEmail: false };
  }

  // 2. 尝试通过邮箱匹配已有用户
  let user = null;
  if (userInfo.email) {
    user = await prisma.user.findUnique({
      where: { email: userInfo.email },
    });
  }

  // 3. 创建新用户
  if (!user) {
    let username = userInfo.username;
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      username = `${userInfo.username}_${Math.floor(Math.random() * 10000)}`;
    }

    // 自动分配数字账号 (5位起)
    let numericAccount: string | undefined;
    try {
      const seq = await prisma.accountSequence.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1, nextValue: 10000 },
      });
      numericAccount = String(seq.nextValue);
      await prisma.accountSequence.update({
        where: { id: 1 },
        data: { nextValue: seq.nextValue + 1 },
      });
    } catch (e) {
      console.warn('[OAuth] Failed to assign numericAccount:', e);
    }

    user = await prisma.user.create({
      data: {
        username,
        email: userInfo.email,
        displayName: userInfo.displayName || userInfo.username,
        avatar: userInfo.avatar,
        emailVerifiedAt: userInfo.email ? new Date() : null,
        locale: 'zh-CN',
        numericAccount,
      },
    });
  }

  // 4. 创建 OAuth 关联
  await prisma.oAuthAccount.create({
    data: {
      userId: user.id,
      provider: dbProvider,
      providerAccountId: userInfo.providerAccountId,
      providerUsername: userInfo.username,
      providerEmail: userInfo.email,
      providerAvatar: userInfo.avatar,
      accessToken,
      refreshToken,
    },
  });

  return { user, isNewUser: true, needEmail: !userInfo.email };
}

// ────────────────────────────────────────────
// 5. 绑定：将第三方账号关联到已登录用户
// ────────────────────────────────────────────

export async function bindOAuthAccount(
  userId: string,
  provider: OAuthProvider,
  userInfo: OAuthUserInfo,
  accessToken: string,
  refreshToken?: string
) {
  const dbProvider = PROVIDER_MAP[provider];

  // 检查该第三方账号是否已被其他用户绑定
  const existingAccount = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: dbProvider,
        providerAccountId: userInfo.providerAccountId,
      },
    },
  });

  if (existingAccount) {
    if (existingAccount.userId === userId) {
      // 已经绑定了，更新 token
      await prisma.oAuthAccount.update({
        where: { id: existingAccount.id },
        data: {
          accessToken,
          refreshToken: refreshToken || undefined,
          providerUsername: userInfo.username,
          providerAvatar: userInfo.avatar,
          providerEmail: userInfo.email,
        },
      });
      return { success: true, message: 'already_bound' };
    }
    // 被其他用户绑定了
    throw new Error('该第三方账号已被其他用户绑定');
  }

  // 创建绑定
  await prisma.oAuthAccount.create({
    data: {
      userId,
      provider: dbProvider,
      providerAccountId: userInfo.providerAccountId,
      providerUsername: userInfo.username,
      providerEmail: userInfo.email,
      providerAvatar: userInfo.avatar,
      accessToken,
      refreshToken,
    },
  });

  return { success: true, message: 'bound' };
}

// ────────────────────────────────────────────
// 6. 解绑：解除第三方账号关联
// ────────────────────────────────────────────

export async function unbindOAuthAccount(
  userId: string,
  provider: OAuthProvider
) {
  const dbProvider = PROVIDER_MAP[provider];

  // 查找绑定记录
  const account = await prisma.oAuthAccount.findFirst({
    where: {
      userId,
      provider: dbProvider,
    },
  });

  if (!account) {
    throw new Error('未绑定该第三方账号');
  }

  // 检查：如果用户没有密码且只绑定了一个第三方，不允许解绑
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { oauthAccounts: true },
  });

  if (!user) throw new Error('用户不存在');

  if (!user.passwordHash && user.oauthAccounts.length <= 1) {
    throw new Error('OAuth-only 用户至少需要保留一个第三方登录方式。请先设置密码后再解绑。');
  }

  // 删除绑定
  await prisma.oAuthAccount.delete({
    where: { id: account.id },
  });

  return { success: true };
}

// ────────────────────────────────────────────
// 7. 查询用户已绑定的第三方账号
// ────────────────────────────────────────────

export async function getUserOAuthAccounts(userId: string) {
  const accounts = await prisma.oAuthAccount.findMany({
    where: { userId },
    select: {
      id: true,
      provider: true,
      providerAccountId: true,
      providerUsername: true,
      providerEmail: true,
      providerAvatar: true,
      createdAt: true,
    },
  });

  return accounts;
}

// ────────────────────────────────────────────
// 8. 登录：生成 JWT + 设置 Cookie
// ────────────────────────────────────────────

export async function loginOAuthUser(user: {
  id: string;
  username: string;
  role: string;
  tenantId?: string | null;
}) {
  const token = signToken({
    userId: user.id,
    username: user.username,
    role: user.role,
    tenantId: user.tenantId || undefined,
  });
  await setAuthCookie(token);
  return token;
}
