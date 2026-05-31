# AI Workspace OS

企业级 AI 超级工作台 — 全平台覆盖 (Web / iOS / Android / Windows / macOS / Linux)

## 功能特性

- 🤖 多模型 AI 对话 (GPT-5.5, Claude 4.8, Gemini 3.5, MiMo V2.5, DeepSeek 等)
- 🎨 AI 图片生成 (即梦 AI / Stable Diffusion)
- 🎬 AI 视频生成 (HyperFrames / MiMo)
- 🎤 AI 音频/TTS (多引擎语音合成)
- 🤖 AI Agent 工作流 (多轮推理 + Tool Calling)
- ⚡ 可视化 Workflow 编排
- 🔧 MCP (Model Context Protocol) 集成
- 📁 文件理解 / OCR / 多模态
- 🌐 中英文国际化 (i18n)
- 🔒 企业级安全 (RBAC, 2FA, WAF)
- 💰 多租户 SaaS 计费体系
- 📊 完整监控和日志
- 📱 全平台原生客户端 (iOS / Android / Desktop)

## 技术栈

### Web 端
- **前端**: Next.js 15, React 19, TailwindCSS, Framer Motion
- **后端**: Next.js API Routes, Prisma ORM
- **数据库**: PostgreSQL, Redis
- **文件存储**: MinIO / S3
- **向量数据库**: Qdrant
- **部署**: Docker, PM2, Caddy

### Android 客户端
- **语言**: Kotlin
- **UI**: Jetpack Compose (Material 3)
- **架构**: MVVM + Hilt DI

### iOS 客户端
- **语言**: Swift
- **UI**: SwiftUI
- **架构**: MVVM

### Desktop 客户端 (Windows / macOS / Linux)
- **框架**: Tauri 2 + React + Vite
- **语言**: Rust (后端) + TypeScript (前端)
- **UI**: TailwindCSS

## 快速开始

### Web 端

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

### Android

```bash
cd clients/android
# 用 Android Studio 打开，或：
./gradlew assembleDebug
```

### iOS

```bash
cd clients/ios
open AiOS.xcodeproj
# Xcode 构建运行
```

### Desktop (Tauri)

```bash
cd clients/desktop
npm install
npm run tauri dev
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
aios/
├── src/                    # Web 端源码
│   ├── app/                # Next.js App Router
│   │   ├── (auth)/         # 认证页面 (登录/注册)
│   │   ├── (dashboard)/    # 工作台页面
│   │   └── api/            # API 路由
│   ├── components/         # React 组件
│   ├── lib/                # 核心库
│   │   ├── ai/             # AI Gateway (多模型路由)
│   │   ├── auth/           # 认证系统
│   │   ├── db/             # 数据库
│   │   ├── i18n/           # 国际化
│   │   ├── mail/           # 邮件系统
│   │   ├── security/       # 安全模块
│   │   └── billing/        # 计费系统
│   ├── store/              # Zustand 状态管理
│   ├── hooks/              # React Hooks
│   └── types/              # TypeScript 类型
├── clients/                # 全平台客户端
│   ├── android/            # Android (Kotlin + Compose)
│   ├── ios/                # iOS (SwiftUI)
│   └── desktop/            # Desktop (Tauri 2 + React)
├── messages/               # i18n 消息文件
│   ├── zh-CN/
│   └── en-US/
├── prisma/                 # 数据库 Schema
├── docker-compose.yml
└── Dockerfile
```

## API 文档

Web 端 API 统一入口: `https://aios.vios.top/api/*`

客户端 SDK 使用同一套 API，所有端共享同一后端。

## License

Private - AIOS (aios.vios.top) © 2026
