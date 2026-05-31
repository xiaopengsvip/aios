'use client';

import { useState, useEffect } from 'react';

interface UsageLog {
  id: string;
  endpoint: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  latency: number;
  modelName: string;
  providerName: string;
  createdAt: string;
}

interface UsageStats {
  totalTokens: number;
  totalCost: number;
  totalCalls: number;
  avgLatency: number;
}

export default function UsagePage() {
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [stats, setStats] = useState<UsageStats>({ totalTokens: 0, totalCost: 0, totalCalls: 0, avgLatency: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/usage');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setStats(data.stats || { totalTokens: 0, totalCost: 0, totalCalls: 0, avgLatency: 0 });
      }
    } catch {}
    setLoading(false);
  };

  const filtered = filter === 'all' ? logs : logs.filter(l => l.endpoint.includes(filter));

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-lg font-bold">📊 使用统计</h2>
        <p className="text-xs text-muted-foreground mt-1">Token 用量、费用、延迟统计</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '总调用', value: stats.totalCalls.toLocaleString(), icon: '📞', suffix: '次' },
          { label: '总 Token', value: stats.totalTokens.toLocaleString(), icon: '🔤', suffix: '' },
          { label: '总费用', value: `¥${stats.totalCost.toFixed(4)}`, icon: '💰', suffix: '' },
          { label: '平均延迟', value: `${stats.avgLatency}ms`, icon: '⏱️', suffix: '' },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-center gap-2"><span>{c.icon}</span><span className="text-xs text-muted-foreground">{c.label}</span></div>
            <div className="text-xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'chat', 'multimodal', 'image'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs ${filter === f ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-accent'}`}
          >
            {f === 'all' ? '全部' : f === 'chat' ? '对话' : f === 'multimodal' ? '多模态' : '图片'}
          </button>
        ))}
      </div>

      {/* Usage Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">时间</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">端点</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">模型</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">Prompt</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">Completion</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">总Token</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">费用</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground text-xs">延迟</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">加载中...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">暂无使用记录</td></tr>
              ) : (
                filtered.map(log => (
                  <tr key={log.id} className="hover:bg-accent/50">
                    <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString('zh-CN')}</td>
                    <td className="px-4 py-2 text-xs">{log.endpoint}</td>
                    <td className="px-4 py-2 text-xs">{log.modelName || '-'}</td>
                    <td className="px-4 py-2 text-xs text-right font-mono">{log.promptTokens}</td>
                    <td className="px-4 py-2 text-xs text-right font-mono">{log.completionTokens}</td>
                    <td className="px-4 py-2 text-xs text-right font-mono font-medium">{log.totalTokens}</td>
                    <td className="px-4 py-2 text-xs text-right font-mono">¥{Number(log.cost).toFixed(4)}</td>
                    <td className="px-4 py-2 text-xs text-right font-mono">{log.latency}ms</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
