'use client';

import Link from 'next/link';
import { useState } from 'react';

const SECTIONS = [
  {
    id: 'quickstart',
    icon: '🚀',
    title: '快速开始',
    content: [
      {
        heading: '注册账号',
        text: '访问 aios.vios.top/register 注册账号，完成邮箱验证后即可使用。',
      },
      {
        heading: '选择模型',
        text: '进入 AI 对话页面，从模型选择器中选择可用的模型（如 MiMo v2.5 Pro、DeepSeek V3 等）。',
      },
      {
        heading: '开始对话',
        text: '在输入框中输入问题，支持 Markdown 渲染、代码高亮、LaTeX 公式等。',
      },
    ],
  },
  {
    id: 'models',
    icon: '🧠',
    title: '可用模型',
    content: [
      {
        heading: 'Xiaomi MiMo',
        text: 'MiMo v2.5 Pro / v2.5 / v2 Omni — 小米自研大模型，支持中文对话、推理、多模态。',
      },
      {
        heading: 'Volcengine Ark',
        text: 'DeepSeek V3/V4、Doubao Seed 系列、GLM-4 — 火山引擎托管的多种模型。',
      },
      {
        heading: 'OpenAI 兼容接口',
        text: '所有模型通过 OpenAI 兼容的 /v1/chat/completions 接口调用，支持流式输出。',
      },
    ],
  },
  {
    id: 'api',
    icon: '🔌',
    title: 'API 接口',
    content: [
      {
        heading: '认证方式',
        code: 'Authorization: Bearer <your-api-key>',
      },
      {
        heading: '对话接口',
        code: `POST /v1/chat/completions
{
  "model": "mimo-v2.5-pro",
  "messages": [{"role": "user", "content": "Hello"}],
  "stream": true
}`,
      },
      {
        heading: '模型列表',
        code: 'GET /v1/models',
      },
      {
        heading: '获取 API Key',
        text: '登录后进入 API 平台页面，创建 API Key 并妥善保存。',
      },
    ],
  },
  {
    id: 'features',
    icon: '✨',
    title: '功能特性',
    content: [
      {
        heading: 'AI 对话',
        text: '支持多轮对话、Markdown 渲染、代码高亮、LaTeX 公式、流式输出。',
      },
      {
        heading: 'AI 绘图',
        text: '图片理解（上传图片 + 提问）和图片生成（文本描述 → 图片）。',
      },
      {
        heading: 'AI 智能体',
        text: '内置 Web Search、Code Interpreter、Data Analyst、File Reader 等 Agent。',
      },
      {
        heading: '工作流',
        text: '可视化编排 AI 工作流，支持 LLM、代码执行、HTTP 请求、条件分支等节点。',
      },
      {
        heading: '知识库',
        text: '上传文档进行分块存储，支持 RAG 检索增强生成。',
      },
      {
        heading: 'API 开放平台',
        text: '提供 OpenAI 兼容接口，支持第三方应用集成。',
      },
    ],
  },
  {
    id: 'faq',
    icon: '❓',
    title: '常见问题',
    content: [
      {
        heading: '模型调用报 401 错误',
        text: '检查 API Key 是否有效，或在管理后台确认 Key 状态为 ACTIVE。',
      },
      {
        heading: '流式输出中断',
        text: '检查网络连接，或尝试切换模型。部分模型可能因限流导致中断。',
      },
      {
        heading: '如何切换语言？',
        text: '页面右上角或侧边栏底部有语言切换按钮，支持中文/英文。',
      },
      {
        heading: '移动端如何使用？',
        text: '直接在手机浏览器访问即可，支持响应式布局和底部导航。',
      },
    ],
  },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('quickstart');

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-sm">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">A</div>
            AI 工作台
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">登录</Link>
            <Link href="/register" className="text-sm px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">注册</Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-8">
        {/* Sidebar nav */}
        <nav className="hidden md:block w-48 shrink-0 sticky top-20 self-start">
          <div className="space-y-1">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left ${
                  activeSection === s.id
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <span>{s.icon}</span>
                <span>{s.title}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {/* Mobile section selector */}
          <div className="md:hidden mb-6 flex gap-2 overflow-x-auto pb-2">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                  activeSection === s.id
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border text-muted-foreground'
                }`}
              >
                <span>{s.icon}</span>
                <span>{s.title}</span>
              </button>
            ))}
          </div>

          {SECTIONS.filter(s => s.id === activeSection).map(section => (
            <div key={section.id} className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold mb-2">{section.icon} {section.title}</h1>
                <div className="h-1 w-16 bg-primary rounded-full" />
              </div>

              {section.content.map((item, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <h2 className="text-sm font-semibold">{item.heading}</h2>
                  {item.text && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                  )}
                  {item.code && (
                    <pre className="bg-background rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre border border-border">{item.code}</pre>
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* Back to home */}
          <div className="mt-12 pt-6 border-t border-border">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← 返回首页
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
