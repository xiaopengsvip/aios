'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { LoadingSpinner } from '@/components/ui/Loading';

interface User {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  displayName: string | null;
  avatar: string | null;
  balance: string;
  creditLimit: string;
  totalSpent: string;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  createdAt: string;
}

const roleBadgeColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-500/20 text-red-400 border-red-500/30',
  ADMIN: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  USER: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  GUEST: 'bg-muted/20 text-muted-foreground border-border/30',
};

const statusBadgeColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
  SUSPENDED: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  BANNED: 'bg-red-500/20 text-red-400 border-red-500/30',
  PENDING_VERIFICATION: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export default function AdminUsersPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('admin.common');
  const locale = useLocale();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
        setTotal(data.total);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const openEditModal = (user: User) => {
    setEditUser(user);
    setEditRole(user.role);
    setEditStatus(user.status);
  };

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editUser.id,
          role: editRole,
          status: editStatus,
        }),
      });
      if (res.ok) {
        setEditUser(null);
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to update user:', err);
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{t('users.title')}</h1>
            <p className="text-muted-foreground text-sm mt-1">{t('users.totalUsers', { count: total })}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('users.searchPlaceholder')}
              className="px-4 py-2 rounded-lg bg-muted/50 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-indigo-500 text-sm w-64"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm transition-all"
            >
              {tCommon('search')}
            </button>
          </form>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 rounded-lg bg-muted/50 border border-border text-foreground text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">{tCommon('allRoles')}</option>
            <option value="SUPER_ADMIN">{t('users.roleSuperAdmin')}</option>
            <option value="ADMIN">{t('users.roleAdmin')}</option>
            <option value="USER">{t('users.roleUser')}</option>
            <option value="GUEST">{t('users.roleGuest')}</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 rounded-lg bg-muted/50 border border-border text-foreground text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">{tCommon('allStatus')}</option>
            <option value="ACTIVE">{t('users.statusActive')}</option>
            <option value="SUSPENDED">{t('users.statusSuspended')}</option>
            <option value="BANNED">{t('users.statusBanned')}</option>
            <option value="PENDING_VERIFICATION">{t('users.statusPending')}</option>
          </select>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card/50">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">{t('users.columnUser')}</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">{t('users.columnEmail')}</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">{t('users.columnRole')}</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">{t('users.columnStatus')}</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">{t('users.columnBalance')}</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">{t('users.columnLastLogin')}</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">{t('users.columnCreatedAt')}</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">{t('users.columnActions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <LoadingSpinner size="sm" />
                        {tCommon('loading')}
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground">
                      {t('users.noUsers')}
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold shrink-0">
                            {(user.displayName || user.username)?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-medium">{user.displayName || user.username}</div>
                            <div className="text-xs text-muted-foreground">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{user.email || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-xs border ${roleBadgeColors[user.role] || 'bg-muted/20 text-muted-foreground border-border/30'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-xs border ${statusBadgeColors[user.status] || 'bg-muted/20 text-muted-foreground border-border/30'}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        ¥{Number(user.balance).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleString(locale === 'zh-CN' ? 'zh-CN' : 'en-US')
                          : t('users.neverLogin')}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(user.createdAt).toLocaleString(locale === 'zh-CN' ? 'zh-CN' : 'en-US')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEditModal(user)}
                          className="px-3 py-1 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 text-xs transition-all"
                        >
                          {tCommon('edit')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <span className="text-sm text-muted-foreground">
              {tCommon('pageInfo', { page, total: totalPages })}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {tCommon('previousPage')}
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {tCommon('nextPage')}
              </button>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
              <h2 className="text-lg font-semibold mb-4">{t('users.editUser')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">{t('users.username')}</label>
                  <div className="px-4 py-2 rounded-lg bg-muted/50 border border-border text-muted-foreground text-sm">
                    {editUser.username}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">{t('users.role')}</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-foreground text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="GUEST">GUEST</option>
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">{t('users.status')}</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-foreground text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="BANNED">BANNED</option>
                    <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground text-sm transition-all"
                >
                  {tCommon('cancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm transition-all disabled:opacity-50"
                >
                  {saving ? tCommon('saving') : tCommon('save')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
