import { useState } from 'react';
import { api } from '../services/api';

interface FeatureProps { requireAuth?: (cb?: () => void) => boolean; isAuthed?: boolean; }

export function Search({ requireAuth, isAuthed }: FeatureProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const search = async () => {
    if (!query.trim()) return;
    if (requireAuth && !requireAuth()) return;
    setSearching(true); setError('');
    try {
      const data = await api.post('/api/search', { query });
      setResults(data.results || []);
    } catch (e: any) { setError(e.message); } finally { setSearching(false); }
  };

  const typeIcons: Record<string, string> = { conversation: '💬', file: '📄', agent: '🤖', prompt: '💡', knowledge: '📚' };

  return (
    <div className="feature-container">
      <div className="feature-header"><h2>🔍 全局搜索</h2></div>
      <div className="feature-body">
        <div className="search-bar">
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key==='Enter' && search()} placeholder="搜索对话、文件、Agent..." autoFocus />
          <button className="btn-send" onClick={search} disabled={searching||!query.trim()}>{searching ? '...' : '🔍'}</button>
        </div>
        {error && <div className="error-banner"><span>⚠️ {error}</span><button onClick={()=>setError('')}>✕</button></div>}
        {results.map((r, i) => (
          <div key={i} className="result-card">
            <div className="result-header"><span>{typeIcons[r.type] || '📄'} {r.title || r.name}</span><span className="result-score">{r.type}</span></div>
            <p className="result-content">{r.content?.slice(0, 200) || r.description?.slice(0, 200) || ''}</p>
          </div>
        ))}
        {results.length === 0 && query && !searching && <div className="empty-hint">未找到结果</div>}
      </div>
    </div>
  );
}
