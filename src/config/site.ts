// ============================================================
// AI Workspace OS - 站点配置
// 所有页面/组件从此处读取站点信息
// ============================================================

export const siteConfig = {
  name: 'AI 工作台',
  nameEn: 'AI Workspace OS',
  description: '企业级 AI 超级工作台 — Agent First · Workflow First · MCP Native',
  descriptionEn: 'Enterprise AI Super Workspace — Agent First · Workflow First · MCP Native',

  // 版本信息 — 每次改动必须更新
  version: '0.0.2-00A',
  versionDate: '2026-05-30',
  versionPhase: 'Phase 1: UI 重设计 + 响应式布局',

  // 域名
  url: 'https://aios.allapple.top',
  betaUrl: 'https://beta-aios.allapple.top',

  // 公司信息
  company: 'All Apple',
  author: 'Everett',
  github: 'https://github.com/xiaopengsvip',

  // 功能标志
  features: {
    agent: false,       // Agent Runtime — Phase 3
    mcp: false,         // MCP Runtime — Phase 3
    workflow: false,    // Workflow Runtime — Phase 4
    knowledge: false,   // Knowledge Base — Phase 4
    coding: false,      // AI Coding — Phase 4
    marketplace: false, // Marketplace — Phase 5
    credit: false,      // Credit System — Phase 5
    multiTenant: false, // SaaS 多租户 — Phase 5
  },

  // 支持的语言
  locales: ['zh-CN', 'en-US'] as const,
  defaultLocale: 'zh-CN' as const,
} as const;

export type SiteConfig = typeof siteConfig;
