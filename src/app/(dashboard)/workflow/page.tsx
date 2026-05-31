'use client';

import { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Node, Edge, addEdge, useNodesState, useEdgesState,
  Controls, MiniMap, Background, BackgroundVariant,
  Connection, Handle, Position, NodeProps,
  Panel, ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useTranslations } from 'next-intl';

/* ─── Custom Node Components ─── */
const NODE_STYLES: Record<string, { icon: string; bg: string; border: string }> = {
  input:     { icon: '📥', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  llm:       { icon: '🧠', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
  agent:     { icon: '🤖', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  condition: { icon: '🔀', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  code:      { icon: '💻', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  http:      { icon: '🌐', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  transform: { icon: '🔄', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  output:    { icon: '📤', bg: 'bg-pink-500/10', border: 'border-pink-500/30' },
  start:     { icon: '▶️', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  end:       { icon: '⏹️', bg: 'bg-red-500/10', border: 'border-red-500/30' },
};

function CustomNode({ data, selected }: NodeProps) {
  const style = NODE_STYLES[data.nodeType] || NODE_STYLES.llm;
  return (
    <div className={`px-4 py-3 rounded-xl border-2 ${style.border} ${style.bg} bg-card shadow-lg min-w-[160px] transition-all ${selected ? 'ring-2 ring-primary shadow-xl' : ''}`}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-primary !border-2 !border-background" />
      <div className="flex items-center gap-2">
        <span className="text-lg">{style.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold truncate">{data.label}</div>
          {data.description && <div className="text-[10px] text-muted-foreground truncate mt-0.5">{data.description}</div>}
        </div>
      </div>
      {data.status && data.status !== 'idle' && (
        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${data.status === 'running' ? 'bg-yellow-500 animate-pulse' : data.status === 'done' ? 'bg-green-500' : 'bg-red-500'}`} />
      )}
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-primary !border-2 !border-background" />
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

/* ─── Templates ─── */
const TEMPLATES = [
  {
    name: '内容生产线',
    nodes: [
      { id: 'n1', type: 'custom' as const, position: { x: 250, y: 0 }, data: { nodeType: 'input', label: '接收主题', description: 'topic variable', status: 'idle' } },
      { id: 'n2', type: 'custom' as const, position: { x: 250, y: 150 }, data: { nodeType: 'llm', label: '生成内容', description: 'GPT-4o', status: 'idle' } },
      { id: 'n3', type: 'custom' as const, position: { x: 250, y: 300 }, data: { nodeType: 'transform', label: '格式化', description: 'Markdown', status: 'idle' } },
      { id: 'n4', type: 'custom' as const, position: { x: 250, y: 450 }, data: { nodeType: 'output', label: '输出结果', description: 'text', status: 'idle' } },
    ],
    edges: [
      { id: 'e1-2', source: 'n1', target: 'n2', animated: true },
      { id: 'e2-3', source: 'n2', target: 'n3', animated: true },
      { id: 'e3-4', source: 'n3', target: 'n4', animated: true },
    ],
  },
  {
    name: '数据处理',
    nodes: [
      { id: 'n1', type: 'custom' as const, position: { x: 250, y: 0 }, data: { nodeType: 'input', label: '数据输入', description: 'data', status: 'idle' } },
      { id: 'n2', type: 'custom' as const, position: { x: 250, y: 150 }, data: { nodeType: 'code', label: '数据处理', description: 'Python', status: 'idle' } },
      { id: 'n3', type: 'custom' as const, position: { x: 250, y: 300 }, data: { nodeType: 'llm', label: '生成报告', description: 'GPT-4o', status: 'idle' } },
      { id: 'n4', type: 'custom' as const, position: { x: 250, y: 450 }, data: { nodeType: 'output', label: '输出报告', description: 'Markdown', status: 'idle' } },
    ],
    edges: [
      { id: 'e1-2', source: 'n1', target: 'n2', animated: true },
      { id: 'e2-3', source: 'n2', target: 'n3', animated: true },
      { id: 'e3-4', source: 'n3', target: 'n4', animated: true },
    ],
  },
  {
    name: '条件分支',
    nodes: [
      { id: 'n1', type: 'custom' as const, position: { x: 250, y: 0 }, data: { nodeType: 'input', label: '输入', description: '', status: 'idle' } },
      { id: 'n2', type: 'custom' as const, position: { x: 250, y: 150 }, data: { nodeType: 'llm', label: '分类判断', description: 'Classify input', status: 'idle' } },
      { id: 'n3', type: 'custom' as const, position: { x: 100, y: 300 }, data: { nodeType: 'condition', label: '条件A', description: 'If positive', status: 'idle' } },
      { id: 'n4', type: 'custom' as const, position: { x: 400, y: 300 }, data: { nodeType: 'condition', label: '条件B', description: 'If negative', status: 'idle' } },
      { id: 'n5', type: 'custom' as const, position: { x: 100, y: 450 }, data: { nodeType: 'llm', label: '处理A', description: '', status: 'idle' } },
      { id: 'n6', type: 'custom' as const, position: { x: 400, y: 450 }, data: { nodeType: 'llm', label: '处理B', description: '', status: 'idle' } },
      { id: 'n7', type: 'custom' as const, position: { x: 250, y: 600 }, data: { nodeType: 'output', label: '合并输出', description: '', status: 'idle' } },
    ],
    edges: [
      { id: 'e1-2', source: 'n1', target: 'n2', animated: true },
      { id: 'e2-3', source: 'n2', target: 'n3', animated: true },
      { id: 'e2-4', source: 'n2', target: 'n4', animated: true },
      { id: 'e3-5', source: 'n3', target: 'n5', animated: true },
      { id: 'e4-6', source: 'n4', target: 'n6', animated: true },
      { id: 'e5-7', source: 'n5', target: 'n7', animated: true },
      { id: 'e6-7', source: 'n6', target: 'n7', animated: true },
    ],
  },
];

/* ─── Main Editor ─── */
function WorkflowEditor() {
  const t = useTranslations('workflow');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [showNodePanel, setShowNodePanel] = useState(false);
  const [savedWorkflowId, setSavedWorkflowId] = useState<string | null>(null);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({ ...params, animated: true }, eds));
  }, [setEdges]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node);
  }, []);

  const addNode = useCallback((nodeType: string) => {
    const id = `node-${Date.now()}`;
    const style = NODE_STYLES[nodeType];
    const newNode: Node = {
      id,
      type: 'custom',
      position: { x: 250 + Math.random() * 100, y: nodes.length * 150 },
      data: { nodeType, label: style.icon + ' ' + nodeType, description: '', status: 'idle' },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [nodes.length, setNodes]);

  const deleteSelected = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
      setSelectedNode(null);
    }
  }, [selectedNode, setNodes, setEdges]);

  const updateNodeData = useCallback((key: string, value: string) => {
    if (!selectedNode) return;
    setNodes((nds) => nds.map((n) => n.id === selectedNode.id ? { ...n, data: { ...n.data, [key]: value } } : n));
    setSelectedNode((prev) => prev ? { ...prev, data: { ...prev.data, [key]: value } } : null);
  }, [selectedNode, setNodes]);

  const loadTemplate = useCallback((idx: number) => {
    const tmpl = TEMPLATES[idx];
    setNodes(tmpl.nodes as Node[]);
    setEdges(tmpl.edges as Edge[]);
    setWorkflowName(tmpl.name);
    setSelectedNode(null);
    setLogs([]);
  }, [setNodes, setEdges]);

  const saveWorkflow = useCallback(async (): Promise<string | null> => {
    const workflow = {
      name: workflowName,
      description: '',
      nodes: nodes.map((n) => ({ id: n.id, type: n.data.nodeType, name: n.data.label, config: {} })),
      edges: edges.map((e) => ({ source: e.source, target: e.target })),
    };
    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow),
      });
      if (res.ok) {
        const data = await res.json();
        const id = data.workflow?.id;
        setSavedWorkflowId(id);
        setLogs((prev) => [...prev, '💾 Workflow saved!']);
        return id;
      }
      setLogs((prev) => [...prev, '❌ Save failed']);
      return null;
    } catch (e: any) {
      setLogs((prev) => [...prev, `❌ Save error: ${e.message}`]);
      return null;
    }
  }, [workflowName, nodes, edges]);

  const runWorkflow = useCallback(async () => {
    if (nodes.length === 0) return;
    setIsRunning(true);
    setLogs(['▶ Starting workflow...']);

    // Auto-save to get workflow ID
    let wfId = savedWorkflowId;
    if (!wfId) {
      setLogs((prev) => [...prev, '💾 Auto-saving before execution...']);
      wfId = await saveWorkflow();
      if (!wfId) {
        setLogs((prev) => [...prev, '❌ Cannot run: save failed']);
        setIsRunning(false);
        return;
      }
    }

    // Reset all node statuses
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: 'idle' } })));

    try {
      setLogs((prev) => [...prev, `🔗 Executing workflow ${wfId}...`]);
      const res = await fetch(`/api/workflows/${wfId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: {} }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Execute failed (${res.status})`);
      }

      const data = await res.json();
      const steps: Array<{ nodeId: string; nodeType: string; status: string; output: any; duration: number }> = data.steps || [];

      // Animate each step sequentially
      for (const step of steps) {
        // Mark node as running
        setNodes((nds) => nds.map((n) =>
          n.id === step.nodeId ? { ...n, data: { ...n.data, status: 'running' } } : n
        ));
        setLogs((prev) => [...prev, `⏳ Running: ${step.nodeType} (${step.nodeId})`]);

        // Brief delay for visual animation
        await new Promise((r) => setTimeout(r, 400));

        // Mark node as done or error
        const nodeStatus = step.status === 'error' ? 'error' : 'done';
        setNodes((nds) => nds.map((n) =>
          n.id === step.nodeId ? { ...n, data: { ...n.data, status: nodeStatus } } : n
        ));

        const icon = step.status === 'error' ? '❌' : '✅';
        const outputPreview = step.output
          ? (typeof step.output === 'object' ? JSON.stringify(step.output).slice(0, 80) : String(step.output).slice(0, 80))
          : '';
        setLogs((prev) => [...prev, `${icon} ${step.nodeType}: ${outputPreview} (${step.duration}ms)`]);
      }

      const finalStatus = data.status === 'COMPLETED' ? '🎉 Workflow completed!' : `⚠️ Workflow ${data.status}`;
      setLogs((prev) => [...prev, finalStatus]);
    } catch (e: any) {
      setLogs((prev) => [...prev, `❌ Execution error: ${e.message}`]);
    } finally {
      setIsRunning(false);
    }
  }, [nodes, setNodes, savedWorkflowId, saveWorkflow]);

  const resetStatuses = useCallback(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: 'idle' } })));
    setLogs([]);
  }, [setNodes]);

  return (
    <div className="flex h-[calc(100vh-3.5rem-4rem)] lg:h-screen">
      {/* Left: Node Palette */}
      <div className="w-14 lg:w-48 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-2 lg:p-3 border-b border-border">
          <h3 className="text-xs font-semibold hidden lg:block">节点类型</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-1.5 lg:p-2 space-y-1">
          {Object.entries(NODE_STYLES).map(([type, style]) => (
            <button
              key={type}
              onClick={() => addNode(type)}
              className="w-full flex items-center gap-2 px-2 py-1.5 lg:py-2 rounded-lg hover:bg-accent text-xs transition-colors"
              title={type}
            >
              <span className="text-sm">{style.icon}</span>
              <span className="hidden lg:inline capitalize">{type}</span>
            </button>
          ))}
        </div>
        <div className="p-1.5 lg:p-2 border-t border-border space-y-1">
          <button onClick={() => setShowNodePanel(!showNodePanel)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent text-xs">
            <span>📋</span><span className="hidden lg:inline">模板</span>
          </button>
        </div>
      </div>

      {/* Center: Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="h-10 flex items-center justify-between px-3 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-2">
            <input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="bg-transparent text-sm font-semibold border-none outline-none max-w-[200px]"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {selectedNode && (
              <button onClick={deleteSelected} className="h-7 px-2 rounded text-xs text-red-500 hover:bg-red-500/10">🗑 删除</button>
            )}
            <button onClick={resetStatuses} className="h-7 px-2 rounded text-xs hover:bg-accent">🔄 重置</button>
            <button onClick={saveWorkflow} className="h-7 px-3 rounded text-xs bg-secondary hover:bg-secondary/80">💾 保存</button>
            <button
              onClick={runWorkflow}
              disabled={isRunning || nodes.length === 0}
              className="h-7 px-3 rounded text-xs bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isRunning ? '⏳ 运行中...' : '▶ 运行'}
            </button>
          </div>
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            defaultEdgeOptions={{ animated: true, style: { strokeWidth: 2 } }}
          >
            <Controls className="!bg-card !border-border !shadow-lg" />
            <MiniMap
              className="!bg-card !border-border"
              nodeColor={(n) => {
                const type = n.data?.nodeType;
                return NODE_STYLES[type]?.bg.includes('emerald') ? '#10b981' :
                  NODE_STYLES[type]?.bg.includes('indigo') ? '#6366f1' :
                  NODE_STYLES[type]?.bg.includes('purple') ? '#a855f7' : '#6b7280';
              }}
            />
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="opacity-20" />

            {/* Template Panel */}
            {showNodePanel && (
              <Panel position="top-left" className="!m-0">
                <div className="bg-card border border-border rounded-xl shadow-xl p-3 w-64 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold">工作流模板</h4>
                    <button onClick={() => setShowNodePanel(false)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
                  </div>
                  {TEMPLATES.map((tmpl, i) => (
                    <button
                      key={i}
                      onClick={() => { loadTemplate(i); setShowNodePanel(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent text-xs transition-colors"
                    >
                      <div className="font-medium">{tmpl.name}</div>
                      <div className="text-muted-foreground mt-0.5">{tmpl.nodes.length} 个节点</div>
                    </button>
                  ))}
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>
      </div>

      {/* Right: Node Config + Logs */}
      <div className="w-64 lg:w-80 border-l border-border bg-card flex flex-col shrink-0 hidden lg:flex">
        {/* Node Config */}
        {selectedNode && (
          <div className="p-3 border-b border-border space-y-3">
            <h3 className="text-xs font-semibold flex items-center gap-2">
              <span>{NODE_STYLES[selectedNode.data.nodeType]?.icon}</span>
              节点配置
            </h3>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-muted-foreground">名称</label>
                <input
                  value={selectedNode.data.label || ''}
                  onChange={(e) => updateNodeData('label', e.target.value)}
                  className="w-full h-8 px-2 rounded border border-border bg-background text-xs mt-0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">描述</label>
                <input
                  value={selectedNode.data.description || ''}
                  onChange={(e) => updateNodeData('description', e.target.value)}
                  className="w-full h-8 px-2 rounded border border-border bg-background text-xs mt-0.5"
                />
              </div>
            </div>
          </div>
        )}

        {/* Execution Logs */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-3 py-2 border-b border-border">
            <h3 className="text-xs font-semibold">📋 执行日志</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {logs.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-8">点击运行查看日志</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-xs font-mono text-foreground/80">{log}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkflowPage() {
  return (
    <ReactFlowProvider>
      <WorkflowEditor />
    </ReactFlowProvider>
  );
}
