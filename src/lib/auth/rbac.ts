// ============================================================
// RBAC 中间件 - 基于角色的访问控制
// ============================================================

import { requireAuth, requireAdmin, AuthError, type JWTPayload } from './index';

// 角色层级 (数字越大权限越高)
const ROLE_HIERARCHY: Record<string, number> = {
  GUEST: 0,
  USER: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

// 权限定义
export const Permissions = {
  // 用户权限
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // 聊天权限
  CHAT_USE: 'chat:use',
  CHAT_HISTORY: 'chat:history',
  
  // 文件权限
  FILE_UPLOAD: 'file:upload',
  FILE_READ: 'file:read',
  FILE_DELETE: 'file:delete',
  
  // Agent 权限
  AGENT_USE: 'agent:use',
  AGENT_CREATE: 'agent:create',
  AGENT_MANAGE: 'agent:manage',
  
  // Workflow 权限
  WORKFLOW_USE: 'workflow:use',
  WORKFLOW_CREATE: 'workflow:create',
  WORKFLOW_MANAGE: 'workflow:manage',
  
  // Admin 权限
  ADMIN_READ: 'admin:read',
  ADMIN_WRITE: 'admin:write',
  ADMIN_DELETE: 'admin:delete',
  
  // 系统权限
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_MONITOR: 'system:monitor',
} as const;

export type Permission = typeof Permissions[keyof typeof Permissions];

// 角色默认权限映射
const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  GUEST: [
    Permissions.USER_READ,
  ],
  USER: [
    Permissions.USER_READ,
    Permissions.USER_UPDATE,
    Permissions.CHAT_USE,
    Permissions.CHAT_HISTORY,
    Permissions.FILE_UPLOAD,
    Permissions.FILE_READ,
    Permissions.FILE_DELETE,
    Permissions.AGENT_USE,
    Permissions.WORKFLOW_USE,
  ],
  ADMIN: [
    Permissions.USER_READ,
    Permissions.USER_UPDATE,
    Permissions.USER_DELETE,
    Permissions.CHAT_USE,
    Permissions.CHAT_HISTORY,
    Permissions.FILE_UPLOAD,
    Permissions.FILE_READ,
    Permissions.FILE_DELETE,
    Permissions.AGENT_USE,
    Permissions.AGENT_CREATE,
    Permissions.AGENT_MANAGE,
    Permissions.WORKFLOW_USE,
    Permissions.WORKFLOW_CREATE,
    Permissions.WORKFLOW_MANAGE,
    Permissions.ADMIN_READ,
    Permissions.ADMIN_WRITE,
    Permissions.SYSTEM_MONITOR,
  ],
  SUPER_ADMIN: Object.values(Permissions), // 所有权限
};

// 检查角色是否有指定权限
export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = DEFAULT_ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

// 检查角色是否满足最低级别
export function hasMinimumRole(role: string, minimumRole: string): boolean {
  return (ROLE_HIERARCHY[role] || 0) >= (ROLE_HIERARCHY[minimumRole] || 0);
}

// API 中间件: 要求指定权限
export async function requirePermission(permission: Permission): Promise<JWTPayload> {
  const payload = await requireAuth();
  
  if (!hasPermission(payload.role, permission)) {
    throw new AuthError('权限不足', 403);
  }
  
  return payload;
}

// API 中间件: 要求最低角色级别
export async function requireRole(minimumRole: string): Promise<JWTPayload> {
  const payload = await requireAuth();
  
  if (!hasMinimumRole(payload.role, minimumRole)) {
    throw new AuthError('权限不足', 403);
  }
  
  return payload;
}

// 导出便捷方法
export { requireAuth, requireAdmin };
