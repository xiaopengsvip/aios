'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Model {
  id: string;
  name: string;
  provider: string;
  icon: string;
  description?: string;
}

const defaultModels: Model[] = [
  { id: 'mimo-v2.5-pro', name: 'MiMo V2.5 Pro', provider: 'Xiaomi MiMo', icon: '🟠', description: '小米旗舰推理模型 · 1M context' },
  { id: 'mimo-v2.5', name: 'MiMo V2.5', provider: 'Xiaomi MiMo', icon: '🟠', description: '多模态理解 · 图片/音频/视频' },
  { id: 'mimo-v2-flash', name: 'MiMo V2 Flash', provider: 'Xiaomi MiMo', icon: '🟠', description: '轻量快速模型' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', icon: '🟢', description: '多模态旗舰模型' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', icon: '🟢', description: '轻量高效模型' },
  { id: 'claude-sonnet-4-20250514', name: 'Claude 4 Sonnet', provider: 'Anthropic', icon: '🟣', description: '平衡性能与速度' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', icon: '🔵', description: '谷歌旗舰模型' },
  { id: 'qwen-max', name: 'Qwen 3 Max', provider: 'Alibaba', icon: '🟡', description: '通义千问旗舰' },
  { id: 'grok-3', name: 'Grok 3', provider: 'xAI', icon: '⚫', description: 'xAI 旗舰模型' },
];

export default function ModelSelector({
  selected,
  onSelect,
  models = defaultModels,
}: {
  selected: Model;
  onSelect: (model: Model) => void;
  models?: Model[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>(['mimo-v2.5-pro', 'mimo-v2.5']);

  const filtered = useMemo(() => {
    if (!search) return models;
    const q = search.toLowerCase();
    return models.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
    );
  }, [models, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, Model[]> = {};
    filtered.forEach((m) => {
      if (!groups[m.provider]) groups[m.provider] = [];
      groups[m.provider].push(m);
    });
    return groups;
  }, [filtered]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 text-sm transition-all"
      >
        <span>{selected.icon}</span>
        <span>{selected.name}</span>
        <span className="text-xs text-zinc-500">{selected.provider}</span>
        <span className="text-xs">▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl z-50 overflow-hidden"
            >
              {/* Search */}
              <div className="p-3 border-b border-zinc-800">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索模型..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              {/* Model list */}
              <div className="max-h-80 overflow-y-auto">
                {Object.entries(grouped).map(([provider, providerModels]) => (
                  <div key={provider}>
                    <div className="px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      {provider}
                    </div>
                    {providerModels.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          onSelect(model);
                          setOpen(false);
                        }}
                        className={`flex items-center gap-3 w-full px-4 py-3 text-sm hover:bg-zinc-800 transition-all ${
                          selected.id === model.id ? 'bg-zinc-800 text-white' : 'text-zinc-400'
                        }`}
                      >
                        <span className="text-base">{model.icon}</span>
                        <div className="flex-1 text-left">
                          <div className="font-medium">{model.name}</div>
                          {model.description && (
                            <div className="text-xs text-zinc-600">{model.description}</div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(model.id);
                          }}
                          className="text-sm hover:scale-110 transition-transform"
                        >
                          {favorites.includes(model.id) ? '⭐' : '☆'}
                        </button>
                      </button>
                    ))}
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-zinc-500">
                    未找到匹配的模型
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
