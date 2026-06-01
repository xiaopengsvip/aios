import { useState, useEffect } from "react";
import { api } from "../services/api";

interface AgentProps {
  requireAuth?: (cb?: () => void) => boolean;
  isAuthed?: boolean;
}

interface Agent {
  id: string;
  name: string;
  description?: Record<string, string> | string;
  systemPrompt?: string;
  tools?: any[];
  runCount?: number;
  createdAt?: string;
}

interface ExecutionResult {
  id: string;
  agentId: string;
  input: string;
  output?: string;
  status: string;
  error?: string;
  toolCalls?: any[];
  duration?: number;
  createdAt?: string;
}

export function Agent({ requireAuth, isAuthed }: AgentProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selected, setSelected] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [history, setHistory] = useState<ExecutionResult[]>([]);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: '', description: '', systemPrompt: '' });

  useEffect(() => { if (isAuthed) loadAgents(); }, [isAuthed]);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/agents');
      setAgents(data.agents || []);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const selectAgent = async (agent: Agent) => {
    setSelected(agent);
    setResult(null);
    setHistory([]);
    // Load agent details
    try {
      const data = await api.get(`/api/agents/${agent.id}`);
      if (data.agent) setSelected(data.agent);
      if (data.executions) setHistory(data.executions);
    } catch {}
  };

  const execute = async () => {
    if (!selected || !input.trim()) return;
    if (requireAuth && !requireAuth()) return;
    setExecuting(true); setError(''); setResult(null);
    try {
      const data = await api.post(`/api/agents/${selected.id}/execute`, { input });
      setResult(data);
      setHistory(prev => [data, ...prev].slice(0, 50));
      // Update run count
      setAgents(prev => prev.map(a => a.id === selected.id ? { ...a, runCount: (a.runCount || 0) + 1 } : a));
    } catch (e: any) { setError(e.message); }
    setExecuting(false);
  };

  const createAgent = async () => {
    if (!newAgent.name) return;
    try {
      const data = await api.post('/api/agents', newAgent);
      if (data.agent) {
        setAgents(prev => [data.agent, ...prev]);
        setShowCreate(false);
        setNewAgent({ name: '', description: '', systemPrompt: '' });
      }
    } catch (e: any) { setError(e.message); }
  };

  const deleteAgent = async (id: string) => {
    try {
      await api.delete(`/api/agents/${id}`);
      setAgents(prev => prev.filter(a => a.id !== id));
      if (selected?.id === id) { setSelected(null); setHistory([]); }
    } catch {}
  };

  const getDesc = (agent: Agent): string => {
    if (!agent.description) return '';
    if (typeof agent.description === 'string') return agent.description;
    return agent.description['zh-CN'] || agent.description['en-US'] || '';
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Agent list sidebar */}
      <div style={{ width: 280, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600 }}>🤖 Agent</h2>
          <button className="btn-small" onClick={() => setShowCreate(true)}>+ 新建</button>
        </div>

        {showCreate && (
          <div style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
            <input value={newAgent.name} onChange={e => setNewAgent(a => ({ ...a, name: e.target.value }))} placeholder="Agent 名称" style={{ marginBottom: 6 }} />
            <textarea value={newAgent.description} onChange={e => setNewAgent(a => ({ ...a, description: e.target.value }))} placeholder="描述 (可选)" rows={2} style={{ marginBottom: 6, resize: 'none' }} />
            <textarea value={newAgent.systemPrompt} onChange={e => setNewAgent(a => ({ ...a, systemPrompt: e.target.value }))} placeholder="系统提示词 (可选)" rows={3} style={{ marginBottom: 6, resize: 'none', fontSize: 12 }} />
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn-send" onClick={createAgent} style={{ flex: 1 }}>创建</button>
              <button className="btn-small" onClick={() => setShowCreate(false)}>取消</button>
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && <div style={{ padding: 16, fontSize: 12, color: '#888', textAlign: 'center' }}>加载中...</div>}
          {!loading && agents.length === 0 && <div style={{ padding: 16, fontSize: 12, color: '#888', textAlign: 'center' }}>暂无 Agent</div>}
          {agents.map(agent => (
            <div
              key={agent.id}
              onClick={() => selectAgent(agent)}
              style={{
                padding: '10px 16px', cursor: 'pointer',
                background: selected?.id === agent.id ? 'var(--bg)' : 'transparent',
                borderLeft: selected?.id === agent.id ? '2px solid #6366f1' : '2px solid transparent',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>
                  {agent.name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.name}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>执行 {agent.runCount || 0} 次</div>
                </div>
                <button className="btn-icon" style={{ fontSize: 11, opacity: 0.5 }} onClick={e => { e.stopPropagation(); deleteAgent(agent.id); }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 48 }}>🤖</span>
            <h3 style={{ fontSize: 16, color: '#888' }}>选择一个 Agent 开始执行</h3>
          </div>
        ) : (
          <>
            {/* Agent info header */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18 }}>
                {selected.name[0]}
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>{selected.name}</h3>
                <p style={{ fontSize: 12, color: '#888' }}>{getDesc(selected)}</p>
              </div>
              {selected.systemPrompt && (
                <div style={{ marginLeft: 'auto', padding: '4px 10px', background: 'rgba(99,102,241,0.1)', borderRadius: 6, fontSize: 11, color: '#6366f1' }}>
                  🧠 有系统提示词
                </div>
              )}
            </div>

            {/* Execution input */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="输入指令给 Agent..."
                rows={2}
                style={{ flex: 1, resize: 'none' }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); execute(); } }}
              />
              <button className="btn-send" onClick={execute} disabled={executing || !input.trim()} style={{ alignSelf: 'flex-end' }}>
                {executing ? '⏳' : '▶ 执行'}
              </button>
            </div>

            {/* Results area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {error && <div className="error-banner" style={{ marginBottom: 12 }}><span>⚠️ {error}</span><button onClick={() => setError('')}>✕</button></div>}

              {/* Current result */}
              {result && (
                <div style={{ marginBottom: 20, padding: 16, border: '1px solid var(--border)', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>执行结果</span>
                    <span style={{ fontSize: 11, color: result.status === 'success' ? '#16a34a' : '#dc2626', padding: '1px 6px', borderRadius: 4, background: result.status === 'success' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)' }}>
                      {result.status}
                    </span>
                    {result.duration && <span style={{ fontSize: 11, color: '#888' }}>{result.duration}ms</span>}
                  </div>
                  {result.toolCalls && result.toolCalls.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>🔧 工具调用:</div>
                      {result.toolCalls.map((tc, i) => (
                        <div key={i} style={{ padding: '4px 8px', background: 'rgba(99,102,241,0.05)', borderRadius: 6, fontSize: 12, fontFamily: 'monospace', marginBottom: 4 }}>
                          {tc.name}({JSON.stringify(tc.arguments || tc.input || {})})
                        </div>
                      ))}
                    </div>
                  )}
                  <pre style={{ padding: 12, background: '#11111b', borderRadius: 8, fontSize: 12, fontFamily: 'monospace', lineHeight: 1.5, whiteSpace: 'pre-wrap', color: '#cdd6f4', maxHeight: 400, overflow: 'auto' }}>
                    {result.output || result.error || '无输出'}
                  </pre>
                </div>
              )}

              {/* Execution history */}
              {history.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>📋 执行历史 ({history.length})</h4>
                  {history.map((h, i) => (
                    <div key={h.id || i} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 6, fontSize: 12 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ color: h.status === 'success' ? '#16a34a' : '#dc2626' }}>{h.status === 'success' ? '✅' : '❌'}</span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.input}</span>
                        <span style={{ color: '#888' }}>{h.duration ? `${h.duration}ms` : ''}</span>
                      </div>
                      <div style={{ color: '#666', maxHeight: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {(h.output || h.error || '').slice(0, 200)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
