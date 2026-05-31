'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface StaticPage {
  id: string;
  slug: string;
  title: string;
  titleEn: string;
  content: string;
  contentEn: string;
  isPublished: boolean;
  sortOrder: number;
}

interface SiteConfig {
  siteName: string;
  siteNameEn: string;
  siteIcon: string;
  siteIconUrl: string;
  logoUrl: string;
  faviconUrl: string;
  copyright: string;
  copyrightEn: string;
  footerText: string;
  footerTextEn: string;
  icp: string;
  github: string;
  x: string;
  discord: string;
}

export default function AdminPagesPage() {
  const t = useTranslations('admin');
  const [activeTab, setActiveTab] = useState<'config' | 'pages'>('config');
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [editingPage, setEditingPage] = useState<StaticPage | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchConfig();
    fetchPages();
  }, []);

  const fetchConfig = async () => {
    const res = await fetch('/api/admin/site-config');
    if (res.ok) {
      const data = await res.json();
      setConfig(data.config);
    }
  };

  const fetchPages = async () => {
    const res = await fetch('/api/admin/pages');
    if (res.ok) {
      const data = await res.json();
      setPages(data.pages || []);
    }
  };

  const saveConfig = async () => {
    if (!config) return;
    setSaving(true);
    const res = await fetch('/api/admin/site-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (res.ok) setMsg('✅ 配置已保存');
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const savePage = async () => {
    if (!editingPage) return;
    setSaving(true);
    const method = editingPage.id ? 'PATCH' : 'POST';
    const res = await fetch('/api/admin/pages', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingPage),
    });
    if (res.ok) {
      setMsg('✅ 页面已保存');
      setEditingPage(null);
      fetchPages();
    }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const deletePage = async (id: string) => {
    if (!confirm('确定删除此页面？')) return;
    await fetch(`/api/admin/pages?id=${id}`, { method: 'DELETE' });
    fetchPages();
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">📄 页面管理</h1>
          <p className="text-xs text-muted-foreground mt-1">管理网站配置和静态页面</p>
        </div>
        {msg && <span className="text-sm text-green-500">{msg}</span>}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('config')} className={`px-4 py-1.5 rounded-lg text-sm ${activeTab === 'config' ? 'bg-primary text-primary-foreground' : 'border border-border'}`}>⚙️ 网站配置</button>
        <button onClick={() => setActiveTab('pages')} className={`px-4 py-1.5 rounded-lg text-sm ${activeTab === 'pages' ? 'bg-primary text-primary-foreground' : 'border border-border'}`}>📄 静态页面</button>
      </div>

      {activeTab === 'config' && config && (
        <div className="space-y-6">
          {/* Brand */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold">🏷️ 品牌信息</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">网站名称 (中文)</label>
                <input value={config.siteName} onChange={e => setConfig({ ...config, siteName: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">网站名称 (英文)</label>
                <input value={config.siteNameEn} onChange={e => setConfig({ ...config, siteNameEn: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">品牌图标文字</label>
                <input value={config.siteIcon} onChange={e => setConfig({ ...config, siteIcon: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" placeholder="A" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">品牌图标 URL (优先)</label>
                <input value={config.siteIconUrl} onChange={e => setConfig({ ...config, siteIconUrl: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Logo URL</label>
                <input value={config.logoUrl} onChange={e => setConfig({ ...config, logoUrl: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Favicon URL</label>
                <input value={config.faviconUrl} onChange={e => setConfig({ ...config, faviconUrl: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" placeholder="https://..." />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold">📎 底部信息</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">版权信息 (中文)</label>
                <input value={config.copyright} onChange={e => setConfig({ ...config, copyright: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">版权信息 (英文)</label>
                <input value={config.copyrightEn} onChange={e => setConfig({ ...config, copyrightEn: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">底部附加文字 (中文)</label>
                <input value={config.footerText} onChange={e => setConfig({ ...config, footerText: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">底部附加文字 (英文)</label>
                <input value={config.footerTextEn} onChange={e => setConfig({ ...config, footerTextEn: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">ICP 备案号</label>
                <input value={config.icp} onChange={e => setConfig({ ...config, icp: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" placeholder="京ICP备XXXXXXXX号" />
              </div>
            </div>
          </div>

          {/* Social */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold">🔗 社交链接</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">GitHub</label>
                <input value={config.github} onChange={e => setConfig({ ...config, github: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" placeholder="https://github.com/..." />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">X (Twitter)</label>
                <input value={config.x} onChange={e => setConfig({ ...config, x: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" placeholder="https://x.com/..." />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Discord</label>
                <input value={config.discord} onChange={e => setConfig({ ...config, discord: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" placeholder="https://discord.gg/..." />
              </div>
            </div>
          </div>

          <button onClick={saveConfig} disabled={saving} className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {saving ? '保存中...' : '💾 保存配置'}
          </button>
        </div>
      )}

      {activeTab === 'pages' && (
        <div className="space-y-4">
          {/* Page list */}
          <div className="flex justify-end">
            <button onClick={() => setEditingPage({ id: '', slug: '', title: '', titleEn: '', content: '', contentEn: '', isPublished: true, sortOrder: 0 })} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm">
              + 新建页面
            </button>
          </div>

          {pages.map(p => (
            <div key={p.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-lg">📄</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{p.title}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${p.isPublished ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {p.isPublished ? '已发布' : '草稿'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">/{p.slug} · {p.titleEn}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditingPage(p)} className="text-xs text-primary hover:underline">编辑</button>
                <button onClick={() => deletePage(p.id)} className="text-xs text-red-500 hover:underline">删除</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Page editor modal */}
      {editingPage && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setEditingPage(null)}>
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">{editingPage.id ? '编辑页面' : '新建页面'}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">URL Slug</label>
                <input value={editingPage.slug} onChange={e => setEditingPage({ ...editingPage, slug: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" placeholder="about" />
              </div>
              <div className="flex items-end gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editingPage.isPublished} onChange={e => setEditingPage({ ...editingPage, isPublished: e.target.checked })} />
                  已发布
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">标题 (中文)</label>
                <input value={editingPage.title} onChange={e => setEditingPage({ ...editingPage, title: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">标题 (英文)</label>
                <input value={editingPage.titleEn} onChange={e => setEditingPage({ ...editingPage, titleEn: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">内容 (中文, Markdown)</label>
              <textarea value={editingPage.content} onChange={e => setEditingPage({ ...editingPage, content: e.target.value })} rows={8} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono resize-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">内容 (英文, Markdown)</label>
              <textarea value={editingPage.contentEn} onChange={e => setEditingPage({ ...editingPage, contentEn: e.target.value })} rows={6} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono resize-none" />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setEditingPage(null)} className="h-9 px-4 rounded-lg border border-border text-sm">取消</button>
              <button onClick={savePage} disabled={saving} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
