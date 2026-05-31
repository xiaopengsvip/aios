'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { LoadingSpinner } from '@/components/ui/Loading';

interface SystemStats {
  userCount: number;
  activeUserCount: number;
  modelCount: number;
  providerCount: number;
  apiKeyCount: number;
  activeKeyCount: number;
  totalRequests: string;
  todayRequests: number;
  totalRevenue: string;
  avgLatency: number;
  errorRate: number;
  uptime: string;
  modelUsage: Array<{
    modelName: string;
    callCount: number;
    totalTokens: number;
  }>;
  recentErrors: Array<{
    id: string;
    errorMessage: string;
    modelName: string;
    createdAt: string;
  }>;
}

export default function AdminMonitorPage() {
  const t = useTranslations('admin');
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.stats) setStats(data.stats);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background text-muted-foreground">
        <div className="flex items-center gap-2">
          <LoadingSpinner size="sm" />
          {t('common.loading')}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{t('monitor.title')}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t('monitor.lastRefresh', { time: lastRefresh.toLocaleTimeString() })}
            </p>
          </div>
          <button
            onClick={fetchStats}
            className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 text-sm transition-all"
          >
            {t('monitor.refresh')}
          </button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-border bg-card/50 p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span>👥</span> {t('monitor.totalUsers')}
            </div>
            <div className="text-2xl font-bold">{stats?.userCount || 0}</div>
            <div className="text-xs text-muted-foreground/70 mt-1">{t('monitor.active')}: {stats?.activeUserCount || 0}</div>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span>📊</span> {t('monitor.todayRequests')}
            </div>
            <div className="text-2xl font-bold">{stats?.todayRequests?.toLocaleString() || 0}</div>
            <div className="text-xs text-muted-foreground/70 mt-1">{t('monitor.total')}: {stats?.totalRequests ? Number(stats.totalRequests).toLocaleString() : 0}</div>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span>⚡</span> {t('monitor.avgLatency')}
            </div>
            <div className="text-2xl font-bold">{stats?.avgLatency || 0}ms</div>
            <div className="text-xs text-muted-foreground/70 mt-1">
              {t('monitor.errorRate')}: {stats?.errorRate?.toFixed(2) || '0.00'}%
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span>💰</span> {t('monitor.totalRevenue')}
            </div>
            <div className="text-2xl font-bold">${stats?.totalRevenue ? Number(stats.totalRevenue).toFixed(2) : '0.00'}</div>
          </div>
        </div>

        {/* Resource Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-border bg-card/50 p-5">
            <h3 className="text-sm font-semibold mb-3">{t('monitor.systemStatus')}</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{t('monitor.cpuUsage')}</span>
                  <span>-</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-indigo-600" style={{ width: '0%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{t('monitor.memoryUsage')}</span>
                  <span>-</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-green-600" style={{ width: '0%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{t('monitor.diskUsage')}</span>
                  <span>-</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-yellow-600" style={{ width: '0%' }} />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-3">{t('monitor.systemMetricsHint')}</p>
          </div>

          <div className="rounded-xl border border-border bg-card/50 p-5">
            <h3 className="text-sm font-semibold mb-3">{t('monitor.resourceOverview')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('monitor.modelCount')}</span>
                <span>{stats?.modelCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('monitor.providerCount')}</span>
                <span>{stats?.providerCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('monitor.apiKeys')}</span>
                <span>{stats?.activeKeyCount || 0} / {stats?.apiKeyCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('monitor.uptime')}</span>
                <span>{stats?.uptime || '-'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/50 p-5">
            <h3 className="text-sm font-semibold mb-3">{t('monitor.healthStatus')}</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm">{t('monitor.apiService')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm">{t('monitor.database')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-sm">{t('monitor.cache')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm">{t('monitor.taskQueue')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Model Usage */}
        <div className="rounded-xl border border-border bg-card/50 p-6 mb-8">
          <h2 className="text-sm font-semibold mb-4">{t('monitor.modelUsageRank')}</h2>
          {stats?.modelUsage && stats.modelUsage.length > 0 ? (
            <div className="space-y-3">
              {stats.modelUsage.map((item, idx) => {
                const maxCalls = Math.max(...stats.modelUsage.map((m) => m.callCount));
                const pct = maxCalls > 0 ? (item.callCount / maxCalls) * 100 : 0;
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{item.modelName}</span>
                      <span className="text-muted-foreground">{item.callCount.toLocaleString()} {t('monitor.calls')}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground/70 text-sm">{t('monitor.noUsageData')}</div>
          )}
        </div>

        {/* Recent Errors */}
        <div className="rounded-xl border border-border bg-card/50 p-6">
          <h2 className="text-sm font-semibold mb-4">{t('monitor.recentErrors')}</h2>
          {stats?.recentErrors && stats.recentErrors.length > 0 ? (
            <div className="space-y-2">
              {stats.recentErrors.map((err) => (
                <div key={err.id} className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  <span className="text-red-400 text-xs mt-0.5">⚠</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-red-400 truncate">{err.errorMessage}</div>
                    <div className="text-xs text-muted-foreground/70 mt-1">
                      {err.modelName} · {new Date(err.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground/70 text-sm">{t('monitor.noErrors')}</div>
          )}
        </div>
      </div>
    </div>
  );
}
