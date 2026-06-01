import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface FeatureProps { requireAuth?: (cb?: () => void) => boolean; isAuthed?: boolean; }

export function Knowledge({ requireAuth, isAuthed }: FeatureProps) {
  const [bases, setBases] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (isAuthed) loadBases(); }, [isAuthed]);

  const loadBases = async () => {
    setLoading(true);
    try { const data = await api.get('/api/knowledge'); setBases(data.knowledgeBases || []); }
    catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const search = async () => {
    if (!query.trim() || !selected) return;
    if (requireAuth && !requireAuth()) return;
    setSearching(true); setError('');
    try {
      const data = await api.post('/api/knowledge/search', { query, knowledgeBaseId: selected });
      setResults(data.results || []);
    } catch (e: any) { setError(e.message); } finally { setSearching(false); }
  };

  return (
    <div className="feature-container">
      <div className="feature-header"><h2>📚 知识库</h2></div>
      <div className="feature-body">
        {loading ? <div className="loading">加载中...</div> : (
          <>
            <select value={selected} onChange={e => setSelected(e.target.value)}>
              <option value="">选择知识库</option>
              {bases.map(b => <option key={b.id} value={b.id}>{b.name} ({b.chunkCount || 0} 块)</option>)}
            </select>
            <div className="search-bar">
              <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key==='Enter' && search()} placeholder="搜索知识库..." />
              <button className="btn-send" onClick={search} disabled={searching||!query.trim()}>
                {searching ? '...' : '🔍'}
              </button>
            </div>
            {error && <div className="error-banner"><span>⚠️ {error}</span><button onClick={()=>setError('')}>✕</button></div>}
            {results.map((r, i) => (
              <div key={i} className="result-card">
                <div className="result-header"><span className="result-doc">📄 {r.document}</span><span className="result-score">相关度: {(r.score*100).toFixed(0)}%</span></div>
                <p className="result-content">{r.content.slice(0, 300)}</p>
              </div>
            ))}
            {results.length === 0 && query && !searching && <div className="empty-hint">未找到相关结果</div>}
          </>
        )}
      </div>
    </div>
  );
}
