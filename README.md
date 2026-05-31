# AI Workspace OS

企业级 AI 超级工作台

## 功能特性

- 🤖 多模型 AI 对话 (GPT-4o, Claude 4, Gemini 2.5, DeepSeek, Qwen 等)
- 🎨 AI 图片生成
- 🎬 AI 视频生成
- 🎤 AI 音频/TTS
- 🤖 AI Agent 工作流
- ⚡ 可视化 Workflow 编排
- 🔧 Tool Calling / MCP
- 📁 文件理解 / OCR
- 🌐 中英文国际化
- 🔒 企业级安全 (RBAC, 2FA, WAF)
- 💰 多租户 SaaS 计费体系
- 📊 完整监控和日志

## 技术栈

- **前端**: Next.js 15, React 19, TailwindCSS, Framer Motion
- **后端**: Next.js API Routes, Prisma ORM
- **数据库**: PostgreSQL, Redis
- **文件存储**: MinIO / S3
- **向量数据库**: Qdrant
- **部署**: Docker, PM2, Caddy

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入数据库和 API 配置

# 初始化数据库
npx prisma migrate dev
npx prisma db seed

# 启动开发服务器
npm run dev
```

## 部署

```bash
# Docker Compose
docker-compose up -d

# 或 PM2
npm run build
pm2 start ecosystem.config.js --env production
```

## 项目结构

```
aios.allapple.top/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (auth)/       # 认证页面 (登录/注册)
│   │   ├── (dashboard)/  # 工作台页面
│   │   └── api/          # API 路由
│   ├── components/       # React 组件
│   ├── lib/              # 核心库
│   │   ├── ai/           # AI Gateway
│   │   ├── auth/         # 认证系统
│   │   ├── db/           # 数据库
│   │   ├── i18n/         # 国际化
│   │   ├── mail/         # 邮件系统
│   │   ├── security/     # 安全模块
│   │   └── billing/      # 计费系统
│   ├── store/            # Zustand 状态管理
│   ├── hooks/            # React Hooks
│   └── types/            # TypeScript 类型
├── messages/             # i18n 消息文件
│   ├── zh-CN/
│   └── en-US/
├── prisma/               # 数据库 Schema
├── docker-compose.yml
└── Dockerfile
```

## License

Private - All Apple © 2026
