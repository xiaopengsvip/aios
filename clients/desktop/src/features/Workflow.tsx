import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface FeatureProps { requireAuth?: (cb?: () => void) => boolean; isAuthed?: boolean; }

export function Workflow({ requireAuth, isAuthed }: FeatureProps) {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { if (isAuthed) loadWorkflows(); }, [isAuthed]);

  const loadWorkflows = async () => {
    setLoading(true);
    try { const data = await api.get('/api/workflows'); setWorkflows(data.workflows || []); }
    catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const execute = async (id: string) => {
    if (requireAuth && !requireAuth()) return;
    setExecuting(id); setResult(null); setError('');
    try {
      const data = await api.post(`/api/workflows/${id}/execute`, { input: input || undefined });
      setResult(data);
    } catch (e: any) { setError(e.message); } finally { setExecuting(''); }
  };

  return (
    <div className="feature-container">
      <div className="feature-header"><h2>⚡ 工作流</h2><button className="btn-small" onClick={loadWorkflows}>刷新</button></div>
      <div className="feature-body">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="输入参数 (可选)" />
        {error && <div className="error-banner"><span>⚠️ {error}</span><button onClick={()=>setError('')}>✕</button></div>}
        {loading ? <div className="loading">加载中...</div> : workflows.length === 0 ? <div className="empty-hint">暂无工作流</div> : (
          <div className="workflow-list">
            {workflows.map(w => (
              <div key={w.id} className="workflow-item">
                <div className="workflow-info"><span className="workflow-name">{w.name}</span><span className="workflow-desc">{w.description}</span></div>
                <button className="btn-small" onClick={() => execute(w.id)} disabled={!!executing}>
                  {executing === w.id ? '⏳' : '▶️ 执行'}
                </button>
              </div>
            ))}
          </div>
        )}
        {result && <div className="result-card"><pre>{JSON.stringify(result, null, 2)}</pre></div>}
      </div>
    </div>
  );
}
