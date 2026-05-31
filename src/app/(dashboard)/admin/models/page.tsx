'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { LoadingSpinner } from '@/components/ui/Loading';

interface ProviderInfo {
  id: string;
  name: string;
  type: string;
}

interface ModelItem {
  id: string;
  name: string;
  displayName: any;
  type: string;
  providerId: string;
  provider: ProviderInfo;
  providerStatus?: 'online' | 'unknown' | 'no_keys';
  maxTokens: number;
  contextWindow: number;
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsToolUse: boolean;
  inputPrice: string;
  outputPrice: string;
  isEnabled: boolean;
  totalCalls: string;
  totalTokens: string;
  createdAt: string;
}

export default function AdminModelsPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('admin.common');
  const [models, setModels] = useState<ModelItem[]>([]);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerFilter, setProviderFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editModel, setEditModel] = useState<ModelItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Add form state
  const [newName, setNewName] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newProviderId, setNewProviderId] = useState('');
  const [newType, setNewType] = useState('CHAT');
  const [newMaxTokens, setNewMaxTokens] = useState('4096');
  const [newContextWindow, setNewContextWindow] = useState('128000');
  const [newInputPrice, setNewInputPrice] = useState('0');
  const [newOutputPrice, setNewOutputPrice] = useState('0');

  // Edit form state
  const [editInputPrice, setEditInputPrice] = useState('');
  const [editOutputPrice, setEditOutputPrice] = useState('');
  const [editIsEnabled, setEditIsEnabled] = useState(true);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (providerFilter) params.set('providerId', providerFilter);
      const res = await fetch(`/api/admin/models?${params}`);
      const data = await res.json();
      if (data.models) setModels(data.models);
    } catch (err) {
      console.error('Failed to fetch models:', err);
    } finally {
      setLoading(false);
    }
  }, [providerFilter]);

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/admin/providers');
      const data = await res.json();
      if (data.providers) setProviders(data.providers);
    } catch (err) {
      console.error('Failed to fetch providers:', err);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          displayName: { 'zh-CN': newDisplayName, 'en-US': newDisplayName },
          providerId: newProviderId,
          type: newType,
          maxTokens: parseInt(newMaxTokens),
          contextWindow: parseInt(newContextWindow),
          inputPrice: parseFloat(newInputPrice),
          outputPrice: parseFloat(newOutputPrice),
        }),
      });
      if (res.ok) {
        setShowAdd(false);
        setNewName('');
        setNewDisplayName('');
        setNewProviderId('');
        setNewType('CHAT');
        setNewMaxTokens('4096');
        setNewContextWindow('128000');
        setNewInputPrice('0');
        setNewOutputPrice('0');
        fetchModels();
      }
    } catch (err) {
      console.error('Failed to add model:', err);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (model: ModelItem) => {
    setEditModel(model);
    setEditInputPrice(model.inputPrice);
    setEditOutputPrice(model.outputPrice);
    setEditIsEnabled(model.isEnabled);
  };

  const handleUpdate = async () => {
    if (!editModel) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/models', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: editModel.id,
          inputPrice: parseFloat(editInputPrice),
          outputPrice: parseFloat(editOutputPrice),
          isEnabled: editIsEnabled,
        }),
      });
      if (res.ok) {
        setEditModel(null);
        fetchModels();
      }
    } catch (err) {
      console.error('Failed to update model:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleModel = async (model: ModelItem) => {
    try {
      await fetch('/api/admin/models', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: model.id,
          isEnabled: !model.isEnabled,
        }),
      });
      fetchModels();
    } catch (err) {
      console.error('Failed to toggle model:', err);
    }
  };

  const modelsByProvider = models.reduce((acc, model) => {
    const key = model.provider.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(model);
    return acc;
  }, {} as Record<string, ModelItem[]>);

  // 解析多语言 displayName
  const getDisplayName = (m: ModelItem) => {
    if (typeof m.displayName === 'object' && m.displayName !== null) {
      return m.displayName['zh-CN'] || m.displayName['en-US'] || m.name;
    }
    if (typeof m.displayName === 'string') {
      try {
        const parsed = JSON.parse(m.displayName);
        return parsed['zh-CN'] || parsed['en-US'] || m.name;
      } catch { return m.name; }
    }
    return m.name;
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{t('models.title')}</h1>
            <p className="text-muted-foreground text-sm mt-1">{t('models.totalModels', { count: models.length })}</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm transition-all"
          >
            {t('models.addModel')}
          </button>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">{t('models.allProviders')}</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Models by provider */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <LoadingSpinner size="sm" className="mr-2" />
            {tCommon('loading')}
          </div>
        ) : Object.keys(modelsByProvider).length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">{t('models.noModelData')}</div>
        ) : (
          <div className="space-y-8">
            {Object.entries(modelsByProvider).map(([providerName, providerModels]) => (
              <div key={providerName}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    providerModels.some((m: any) => m.providerStatus === 'online')
                      ? 'bg-emerald-500 animate-pulse'
                      : providerModels.some((m: any) => m.providerStatus === 'unknown')
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`} />
                  {providerName}
                  <span className="text-sm text-muted-foreground font-normal">({providerModels.length})</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    providerModels.some((m: any) => m.providerStatus === 'online')
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : providerModels.some((m: any) => m.providerStatus === 'unknown')
                      ? 'bg-yellow-500/15 text-yellow-400'
                      : 'bg-red-500/15 text-red-400'
                  }`}>
                    {providerModels.some((m: any) => m.providerStatus === 'online')
                      ? '在线'
                      : providerModels.some((m: any) => m.providerStatus === 'unknown')
                      ? '未知'
                      : '无 Key'}
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {providerModels.map((model) => (
                    <div
                      key={model.id}
                      className={`rounded-xl border p-4 transition-all ${
                        model.isEnabled
                          ? 'border-border bg-card/50 hover:border-border'
                          : 'border-border bg-card/20 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-medium text-sm">{getDisplayName(model)}</div>
                          <div className="text-[10px] text-muted-foreground/60 mt-0.5 font-mono">{model.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{model.type}</div>
                        </div>
                        <button
                          onClick={() => toggleModel(model)}
                          className={`w-10 h-5 rounded-full transition-all relative ${
                            model.isEnabled ? 'bg-indigo-600' : 'bg-muted'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${
                              model.isEnabled ? 'left-5.5' : 'left-0.5'
                            }`}
                            style={{ left: model.isEnabled ? '22px' : '2px' }}
                          />
                        </button>
                      </div>
                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>{t('models.contextWindow')}</span>
                          <span>{(model.contextWindow / 1000).toFixed(0)}K</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('models.inputPrice')}</span>
                          <span>${Number(model.inputPrice).toFixed(4)}/1M tokens</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('models.outputPrice')}</span>
                          <span>${Number(model.outputPrice).toFixed(4)}/1M tokens</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('models.totalCalls')}</span>
                          <span>{Number(model.totalCalls).toLocaleString()}</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          {model.supportsStreaming && <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px]">{t('models.streaming')}</span>}
                          {model.supportsVision && <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px]">{t('models.vision')}</span>}
                          {model.supportsToolUse && <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px]">{t('models.tools')}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => openEdit(model)}
                        className="w-full mt-3 px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 text-xs transition-all"
                      >
                        {t('models.editPricing')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Modal */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">{t('models.addTitle')}</h2>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">{t('models.modelName')}</label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="gpt-4o"
                    required
                    className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">{t('models.displayName')}</label>
                  <input
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    placeholder="GPT-4o"
                    className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">{t('models.provider')}</label>
                  <select
                    value={newProviderId}
                    onChange={(e) => setNewProviderId(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">{t('models.selectProvider')}</option>
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">{t('models.type')}</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    {['CHAT', 'IMAGE', 'VIDEO', 'AUDIO', 'TTS', 'STT', 'EMBEDDING', 'OCR', 'VISION'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">{t('models.maxTokens')}</label>
                    <input
                      value={newMaxTokens}
                      onChange={(e) => setNewMaxTokens(e.target.value)}
                      type="number"
                      className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">{t('models.contextWindowSize')}</label>
                    <input
                      value={newContextWindow}
                      onChange={(e) => setNewContextWindow(e.target.value)}
                      type="number"
                      className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">{t('models.inputPriceLabel')}</label>
                    <input
                      value={newInputPrice}
                      onChange={(e) => setNewInputPrice(e.target.value)}
                      type="number"
                      step="0.0001"
                      className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">{t('models.outputPriceLabel')}</label>
                    <input
                      value={newOutputPrice}
                      onChange={(e) => setNewOutputPrice(e.target.value)}
                      type="number"
                      step="0.0001"
                      className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground text-sm transition-all"
                  >
                    {tCommon('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm transition-all disabled:opacity-50"
                  >
                    {saving ? tCommon('creating') : t('models.createModel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editModel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
              <h2 className="text-lg font-semibold mb-4">{t('models.editTitle', { name: editModel.name })}</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">{t('models.inputPriceLabel')}</label>
                    <input
                      value={editInputPrice}
                      onChange={(e) => setEditInputPrice(e.target.value)}
                      type="number"
                      step="0.0001"
                      className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">{t('models.outputPriceLabel')}</label>
                    <input
                      value={editOutputPrice}
                      onChange={(e) => setEditOutputPrice(e.target.value)}
                      type="number"
                      step="0.0001"
                      className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-muted-foreground">{t('models.enabled')}</label>
                  <button
                    onClick={() => setEditIsEnabled(!editIsEnabled)}
                    className={`w-10 h-5 rounded-full transition-all relative ${
                      editIsEnabled ? 'bg-indigo-600' : 'bg-muted'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all"
                      style={{ left: editIsEnabled ? '22px' : '2px' }}
                    />
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setEditModel(null)}
                  className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground text-sm transition-all"
                >
                  {tCommon('cancel')}
                </button>
                <button
                  onClick={handleUpdate}
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
