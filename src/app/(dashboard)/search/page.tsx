'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Empty, Badge } from '@/components/ui';

interface SearchResult {
  type: string;
  id: string;
  title: string;
  [key: string]: any;
}

const typeIcons: Record<string, string> = {
  conversation: '💬',
  file: '📁',
  prompt: '📝',
  agent: '🤖',
};

const typeColors: Record<string, string> = {
  conversation: 'blue',
  file: 'gray',
  prompt: 'green',
  agent: 'purple',
};

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const navigateToResult = (result: SearchResult) => {
    switch (result.type) {
      case 'conversation': router.push('/chat'); break;
      case 'file': router.push('/files'); break;
      case 'prompt': router.push('/prompts'); break;
      case 'agent': router.push('/agent'); break;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="h-14 flex items-center px-4 border-b border-border bg-card/30">
        <h1 className="text-sm font-semibold">🔍 全局搜索</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6">
          <div className="flex gap-3 mb-8">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
              placeholder="搜索对话、文件、Prompt、Agent..."
              className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-indigo-500"
            />
            <button onClick={doSearch} className="px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all">搜索</button>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-4 border-border border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">搜索中...</p>
            </div>
          ) : searched && results.length === 0 ? (
            <Empty icon={<span className="text-5xl">🔍</span>} title="未找到结果" message="试试其他关键词" />
          ) : results.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground mb-4">找到 {results.length} 个结果</p>
              {results.map((r, i) => (
                <motion.div key={`${r.type}-${r.id}-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => navigateToResult(r)} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card/50 cursor-pointer hover:border-indigo-500/50 transition-all">
                  <span className="text-2xl">{typeIcons[r.type] || '📄'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.type}</p>
                  </div>
                  <Badge color={typeColors[r.type] || 'gray' as any}>{r.type}</Badge>
                </motion.div>
              ))}
            </div>
          ) : !searched ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-muted-foreground">输入关键词搜索所有内容</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
