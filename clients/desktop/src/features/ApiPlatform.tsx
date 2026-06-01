import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface FeatureProps { requireAuth?: (cb?: () => void) => boolean; isAuthed?: boolean; }

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
  GET: '#16a34a', POST: '#2563eb', PUT: '#ca8a04', DELETE: '#dc2626',
};

export function ApiPlatform({ isAuthed }: FeatureProps) {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', permissions: 'read', rateLimit: 100 });
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'keys' | 'docs'>('keys');

  useEffect(() => { if (isAuthed) fetchKeys(); }, [isAuthed]);

  const fetchKeys = async () => {
    try { const data = await api.get('/api/platform/keys'); setKeys(data.keys || []); } catch {}
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.name) return;
    setCreating(true);
    try {
      const data = await api.post('/api/platform/keys', form);
      if (data.key) { setNewKey(data.key); setShowCreate(false); setForm({ name: '', permissions: 'read', rateLimit: 100 }); fetchKeys(); }
    } catch {}
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    try { await api.delete(`/api/platform/keys?id=${id}`); fetchKeys(); } catch {}
  };

  return (
    <div className="feature-container">
      <div className="feature-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h2>🔌 API 开放平台</h2>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {(['keys', 'docs'] as const).map(tab => (
            <button key={tab} className={`chip ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'keys' ? '🔑 API Keys' : '📖 接口文档'}
            </button>
          ))}
        </div>
      </div>

      {newKey && (
        <div style={{ padding: 16, background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: 12, margin: '12px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>✅ API Key 创建成功</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
            <code style={{ flex: 1, padding: '8px 12px', background: 'var(--bg)', borderRadius: 8, fontSize: 11, wordBreak: 'break-all', border: '1px solid var(--border)' }}>{newKey}</code>
            <button className="btn-small" onClick={() => { navigator.clipboard.writeText(newKey); setNewKey(null); }}>复制</button>
          </div>
          <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>⚠️ 请立即保存，此 Key 不会再次显示。</p>
        </div>
      )}

      {activeTab === 'keys' ? (
        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn-small" onClick={() => setShowCreate(!showCreate)}>+ 创建 API Key</button>
          </div>
          {showCreate && (
            <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input placeholder="Key 名称" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ flex: 1, minWidth: 150 }} />
                <select value={form.permissions} onChange={e => setForm(f => ({ ...f, permissions: e.target.value }))}>
                  <option value="read">只读</option><option value="write">读写</option><option value="admin">管理员</option>
                </select>
                <input type="number" placeholder="限流" value={form.rateLimit} onChange={e => setForm(f => ({ ...f, rateLimit: +e.target.value }))} style={{ width: 100 }} />
                <button className="btn-send" onClick={handleCreate} disabled={creating}>{creating ? '...' : '创建'}</button>
              </div>
            </div>
          )}
          {loading ? <div className="loading">加载中...</div> : keys.length === 0 ? <div className="empty-hint">暂无 API Key</div> : (
            keys.map(k => (
              <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: '1px solid var(--border)', borderRadius: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 24 }}>🔑</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{k.name}</span>
                    <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: k.isActive ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)', color: k.isActive ? '#16a34a' : '#dc2626' }}>{k.isActive ? '活跃' : '禁用'}</span>
                  </div>
                  <code style={{ fontSize: 11, color: '#888' }}>{k.keyPreview}</code>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#666', marginTop: 4 }}>
                    <span>权限: {k.permissions}</span><span>限流: {k.rateLimit}/min</span><span>调用: {k.usageCount}</span>
                  </div>
                </div>
                <button style={{ fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => handleDelete(k.id)}>删除</button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 12, marginBottom: 12 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>🔑 认证方式</h3>
            <pre style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, fontSize: 12, fontFamily: 'monospace' }}>
              {'// 在请求头中携带 API Key\nAuthorization: Bearer <your-api-key>'}
            </pre>
          </div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}><h3 style={{ fontSize: 13, fontWeight: 600 }}>📡 接口列表</h3></div>
            {ENDPOINTS.map(ep => (
              <div key={ep.path} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
                <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: METHOD_COLORS[ep.method], background: METHOD_COLORS[ep.method] + '15' }}>{ep.method}</span>
                <code style={{ fontSize: 12, fontFamily: 'monospace' }}>{ep.path}</code>
                <span style={{ fontSize: 11, color: '#888', marginLeft: 'auto' }}>{ep.desc}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 12 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>📝 示例请求</h3>
            <pre style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, fontSize: 11, fontFamily: 'monospace', overflow: 'auto' }}>
{`curl -X POST https://aios.vios.top/v1/chat/completions \\
  -H "Authorization: Bearer ***" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpt-4","messages":[{"role":"user","content":"Hello!"}]}'`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
