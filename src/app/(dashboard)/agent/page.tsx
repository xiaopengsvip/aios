'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Button, Input, Empty, Badge, LoadingSpinner } from '@/components/ui';


interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  capabilities: string[];
  model: string;
  systemPrompt: string;
  tools: string[];
  isBuiltIn: boolean;
}

interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: { name: string; input: string; output: string }[];
  status: 'streaming' | 'done' | 'error';
}

function getBuiltInAgents(t: (key: string) => string): Agent[] {
  return [
    {
      id: 'web-search',
      name: 'Web Search',
      description: t('webSearchDesc'),
      icon: '🔍',
      capabilities: [t('capWebSearch'), t('capInfoAggregation'), t('capRealtimeData')],
      model: 'mimo-v2.5-pro',
      systemPrompt: 'You are a web search assistant. Search the internet for relevant information and provide accurate answers.',
      tools: ['web_search', 'url_fetch'],
      isBuiltIn: true,
    },
    {
      id: 'code-interpreter',
      name: 'Code Interpreter',
      description: t('codeInterpreterDesc'),
      icon: '💻',
      capabilities: [t('capPythonExec'), t('capDataAnalysis'), t('capVisualization')],
      model: 'mimo-v2.5-pro',
      systemPrompt: 'You are a code interpreter. Write and execute code to solve problems.',
      tools: ['code_execute', 'file_read', 'file_write'],
      isBuiltIn: true,
    },
    {
      id: 'data-analyst',
      name: 'Data Analyst',
      description: t('dataAnalystDesc'),
      icon: '📊',
      capabilities: [t('capDataCleaning'), t('capStatAnalysis'), t('capChartGen')],
      model: 'mimo-v2.5-pro',
      systemPrompt: 'You are a data analyst. Analyze datasets and provide insights with visualizations.',
      tools: ['code_execute', 'file_read', 'chart_generate'],
      isBuiltIn: true,
    },
    {
      id: 'file-reader',
      name: 'File Reader',
      description: t('fileReaderDesc'),
      icon: '📄',
      capabilities: [t('capPdfParse'), t('capDocExtract'), t('capOcr')],
      model: 'mimo-v2.5-pro',
      systemPrompt: 'You are a file reader assistant. Read and extract information from various file formats.',
      tools: ['file_read', 'ocr_extract', 'pdf_parse'],
      isBuiltIn: true,
    },
  ];
}

function getAvailableTools(t: (key: string) => string) {
  return [
    { id: 'web_search', name: t('toolWebSearch'), icon: '🔍' },
    { id: 'url_fetch', name: t('toolUrlFetch'), icon: '🌐' },
    { id: 'code_execute', name: t('toolCodeExecute'), icon: '💻' },
    { id: 'file_read', name: t('toolFileRead'), icon: '📄' },
    { id: 'file_write', name: t('toolFileWrite'), icon: '✏️' },
    { id: 'chart_generate', name: t('toolChartGenerate'), icon: '📊' },
    { id: 'ocr_extract', name: t('toolOcrExtract'), icon: '👁️' },
    { id: 'pdf_parse', name: t('toolPdfParse'), icon: '📕' },
    { id: 'image_generate', name: t('toolImageGenerate'), icon: '🎨' },
    { id: 'api_call', name: t('toolApiCall'), icon: '🔌' },
  ];
}

const PROVIDER_ICONS: Record<string, string> = {
  OPENAI: '🟢', ANTHROPIC: '🟠', GOOGLE: '🔵', DEEPSEEK: '🟣',
  QWEN: '🟡', XAI: '⚫', CUSTOM: '🔮', SILICONFLOW: '💎',
  OPENROUTER: '🌐', KIMI: '🌙', GLM: '🧊', MINIMAX: '🎯',
};

interface DBModel {
  id: string;
  name: string;
  displayName: Record<string, string>;
  provider: { name: string; type?: string };
  providerStatus?: 'online' | 'unknown';
}

