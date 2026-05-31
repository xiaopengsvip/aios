'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button, Empty, Badge } from '@/components/ui';

interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  documentCount: number;
  chunkCount: number;
  isPublic: boolean;
  createdAt: string;
}

export default function KnowledgePage() {
  const [bases, setBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKb, setNewKb] = useState({ name: '', description: '', icon: '📚' });
  const [selectedKb, setSelectedKb] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/knowledge')
      .then((r) => r.json())
      .then((d) => setBases(d.knowledgeBases || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const createKb = async () => {
    if (!newKb.name.trim()) return;
    const res = await fetch('/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_kb', ...newKb }),
    });
    const data = await res.json();
    if (data.success) {
      setBases((prev) => [data.knowledgeBase, ...prev]);
      setNewKb({ name: '', description: '', icon: '📚' });
      setShowCreate(false);
    }
  };

  const addDocument = async () => {
    if (!selectedKb || !docTitle.trim() || !docContent.trim()) return;
    const res = await fetch('/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_document', knowledgeBaseId: selectedKb, title: docTitle, content: docContent }),
    });
    const data = await res.json();
    if (data.success) {
      setDocTitle('');
      setDocContent('');
      // Refresh
      const kbRes = await fetch('/api/knowledge');
      const kbData = await kbRes.json();
      setBases(kbData.knowledgeBases || []);
    }
  };

  const searchKb = async () => {
    if (!selectedKb || !searchQuery.trim()) return;
    const res = await fetch('/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'search', knowledgeBaseId: selectedKb, query: searchQuery }),
    });
    const data = await res.json();
    setSearchResults(data.results || []);
  };

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar — desktop: fixed sidebar, mobile: full-width when no kb selected */}
      <div className={`${selectedKb ? 'hidden md:flex' : 'flex'} w-full md:w-72 border-r border-border bg-card flex-col shrink-0`}>
        <div className="h-14 flex items-center justify-between px-4 border-b border-border">
          <h1 className="text-sm font-semibold">📚 知识库</h1>
          <Button size="sm" onClick={() => setShowCreate(!showCreate)}>+ 新建</Button>
        </div>

        {showCreate && (
          <div className="p-4 border-b border-border space-y-3">
            <input value={newKb.name} onChange={(e) => setNewKb({ ...newKb, name: e.target.value })} placeholder="知识库名称" className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none" />
            <input value={newKb.description} onChange={(e) => setNewKb({ ...newKb, description: e.target.value })} placeholder="描述（可选）" className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none" />
            <Button size="sm" className="w-full" onClick={createKb}>创建</Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {bases.map((kb) => (
            <div key={kb.id} onClick={() => setSelectedKb(kb.id)} className={`p-3 rounded-xl cursor-pointer transition-all ${selectedKb === kb.id ? 'bg-muted border border-indigo-500/50' : 'hover:bg-muted/50 border border-transparent'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span>{kb.icon || '📚'}</span>
                <span className="text-sm font-medium">{kb.name}</span>
                {kb.isPublic && <Badge color="gray">公开</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">{kb.documentCount} 文档 · {kb.chunkCount} 分块</p>
            </div>
          ))}
          {bases.length === 0 && !loading && <Empty icon={<span className="text-4xl">📚</span>} title="暂无知识库" message="" />}
        </div>
      </div>

      {/* Main — desktop: always shown, mobile: only when kb selected */}
      <div className={`${selectedKb ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
        {selectedKb ? (
          <>
            <div className="h-14 flex items-center px-4 border-b border-border bg-card">
              {/* Mobile back button */}
              <button
                onClick={() => setSelectedKb(null)}
                className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors text-muted-foreground mr-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <h2 className="text-sm font-semibold">文档管理</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Add document */}
              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-4">
                <h3 className="text-sm font-semibold">添加文档</h3>
                <input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="文档标题" className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none" />
                <textarea value={docContent} onChange={(e) => setDocContent(e.target.value)} placeholder="粘贴文本内容..." rows={6} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none resize-none" />
                <Button onClick={addDocument} disabled={!docTitle.trim() || !docContent.trim()}>添加并分块</Button>
              </div>

              {/* Search */}
              <div className="rounded-xl border border-border bg-card/50 p-6 space-y-4">
                <h3 className="text-sm font-semibold">知识搜索</h3>
                <div className="flex gap-2">
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="搜索知识库..." className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none" />
                  <Button onClick={searchKb}>搜索</Button>
                </div>
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((r, i) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge color="gray">Score: {r.score.toFixed(1)}</Badge>
                        </div>
                        <p className="text-sm text-foreground line-clamp-3">{r.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Empty icon={<span className="text-5xl">📚</span>} title="选择或创建知识库" message="知识库用于存储和检索文档，支持 RAG 检索增强生成" />
          </div>
        )}
      </div>
    </div>
  );
}
