import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface FeatureProps { requireAuth?: (cb?: () => void) => boolean; isAuthed?: boolean; }

export function Usage({ requireAuth, isAuthed }: FeatureProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (isAuthed) loadStats(); }, [isAuthed]);

  const loadStats = async () => {
    setLoading(true);
    try { const data = await api.get('/api/usage'); setStats(data); }
    catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="feature-container">
      <div className="feature-header"><h2>📊 使用统计</h2><button className="btn-small" onClick={loadStats}>刷新</button></div>
      <div className="feature-body">
        {error && <div className="error-banner"><span>⚠️ {error}</span><button onClick={()=>setError('')}>✕</button></div>}
        {loading ? <div className="loading">加载中...</div> : !stats ? <div className="empty-hint">暂无数据</div> : (
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-value">{stats.totalMessages || 0}</div><div className="stat-label">总消息数</div></div>
            <div className="stat-card"><div className="stat-value">{stats.totalTokens || 0}</div><div className="stat-label">总 Token</div></div>
            <div className="stat-card"><div className="stat-value">{stats.totalConversations || 0}</div><div className="stat-label">对话数</div></div>
            <div className="stat-card"><div className="stat-value">{stats.totalFiles || 0}</div><div className="stat-label">文件数</div></div>
            {stats.byModel && Object.entries(stats.byModel).map(([model, count]: any) => (
              <div key={model} className="stat-card"><div className="stat-value">{count}</div><div className="stat-label">{model}</div></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