export default function AgentPage() {
  const t = useTranslations('agent');
  const tCommon = useTranslations('common');
  const availableTools = getAvailableTools(t);
  const [agents, setAgents] = useState<Agent[]>(() => getBuiltInAgents(t));
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [dbModels, setDbModels] = useState<DBModel[]>([]);
  const [newAgent, setNewAgent] = useState({
    name: '',
    description: '',
    systemPrompt: '',
    model: '',
    tools: [] as string[],
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 从 API 获取可用模型
  useEffect(() => {
    fetch('/api/models')
      .then(res => res.ok ? res.json() : { models: [] })
      .then(data => {
        const models = data.models || [];
        setDbModels(models);
        // 优先选 mimo-v2.5-pro，否则第一个
        if (models.length > 0 && !newAgent.model) {
          const preferred = models.find((m: DBModel) => m.name === 'mimo-v2.5-pro');
          setNewAgent(prev => ({ ...prev, model: (preferred || models[0]).name }));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming || !selectedAgent) return;

    const userMessage: AgentMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      status: 'done',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    const assistantMessage: AgentMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      toolCalls: [],
      status: 'streaming',
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      // For built-in agents, use the chat API directly
      if (selectedAgent.isBuiltIn) {
        const res = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: input.trim(),
            systemPrompt: selectedAgent.systemPrompt,
            model: selectedAgent.model,
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? {
                  ...m,
                  content: data.content || data.message || t('simulatedResponse', { name: selectedAgent.name }),
                  toolCalls: data.toolCalls || [],
                  status: 'done' as const,
                }
              : m
          )
        );
      } else {
        // For custom agents, use the agent execute API
        const res = await fetch(`/api/agents/${selectedAgent.id}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: input.trim() }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const toolCallsFromSteps = (data.steps || [])
          .filter((s: any) => s.type === 'tool_call' && s.toolCalls)
          .flatMap((s: any) => s.toolCalls.map((tc: any) => ({
            name: tc.toolName,
            input: JSON.stringify(tc.input),
            output: tc.output,
          })));

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? {
                  ...m,
                  content: data.response || 'No response',
                  toolCalls: toolCallsFromSteps,
                  status: 'done' as const,
                }
              : m
          )
        );
      }
    } catch (error: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, content: `Error: ${error.message}`, status: 'error' as const }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const createAgent = () => {
    if (!newAgent.name.trim() || !newAgent.systemPrompt.trim()) return;

    const agent: Agent = {
      id: `custom-${Date.now()}`,
      name: newAgent.name,
      description: newAgent.description,
      icon: '🤖',
      capabilities: newAgent.tools.map((t) => availableTools.find((at) => at.id === t)?.name || t),
      model: newAgent.model,
      systemPrompt: newAgent.systemPrompt,
      tools: newAgent.tools,
      isBuiltIn: false,
    };

    setAgents((prev) => [...prev, agent]);
    setNewAgent({ name: '', description: '', systemPrompt: '', model: 'mimo-v2.5-pro', tools: [] });
    setShowCreateForm(false);
    setSelectedAgent(agent);
  };

  const toggleTool = (toolId: string) => {
    setNewAgent((prev) => ({
      ...prev,
      tools: prev.tools.includes(toolId)
        ? prev.tools.filter((t) => t !== toolId)
        : [...prev.tools, toolId],
    }));
  };

  return (
    <div className="flex h-full bg-background">
      {/* Agent list sidebar — desktop: fixed sidebar, mobile: full-width when no agent selected */}
      <div className={`${selectedAgent ? 'hidden md:flex' : 'flex'} w-full md:w-72 border-r border-border bg-card flex-col shrink-0`}>
        <div className="h-14 flex items-center justify-between px-4 border-b border-border">
          <h1 className="text-sm font-semibold">🤖 {t('title')}</h1>
          <Button size="sm" onClick={() => setShowCreateForm(true)}>
            {t('create')}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 md:grid-cols-1 gap-2 auto-rows-min content-start">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => {
                setSelectedAgent(agent);
                setMessages([]);
              }}
              className={`w-full p-3 rounded-xl text-left transition-all ${
                selectedAgent?.id === agent.id
                  ? 'bg-muted border border-border'
                  : 'hover:bg-muted/50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">{agent.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{agent.name}</div>
                  {agent.isBuiltIn && (
                    <Badge color="indigo" className="text-xs">
                      {t('builtin')}
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{agent.description}</p>
              <div className="flex flex-wrap gap-1">
                {agent.capabilities.slice(0, 3).map((cap) => (
                  <span
                    key={cap}
                    className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main area — desktop: always shown, mobile: only when agent selected */}
      <div className={`${selectedAgent ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
        {selectedAgent ? (
          <>
            {/* Agent header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-border bg-card">
              <div className="flex items-center gap-3">
                {/* Mobile back button */}
                <button
                  onClick={() => { setSelectedAgent(null); setMessages([]); }}
                  className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors text-muted-foreground"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <span className="text-xl">{selectedAgent.icon}</span>
                <div>
                  <h2 className="text-sm font-semibold">{selectedAgent.name}</h2>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{selectedAgent.model}</span>
                    <span>·</span>
                    <span>{t('tools', { count: selectedAgent.tools.length })}</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2">
                {selectedAgent.tools.map((tool) => {
                  const toolInfo = availableTools.find((t) => t.id === tool);
                  return (
                    <span
                      key={tool}
                      className="px-2 py-1 rounded-lg bg-muted text-xs text-muted-foreground"
                      title={toolInfo?.name}
                    >
                      {toolInfo?.icon} {toolInfo?.name}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl mb-4">{selectedAgent.icon}</div>
                    <h2 className="text-xl font-semibold mb-2">{selectedAgent.name}</h2>
                    <p className="text-muted-foreground text-sm mb-4">{selectedAgent.description}</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {selectedAgent.capabilities.map((cap) => (
                        <span
                          key={cap}
                          className="px-3 py-1.5 rounded-lg bg-muted border border-border text-xs text-muted-foreground"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-6">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs shrink-0">
                          {selectedAgent.icon}
                        </div>
                      )}

                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-muted border border-border'
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>

                        {/* Tool calls */}
                        {message.toolCalls && message.toolCalls.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.toolCalls.map((call, idx) => (
                              <div
                                key={idx}
                                className="rounded-lg bg-card/80 border border-border p-3"
                              >
                                <div className="flex items-center gap-2 text-xs text-indigo-400 mb-1">
                                  <span>🔧</span>
                                  <span className="font-medium">
                                    {availableTools.find((t) => t.id === call.name)?.name || call.name}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {t('toolInput')}: {call.input}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {t('toolOutput')}: {call.output}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {message.status === 'streaming' && (
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            {t('thinking')}
                          </div>
                        )}
                      </div>

                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                          U
                        </div>
                      )}
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border bg-card p-4 pb-20 md:pb-4">
              <div className="max-w-3xl mx-auto flex gap-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={t('inputPlaceholder', { name: selectedAgent.name })}
                  className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm"
                  disabled={isStreaming}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isStreaming}
                  loading={isStreaming}
                  size="lg"
                >
                  {!isStreaming && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-4">🤖</div>
              <h2 className="text-xl font-semibold mb-2">{t('emptyTitle')}</h2>
              <p className="text-muted-foreground text-sm">{t('emptyDesc')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Create agent modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowCreateForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold mb-4">{t('createTitle')}</h2>

              <div className="space-y-4">
                <div>
                  <Input
                    label={t('name')}
                    value={newAgent.name}
                    onChange={(e) => setNewAgent((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder={t('namePlaceholder')}
                  />
                </div>

                <div>
                  <Input
                    label={t('description')}
                    value={newAgent.description}
                    onChange={(e) => setNewAgent((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder={t('descriptionPlaceholder')}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('systemPrompt')}</label>
                  <textarea
                    value={newAgent.systemPrompt}
                    onChange={(e) => setNewAgent((prev) => ({ ...prev, systemPrompt: e.target.value }))}
                    placeholder={t('systemPromptPlaceholder')}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('model')}</label>
                  <select
                    value={newAgent.model}
                    onChange={(e) => setNewAgent((prev) => ({ ...prev, model: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                  >
                    {dbModels.map((m) => (
                      <option key={m.id} value={m.name}>
                        {PROVIDER_ICONS[m.provider?.type || ''] || '🔮'} {m.displayName?.zh || m.displayName?.en || m.name} ({m.provider?.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('toolsLabel')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableTools.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => toggleTool(tool.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                          newAgent.tools.includes(tool.id)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted border border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span>{tool.icon}</span>
                        <span>{tool.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1"
                >
                  {t('cancel')}
                </Button>
                <Button
                  onClick={createAgent}
                  disabled={!newAgent.name.trim() || !newAgent.systemPrompt.trim()}
                  className="flex-1"
                >
                  {t('createButton')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
