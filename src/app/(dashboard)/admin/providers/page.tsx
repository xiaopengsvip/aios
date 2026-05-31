'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { LoadingSpinner } from '@/components/ui/Loading';

interface ProviderItem {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
  isEnabled: boolean;
  dashboardUrl?: string | null;
  status: string;
  lastHealthCheck: string | null;
  avgLatency: number | null;
  successRate: string | null;
  rateLimit: number | null;
  concurrencyLimit: number | null;
  _count?: { keys: number; models: number };
  modelTypes?: Record<string, number>;
  activeKeys?: number;
  totalCalls?: number;
  totalTokens?: number;
  expiringKeys?: number;
  createdAt: string;
}

const providerTypes = [
  'OPENAI', 'ANTHROPIC', 'GOOGLE', 'DEEPSEEK', 'QWEN', 'GLM', 'KIMI',
  'MINIMAX', 'XAI', 'COHERE', 'MISTRAL', 'PERPLEXITY', 'OPENROUTER',
  'SILICONFLOW', 'OLLAMA', 'VLLM', 'LMSTUDIO', 'ONEAPI', 'CUSTOM',
];

const statusColors: Record<string, string> = {
  healthy: 'bg-green-500/20 text-green-400 border-green-500/30',
  unhealthy: 'bg-red-500/20 text-red-400 border-red-500/30',
  unknown: 'bg-muted/20 text-muted-foreground border-border/30',
};

const typeIcons: Record<string, string> = {
  CHAT: '💬', VISION: '👁️', IMAGE: '🎨', VIDEO: '🎬', AUDIO: '🎵',
  TTS: '🔊', STT: '🎤', EMBEDDING: '📐', OCR: '📝',
};

