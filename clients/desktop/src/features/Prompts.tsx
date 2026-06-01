import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface FeatureProps { requireAuth?: (cb?: () => void) => boolean; isAuthed?: boolean; }

export function Prompts({ isAuthed }: FeatureProps) {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (isAuthed) loadPrompts(); }, [isAuthed]);

  const loadPrompts = async () => {
    setLoading(true);
    try { const data = await api.get('/api/prompts'); setPrompts(data.prompts || []); }
    catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const copyPrompt = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="feature-container">
      <div className="feature-header"><h2>💡 提示词库</h2><button className="btn-small" onClick={loadPrompts}>刷新</button></div>
      <div className="feature-body">
        {error && <div className="error-banner"><span>⚠️ {error}</span><button onClick={()=>setError('')}>✕</button></div>}
        {loading ? <div className="loading">加载中...</div> : prompts.length === 0 ? <div className="empty-hint">暂无提示词</div> : (
          <div className="prompt-list">
            {prompts.map(p => (
              <div key={p.id} className="prompt-card">
                <div className="prompt-header"><h3>{p.title}</h3>{p.category && <span className="chip">{p.category}</span>}</div>
                <p className="prompt-content">{p.content?.slice(0, 200)}</p>
                <button className="btn-small" onClick={() => copyPrompt(p.content)}>📋 复制</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
