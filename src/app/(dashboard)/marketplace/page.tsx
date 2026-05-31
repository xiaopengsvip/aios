'use client';

import { useState } from 'react';

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

// Mock data for marketplace
const MOCK_ITEMS: MarketItem[] = [
  // Agents
  { id: 'a1', name: '代码助手', description: '智能代码生成、审查和调试助手', category: '开发', author: 'AIOS', downloads: 1234, rating: 4.8, icon: '🤖', tags: ['代码', '开发', '调试'], type: 'agents' },
  { id: 'a2', name: '翻译专家', description: '多语言翻译，支持100+语言互译', category: '语言', author: 'AIOS', downloads: 856, rating: 4.6, icon: '🌐', tags: ['翻译', '多语言'], type: 'agents' },
  { id: 'a3', name: '数据分析师', description: '自动分析数据、生成图表和报告', category: '数据', author: 'Community', downloads: 623, rating: 4.5, icon: '📊', tags: ['数据', '分析', '图表'], type: 'agents' },
  { id: 'a4', name: 'SEO优化师', description: '网站SEO分析和优化建议', category: '营销', author: 'Community', downloads: 445, rating: 4.3, icon: '🔍', tags: ['SEO', '营销'], type: 'agents' },
  // Prompts
  { id: 'p1', name: '周报模板', description: '自动生成结构化的工作周报', category: '效率', author: 'AIOS', downloads: 2345, rating: 4.9, icon: '📝', tags: ['周报', '办公'], type: 'prompts' },
  { id: 'p2', name: '文章大纲', description: '根据主题生成文章大纲和结构', category: '写作', author: 'Community', downloads: 1567, rating: 4.7, icon: '✍️', tags: ['写作', '大纲'], type: 'prompts' },
  { id: 'p3', name: '面试题库', description: '生成各岗位面试题和参考答案', category: '求职', author: 'Community', downloads: 987, rating: 4.5, icon: '💼', tags: ['面试', '求职'], type: 'prompts' },
  // Workflows
  { id: 'w1', name: '内容生产线', description: '选题→撰写→审校→发布全流程', category: '内容', author: 'AIOS', downloads: 789, rating: 4.6, icon: '⚡', tags: ['内容', '自动化'], type: 'workflows' },
  { id: 'w2', name: '客户工单处理', description: '自动分类→优先级→分配→回复', category: '客服', author: 'Community', downloads: 534, rating: 4.4, icon: '🎫', tags: ['客服', '工单'], type: 'workflows' },
];

const CATEGORIES = ['全部', '开发', '语言', '数据', '营销', '效率', '写作', '求职', '内容', '客服'];

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<TabType>('agents');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部');

  const filtered = MOCK_ITEMS.filter(item => {
    if (item.type !== activeTab) return false;
    if (category !== '全部' && item.category !== category) return false;
    if (search && !item.name.includes(search) && !item.description.includes(search)) return false;
    return true;
  });

  const tabs = [
    { key: 'agents' as const, label: '🤖 智能体', count: MOCK_ITEMS.filter(i => i.type === 'agents').length },
    { key: 'prompts' as const, label: '📝 提示词', count: MOCK_ITEMS.filter(i => i.type === 'prompts').length },
    { key: 'workflows' as const, label: '⚡ 工作流', count: MOCK_ITEMS.filter(i => i.type === 'workflows').length },
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
            {tab.label} <span className="ml-1 opacity-60">({tab.count})</span>
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
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-4xl mb-3">🔍</div>
          <p>暂无匹配的应用</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
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
                  <span>⭐ {item.rating}</span>
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
        <div><div className="text-lg font-bold text-foreground">{MOCK_ITEMS.length}</div>总应用</div>
        <div><div className="text-lg font-bold text-foreground">{MOCK_ITEMS.reduce((s, i) => s + i.downloads, 0).toLocaleString()}</div>总下载</div>
        <div><div className="text-lg font-bold text-foreground">2</div>贡献者</div>
      </div>
    </div>
  );
}
