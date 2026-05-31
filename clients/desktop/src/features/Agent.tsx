import { useState, useEffect } from "react";
import { api } from "../services/api";

export function Agent() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [executeInput, setExecuteInput] = useState("");
  const [executeResult, setExecuteResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    api.getAgents()
      .then(d => setAgents(d.agents || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleExecute = async () => {
    if (!selected || !executeInput.trim()) return;
    setIsExecuting(true);
    setExecuteResult(null);
    try {
      const result = await api.executeAgent(selected.id, executeInput);
      setExecuteResult(result);
    } catch (err: any) {
      setExecuteResult({ error: err.message });
    } finally {
      setIsExecuting(false);
    }
  };

  const getName = (agent: any) => {
    if (!agent.description) return agent.name;
    if (typeof agent.description === "string") return agent.name;
    return agent.name;
  };

  if (loading) return <div className="page-loading">加载中...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Agent</h2>
        <button className="btn-small" onClick={() => { setLoading(true); api.getAgents().then(d => setAgents(d.agents || [])).finally(() => setLoading(false)); }}>刷新</button>
      </div>
      {agents.length === 0 ? (
        <div className="empty-state"><span className="empty-icon">🤖</span><h3>暂无 Agent</h3></div>
      ) : (
        <div className="agent-grid">
          {agents.map(agent => (
            <div key={agent.id} className="agent-card" onClick={() => { setSelected(agent); setExecuteInput(""); setExecuteResult(null); }}>
              <div className="agent-avatar">{(agent.name || "A")[0]}</div>
              <div className="agent-info">
                <div className="agent-name">{getName(agent)}</div>
                <div className="agent-meta">执行 {agent.runCount || 0} 次</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Execute Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selected.name}</h3>
              <button onClick={() => setSelected(null)}>✕</button>
            </div>
            <textarea
              value={executeInput}
              onChange={e => setExecuteInput(e.target.value)}
              placeholder="输入指令..."
              rows={4}
            />
            {isExecuting && <div className="loading-bar" />}
            {executeResult && (
              <div className="result-box">
                {executeResult.error ? executeResult.error : (executeResult.output || "无输出")}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setSelected(null)}>关闭</button>
              <button className="btn-primary" onClick={handleExecute} disabled={isExecuting || !executeInput.trim()}>
                {isExecuting ? "执行中..." : "执行"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
