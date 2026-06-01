import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface FeatureProps { requireAuth?: (cb?: () => void) => boolean; isAuthed?: boolean; }

export function Workflow({ requireAuth, isAuthed }: FeatureProps) {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [input, setInput] = useState('{}');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => { if (isAuthed) loadWorkflows(); }, [isAuthed]);

  const loadWorkflows = async () => {
    setLoading(true);
    try { const data = await api.get('/api/workflows'); setWorkflows(data.workflows || []); }
    catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const loadDetail = async (id: string) => {
    try {
      const data = await api.get(`/api/workflows/${id}`);
      setSelected(data.workflow || data);
      if (data.executions) setResults(data.executions);
    } catch {}
  };

  const execute = async () => {
    if (!selected) return;
    if (requireAuth && !requireAuth()) return;
    setExecuting(true); setError('');
    try {
      let parsedInput = {};
      try { parsedInput = JSON.parse(input); } catch { parsedInput = { input }; }
      const data = await api.post(`/api/workflows/${selected.id}/execute`, { input: parsedInput });
      setResults(prev => [{ ...data, time: Date.now() }, ...prev].slice(0, 20));
    } catch (e: any) { setError(e.message); }
    setExecuting(false);
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Workflow list */}
      <div style={{ width: 280, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600 }}>⚡ 工作流</h2>
          <button className="btn-small" onClick={loadWorkflows}>刷新</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && <div style={{ padding: 16, fontSize: 12, color: '#888', textAlign: 'center' }}>加载中...</div>}
          {!loading && workflows.length === 0 && <div style={{ padding: 16, fontSize: 12, color: '#888', textAlign: 'center' }}>暂无工作流</div>}
          {workflows.map(w => (
            <div key={w.id} onClick={() => { setSelected(w); loadDetail(w.id); }} style={{ padding: '10px 16px', cursor: 'pointer', background: selected?.id === w.id ? 'var(--bg)' : 'transparent', borderLeft: selected?.id === w.id ? '2px solid #6366f1' : '2px solid transparent', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{w.name}</div>
              <div style={{ fontSize: 11, color: '#888' }}>{w.description || '无描述'}</div>
              <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{w.nodeCount || '?'} 节点 · {w.executionCount || 0} 次执行</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#888' }}>
            <span style={{ fontSize: 48 }}>⚡</span><h3>选择一个工作流</h3>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>{selected.name}</h3>
              <p style={{ fontSize: 12, color: '#888' }}>{selected.description}</p>
            </div>

            {/* Nodes visualization */}
            {selected.nodes && selected.nodes.length > 0 && (
              <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {selected.nodes.map((node: any, i: number) => (
                  <div key={node.id || i} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{node.type === 'start' ? '🟢' : node.type === 'llm' ? '🧠' : node.type === 'tool' ? '🔧' : node.type === 'condition' ? '🔀' : '🔴'}</span>
                    <span>{node.data?.label || node.type}</span>
                    {i < selected.nodes.length - 1 && <span style={{ color: '#888', marginLeft: 4 }}>→</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Input/Execute */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
              <label style={{ fontSize: 12, color: '#888', marginBottom: 4, display: 'block' }}>输入参数 (JSON)</label>
              <textarea value={input} onChange={e => setInput(e.target.value)} rows={3} style={{ width: '100%', fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }} />
              <button className="btn-send" onClick={execute} disabled={executing} style={{ marginTop: 8 }}>
                {executing ? '⏳ 执行中...' : '▶ 执行工作流'}
              </button>
              {error && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠️ {error}</div>}
            </div>

            {/* Results */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
              <h4 style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>📋 执行结果 ({results.length})</h4>
              {results.length === 0 ? <div style={{ color: '#888', fontSize: 13 }}>尚未执行</div> : results.map((r, i) => (
                <div key={i} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8, marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ color: r.status === 'success' || r.success ? '#16a34a' : '#dc2626' }}>{r.status === 'success' || r.success ? '✅' : '❌'}</span>
                    <span style={{ fontSize: 11, color: '#888' }}>{r.duration ? `${r.duration}ms` : ''}</span>
                  </div>
                  <pre style={{ padding: 8, background: '#11111b', borderRadius: 6, fontSize: 11, fontFamily: 'monospace', color: '#cdd6f4', whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>
                    {JSON.stringify(r.output || r.result || r.error || r, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
