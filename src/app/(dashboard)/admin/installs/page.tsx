'use client';

import { useState, useEffect, useCallback } from 'react';

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
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('android');

  const loadStats = useCallback(async () => {
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center text-muted-foreground py-20">加载失败</div>;
  }

  const maxDaily = Math.max(...stats.dailyNew.map(d => d.count), 1);
  const activePlatform = stats.platforms[activeTab as keyof typeof stats.platforms];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">设备安装统计</h1>
          <p className="text-muted-foreground text-sm mt-1">查看不同平台和设备的安装量</p>
        </div>
        <button
          onClick={() => { setLoading(true); loadStats(); }}
          className="px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm"
        >
          刷新
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="总安装量" value={stats.total} icon="📊" />
        <StatCard label="7日活跃" value={stats.activeWeek} icon="🔥" />
        <StatCard label="今日新增" value={stats.todayNew} icon="📈" />
        {stats.byPlatform.map(p => (
          <StatCard
            key={p.name}
            label={p.name}
            value={p.count}
            icon={platformIcons[p.name] || '📱'}
          />
        ))}
      </div>

      {/* Platform tabs */}
      <div className="flex gap-2">
        {Object.keys(stats.platforms).map(platform => (
          <button
            key={platform}
            onClick={() => setActiveTab(platform)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              activeTab === platform
                ? platformColors[platform]
                : 'border-border/30 text-muted-foreground hover:bg-muted/50'
            }`}
          >
            {platformIcons[platform]} {platform} ({stats.platforms[platform as keyof typeof stats.platforms].total})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device models */}
        <div className="rounded-xl border border-border/50 bg-card/50 p-5">
          <h3 className="font-semibold mb-4">设备型号</h3>
          {activePlatform.devices.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">暂无数据</p>
          ) : (
            <div className="space-y-3">
              {activePlatform.devices.map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-muted-foreground text-sm w-6">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium truncate">{d.name}</span>
                      <span className="text-muted-foreground">{d.count}</span>
                    </div>
                    <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/60 rounded-full transition-all"
                        style={{ width: `${(d.count / (activePlatform.devices[0]?.count || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* OS versions */}
        <div className="rounded-xl border border-border/50 bg-card/50 p-5">
          <h3 className="font-semibold mb-4">系统版本</h3>
          {(activePlatform.osVersions || []).length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">暂无数据</p>
          ) : (
            <div className="space-y-3">
              {(activePlatform.osVersions || []).map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-muted-foreground text-sm w-6">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium truncate">{d.name}</span>
                      <span className="text-muted-foreground">{d.count}</span>
                    </div>
                    <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-secondary/60 rounded-full transition-all"
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

      {/* Daily trend */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-5">
        <h3 className="font-semibold mb-4">每日新增 (近14天)</h3>
        {stats.dailyNew.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">暂无数据</p>
        ) : (
          <div className="flex items-end gap-2 h-40">
            {stats.dailyNew.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">{d.count}</span>
                <div
                  className="w-full bg-primary/40 rounded-t-md transition-all min-h-[4px]"
                  style={{ height: `${(d.count / maxDaily) * 120}px` }}
                />
                <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                  {d.name.slice(5)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* App versions */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-5">
        <h3 className="font-semibold mb-4">应用版本分布</h3>
        <div className="flex gap-3 flex-wrap">
          {stats.byAppVersion.map((v, i) => (
            <div key={i} className="px-4 py-3 rounded-lg bg-muted/20 border border-border/30">
              <div className="text-lg font-bold">v{v.name}</div>
              <div className="text-sm text-muted-foreground">{v.count} 台设备</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
