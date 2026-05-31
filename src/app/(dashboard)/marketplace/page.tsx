'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type TabType = 'agents' | 'prompts' | 'workflows';

interface MarketItem {
  id: string;
  name: string;
  description: string;
  category: string;
  author: string;
  downloads: number;
  rating: number;
  icon: string;
  tags: string[];
  type: TabType;
}

const CATEGORIES = ['全部', '开发', '语言', '数据', '营销', '效率', '写作', '求职', '内容', '客服'];

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<TabType>('agents');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('全部');
  const [items, setItems] = useState<MarketItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchItems = useCallback(async () => {
    // Cancel previous request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const params = new URLSearchParams({ type: activeTab });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (category !== '全部') params.set('category', category);
      params.set('pageSize', '50');

      const res = await fetch(`/api/marketplace?${params}`, { signal: controller.signal });
      if (!res.ok) return;
      const data = await res.json();
      if (!controller.signal.aborted) {
        setItems(data.items || []);
        setTotal(data.total || 0);
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') console.error('Marketplace fetch error:', e);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [activeTab, debouncedSearch, category]);

  // Re-fetch when tab, search, or category changes
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Reset category when switching tabs (categories are prompt-specific)
  useEffect(() => {
    setCategory('全部');
  }, [activeTab]);

  const tabs = [
    { key: 'agents' as const, label: '🤖 智能体' },
    { key: 'prompts' as const, label: '📝 提示词' },
    { key: 'workflows' as const, label: '⚡ 工作流' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">🏪 应用市场</h2>
        <p className="text-sm text-muted-foreground">发现社区贡献的智能体、提示词和工作流模板</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'border border-border hover:bg-accent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索应用..."
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background text-sm"
          />
        </div>
        {activeTab === 'prompts' && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                  category === cat ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-accent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">加载中...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-4xl mb-3">🔍</div>
          <p>暂无匹配的应用</p>
          {debouncedSearch && <p className="text-xs mt-1">尝试其他关键词</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div
              key={item.id}
              className="group rounded-xl border border-border bg-card p-4 space-y-3 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{item.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {item.tags.map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>by {item.author}</span>
                <div className="flex items-center gap-3">
                  <span>⭐ {item.rating.toFixed(1)}</span>
                  <span>📥 {item.downloads.toLocaleString()}</span>
                </div>
              </div>
              <button className="w-full h-8 rounded-lg border border-border text-xs font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
                安装使用
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Stats Footer */}
      <div className="flex justify-center gap-8 text-center text-xs text-muted-foreground">
        <div><div className="text-lg font-bold text-foreground">{total}</div>总应用</div>
        <div><div className="text-lg font-bold text-foreground">{items.reduce((s, i) => s + i.downloads, 0).toLocaleString()}</div>总下载</div>
      </div>
    </div>
  );
}
