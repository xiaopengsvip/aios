// Prisma Seed - 初始化默认数据
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. 创建默认管理员
  const defaultAdminPassword = process.env.ADMIN_PASSWORD || 'changeme';
  const adminPassword = await bcrypt.hash(defaultAdminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@allapple.top',
      passwordHash: adminPassword,
      role: 'SUPER_ADMIN',
      displayName: '系统管理员',
      emailVerifiedAt: new Date(),
      locale: 'zh-CN',
    },
  });
  console.log(`✅ Admin user: ${admin.username} (${admin.email})`);

  // 2. 创建默认 Providers (只添加不存在的)
  const providers = [
    { name: 'OpenAI', type: 'OPENAI', baseUrl: 'https://api.openai.com' },
    { name: 'Anthropic', type: 'ANTHROPIC', baseUrl: 'https://api.anthropic.com' },
    { name: 'DeepSeek', type: 'DEEPSEEK', baseUrl: 'https://api.deepseek.com' },
    { name: 'Qwen', type: 'QWEN', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode' },
    { name: 'Google Gemini', type: 'GOOGLE', baseUrl: 'https://generativelanguage.googleapis.com' },
    { name: 'xAI Grok', type: 'XAI', baseUrl: 'https://api.x.ai' },
    { name: 'GLM', type: 'GLM', baseUrl: 'https://open.bigmodel.cn/api/paas' },
    { name: 'Kimi', type: 'KIMI', baseUrl: 'https://api.moonshot.cn' },
    { name: 'MiniMax', type: 'MINIMAX', baseUrl: 'https://api.minimax.chat' },
    { name: 'OpenRouter', type: 'OPENROUTER', baseUrl: 'https://openrouter.ai/api' },
    { name: 'SiliconFlow', type: 'SILICONFLOW', baseUrl: 'https://api.siliconflow.cn' },
    { name: 'Ollama Local', type: 'OLLAMA', baseUrl: 'http://localhost:11434' },
  ];

  let created = 0;
  for (const p of providers) {
    const existing = await prisma.provider.findFirst({ where: { type: p.type as any } });
    if (!existing) {
      await prisma.provider.create({
        data: { name: p.name, type: p.type as any, baseUrl: p.baseUrl },
      });
      created++;
    }
  }
  console.log(`✅ ${created} new providers created (${providers.length - created} already existed)`);

  // 3. 创建默认模型
  const models = [
    { name: 'gpt-4o', providerType: 'OPENAI', type: 'CHAT', context: 128000, input: 2.5, output: 10 },
    { name: 'gpt-4o-mini', providerType: 'OPENAI', type: 'CHAT', context: 128000, input: 0.15, output: 0.6 },
    { name: 'claude-sonnet-4-20250514', providerType: 'ANTHROPIC', type: 'CHAT', context: 200000, input: 3, output: 15 },
    { name: 'claude-3-5-haiku-20241022', providerType: 'ANTHROPIC', type: 'CHAT', context: 200000, input: 0.8, output: 4 },
    { name: 'deepseek-chat', providerType: 'DEEPSEEK', type: 'CHAT', context: 64000, input: 0.14, output: 0.28 },
    { name: 'deepseek-reasoner', providerType: 'DEEPSEEK', type: 'CHAT', context: 64000, input: 0.55, output: 2.19 },
    { name: 'qwen-max', providerType: 'QWEN', type: 'CHAT', context: 32000, input: 2.4, output: 9.6 },
    { name: 'gemini-2.5-pro', providerType: 'GOOGLE', type: 'CHAT', context: 1000000, input: 1.25, output: 10 },
    { name: 'grok-3', providerType: 'XAI', type: 'CHAT', context: 131072, input: 3, output: 15 },
    { name: 'glm-4-plus', providerType: 'GLM', type: 'CHAT', context: 128000, input: 0.5, output: 0.5 },
    { name: 'moonshot-v1-128k', providerType: 'KIMI', type: 'CHAT', context: 128000, input: 0.6, output: 0.6 },
  ];

  for (const m of models) {
    const provider = await prisma.provider.findFirst({
      where: { type: m.providerType as any },
    });
    if (provider) {
      await prisma.model.upsert({
        where: { providerId_name: { providerId: provider.id, name: m.name } },
        update: {},
        create: {
          name: m.name,
          displayName: { 'zh-CN': m.name, 'en-US': m.name },
          providerId: provider.id,
          type: m.type as any,
          contextWindow: m.context,
          inputPrice: m.input,
          outputPrice: m.output,
        },
      });
    }
  }
  console.log(`✅ ${models.length} models created`);

  // 4. 创建系统配置
  const configs = [
    { key: 'app.name', value: { 'zh-CN': 'AI 工作台', 'en-US': 'AI Workspace OS' } },
    { key: 'app.version', value: '0.1.0' },
    { key: 'billing.currency', value: 'CNY' },
    { key: 'billing.min_topup', value: 10 },
    { key: 'auth.max_login_attempts', value: 5 },
    { key: 'auth.lockout_minutes', value: 15 },
    { key: 'chat.max_context_messages', value: 50 },
    { key: 'chat.default_temperature', value: 0.7 },
  ];

  for (const c of configs) {
    await prisma.systemConfig.upsert({
      where: { key: c.key },
      update: {},
      create: c,
    });
  }
  console.log(`✅ ${configs.length} system configs created`);

  // 5. 创建内置提示词
  const prompts = [
    {
      title: { 'zh-CN': '通用助手', 'en-US': 'General Assistant' },
      content: { 'zh-CN': '你是一个有用的AI助手，请用中文回答问题。', 'en-US': 'You are a helpful AI assistant.' },
      category: 'general',
      isBuiltin: true,
      isPublic: true,
    },
    {
      title: { 'zh-CN': '代码助手', 'en-US': 'Code Assistant' },
      content: { 'zh-CN': '你是一个专业的编程助手，擅长各种编程语言。请提供清晰、高效的代码解决方案。', 'en-US': 'You are a professional coding assistant. Provide clear, efficient code solutions.' },
      category: 'coding',
      isBuiltin: true,
      isPublic: true,
    },
    {
      title: { 'zh-CN': '翻译助手', 'en-US': 'Translation Assistant' },
      content: { 'zh-CN': '你是一个专业的翻译助手，精通中英双语。翻译时保持原文的语义和风格。', 'en-US': 'You are a professional translator fluent in Chinese and English.' },
      category: 'translation',
      isBuiltin: true,
      isPublic: true,
    },
  ];

  for (const p of prompts) {
    await prisma.prompt.create({ data: p as any });
  }
  console.log(`✅ ${prompts.length} built-in prompts created`);

  // 5. 初始化网站配置 (单例)
  await prisma.siteConfig.upsert({
    where: { id: 'site' },
    update: {},
    create: {
      id: 'site',
      siteName: 'AI 工作台',
      siteNameEn: 'AI Workspace OS',
      siteIcon: 'A',
      copyright: '© 2026 AIOS',
      copyrightEn: '© 2026 AIOS',
    },
  });
  console.log('✅ SiteConfig initialized');

  // 6. 创建默认静态页面
  const pages = [
    { slug: 'about', title: '关于我们', titleEn: 'About Us', content: '# 关于我们\n\nAI 工作台是一个企业级 AI 超级工作台，提供多模型对话、智能体、工作流编排等功能。', contentEn: '# About Us\n\nAI Workspace OS is an enterprise-grade AI platform.' },
    { slug: 'privacy', title: '隐私政策', titleEn: 'Privacy Policy', content: '# 隐私政策\n\n我们重视您的隐私。本页面内容可由管理员在后台编辑。', contentEn: '# Privacy Policy\n\nWe value your privacy. This content can be edited by admin.' },
    { slug: 'terms', title: '服务条款', titleEn: 'Terms of Service', content: '# 服务条款\n\n使用本平台即表示您同意以下条款。本页面内容可由管理员在后台编辑。', contentEn: '# Terms of Service\n\nBy using this platform, you agree to these terms.' },
    { slug: 'security', title: '安全说明', titleEn: 'Security', content: '# 安全说明\n\n我们采取多种安全措施保护您的数据。本页面内容可由管理员在后台编辑。', contentEn: '# Security\n\nWe take multiple security measures to protect your data.' },
    { slug: 'pricing', title: '定价方案', titleEn: 'Pricing', content: '# 定价方案\n\n我们提供灵活的定价方案。本页面内容可由管理员在后台编辑。', contentEn: '# Pricing\n\nWe offer flexible pricing plans.' },
    { slug: 'careers', title: '加入我们', titleEn: 'Careers', content: '# 加入我们\n\n我们正在寻找优秀的人才。本页面内容可由管理员在后台编辑。', contentEn: '# Careers\n\nWe are looking for talented people.' },
    { slug: 'contact', title: '联系我们', titleEn: 'Contact', content: '# 联系我们\n\n如有问题，请联系我们。本页面内容可由管理员在后台编辑。', contentEn: '# Contact\n\nIf you have any questions, please contact us.' },
  ];

  for (const p of pages) {
    await prisma.staticPage.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }
  console.log(`✅ ${pages.length} static pages created`);

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
