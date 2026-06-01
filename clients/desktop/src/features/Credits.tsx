import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface FeatureProps { requireAuth?: (cb?: () => void) => boolean; isAuthed?: boolean; }

export function Credits({ _requireAuth, isAuthed }: FeatureProps) {
  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (isAuthed) loadData(); }, [isAuthed]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bal, tx] = await Promise.all([api.get('/api/credits/balance'), api.get('/api/credits/transactions')]);
      setBalance(bal); setTransactions(tx.transactions || []);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="feature-container">
      <div className="feature-header"><h2>💰 积分</h2><button className="btn-small" onClick={loadData}>刷新</button></div>
      <div className="feature-body">
        {error && <div className="error-banner"><span>⚠️ {error}</span><button onClick={()=>setError('')}>✕</button></div>}
        {loading ? <div className="loading">加载中...</div> : (
          <>
            <div className="balance-card">
              <div className="balance-amount">{balance?.balance ?? '0'}</div>
              <div className="balance-label">可用积分</div>
            </div>
            <h3>交易记录</h3>
            {transactions.length === 0 ? <div className="empty-hint">暂无记录</div> : (
              <div className="transaction-list">
                {transactions.map((t, i) => (
                  <div key={i} className="transaction-item">
                    <span className="tx-type">{t.type === 'topup' ? '💰 充值' : '📤 消费'}</span>
                    <span className="tx-amount" style={{color: t.amount > 0 ? '#10b981' : '#ef4444'}}>{t.amount > 0 ? '+' : ''}{t.amount}</span>
                    <span className="tx-date">{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
