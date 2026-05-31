'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { LoadingSpinner } from '@/components/ui/Loading';

interface Transaction {
  id: string;
  userId: string;
  user?: { username: string; email: string | null };
  type: string;
  amount: string;
  balanceAfter: string;
  description: string | null;
  paymentMethod: string | null;
  paymentStatus: string;
  createdAt: string;
}

interface Stats {
  totalRevenue: string;
  totalUsers: number;
  monthlyRevenue: string;
  recentTransactions: Transaction[];
}

export default function AdminBillingPage() {
  const t = useTranslations('admin');
  const [stats, setStats] = useState<Stats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [adjustUserId, setAdjustUserId] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustDescription, setAdjustDescription] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (typeFilter) params.set('type', typeFilter);
      const res = await fetch(`/api/admin/billing?${params}`);
      const data = await res.json();
      if (data.transactions) {
        setTransactions(data.transactions);
        setTotal(data.total);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, typeFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjusting(true);
    try {
      const res = await fetch('/api/admin/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: adjustUserId,
          amount: parseFloat(adjustAmount),
          description: adjustDescription,
        }),
      });
      if (res.ok) {
        setShowAdjust(false);
        setAdjustUserId('');
        setAdjustAmount('');
        setAdjustDescription('');
        fetchStats();
        fetchTransactions();
      }
    } catch (err) {
      console.error('Failed to adjust balance:', err);
    } finally {
      setAdjusting(false);
    }
  };

  const handleExport = () => {
    const csv = [
      ['ID', '用户ID', '类型', '金额', '余额', '描述', '状态', '时间'].join(','),
      ...transactions.map((tx) =>
        [tx.id, tx.userId, tx.type, tx.amount, tx.balanceAfter, tx.description || '', tx.paymentStatus, tx.createdAt].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / pageSize);

  const typeColors: Record<string, string> = {
    topup: 'text-green-400',
    usage: 'text-red-400',
    refund: 'text-blue-400',
    credit: 'text-yellow-400',
    bonus: 'text-purple-400',
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{t('billing.title')}</h1>
            <p className="text-muted-foreground text-sm mt-1">{t('billing.subtitle')}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 text-sm transition-all"
            >
              {t('billing.exportCsv')}
            </button>
            <button
              onClick={() => setShowAdjust(true)}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm transition-all"
            >
              {t('billing.adjustBalance')}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-border bg-card/50 p-5">
            <div className="text-sm text-muted-foreground mb-1">{t('billing.totalRevenue')}</div>
            <div className="text-2xl font-bold">${stats?.totalRevenue ? Number(stats.totalRevenue).toFixed(2) : '0.00'}</div>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-5">
            <div className="text-sm text-muted-foreground mb-1">{t('billing.monthlyRevenue')}</div>
            <div className="text-2xl font-bold">${stats?.monthlyRevenue ? Number(stats.monthlyRevenue).toFixed(2) : '0.00'}</div>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-5">
            <div className="text-sm text-muted-foreground mb-1">{t('billing.totalUsers')}</div>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-5">
            <div className="text-sm text-muted-foreground mb-1">{t('billing.monthlyTransactions')}</div>
            <div className="text-2xl font-bold">{total}</div>
          </div>
        </div>

        {/* Revenue Chart Placeholder */}
        <div className="rounded-xl border border-border bg-card/50 p-6 mb-8">
          <h2 className="text-sm font-semibold mb-4">{t('billing.revenueTrend')}</h2>
          <div className="h-48 flex items-center justify-center text-muted-foreground/70 text-sm border border-dashed border-border rounded-lg">
            📊 {t('billing.chartPlaceholder')}
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4 mb-4">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">{t('common.allTypes')}</option>
            <option value="topup">{t('billing.typeTopup')}</option>
            <option value="usage">{t('billing.typeUsage')}</option>
            <option value="refund">{t('billing.typeRefund')}</option>
            <option value="credit">{t('billing.typeCredit')}</option>
            <option value="bonus">{t('billing.typeBonus')}</option>
          </select>
          <span className="text-sm text-muted-foreground">{t('billing.totalRecords', { count: total })}</span>
        </div>

        {/* Transactions Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card/50">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">{t('billing.columnTime')}</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">{t('billing.columnUser')}</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">{t('billing.columnType')}</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">{t('billing.columnAmount')}</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">{t('billing.columnBalance')}</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">{t('billing.columnDescription')}</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">{t('billing.columnStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <LoadingSpinner size="sm" />
                        {t('common.loading')}
                      </div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">{t('billing.noTransactions')}</td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">{tx.user?.username || tx.userId}</div>
                        {tx.user?.email && <div className="text-xs text-muted-foreground">{tx.user.email}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${typeColors[tx.type] || 'text-muted-foreground'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${
                        Number(tx.amount) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {Number(tx.amount) >= 0 ? '+' : ''}{Number(tx.amount).toFixed(4)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        ${Number(tx.balanceAfter).toFixed(4)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">
                        {tx.description || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-xs border ${
                          tx.paymentStatus === 'SUCCESS' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          tx.paymentStatus === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}>
                          {tx.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <span className="text-sm text-muted-foreground">
              {t('common.pageInfo', { page, total: totalPages })}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {t('common.previousPage')}
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {t('common.nextPage')}
              </button>
            </div>
          </div>
        )}

        {/* Adjust Balance Modal */}
        {showAdjust && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
              <h2 className="text-lg font-semibold mb-4">{t('billing.adjustTitle')}</h2>
              <form onSubmit={handleAdjust} className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">{t('billing.userId')}</label>
                  <input
                    value={adjustUserId}
                    onChange={(e) => setAdjustUserId(e.target.value)}
                    placeholder={t('billing.userIdPlaceholder')}
                    required
                    className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">{t('billing.amount')}</label>
                  <input
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    type="number"
                    step="0.01"
                    placeholder={t('billing.amountPlaceholder')}
                    required
                    className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">{t('billing.descriptionLabel')}</label>
                  <input
                    value={adjustDescription}
                    onChange={(e) => setAdjustDescription(e.target.value)}
                    placeholder={t('billing.descriptionPlaceholder')}
                    className="w-full px-4 py-2 rounded-lg bg-muted/50 border border-border text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdjust(false)}
                    className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground text-sm transition-all"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={adjusting}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm transition-all disabled:opacity-50"
                  >
                    {adjusting ? t('billing.processing') : t('billing.confirmAdjust')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
