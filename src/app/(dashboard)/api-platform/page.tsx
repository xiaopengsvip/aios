'use client';

import { useState, useEffect } from 'react';

interface ApiKey {
  id: string;
  name: string;
  keyPreview: string;
  permissions: string;
  rateLimit: number;
  usageCount: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  isActive: boolean;
}

const ENDPOINTS = [
  { method: 'POST', path: '/v1/chat/completions', desc: 'AI 对话补全' },
  { method: 'POST', path: '/v1/images/generate', desc: '图片生成' },
  { method: 'POST', path: '/v1/audio/transcribe', desc: '音频转文字' },
  { method: 'GET', path: '/v1/models', desc: '模型列表' },
  { method: 'GET', path: '/v1/usage', desc: '使用量查询' },
  { method: 'POST', path: '/v1/agents/execute', desc: 'Agent 执行' },
  { method: 'POST', path: '/v1/workflows/execute', desc: '工作流执行' },
];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-500/10 text-green-600',
  POST: 'bg-blue-500/10 text-blue-600',
  PUT: 'bg-yellow-500/10 text-yellow-600',
  DELETE: 'bg-red-500/10 text-red-600',
};

export default function ApiPlatformPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', permissions: 'read', rateLimit: 100 });
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'keys' | 'docs'>('keys');

  useEffect(() => { fetchKeys(); }, []);

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/platform/keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch {}
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.name) return;
    setCreating(true);
    try {
      const res = await fetch('/api/platform/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setNewKey(data.key);
        setShowCreate(false);
        setForm({ name: '', permissions: 'read', rateLimit: 100 });
        fetchKeys();
      }
    } catch {}
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此 API Key？')) return;
    try {
      await fetch(`/api/platform/keys?id=${id}`, { method: 'DELETE' });
      fetchKeys();
    } catch {}
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">🔌 API 开放平台</h2>
          <p className="text-xs text-muted-foreground mt-1">管理 API Key，查看接口文档</p>
        </div>
        <div className="flex gap-2">
          {(['keys', 'docs'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                activeTab === tab ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-accent'
              }`}
            >
              {tab === 'keys' ? '🔑 API Keys' : '📖 接口文档'}
            </button>
          ))}
        </div>
      </div>

      {/* New Key Alert */}
      {newKey && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 space-y-2">
          <div className="text-sm font-medium text-green-600">✅ API Key 创建成功</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-xs font-mono break-all">{newKey}</code>
            <button onClick={() => { copyKey(newKey); setNewKey(null); }} className="shrink-0 h-9 px-3 rounded-lg bg-green-600 text-white text-xs">
              {copied ? '✓ 已复制' : '复制'}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">⚠️ 请立即保存，此 Key 不会再次显示。</p>
        </div>
      )}

      {activeTab === 'keys' ? (
        <>
          {/* Create Key */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              + 创建 API Key
            </button>
          </div>

          {showCreate && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  placeholder="Key 名称"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="h-10 px-3 rounded-lg border border-border bg-background text-sm"
                />
                <select
                  value={form.permissions}
                  onChange={e => setForm(f => ({ ...f, permissions: e.target.value }))}
                  className="h-10 px-3 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="read">只读</option>
                  <option value="write">读写</option>
                  <option value="admin">管理员</option>
                </select>
                <input
                  type="number"
                  placeholder="限流 (次/分钟)"
                  value={form.rateLimit}
                  onChange={e => setForm(f => ({ ...f, rateLimit: parseInt(e.target.value) || 100 }))}
                  className="h-10 px-3 rounded-lg border border-border bg-background text-sm"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowCreate(false)} className="h-9 px-4 rounded-lg border border-border text-sm hover:bg-accent">取消</button>
                <button onClick={handleCreate} disabled={creating} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50">
                  {creating ? '创建中...' : '创建'}
                </button>
              </div>
            </div>
          )}

          {/* Keys List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center p-8 text-muted-foreground">加载中...</div>
            ) : keys.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">暂无 API Key</div>
            ) : (
              keys.map(k => (
                <div key={k.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">🔑</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{k.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${k.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {k.isActive ? '活跃' : '禁用'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">{k.keyPreview}</div>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      <span>权限: {k.permissions}</span>
                      <span>限流: {k.rateLimit}/min</span>
                      <span>调用: {k.usageCount}</span>
                      {k.lastUsedAt && <span>最后使用: {new Date(k.lastUsedAt).toLocaleDateString('zh-CN')}</span>}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(k.id)} className="text-xs text-red-500 hover:text-red-700 shrink-0">删除</button>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /* API Docs */
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">🔑 认证方式</h3>
            <div className="bg-background rounded-lg p-3 text-xs font-mono">
              <div className="text-muted-foreground">{'// 在请求头中携带 API Key'}</div>
              <div>{'Authorization: Bearer <your-api-key>'}</div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">📡 接口列表</h3>
            </div>
            <div className="divide-y divide-border">
              {ENDPOINTS.map(ep => (
                <div key={ep.path} className="px-4 py-3 flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${METHOD_COLORS[ep.method]}`}>
                    {ep.method}
                  </span>
                  <code className="text-xs font-mono">{ep.path}</code>
                  <span className="text-xs text-muted-foreground ml-auto">{ep.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">📝 示例请求</h3>
            <pre className="bg-background rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre">{`curl -X POST https://aios.allapple.top/v1/chat/completions \
  -H "Authorization: Bearer ak_xxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}</pre>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">📊 错误码</h3>
            <div className="space-y-2 text-xs">
              {[
                { code: '401', desc: 'API Key 无效或已过期' },
                { code: '403', desc: '权限不足' },
                { code: '429', desc: '请求频率超限' },
                { code: '500', desc: '服务器内部错误' },
              ].map(e => (
                <div key={e.code} className="flex gap-3">
                  <code className="font-mono text-red-500">{e.code}</code>
                  <span className="text-muted-foreground">{e.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