export default function AdminProvidersPage() {
  const t = useTranslations('admin');
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editProvider, setEditProvider] = useState<ProviderItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('OPENAI');
  const [newBaseUrl, setNewBaseUrl] = useState('');
  const [newDashboardUrl, setNewDashboardUrl] = useState('');
  const [newRateLimit, setNewRateLimit] = useState('');
  const [newConcurrencyLimit, setNewConcurrencyLimit] = useState('');

  const [editBaseUrl, setEditBaseUrl] = useState('');
  const [editIsEnabled, setEditIsEnabled] = useState(true);
  const [editRateLimit, setEditRateLimit] = useState('');
  const [editConcurrencyLimit, setEditConcurrencyLimit] = useState('');

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/providers');
      const data = await res.json();
      if (data.providers) setProviders(data.providers);
    } catch (err) {
      console.error('Failed to fetch providers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName, type: newType, baseUrl: newBaseUrl,
          dashboardUrl: newDashboardUrl || null,
          rateLimit: newRateLimit ? parseInt(newRateLimit) : null,
          concurrencyLimit: newConcurrencyLimit ? parseInt(newConcurrencyLimit) : null,
        }),
      });
      if (res.ok) {
        setShowAdd(false);
        setNewName(''); setNewType('OPENAI'); setNewBaseUrl(''); setNewDashboardUrl('');
        setNewRateLimit(''); setNewConcurrencyLimit('');
        fetchProviders();
      }
    } catch (err) {
      console.error('Failed to add provider:', err);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (provider: ProviderItem) => {
    setEditProvider(provider);
    setEditBaseUrl(provider.baseUrl);
    setEditIsEnabled(provider.isEnabled);
    setEditRateLimit(provider.rateLimit?.toString() || '');
    setEditConcurrencyLimit(provider.concurrencyLimit?.toString() || '');
  };

  const handleUpdate = async () => {
    if (!editProvider) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/providers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: editProvider.id,
          baseUrl: editBaseUrl, isEnabled: editIsEnabled,
          rateLimit: editRateLimit ? parseInt(editRateLimit) : null,
          concurrencyLimit: editConcurrencyLimit ? parseInt(editConcurrencyLimit) : null,
        }),
      });
      if (res.ok) { setEditProvider(null); fetchProviders(); }
    } catch (err) {
      console.error('Failed to update provider:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleProvider = async (provider: ProviderItem) => {
    try {
      await fetch('/api/admin/providers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: provider.id, isEnabled: !provider.isEnabled }),
      });
      fetchProviders();
    } catch (err) {
      console.error('Failed to toggle provider:', err);
    }
  };

  const formatNumber = (n?: number) => {
    if (n === undefined || n === null) return '—';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  // Summary stats
  const totalModels = providers.reduce((s, p) => s + (p._count?.models || 0), 0);
  const totalKeys = providers.reduce((s, p) => s + (p._count?.keys || 0), 0);
  const activeProviders = providers.filter(p => p.isEnabled && p.activeKeys && p.activeKeys > 0).length;
  const noKeyProviders = providers.filter(p => p.isEnabled && (!p._count?.keys || p._count.keys === 0)).length;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{t('providers.title')}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {providers.length} 个服务商 · {totalModels} 个模型 · {totalKeys} 个 Key
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm transition-all"
          >
            {t('providers.addProvider')}
          </button>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-xl border border-border bg-card">
            <div className="text-lg font-bold text-emerald-400">{activeProviders}</div>
            <div className="text-xs text-muted-foreground">可用服务商</div>
          </div>
          <div className="p-3 rounded-xl border border-border bg-card">
            <div className="text-lg font-bold text-yellow-400">{noKeyProviders}</div>
            <div className="text-xs text-muted-foreground">缺少 Key</div>
          </div>
          <div className="p-3 rounded-xl border border-border bg-card">
            <div className="text-lg font-bold">{totalModels}</div>
            <div className="text-xs text-muted-foreground">总模型数</div>
          </div>
          <div className="p-3 rounded-xl border border-border bg-card">
            <div className="text-lg font-bold">{totalKeys}</div>
            <div className="text-xs text-muted-foreground">总 Key 数</div>
          </div>
        </div>

        {/* Provider list */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <LoadingSpinner size="sm" className="mr-2" />
            {t('common.loading')}
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">{t('providers.noProviderData')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((provider) => {
              const hasKey = (provider._count?.keys || 0) > 0;
              const isActive = hasKey && provider.isEnabled;
              return (
                <div
                  key={provider.id}
                  className={`rounded-xl border p-5 transition-all ${
                    isActive
                      ? 'border-border bg-card/50 hover:border-border'
                      : hasKey
                      ? 'border-border/50 bg-card/20 opacity-60'
                      : 'border-dashed border-yellow-500/30 bg-yellow-500/5'
                  }`}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{provider.name}</h3>
                        <span className={`inline-block px-2 py-0.5 rounded-md text-xs border ${statusColors[provider.status] || statusColors.unknown}`}>
                          {provider.status}
                        </span>
                        {!hasKey && (
                          <span className="inline-block px-2 py-0.5 rounded-md text-xs border border-yellow-500/30 text-yellow-400 bg-yellow-500/10">
                            缺少 Key
                          </span>
                        )}
                        {(provider.expiringKeys || 0) > 0 && (
                          <span className="inline-block px-2 py-0.5 rounded-md text-xs border border-orange-500/30 text-orange-400 bg-orange-500/10">
                            即将到期
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{provider.type}</div>
                    </div>
                    <button
                      onClick={() => toggleProvider(provider)}
                      className={`w-10 h-5 rounded-full transition-all relative ${
                        provider.isEnabled ? 'bg-indigo-600' : 'bg-muted'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all"
                        style={{ left: provider.isEnabled ? '22px' : '2px' }}
                      />
                    </button>
                  </div>

                  {/* Model types */}
                  {provider.modelTypes && Object.keys(provider.modelTypes).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {Object.entries(provider.modelTypes).map(([type, count]) => (
                        <span key={type} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-muted/50 border border-border">
                          {typeIcons[type] || '📦'} {type} ×{count}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                    <div className="flex justify-between">
                      <span>API 端点</span>
                      <span className="text-muted-foreground truncate ml-4 max-w-[200px]" title={provider.baseUrl}>{provider.baseUrl}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>API Key</span>
                      <span className={hasKey ? 'text-emerald-400' : 'text-yellow-400'}>
                        {hasKey ? `${provider._count?.keys} 个 (${provider.activeKeys} 可用)` : '未配置'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>模型数</span>
                      <span>{provider._count?.models || 0}</span>
                    </div>
                    {provider.totalCalls !== undefined && provider.totalCalls > 0 && (
                      <div className="flex justify-between">
                        <span>累计调用</span>
                        <span>{formatNumber(provider.totalCalls)}</span>
                      </div>
                    )}
                    {provider.totalTokens !== undefined && provider.totalTokens > 0 && (
                      <div className="flex justify-between">
                        <span>累计 Token</span>
                        <span>{formatNumber(provider.totalTokens)}</span>
                      </div>
                    )}
                    {provider.avgLatency && (
                      <div className="flex justify-between">
                        <span>平均延迟</span>
                        <span>{provider.avgLatency}ms</span>
                      </div>
                    )}
                    {provider.rateLimit && (
                      <div className="flex justify-between">
                        <span>频率限制</span>
                        <span>{provider.rateLimit} RPM</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(provider)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 text-xs transition-all"
                    >
                      {t('providers.editConfig')}
                    </button>
                    {provider.dashboardUrl && (
                      <a
                        href={provider.dashboardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 text-xs transition-all"
                      >
                        管理后台 ↗
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Modal */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
              <h2 className="text-lg font-semibold mb-4">{t('providers.addTitle')}</h2>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">{t('providers.name')}</label>
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="OpenAI" required
                    className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-foreground text-sm focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">{t('providers.type')}</label>
                  <select value={newType} onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-foreground text-sm focus:outline-none focus:border-indigo-500">
                    {providerTypes.map((pt) => (<option key={pt} value={pt}>{pt}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">{t('providers.baseUrl')}</label>
                  <input value={newBaseUrl} onChange={(e) => setNewBaseUrl(e.target.value)} placeholder="https://api.openai.com" required
                    className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-foreground text-sm focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">管理后台 URL</label>
                  <input value={newDashboardUrl} onChange={(e) => setNewDashboardUrl(e.target.value)} placeholder="https://platform.openai.com/usage (可选)"
                    className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-foreground text-sm focus:outline-none focus:border-indigo-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">{t('providers.rateLimitRpm')}</label>
                    <input value={newRateLimit} onChange={(e) => setNewRateLimit(e.target.value)} type="number" placeholder={t('providers.optional')}
                      className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-foreground text-sm focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">{t('providers.concurrencyLimit')}</label>
                    <input value={newConcurrencyLimit} onChange={(e) => setNewConcurrencyLimit(e.target.value)} type="number" placeholder={t('providers.optional')}
                      className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-foreground text-sm focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowAdd(false)}
                    className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground text-sm transition-all">
                    {t('common.cancel')}
                  </button>
                  <button type="submit" disabled={saving}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm transition-all disabled:opacity-50">
                    {saving ? t('common.creating') : t('providers.createProvider')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editProvider && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
              <h2 className="text-lg font-semibold mb-4">{t('providers.editTitle', { name: editProvider.name })}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">{t('providers.baseUrl')}</label>
                  <input value={editBaseUrl} onChange={(e) => setEditBaseUrl(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-foreground text-sm focus:outline-none focus:border-indigo-500" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-muted-foreground">{t('providers.enabled')}</label>
                  <button onClick={() => setEditIsEnabled(!editIsEnabled)}
                    className={`w-10 h-5 rounded-full transition-all relative ${editIsEnabled ? 'bg-indigo-600' : 'bg-muted'}`}>
                    <div className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all"
                      style={{ left: editIsEnabled ? '22px' : '2px' }} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">{t('providers.rateLimitRpm')}</label>
                    <input value={editRateLimit} onChange={(e) => setEditRateLimit(e.target.value)} type="number" placeholder={t('providers.optional')}
                      className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-foreground text-sm focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">{t('providers.concurrencyLimit')}</label>
                    <input value={editConcurrencyLimit} onChange={(e) => setEditConcurrencyLimit(e.target.value)} type="number" placeholder={t('providers.optional')}
                      className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-foreground text-sm focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setEditProvider(null)}
                  className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground text-sm transition-all">
                  {t('common.cancel')}
                </button>
                <button onClick={handleUpdate} disabled={saving}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm transition-all disabled:opacity-50">
                  {saving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
