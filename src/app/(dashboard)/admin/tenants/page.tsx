'use client';

import { useState, useEffect } from 'react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  plan: string;
  maxUsers: number;
  maxApiCalls: number;
  balance: number;
  creditLimit: number;
  userCount: number;
  createdAt: string;
}

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-500/10 text-gray-500',
  pro: 'bg-blue-500/10 text-blue-500',
  enterprise: 'bg-purple-500/10 text-purple-500',
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', plan: 'free' });
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchTenants(); }, []);

  const fetchTenants = async () => {
    try {
      const res = await fetch('/api/admin/tenants');
      if (res.ok) {
        const data = await res.json();
        setTenants(data.tenants || []);
      }
    } catch {}
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.name || !form.slug) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ name: '', slug: '', plan: 'free' });
        fetchTenants();
      }
    } catch {}
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此租户？')) return;
    try {
      await fetch(`/api/admin/tenants?id=${id}`, { method: 'DELETE' });
      fetchTenants();
    } catch {}
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">🏢 租户管理</h2>
          <p className="text-xs text-muted-foreground mt-1">SaaS 多租户配置与管理</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
        >
          + 新建租户
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              placeholder="租户名称"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="h-10 px-3 rounded-lg border border-border bg-background text-sm"
            />
            <input
              placeholder="Slug (唯一标识)"
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              className="h-10 px-3 rounded-lg border border-border bg-background text-sm"
            />
            <select
              value={form.plan}
              onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
              className="h-10 px-3 rounded-lg border border-border bg-background text-sm"
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreate(false)} className="h-9 px-4 rounded-lg border border-border text-sm hover:bg-accent">取消</button>
            <button onClick={handleCreate} disabled={creating} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50">
              {creating ? '创建中...' : '创建'}
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '总租户', value: tenants.length, icon: '🏢' },
          { label: 'Pro/企业', value: tenants.filter(t => t.plan !== 'free').length, icon: '⭐' },
          { label: '总用户', value: tenants.reduce((s, t) => s + (t.userCount || 0), 0), icon: '👥' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-3 text-center">
            <div className="text-lg">{s.icon}</div>
            <div className="text-xl font-bold mt-1">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tenant List */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">租户</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">计划</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">域名</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">余额</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">用户上限</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">API调用上限</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">加载中...</td></tr>
              ) : tenants.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">暂无租户</td></tr>
              ) : (
                tenants.map(t => (
                  <tr key={t.id} className="hover:bg-accent/50">
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.slug}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_COLORS[t.plan] || PLAN_COLORS.free}`}>
                        {t.plan.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{t.domain || '-'}</td>
                    <td className="px-4 py-2.5 text-right font-mono">¥{Number(t.balance).toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right">{t.maxUsers}</td>
                    <td className="px-4 py-2.5 text-right">{t.maxApiCalls.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
