import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface FeatureProps { requireAuth?: (cb?: () => void) => boolean; isAuthed?: boolean; }

export function Marketplace({ _requireAuth, isAuthed }: FeatureProps) {
  const [items, setItems] = useState<any[]>([]);
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (isAuthed) loadItems(); }, [isAuthed, type]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type });
      if (search) params.set('search', search);
      const data = await api.get(`/api/marketplace?${params}`);
      setItems(data.items || data.agents || []);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const types = [['all','全部'],['agent','Agent'],['prompt','提示词'],['workflow','工作流']];

  return (
    <div className="feature-container">
      <div className="feature-header"><h2>🏪 应用市场</h2></div>
      <div className="feature-body">
        <div className="style-selector">
          {types.map(([k,l]) => <button key={k} className={`chip ${type===k?'active':''}`} onClick={()=>setType(k)}>{l}</button>)}
        </div>
        <div className="search-bar">
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key==='Enter' && loadItems()} placeholder="搜索..." />
          <button className="btn-send" onClick={loadItems}>🔍</button>
        </div>
        {error && <div className="error-banner"><span>⚠️ {error}</span><button onClick={()=>setError('')}>✕</button></div>}
        {loading ? <div className="loading">加载中...</div> : items.length === 0 ? <div className="empty-hint">暂无数据</div> : (
          <div className="marketplace-grid">
            {items.map(item => (
              <div key={item.id} className="marketplace-card">
                <div className="marketplace-icon">{item.type === 'agent' ? '🤖' : item.type === 'workflow' ? '⚡' : '💡'}</div>
                <h3>{item.name}</h3>
                <p>{item.description?.['zh-CN'] || item.description?.['en-US'] || item.description || ''}</p>
                <div className="marketplace-meta"><span>安装 {item.installCount || 0}</span><span>⭐ {item.rating || '-'}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
