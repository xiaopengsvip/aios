'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';

interface AuditLogItem {
  id: string;
  userId: string | null;
  user?: { username: string; email: string | null } | null;
  action: string;
  resource: string | null;
  resourceId: string | null;
  details: any;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

const actionColors: Record<string, string> = {
  LOGIN: 'bg-green-500/20 text-green-400',
  LOGOUT: 'bg-muted/20 text-muted-foreground',
  REGISTER: 'bg-blue-500/20 text-blue-400',
  PASSWORD_CHANGE: 'bg-yellow-500/20 text-yellow-400',
  API_CALL: 'bg-indigo-500/20 text-indigo-400',
  ADMIN_ACTION: 'bg-red-500/20 text-red-400',
  KEY_CREATE: 'bg-purple-500/20 text-purple-400',
  KEY_UPDATE: 'bg-purple-500/20 text-purple-400',
  KEY_DELETE: 'bg-red-500/20 text-red-400',
  MODEL_UPDATE: 'bg-cyan-500/20 text-cyan-400',
  PROVIDER_UPDATE: 'bg-cyan-500/20 text-cyan-400',
  USER_UPDATE: 'bg-orange-500/20 text-orange-400',
  BILLING_CHANGE: 'bg-yellow-500/20 text-yellow-400',
};

export default function AdminLogsPage() {
  const t = useTranslations('admin');
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (actionFilter) params.set('action', actionFilter);
      if (userIdFilter) params.set('userId', userIdFilter);
      const res = await fetch(`/api/admin/logs?${params}`);
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
        setTotal(data.total);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, actionFilter, userIdFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{t('logs.title')}</h1>
            <p className="text-muted-foreground text-sm mt-1">{t('logs.totalRecords', { count: total })}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 rounded-lg bg-muted/50 border border-border text-foreground text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">{t('logs.allActions')}</option>
            <option value="LOGIN">{t('logs.actionLogin')}</option>
            <option value="LOGOUT">{t('logs.actionLogout')}</option>
            <option value="REGISTER">{t('logs.actionRegister')}</option>
            <option value="ADMIN_ACTION">{t('logs.actionAdminAction')}</option>
            <option value="KEY_CREATE">{t('logs.actionKeyCreate')}</option>
            <option value="KEY_UPDATE">{t('logs.actionKeyUpdate')}</option>
            <option value="KEY_DELETE">{t('logs.actionKeyDelete')}</option>
            <option value="MODEL_UPDATE">{t('logs.actionModelUpdate')}</option>
            <option value="PROVIDER_UPDATE">{t('logs.actionProviderUpdate')}</option>
            <option value="USER_UPDATE">{t('logs.actionUserUpdate')}</option>
            <option value="BILLING_CHANGE">{t('logs.actionBillingChange')}</option>
          </select>
          <input
            value={userIdFilter}
            onChange={(e) => { setUserIdFilter(e.target.value); setPage(1); }}
            placeholder={t('logs.filterByUserId')}
            className="px-4 py-2 rounded-lg bg-muted/50 border border-border text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-indigo-500 w-64"
          />
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card/50">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">{t('logs.columnTime')}</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">{t('logs.columnUser')}</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">{t('logs.columnAction')}</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">{t('logs.columnResource')}</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">{t('logs.columnIp')}</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">{t('logs.columnDetails')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-border border-t-indigo-500 rounded-full animate-spin" />
                        {t('common.loading')}
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">{t('logs.noLogs')}</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {log.user ? (
                          <div>
                            <div className="text-sm">{log.user.username}</div>
                            <div className="text-xs text-muted-foreground">{log.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/70 text-xs">{log.userId || 'system'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-xs ${actionColors[log.action] || 'bg-muted/20 text-muted-foreground'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {log.resource ? (
                          <span>
                            {log.resource}
                            {log.resourceId && <span className="text-muted-foreground/70 ml-1">({log.resourceId.slice(0, 8)}...)</span>}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                        {log.ip || '-'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">
                        {log.details ? (
                          <span className="font-mono">{JSON.stringify(log.details)}</span>
                        ) : '-'}
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
              {t('common.pageInfo', { page, total: totalPages })}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {t('common.previousPage')}
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {t('common.nextPage')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
