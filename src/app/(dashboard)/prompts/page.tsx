'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button, Empty, Badge } from '@/components/ui';

interface Prompt {
  id: string;
  title: any;
  content: any;
  description?: any;
  category?: string;
  tags: string[];
  useCount: number;
  likeCount: number;
  isBuiltin: boolean;
  isPublic: boolean;
}

const categories = ['全部', '写作', '编程', '分析', '翻译', '创意', '商业', '教育'];

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [search, setSearch] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ title: '', content: '', category: '', tags: '' });

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory !== '全部') params.set('category', selectedCategory);
    if (search) params.set('search', search);
    fetch(`/api/prompts?${params}`)
      .then((r) => r.json())
      .then((d) => setPrompts(d.prompts || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCategory, search]);

  const createPrompt = async () => {
    if (!newPrompt.title.trim() || !newPrompt.content.trim()) return;
    const res = await fetch('/api/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: { 'zh-CN': newPrompt.title },
        content: { 'zh-CN': newPrompt.content },
        category: newPrompt.category || undefined,
        tags: newPrompt.tags.split(',').map((t) => t.trim()).filter(Boolean),
      }),
    });
    const data = await res.json();
    if (data.success) {
      setPrompts((prev) => [data.prompt, ...prev]);
      setNewPrompt({ title: '', content: '', category: '', tags: '' });
      setShowCreate(false);
    }
  };

  const getLocalizedTitle = (title: any): string => {
    if (typeof title === 'string') return title;
    return title?.['zh-CN'] || title?.['en-US'] || Object.values(title)[0] as string || '';
  };

  const getLocalizedContent = (content: any): string => {
    if (typeof content === 'string') return content;
    return content?.['zh-CN'] || content?.['en-US'] || Object.values(content)[0] as string || '';
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="h-14 flex items-center justify-between px-4 border-b border-border bg-card/30">
        <h1 className="text-sm font-semibold">📝 Prompt 库</h1>
        <div className="flex items-center gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索 Prompt..." className="px-3 py-1.5 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none w-48" />
          <Button size="sm" onClick={() => setShowCreate(!showCreate)}>+ 新建</Button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 border-b border-border overflow-x-auto">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-indigo-600 text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>{cat}</button>
        ))}
      </div>

      {showCreate && (
        <div className="px-4 py-4 border-b border-border bg-card/30 space-y-3">
          <div className="flex gap-3">
            <input value={newPrompt.title} onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })} placeholder="标题" className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none" />
            <input value={newPrompt.category} onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })} placeholder="分类" className="w-32 px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none" />
            <input value={newPrompt.tags} onChange={(e) => setNewPrompt({ ...newPrompt, tags: e.target.value })} placeholder="标签(逗号分隔)" className="w-48 px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none" />
          </div>
          <textarea value={newPrompt.content} onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })} placeholder="Prompt 内容..." rows={4} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none resize-none" />
          <Button onClick={createPrompt}>创建</Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        {prompts.length === 0 && !loading ? (
          <Empty icon={<span className="text-5xl">📝</span>} title="暂无 Prompt" message="创建你的第一个 Prompt 模板" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prompts.map((p) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={() => setSelectedPrompt(p)} className="rounded-xl border border-border bg-card/50 p-4 cursor-pointer hover:border-indigo-500/50 transition-all">
                <h3 className="text-sm font-semibold mb-2">{getLocalizedTitle(p.title)}</h3>
                <p className="text-xs text-muted-foreground line-clamp-3 mb-3">{getLocalizedContent(p.content)}</p>
                <div className="flex items-center gap-2">
                  {p.category && <Badge color="gray">{p.category}</Badge>}
                  {p.tags.slice(0, 3).map((tag) => <span key={tag} className="text-xs text-muted-foreground">#{tag}</span>)}
                  <span className="text-xs text-muted-foreground ml-auto">🔥 {p.useCount}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedPrompt(null)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{getLocalizedTitle(selectedPrompt.title)}</h2>
              <button onClick={() => setSelectedPrompt(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <pre className="text-sm text-foreground whitespace-pre-wrap bg-muted rounded-xl p-4 mb-4">{getLocalizedContent(selectedPrompt.content)}</pre>
            <div className="flex items-center gap-2">
              {selectedPrompt.category && <Badge color="gray">{selectedPrompt.category}</Badge>}
              {selectedPrompt.tags.map((tag) => <span key={tag} className="text-xs text-muted-foreground">#{tag}</span>)}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
