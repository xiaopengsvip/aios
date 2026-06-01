'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { LoadingSpinner } from '@/components/ui/Loading';

interface DeviceStat {
  name: string;
  count: number;
}

interface PlatformDetail {
  total: number;
  devices: DeviceStat[];
  osVersions?: DeviceStat[];
}

interface Stats {
  total: number;
  activeWeek: number;
  todayNew: number;
  totalUninstalled: number;
  todayUninstalled: number;
  totalUpdates: number;
  todayUpdates: number;
  byPlatform: DeviceStat[];
  byAppVersion: DeviceStat[];
  platforms: {
    android: PlatformDetail;
    windows: PlatformDetail;
    macos: PlatformDetail;
    linux: PlatformDetail;
  };
  dailyNew: DeviceStat[];
}

const platformColors: Record<string, string> = {
  android: 'bg-green-500/20 text-green-400 border-green-500/30',
  windows: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  macos: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  linux: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const platformIcons: Record<string, string> = {
  android: '🤖',
  windows: '🪟',
  macos: '🍎',
  linux: '🐧',
};

export default function InstallsPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('admin.common');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('android');

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/app/stats');
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error('Failed to load stats:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        {tCommon('noData')}
      </div>
    );
  }

  const maxDaily = Math.max(...stats.dailyNew.map(d => d.count), 1);
  const activePlatform = stats.platforms[activeTab as keyof typeof stats.platforms];

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{t('installs.title')}</h1>
            <p className="text-muted-foreground text-sm mt-1">{t('installs.subtitle')}</p>
          </div>
          <button
            onClick={loadStats}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm transition-all"
          >
            {t('installs.refresh')}
          </button>
        </div>

        {/* Summary cards - 2 rows for complete metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label={t('installs.totalInstalls')}
            value={stats.total}
            icon="📊"
            color="from-indigo-500 to-purple-600"
          />
          <StatCard
            label={t('installs.activeWeek')}
            value={stats.activeWeek}
            icon="🔥"
            color="from-orange-500 to-red-600"
          />
          <StatCard
            label={t('installs.todayNew')}
            value={stats.todayNew}
            icon="📈"
            color="from-green-500 to-emerald-600"
          />
          <StatCard
            label={t('installs.todayUpdates')}
            value={stats.todayUpdates}
            icon="🔄"
            color="from-blue-500 to-cyan-600"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <StatCard
            label={t('installs.totalUninstalled')}
            value={stats.totalUninstalled}
            icon="📤"
            color="from-red-500 to-pink-600"
          />
          <StatCard
            label={t('installs.todayUninstalled')}
            value={stats.todayUninstalled}
            icon="⬇️"
            color="from-yellow-500 to-orange-600"
          />
          <StatCard
            label={t('installs.totalUpdates')}
            value={stats.totalUpdates}
            icon="🔃"
            color="from-cyan-500 to-blue-600"
          />
        </div>

        {/* Platform tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {Object.keys(stats.platforms).map(platform => (
            <button
              key={platform}
              onClick={() => setActiveTab(platform)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border whitespace-nowrap ${
                activeTab === platform
                  ? platformColors[platform]
                  : 'border-border/30 text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {platformIcons[platform]} {t(`installs.tabs.${platform}`)} ({stats.platforms[platform as keyof typeof stats.platforms].total})
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Device models */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-card/50">
              <h3 className="font-semibold">{t('installs.deviceModels')}</h3>
            </div>
            <div className="p-5">
              {activePlatform.devices.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">{t('installs.noData')}</p>
              ) : (
                <div className="space-y-3">
                  {activePlatform.devices.map((d, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-muted-foreground text-sm w-6 text-right">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium truncate">{d.name}</span>
                          <span className="text-muted-foreground">{d.count}</span>
                        </div>
                        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500/60 rounded-full transition-all"
                            style={{ width: `${(d.count / (activePlatform.devices[0]?.count || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* OS versions */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-card/50">
              <h3 className="font-semibold">{t('installs.osVersions')}</h3>
            </div>
            <div className="p-5">
              {(activePlatform.osVersions || []).length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">{t('installs.noData')}</p>
              ) : (
                <div className="space-y-3">
                  {(activePlatform.osVersions || []).map((d, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-muted-foreground text-sm w-6 text-right">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium truncate">{d.name}</span>
                          <span className="text-muted-foreground">{d.count}</span>
                        </div>
                        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500/60 rounded-full transition-all"
                            style={{ width: `${(d.count / (activePlatform.osVersions?.[0]?.count || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Daily trend */}
        <div className="rounded-xl border border-border overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-border bg-card/50">
            <h3 className="font-semibold">{t('installs.dailyTrend')}</h3>
          </div>
          <div className="p-5">
            {stats.dailyNew.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">{t('installs.noData')}</p>
            ) : (
              <div className="flex items-end gap-2 h-48">
                {stats.dailyNew.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <span className="text-xs text-muted-foreground">{d.count}</span>
                    <div
                      className="w-full bg-indigo-500/40 rounded-t-md transition-all min-h-[4px]"
                      style={{ height: `${(d.count / maxDaily) * 160}px` }}
                    />
                    <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                      {d.name.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* App versions */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-card/50">
            <h3 className="font-semibold">{t('installs.appVersions')}</h3>
          </div>
          <div className="p-5">
            <div className="flex gap-3 flex-wrap">
              {stats.byAppVersion.map((v, i) => (
                <div key={i} className="px-4 py-3 rounded-lg bg-muted/30 border border-border">
                  <div className="text-lg font-bold">v{v.name}</div>
                  <div className="text-sm text-muted-foreground">{v.count} {t('installs.devices')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-lg`}>
            {icon}
          </div>
          <div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
