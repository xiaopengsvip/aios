'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { LoadingSpinner } from '@/components/ui/Loading';

interface ApiKey {
  id: string;
  providerId: string;
  provider: { id: string; name: string; type: string; baseUrl: string; dashboardUrl?: string | null };
  keyMask: string;
  status: string;
  isEnabled: boolean;
  weight: number;
  rpm: number | null;
  tpm: number | null;
  dailyQuota: number | null;
  totalCalls: string | number;
  totalTokens: string | number;
  totalCost: string | number;
  expiresAt: string | null;
  quotaTotal: string | number | null;
  quotaRemaining: string | number | null;
  quotaResetAt: string | null;
  lastUsedAt: string | null;
  lastError: string | null;
  lastHealthCheck: string | null;
  circuitOpen: boolean;
  consecutiveErrors: number;
  createdAt: string;
}

interface Provider {
  id: string;
  name: string;
  type: string;
  isEnabled: boolean;
}

export default function AdminKeysPage() {
  const t = useTranslations('admin');
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editKey, setEditKey] = useState<ApiKey | null>(null);
  const [form, setForm] = useState({ providerId: '', name: '', keyValue: '', priority: 100, expiresAt: '', quotaTotal: '' });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; valid: boolean; modelCount?: number; error?: string } | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchData = useCallback(async () => {
    try {
      const [keysRes, providersRes] = await Promise.all([
        fetch('/api/admin/keys'),
        fetch('/api/admin/providers'),
      ]);
      const keysData = await keysRes.json();
      const providersData = await providersRes.json();
      if (keysData.keys) setKeys(keysData.keys);
      if (providersData.providers) setProviders(providersData.providers);
    } catch (err) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async () => {
    if (!form.providerId || !form.keyValue) return;
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: form.providerId,
          key: form.keyValue,
          weight: form.priority,
          expiresAt: form.expiresAt || null,
          quotaTotal: form.quotaTotal ? parseInt(form.quotaTotal) : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Key 添加成功' });
        setShowAdd(false);
        setForm({ providerId: '', name: '', keyValue: '', priority: 100, expiresAt: '', quotaTotal: '' });
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.error || '添加失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (keyId: string) => {
    setTesting(keyId);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId, action: 'test' }),
      });
      const data = await res.json();
      setTestResult({ id: keyId, ...data });
      fetchData();
    } catch (err: any) {
      setTestResult({ id: keyId, valid: false, error: err.message });
    } finally {
      setTesting(null);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await fetch('/api/admin/keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, status }),
      });
      fetchData();
    } catch {
      console.error('Failed to update');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除此 Key？')) return;
    try {
      await fetch(`/api/admin/keys?id=${id}`, { method: 'DELETE' });
      fetchData();
    } catch {
      console.error('Failed to delete');
    }
  };

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    RATE_LIMITED: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    INVALID: 'bg-red-500/10 text-red-400 border-red-500/20',
    FROZEN: 'bg-muted/10 text-muted-foreground border-border/20',
  };

  const formatBigInt = (v: string | number | null | undefined) => {
    if (v === null || v === undefined) return null;
    const n = typeof v === 'string' ? parseInt(v) : v;
    if (isNaN(n)) return null;
    return n;
  };

  const formatNumber = (v: string | number | null | undefined) => {
    const n = formatBigInt(v);
    if (n === null) return '—';
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  const getExpiryStatus = (expiresAt: string | null) => {
    if (!expiresAt) return { text: '未知', color: 'text-muted-foreground', hint: '未设置到期时间' };
    const days = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (days < 0) return { text: '已过期', color: 'text-red-400', hint: `过期于 ${new Date(expiresAt).toLocaleDateString()}` };
    if (days < 7) return { text: `${Math.ceil(days)}天后到期`, color: 'text-orange-400', hint: `到期于 ${new Date(expiresAt).toLocaleDateString()}` };
    return { text: new Date(expiresAt).toLocaleDateString(), color: 'text-muted-foreground', hint: `剩余 ${Math.floor(days)} 天` };
  };

  const getQuotaInfo = (key: ApiKey) => {
    const total = formatBigInt(key.quotaTotal);
    const remaining = formatBigInt(key.quotaRemaining);
    if (total === null && remaining === null) return { text: '未知', color: 'text-muted-foreground' };
    if (total !== null && remaining !== null) {
      const pct = total > 0 ? Math.round((remaining / total) * 100) : 0;
      const color = pct < 10 ? 'text-red-400' : pct < 30 ? 'text-orange-400' : 'text-emerald-400';
      return { text: `${formatNumber(remaining)} / ${formatNumber(total)} (${pct}%)`, color };
    }
    if (remaining !== null) return { text: `剩余 ${formatNumber(remaining)}`, color: 'text-muted-foreground' };
    return { text: `总额 ${formatNumber(total)}`, color: 'text-muted-foreground' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">API Key 管理</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {keys.length} 个 Key · {keys.filter(k => k.status === 'ACTIVE').length} 可用 · {keys.filter(k => k.status === 'INVALID').length} 失效
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium transition-all"
        >
          添加 Key
        </button>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`mb-6 p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message.text}
        </div>
      )}

      {/* Test result */}
      {testResult && (
        <div className={`mb-6 p-3 rounded-xl text-sm border ${testResult.valid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
          {testResult.valid
            ? `✅ Key 验证成功${testResult.modelCount ? `，可用模型 ${testResult.modelCount} 个` : ''}`
            : `❌ Key 验证失败: ${testResult.error}`}
        </div>
      )}

      {/* Add Form */}
      {showAdd && (
        <div className="mb-8 p-6 rounded-2xl border border-border bg-card">
          <h3 className="font-semibold mb-4">添加 API Key</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">服务商</label>
              <select value={form.providerId} onChange={(e) => setForm({ ...form, providerId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:border-indigo-500/50">
                <option value="">选择服务商</option>
                {providers.map((p) => (<option key={p.id} value={p.id}>{p.name} ({p.type})</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Key 名称 (可选)</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="生产环境 Key"
                className="w-full px-3 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:border-indigo-500/50" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-muted-foreground mb-1.5">API Key</label>
              <input type="password" value={form.keyValue} onChange={(e) => setForm({ ...form, keyValue: e.target.value })}
                placeholder="sk-..."
                className="w-full px-3 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:border-indigo-500/50 font-mono" />
              <p className="text-xs text-muted-foreground mt-1">Key 会加密存储，页面仅显示脱敏版本</p>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">到期时间 (可选)</label>
              <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm focus:outline-none focus:border-indigo-500/50" />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">总配额 Tokens (可选)</label>
              <input type="number" value={form.quotaTotal} onChange={(e) => setForm({ ...form, quotaTotal: e.target.value })}
                placeholder="留空表示未知"
                className="w-full px-3 py-2.5 rounded-xl bg-input border border-border text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:border-indigo-500/50" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleAdd} disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl text-sm font-medium transition-all">
              {saving ? '保存中...' : '保存'}
            </button>
            <button onClick={() => setShowAdd(false)}
              className="px-5 py-2.5 border border-border hover:bg-accent rounded-xl text-sm transition-all">
              取消
            </button>
          </div>
        </div>
      )}

      {/* Keys list */}
      <div className="space-y-3">
        {keys.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground rounded-2xl border border-border">
            <div className="text-4xl mb-3">🔑</div>
            <p className="font-medium">暂无 API Key</p>
            <p className="text-xs mt-1">添加 Key 后服务商才能正常工作</p>
          </div>
        ) : (
          keys.map((key) => {
            const expiry = getExpiryStatus(key.expiresAt);
            const quota = getQuotaInfo(key);
            const isTested = testResult?.id === key.id;

            return (
              <div key={key.id} className={`rounded-xl border p-4 transition-all ${
                key.status === 'ACTIVE' ? 'border-border bg-card/50' : 'border-border/50 bg-card/20'
              }`}>
                {/* Row 1: Provider + Status + Actions */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm">{key.provider?.name || '未知'}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${statusColors[key.status] || 'bg-muted/10 text-muted-foreground'}`}>
                      {key.status}
                    </span>
                    {key.circuitOpen && (
                      <span className="text-xs text-red-400">⚡ 熔断中</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTest(key.id)}
                      disabled={testing === key.id}
                      className="px-3 py-1 text-xs rounded-lg border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 transition-colors disabled:opacity-50"
                    >
                      {testing === key.id ? '测试中...' : '🔍 测试'}
                    </button>
                    {key.status === 'ACTIVE' ? (
                      <button onClick={() => handleStatusChange(key.id, 'FROZEN')}
                        className="px-2 py-1 text-xs rounded-lg hover:bg-yellow-500/10 text-yellow-400 transition-colors">
                        冻结
                      </button>
                    ) : (
                      <button onClick={() => handleStatusChange(key.id, 'ACTIVE')}
                        className="px-2 py-1 text-xs rounded-lg hover:bg-emerald-500/10 text-emerald-400 transition-colors">
                        启用
                      </button>
                    )}
                    <button onClick={() => handleDelete(key.id)}
                      className="px-2 py-1 text-xs rounded-lg hover:bg-red-500/10 text-red-400 transition-colors">
                      删除
                    </button>
                  </div>
                </div>

                {/* Row 2: Key mask + stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Key</span>
                    <div className="font-mono text-foreground">{key.keyMask}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">到期</span>
                    <div className={expiry.color} title={expiry.hint}>{expiry.text}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">配额</span>
                    <div className={quota.color}>{quota.text}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">累计调用</span>
                    <div>{formatNumber(key.totalCalls)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">累计 Token</span>
                    <div>{formatNumber(key.totalTokens)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">累计费用</span>
                    <div>¥{Number(key.totalCost || 0).toFixed(4)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">最近使用</span>
                    <div>{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : '—'}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">健康检查</span>
                    <div>{key.lastHealthCheck ? new Date(key.lastHealthCheck).toLocaleString() : '—'}</div>
                  </div>
                </div>

                {/* Error info */}
                {key.lastError && (
                  <div className="mt-2 text-xs text-red-400 bg-red-500/5 px-3 py-1.5 rounded-lg">
                    最近错误: {key.lastError}
                  </div>
                )}

                {/* Provider dashboard link */}
                {key.provider?.dashboardUrl && (
                  <div className="mt-2">
                    <a href={key.provider.dashboardUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                      查看 {key.provider.name} 管理后台 ↗
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
