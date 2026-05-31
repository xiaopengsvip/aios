'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  provider?: string;
  timestamp: Date;
  status?: 'streaming' | 'done' | 'error';
  tokens?: number;
  latency?: number;
}

export default function ChatMessage({
  message,
  onCopy,
  onReuse,
}: {
  message: Message;
  onCopy?: (content: string) => void;
  onReuse?: (content: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    onCopy?.(message.content);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}
    >
      {message.role === 'assistant' && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold shrink-0">
          AI
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 group relative ${
          message.role === 'user'
            ? 'bg-indigo-600 text-white'
            : 'bg-zinc-800/50 border border-zinc-700/50'
        }`}
      >
        {message.role === 'assistant' ? (
          <div className="text-sm markdown-body prose prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        )}

        {message.status === 'streaming' && (
          <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            生成中...
          </div>
        )}

        {message.status === 'done' && (
          <div className="flex items-center gap-3 mt-2 text-xs text-zinc-600">
            {message.model && <span className="px-1.5 py-0.5 rounded bg-zinc-700/50 text-zinc-400">{message.model}</span>}
            {message.tokens && <span>{message.tokens} tokens</span>}
          </div>
        )}

        {message.status === 'error' && (
          <div className="flex items-center gap-2 mt-2 text-xs text-red-400">
            <span>⚠️</span> 生成失败
          </div>
        )}

        {/* Copy button */}
        {message.role === 'assistant' && message.status === 'done' && (
          <div className="absolute -bottom-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              onClick={handleCopy}
              className="px-2 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-xs text-zinc-400 hover:text-white transition-all"
            >
              {copied ? '✓ 已复制' : '📋 复制'}
            </button>
            {onReuse && (
              <button
                onClick={() => onReuse(message.content)}
                className="px-2 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-xs text-zinc-400 hover:text-white transition-all"
              >
                🔄 重用
              </button>
            )}
          </div>
        )}
      </div>

      {message.role === 'user' && (
        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold shrink-0">
          U
        </div>
      )}
    </motion.div>
  );
}
