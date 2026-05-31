'use client';

import Link from 'next/link';
import { useState } from 'react';

const FEATURES: {
  icon: string;
  title: string;
  desc: string;
  demo: Record<string, any>;
}[] = [
  {
    icon: '💬',
    title: 'AI 对话',
    desc: '多模型切换、流式输出、Markdown 渲染、代码高亮',
    demo: {
      type: 'chat',
      messages: [
        { role: 'user', content: '用 Python 写一个快速排序算法' },
        { role: 'assistant', content: `好的，这是一个 Python 快速排序实现：

\`\`\`python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

# 示例
print(quicksort([3, 6, 8, 10, 1, 2, 1]))
# 输出: [1, 1, 2, 3, 6, 8, 10]
\`\`\`

**时间复杂度**: 平均 O(n log n)，最坏 O(n²)` },
      ],
    },
  },
  {
    icon: '🎨',
    title: 'AI 绘图',
    desc: '图片理解 + 文本生成图片',
    demo: {
      type: 'image',
      prompt: '一只可爱的橘猫坐在窗台上，阳光洒进来',
    },
  },
  {
    icon: '🤖',
    title: 'AI 智能体',
    desc: '内置多种 Agent，支持工具调用',
    demo: {
      type: 'agent',
      agents: [
        { icon: '🔍', name: 'Web Search', desc: '搜索互联网获取最新信息' },
        { icon: '💻', name: 'Code Interpreter', desc: '编写和执行代码' },
        { icon: '📊', name: 'Data Analyst', desc: '分析数据集生成报告' },
        { icon: '📄', name: 'File Reader', desc: '读取和解析各种文件' },
      ],
    },
  },
  {
    icon: '⚡',
    title: '工作流编排',
    desc: '可视化拖拽编排 AI 工作流',
    demo: {
      type: 'workflow',
      nodes: [
        { icon: '📥', label: '输入', x: 50, y: 20 },
        { icon: '🧠', label: 'LLM 处理', x: 50, y: 80 },
        { icon: '🔄', label: '格式化', x: 50, y: 140 },
        { icon: '📤', label: '输出', x: 50, y: 200 },
      ],
    },
  },
  {
    icon: '🔌',
    title: 'API 开放平台',
    desc: 'OpenAI 兼容接口，支持第三方集成',
    demo: {
      type: 'api',
      code: `curl -X POST https://aios.vios.top/v1/chat/completions \\
  -H "Authorization: Bearer sk-..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "mimo-v2.5-pro",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "stream": true
  }'`,
    },
  },
];

function ChatDemo({ messages }: { messages: { role: string; content: string }[] }) {
  return (
    <div className="space-y-3 p-4 bg-background rounded-lg border border-border max-h-64 overflow-y-auto">
      {messages.map((m, i) => (
        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
            m.role === 'user'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted border border-border'
          }`}>
            <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
          </div>
        </div>
      ))}
    </div>
  );
}

function AgentDemo({ agents }: { agents: { icon: string; name: string; desc: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 p-4 bg-background rounded-lg border border-border">
      {agents.map((a, i) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border">
          <span className="text-lg">{a.icon}</span>
          <div>
            <div className="text-xs font-medium">{a.name}</div>
            <div className="text-[10px] text-muted-foreground">{a.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function WorkflowDemo({ nodes }: { nodes: { icon: string; label: string; x: number; y: number }[] }) {
  return (
    <div className="p-4 bg-background rounded-lg border border-border flex flex-col items-center gap-0">
      {nodes.map((n, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border text-xs">
            <span>{n.icon}</span>
            <span className="font-medium">{n.label}</span>
          </div>
          {i < nodes.length - 1 && (
            <div className="w-px h-4 bg-border" />
          )}
        </div>
      ))}
    </div>
  );
}

function ApiDemo({ code }: { code: string }) {
  return (
    <pre className="p-4 bg-background rounded-lg border border-border text-xs font-mono overflow-x-auto whitespace-pre leading-relaxed">{code}</pre>
  );
}

function ImageDemo({ prompt }: { prompt: string }) {
  return (
    <div className="p-4 bg-background rounded-lg border border-border text-center">
      <div className="w-20 h-20 mx-auto mb-3 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-3xl">🎨</div>
      <p className="text-xs text-muted-foreground mb-2">提示词：</p>
      <p className="text-sm font-medium">{prompt}</p>
      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        生成中...
      </div>
    </div>
  );
}

export default function DemoPage() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-sm">
            <img src="/icons/icon-192.png" alt="AIOS" className="w-7 h-7 rounded-lg object-cover" />
            AI 工作台
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">登录</Link>
            <Link href="/register" className="text-sm px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">注册</Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-3">🎬 功能演示</h1>
          <p className="text-muted-foreground">探索 AI 工作台的核心功能</p>
        </div>

        {/* Feature tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 justify-center">
          {FEATURES.map((f, i) => (
            <button
              key={i}
              onClick={() => setActiveFeature(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
                activeFeature === i
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <span>{f.icon}</span>
              <span>{f.title}</span>
            </button>
          ))}
        </div>

        {/* Active feature */}
        {FEATURES.map((f, i) => (
          i === activeFeature && (
            <div key={i} className="space-y-6">
              <div className="text-center">
                <div className="text-4xl mb-3">{f.icon}</div>
                <h2 className="text-xl font-bold mb-2">{f.title}</h2>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>

              {/* Demo content */}
              <div className="rounded-2xl border border-border bg-card p-6">
                {f.demo.type === 'chat' && <ChatDemo messages={(f.demo as any).messages || []} />}
                {f.demo.type === 'agent' && <AgentDemo agents={(f.demo.agents || [])} />}
                {f.demo.type === 'workflow' && <WorkflowDemo nodes={(f.demo.nodes || [])} />}
                {f.demo.type === 'api' && <ApiDemo code={(f.demo.code || "")} />}
                {f.demo.type === 'image' && <ImageDemo prompt={(f.demo.prompt || "")} />}
              </div>

              {/* CTA */}
              <div className="text-center">
                <Link
                  href="/register"
                  className="inline-flex px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
                >
                  立即体验 →
                </Link>
              </div>
            </div>
          )
        ))}

        {/* All features grid */}
        <div className="mt-16">
          <h2 className="text-lg font-bold text-center mb-8">全部功能</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: '💬', name: 'AI 对话', desc: '多模型对话' },
              { icon: '🎨', name: 'AI 绘图', desc: '图片理解与生成' },
              { icon: '🎬', name: 'AI 视频', desc: '视频分析' },
              { icon: '🎤', name: 'AI 音频', desc: '音频转写' },
              { icon: '🤖', name: 'AI 智能体', desc: '工具调用' },
              { icon: '⚡', name: '工作流', desc: '可视化编排' },
              { icon: '💻', name: '代码工作台', desc: '在线编程' },
              { icon: '📁', name: '文件管理', desc: '文件上传管理' },
              { icon: '📚', name: '知识库', desc: 'RAG 检索增强' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all cursor-pointer">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <div className="text-sm font-medium">{f.name}</div>
                  <div className="text-xs text-muted-foreground">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back */}
        <div className="mt-12 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
