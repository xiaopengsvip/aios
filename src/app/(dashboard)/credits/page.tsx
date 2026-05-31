'use client';

import { useState, useEffect } from 'react';

interface Balance {
  balance: number;
  creditLimit: number;
  dailyLimit: number;
  monthlyLimit: number;
  totalSpent: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
  paymentStatus: string;
}

const TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  topup: { label: '充值', color: 'text-green-500', icon: '💰' },
  usage: { label: '消费', color: 'text-red-500', icon: '📤' },
  refund: { label: '退款', color: 'text-blue-500', icon: '↩️' },
  credit: { label: '信用额度', color: 'text-purple-500', icon: '💳' },
  bonus: { label: '奖励', color: 'text-yellow-500', icon: '🎁' },
};

export default function CreditsPage() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [balRes, txRes] = await Promise.all([
        fetch('/api/credits/balance'),
        fetch('/api/credits/transactions?limit=50'),
      ]);
      if (balRes.ok) setBalance(await balRes.json());
      if (txRes.ok) {
        const data = await txRes.json();
        setTransactions(data.transactions || []);
      }
    } catch {}
    setLoading(false);
  };

  const handleTopup = async () => {
    const amount = parseFloat(topupAmount);
    if (!amount || amount <= 0) return;
    setTopupLoading(true);
    try {
      const res = await fetch('/api/credits/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      if (res.ok) {
        setTopupAmount('');
        fetchData();
      }
    } catch {}
    setTopupLoading(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Balance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '余额', value: `¥${(balance?.balance || 0).toFixed(2)}`, icon: '💰', color: 'from-green-500 to-emerald-600' },
          { label: '信用额度', value: `¥${(balance?.creditLimit || 0).toFixed(2)}`, icon: '💳', color: 'from-purple-500 to-indigo-600' },
          { label: '今日消费', value: `¥${(balance?.dailyLimit || 0).toFixed(2)}`, icon: '📊', color: 'from-blue-500 to-cyan-600' },
          { label: '累计消费', value: `¥${(balance?.totalSpent || 0).toFixed(2)}`, icon: '📈', color: 'from-orange-500 to-red-600' },
        ].map(card => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{card.icon}</span>
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <div className="text-xl font-bold">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Topup */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2"><span>💰</span> 快速充值</h3>
        <div className="flex gap-2 flex-wrap">
          {[10, 50, 100, 500, 1000].map(amount => (
            <button
              key={amount}
              onClick={() => setTopupAmount(String(amount))}
              className="px-4 py-2 rounded-lg border border-border hover:bg-accent text-sm transition-colors"
            >
              ¥{amount}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            value={topupAmount}
            onChange={e => setTopupAmount(e.target.value)}
            placeholder="自定义金额"
            className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm"
          />
          <button
            onClick={handleTopup}
            disabled={topupLoading || !topupAmount}
            className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {topupLoading ? '处理中...' : '充值'}
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold flex items-center gap-2"><span>📋</span> 交易记录</h3>
        </div>
        <div className="divide-y divide-border">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">暂无交易记录</div>
          ) : (
            transactions.map(tx => {
              const meta = TYPE_LABELS[tx.type] || { label: tx.type, color: 'text-foreground', icon: '💱' };
              return (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-lg">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{meta.label}</div>
                    <div className="text-xs text-muted-foreground truncate">{tx.description || '-'}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-mono font-medium ${tx.type === 'usage' ? 'text-red-500' : 'text-green-500'}`}>
                      {tx.type === 'usage' ? '-' : '+'}¥{Math.abs(tx.amount).toFixed(4)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      余额 ¥{tx.balanceAfter.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(tx.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
