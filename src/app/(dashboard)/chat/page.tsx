'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

interface DBModel {
  id: string;
  name: string;
  displayName: Record<string, string>;
  provider: { name: string; type?: string };
  providerStatus?: 'online' | 'unknown';
  providerLatency?: number | null;
  supportsVision?: boolean;
  supportsToolUse?: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string;
  model?: string;
  provider?: string;
  timestamp: Date;
  status?: 'streaming' | 'done' | 'error';
  tokens?: number;
}

interface ConversationSummary {
  id: string;
  title: string;
  modelId: string | null;
  modelName: string | null;
  modelDisplayName: any;
  messageCount: number;
  totalTokens: string;
  isPinned: boolean;
  isArchived: boolean;
  lastMessage: { id: string; role: string; content: string; createdAt: string } | null;
  createdAt: string;
  updatedAt: string;
}

const PROVIDER_ICONS: Record<string, string> = {
  OPENAI: '🟢', ANTHROPIC: '🟠', GOOGLE: '🔵', DEEPSEEK: '🟣',
  QWEN: '🟡', XAI: '⚫', CUSTOM: '🔮', SILICONFLOW: '💎',
  OPENROUTER: '🌐', KIMI: '🌙', GLM: '🧊', MINIMAX: '🎯',
};

export default function ChatPage() {
  const t = useTranslations('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [models, setModels] = useState<DBModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<DBModel | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load models from DB
  useEffect(() => {
    fetch('/api/models')
      .then((r) => r.json())
      .then((data) => {
        if (data.models?.length) {
          setModels(data.models);
          const defaultModel = data.models.find((m: DBModel) => m.name === 'mimo-v2.5-pro') || data.models[0];
          setSelectedModel(defaultModel);
        }
      })
      .catch(() => {});
  }, []);

  // Load conversation list
  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (e) {
      console.error('Failed to load conversations', e);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history
  const loadConversation = async (convId: string) => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        const loadedMessages: Message[] = data.messages.map((m: any) => ({
          id: m.id,
          role: m.role.toLowerCase() as 'user' | 'assistant' | 'system',
          content: m.content || '',
          model: m.modelName,
          provider: m.providerName,
          timestamp: new Date(m.createdAt),
          status: 'done',
          tokens: m.totalTokens,
        }));
        setMessages(loadedMessages);
        setConversationId(convId);
        if (data.modelId) {
          const found = models.find((m) => m.id === data.modelId);
          if (found) setSelectedModel(found);
        }
      }
    } catch (e) {
      console.error('Failed to load conversation', e);
    } finally {
      setIsLoadingHistory(false);
      setShowSidebar(false);
    }
  };

  // Delete conversation
  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/conversations/${convId}`, { method: 'DELETE' });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== convId));
        if (conversationId === convId) {
          setConversationId(null);
          setMessages([]);
        }
      }
    } catch (e) {
      console.error('Failed to delete conversation', e);
    }
  };

  // New conversation
  const newConversation = () => {
    setConversationId(null);
    setMessages([]);
    setShowSidebar(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming || !selectedModel) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      model: selectedModel.displayName?.['zh-CN'] || selectedModel.name,
      provider: selectedModel.provider.name,
      timestamp: new Date(),
      status: 'streaming',
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedModel.id,
          conversationId: conversationId || undefined,
          messages: messages
            .concat(userMessage)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || t('requestFailed'));
      }

      // Capture conversationId from response header
      const newConvId = response.headers.get('X-Conversation-Id');
      if (newConvId && !conversationId) {
        setConversationId(newConvId);
        loadConversations();
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let fullContent = '';
        let fullReasoning = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

          for (const line of lines) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const json = JSON.parse(data);
              if (json.error) throw new Error(json.error);
              const delta = json.choices?.[0]?.delta?.content || '';
              const reasoningDelta = json.choices?.[0]?.delta?.reasoning || '';
              fullContent += delta;
              fullReasoning += reasoningDelta;

              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessage.id
                    ? { ...m, content: fullContent, reasoning: fullReasoning || undefined, status: 'done', tokens: json.usage?.totalTokens }
                    : m
                )
              );
            } catch (e: any) {
              if (e.message && !e.message.includes('JSON')) throw e;
            }
          }
        }
      }
    } catch (error: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, content: `${t('error')}: ${error.message}`, status: 'error' }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getDisplayName = (m: DBModel) => {
    if (typeof m.displayName === 'object' && m.displayName !== null) {
      return m.displayName['zh-CN'] || m.displayName['en-US'] || m.name;
    }
    if (typeof m.displayName === 'string') {
      try {
        const parsed = JSON.parse(m.displayName);
        return parsed['zh-CN'] || parsed['en-US'] || m.name;
      } catch { return m.name; }
    }
    return m.name;
  };

  const getIcon = (m: DBModel) => PROVIDER_ICONS[m.provider?.name?.toUpperCase()] || '🔮';

  const suggestions = [
    t('suggestion1'),
    t('suggestion2'),
    t('suggestion3'),
    t('suggestion4'),
  ];

  return (
    <div className="flex h-full bg-background">
      {/* Conversation sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <>
            {/* Overlay for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40 lg:hidden"
              onClick={() => setShowSidebar(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed lg:relative z-50 w-[280px] h-full border-r border-border bg-card flex flex-col shrink-0"
            >
              {/* Sidebar header */}
              <div className="flex items-center justify-between p-3 border-b border-border">
                <h2 className="text-sm font-semibold">{t('conversations')}</h2>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-1 rounded hover:bg-accent text-muted-foreground"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* New chat button */}
              <button
                onClick={newConversation}
                className="mx-3 mt-3 mb-1 px-3 py-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('newChat')}
              </button>

              {/* Conversation list */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {isLoadingConversations ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                    {t('loadingModel')}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {t('noConversations')}
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => loadConversation(conv.id)}
                      className={`group flex flex-col gap-1 px-3 py-2.5 rounded-lg cursor-pointer transition-all hover:bg-accent ${
                        conversationId === conv.id ? 'bg-accent' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate flex-1">
                          {conv.title || t('newChat')}
                        </span>
                        <button
                          onClick={(e) => deleteConversation(conv.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      {conv.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.lastMessage.content}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{conv.messageCount} msgs</span>
                        {conv.modelName && <span>· {conv.modelName}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (showSidebar) {
                  setShowSidebar(false);
                } else {
                  setShowSidebar(true);
                  loadConversations();
                }
              }}
              className="p-1.5 rounded-lg hover:bg-accent transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-sm font-semibold">{t('title')}</h1>
            <span className="text-xs text-muted-foreground">{t('messages', { count: messages.length })}</span>
          </div>

          <div className="flex items-center gap-1">

          {/* Model selector */}
          <div className="relative">
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:border-primary/50 text-sm transition-all"
            >
              {selectedModel ? (
                <>
                  <span>{getIcon(selectedModel)}</span>
                  <span className={`w-2 h-2 rounded-full ${selectedModel.providerStatus === 'online' ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                  <span>{getDisplayName(selectedModel)}</span>
                  <span className="text-xs text-muted-foreground">{selectedModel.provider.name}</span>
                </>
              ) : (
                <span className="text-muted-foreground">{t('loadingModel')}</span>
              )}
              <span className="text-xs">▾</span>
            </button>

            <AnimatePresence>
              {showModelSelector && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto"
                >
                  {models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model);
                        setShowModelSelector(false);
                      }}
                      className={`flex items-center gap-3 w-full px-4 py-3 text-sm hover:bg-accent transition-all ${
                        selectedModel?.id === model.id ? 'bg-accent text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      <span>{getIcon(model)}</span>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${model.providerStatus === 'online' ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-medium truncate">{getDisplayName(model)}</div>
                        <div className="text-xs text-muted-foreground">{model.provider.name}</div>
                      </div>
                      <div className="ml-auto flex gap-1 shrink-0">
                        {model.supportsVision && <span className="text-xs">👁</span>}
                        {model.supportsToolUse && <span className="text-xs">🔧</span>}
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingHistory ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span>{t('loadingModel')}</span>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-4">✨</div>
                <h2 className="text-xl font-semibold mb-2">{t('startNewChat')}</h2>
                <p className="text-muted-foreground text-sm mb-8">
                  {t('selectModelHint')}
                </p>
                <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInput(suggestion);
                        inputRef.current?.focus();
                      }}
                      className="p-3 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all text-left"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${
                    message.role === 'user' ? 'justify-end' : ''
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold shrink-0">
                      AI
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border'
                    }`}
                  >
                    {message.reasoning && (
                      <details className="mb-2 group">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none flex items-center gap-1">
                          <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          💭 思考过程
                        </summary>
                        <div className="mt-1.5 text-xs text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-2.5 border border-border/50 max-h-48 overflow-y-auto">
                          {message.reasoning}
                        </div>
                      </details>
                    )}

                    <MarkdownRenderer content={message.content} className="text-sm" />

                    {message.status === 'streaming' && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        {t('streaming')}
                      </div>
                    )}

                    {message.status === 'done' && message.tokens && (
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{message.model}</span>
                        <span>·</span>
                        <span>{message.tokens} tokens</span>
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold shrink-0">
                      U
                    </div>
                  )}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-border bg-card p-4 pb-20 md:pb-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('placeholder')}
                  rows={1}
                  className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                  style={{ minHeight: '48px', maxHeight: '200px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                  }}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isStreaming || !selectedModel}
                className="px-4 py-3 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 text-primary-foreground"
              >
                {isStreaming ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>
                {t('currentModel')}: {selectedModel ? `${getIcon(selectedModel)} ${getDisplayName(selectedModel)}` : t('loadingModel')}
              </span>
              <span>
                {selectedModel?.provider?.name || ''} · {t('streamSupport')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
