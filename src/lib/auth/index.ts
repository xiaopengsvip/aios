import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'aios-jwt-secret-change-in-production';
const ACCESS_TOKEN_EXPIRES = '15m';  // 短期 access token
const REFRESH_TOKEN_EXPIRES = '7d';  // 长期 refresh token
const COOKIE_NAME = 'aios_token';
const REFRESH_COOKIE_NAME = 'aios_refresh';

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
  tenantId?: string;
  type?: 'access' | 'refresh';
  _newAccessToken?: string;  // 自动刷新时使用
}

// 生成 Access Token
export function signToken(payload: Omit<JWTPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'access' }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
}

// 生成 Refresh Token
export function signRefreshToken(payload: Omit<JWTPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'refresh' }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES });
}

// 验证 JWT (支持 access 和 refresh)
export function verifyToken(token: string, expectedType?: 'access' | 'refresh'): JWTPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    if (expectedType && payload.type !== expectedType) return null;
    return payload;
  } catch {
    return null;
  }
}

// 密码哈希
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// 验证密码
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// 获取当前用户 (Server Component)
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      numericAccount: true,
      username: true,
      email: true,
      role: true,
      status: true,
      displayName: true,
      avatar: true,
      locale: true,
      balance: true,
      creditLimit: true,
      tenantId: true,
    },
  });

  if (!user || user.status !== 'ACTIVE') return null;
  return user;
}

// 设置认证 Cookies (access + refresh)
export async function setAuthCookie(accessToken: string, refreshToken?: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutes
    path: '/',
  });
  if (refreshToken) {
    cookieStore.set(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });
  }
}

// 清除认证 Cookies
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete(REFRESH_COOKIE_NAME);
}

// API 路由中间件: 检查认证 (自动刷新过期 access token)
export async function requireAuth(): Promise<JWTPayload & { _newAccessToken?: string }> {
  // 优先检查 Authorization header (Desktop/Mobile 客户端)
  const { headers } = await import('next/headers');
  const headerStore = await headers();
  const authHeader = headerStore.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice(7);
    const payload = verifyToken(bearerToken, 'access');
    if (payload) return payload;
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE_NAME)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

  // 尝试 access token
  if (accessToken) {
    const payload = verifyToken(accessToken, 'access');
    if (payload) return payload;
  }

  // access token 过期，尝试 refresh token
  if (refreshToken) {
    const payload = verifyToken(refreshToken, 'refresh');
    if (payload) {
      // 刷新: 生成新的 access token
      const newAccessToken = signToken({
        userId: payload.userId,
        username: payload.username,
        role: payload.role,
        tenantId: payload.tenantId,
      });
      return { ...payload, _newAccessToken: newAccessToken };
    }
  }

  throw new AuthError('未登录', 401);
}

// API 路由中间件: 检查管理员权限
export async function requireAdmin(): Promise<JWTPayload> {
  const payload = await requireAuth();
  if (payload.role !== 'ADMIN' && payload.role !== 'SUPER_ADMIN') {
    throw new AuthError('权限不足', 403);
  }
  return payload;
}

// 自定义错误类
export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AuthError';
  }
}
