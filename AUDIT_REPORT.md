# AIOS 项目全面审计报告

> 审计时间：2026-06-02
> 审计范围：全平台源码（Web / Qt / Android / iOS / Desktop）
> 状态：已逐文件读完所有关键代码

---

## 一、项目概况

| 项目 | 值 |
|------|-----|
| 仓库 | aios-repo (本地 Git) |
| 最新提交 | fc54731 fix(android): preload system OpenSSL |
| 工作目录 | 干净（无未提交改动） |
| 版本 | 0.0.8 (Web) / 0.1.2 (Qt) |

## 二、全平台规模

| 平台 | 语言 | 框架 | 文件数 | 代码行数 | 状态 |
|------|------|------|--------|---------|------|
| Web | TS/TSX | Next.js 15 + React 19 + Prisma | 172 | 24,878 | ✅ 完整 |
| Qt (Win/Android) | QML + C++ | Qt 6.11 | 77 | ~3,000 | ✅ 可编译 |
| Android 原生 | Kotlin | Jetpack Compose + Hilt | 70 | ~50KB | ✅ 完整 |
| iOS | Swift | SwiftUI | 27 | ~15KB | ⚠ 基础框架 |
| Desktop | TS + Rust | Tauri 2 + React | 50 | ~30KB | ⚠ 已废弃 |

---

## 三、Web 端审计

### 3.1 数据库 (Prisma Schema - 27KB)

**20+ 数据模型，非常完整：**

- User（含数字账号、OAuth、2FA、财务字段）
- OAuthAccount (GitHub/Google/X)
- Tenant（多租户 SaaS）
- RoleDefinition（动态 RBAC）
- Provider + ApiKey + Model（AI Provider 管理）
- Conversation + Message（对话持久化）
- File, KnowledgeBase, Agent, Workflow
- Transaction, Payment, AuditLog
- SystemConfig, EmailVerification, AccountSequence
- UsernameHistory（改名冻结期 90 天）

**枚举定义完整：** UserRole, UserStatus, ProviderType, ModelType, KeyStatus, ConversationRole, MessageStatus, TaskStatus, PaymentStatus, AuditAction

### 3.2 后端 API (40+ 路由)

**认证系统 (lib/auth/)：**
- JWT (access + refresh token)
- bcrypt 密码哈希（12 轮）
- 支持 cookie 和 Bearer header（兼容桌面/移动客户端）
- 登录失败锁定（5 次→锁定）
- OAuth 回调 (GitHub/Google/X)
- 邮箱验证码注册
- 数字账号自动分配（5 位起）

**AI 网关 (lib/ai/)：**
- 熔断机制：5 次连续失败→熔断 5 分钟→自动恢复
- Key 池权重轮询
- 6 个 Provider 适配器：OpenAI, Anthropic, Google, DeepSeek, Xiaomi, 基类
- 流式 SSE 支持
- Guest RPM 限制（10/分钟，内存实现）

**API 路由分类：**
- 认证：16 个接口（login/register/oauth/profile/change-password 等）
- 管理：12 个接口（admin/users/roles/models/providers/keys/logs 等）
- 功能：chat/stream, images/generate, video/generate, audio/generate, code/execute
- 知识库：knowledge/search
- OpenAI 兼容：/v1/chat/completions, /v1/models
- MCP 服务、工作流、应用市场

### 3.3 前端页面

**认证页面：** login, register, register/complete, forgot-password

**功能页面 (17 个)：**
- chat (34KB - 最大), image (26KB), video (21KB), audio (21KB)
- files (21KB), workflow (20KB), agent (25KB), settings (31KB)
- code, knowledge, search, marketplace, prompts, usage, credits, api-platform

**管理后台 (12 个)：**
- users, roles, models, providers, keys, logs, settings, pages, tenants, billing, installs, monitor

**组件：**
- Sidebar.tsx (27KB - 最大组件)
- ChatInput, ChatMessage, ModelSelector
- 20 个 UI 基础组件 (Button, Card, Modal, Table, Toast 等)

### 3.4 Web 端问题

| # | 严重度 | 问题 |
|---|--------|------|
| 1 | ⚠ | Xiaomi 适配器用 `api-key` header，小米文档要求 `Authorization: Bearer` |
| 2 | ⚠ | Xiaomi models() 只返回 2 个模型，缺少 mimo-v2.5, mimo-v2-pro 等 |
| 3 | ⚠ | Guest RPM 内存实现，重启丢失 |
| 4 | ⚠ | Sidebar.tsx 27KB 太大，应拆分 |
| 5 | ⚠ | chat/page.tsx 34KB 太大 |

---

## 四、Qt 客户端审计 (Win/Android)

### 4.1 C++ 源码 (8 文件)

**main.cpp (61行) ✅**
- Qt 6.8+, Basic 样式, Android OpenSSL 预加载
- baseUrl 硬编码为 https://aios.vios.top
- ⚠ baseUrl 不可配置

**apimanager.h/cpp (82+374行) ✅**
- get/post/put/del 全有 30s 超时
- streamChat 有 120s 超时 + readyRead 流式
- connected 属性在 checkNetwork() 中正确设置
- errorOccurred 信号在 6 处 emit
- OAuth 本地 TCP 服务器 (18000-18100)
- 代理：系统/直连/自定义 HTTP/SOCKS5
- ⚠ 无请求重试机制
- ⚠ 无并发请求队列管理

**authmanager.h/cpp (57+194行) ✅**
- requestId 分发（不再 disconnect，修复了之前的 bug）
- OAuth code exchange 完整
- QSettings 持久化 token+user
- ⚠ token 过期无处理
- ⚠ registerUser 不自动登录

**storemanager.h/cpp (43+88行) ✅**
- 持久化：模型/语言/主题/对话
- 对话上限 200 条
- ⚠ 默认模型写死 mimo-v2.5-pro

**logger.h (40行) ❌ 死代码**
- 声明了 Logger 类但没有 .cpp 实现
- 没有在 CMakeLists.txt 中编译
- → 直接删除

### 4.2 QML 组件层 (8 文件)

**TopBar.qml (77行) ✅**
- 显示页面标题（17 个页面名映射）
- 模型选择器（只显示，没有下拉）
- 用户头像首字母

**Sidebar.qml (234行) ✅ 设计精良**
- 7 个分类图标，纯图标导航
- 30+ 子项定义
- 底部：用量/充值/设置

**SubSidebar.qml (210行) ✅**
- 子菜单展开/收起，200ms 动画
- 折叠模式 48px / 展开 180px

**Theme.qml (62行) ✅**
- 浅色/深色完整切换（14 个颜色 token）
- 中英文 i18n：t(zh, en)
- spacing/radius/font token 齐全

**5 个空壳组件（未使用）：**
- ChatInput.qml (295B), ChatMessage.qml (292B), ModelSelector.qml (295B)
- Card.qml (818B), Loading.qml (289B)
- → CMakeLists 中注册了但没被任何页面引用

### 4.3 QML 功能页面 (39 文件)

**真实页面（6 个）：**

| 文件 | 大小 | 功能 |
|------|------|------|
| Login.qml | 20KB | 登录（含 OAuth 4 个） |
| Register.qml | 19KB | 注册 |
| ForgotPassword.qml | 16KB | 忘记密码 |
| Chat.qml | 12KB | 流式消息 + 附件 + 文件选择 |
| Settings.qml | 20KB | 主题/代理/语言/模型/账号 |
| Welcome.qml | 4KB | 8 个功能卡片网格 |

**桩页面（33 个，全部 ~950B）：**
AiSearch, AiPpt, AiPodcast, AiWriting, AiTranslate, AiCode, LocalModel, Contacts, Sheet, Favorites, Notes, Calendar, Email, Todo, Kanban, LocalFiles, TeamKnowledge, Cron, Mcp, Agent, ApiPlatform, Audio, Code, Credits, Files, ImagePage, Knowledge, Marketplace, Prompts, Search, Usage, Video, Workflow
→ 全部只显示图标+标题+"功能即将上线"

### 4.4 Main.qml 页面路由问题

Sidebar 定义了 30+ 个可点击页面，但 Main.qml pageLoader 只映射了 17 个：

```
welcome, chat, image, video, audio, code, files,
knowledge, workflow, marketplace, prompts, search,
agent, settings, usage, credits, api-platform
```

**未映射的页面（点击 fallback 到 welcome）：**
ai-search, ai-ppt, ai-podcast, ai-writing, ai-translate, ai-code, local-model, contacts, sheet, favorites, notes, calendar, email, todo, kanban, local-files, team-knowledge, cron, mcp

### 4.5 CMakeLists.txt

- 48 个 QML 文件全部注册 ✅
- logger.h 没有编译（正确）✅
- 5 个空壳组件注册了但没用 ⚠
- 资源包含 1.3MB app-icon.png + 1.8MB×2 开屏图 ⚠

### 4.6 Qt 端问题

| # | 严重度 | 问题 |
|---|--------|------|
| 1 | ❌ | logger.h 死代码，无实现 |
| 2 | ⚠ | 5 个空壳组件注册但未使用 |
| 3 | ⚠ | app-icon.png 1.3MB 太大 |
| 4 | ⚠ | 开屏图 1.8MB×2 太大 |
| 5 | ⚠ | Main.qml 缺少 19 个页面路由映射 |
| 6 | ⚠ | baseUrl 硬编码 |
| 7 | ⚠ | 默认模型写死 mimo-v2.5-pro |
| 8 | ⚠ | TopBar 模型选择器没有下拉功能 |
| 9 | ⚠ | 无请求重试机制 |
| 10 | ⚠ | token 过期无处理 |

---

## 五、Android 原生客户端审计

**架构：** Kotlin + Jetpack Compose + Hilt DI + Material 3

**核心模块：**
- MainActivity.kt (14KB) — 主 Activity
- core/network/ApiService (8KB) — API 接口
- core/network/SseClient (5.5KB) — SSE 流式
- core/auth/AuthManager + OAuthManager — 认证
- core/navigation/Screen — 导航路由
- core/update/UpdateManager — 热更新
- data/repository/ — Chat, Auth, Agent Repository

**功能页面（19 个）：**
ChatScreen, LoginScreen, RegisterScreen, ForgotPasswordScreen, ImageScreen, VideoScreen, AudioScreen, AgentScreen, CodeScreen, FilesScreen, KnowledgeScreen, WorkflowScreen, MarketplaceScreen, PromptsScreen, SearchScreen, SettingsScreen, UsageScreen, CreditsScreen, ApiPlatformScreen, WebViewScreen

**问题：**
- ⚠ splash 图片 5 个尺寸总计 7MB 太大
- ⚠ MainActivity 14KB 太大

---

## 六、iOS 客户端审计

**架构：** Swift + SwiftUI（无 MVVM）

**核心：**
- APIClient.swift (5KB) — 网络层
- AuthManager.swift (1KB) — 认证
- DataModels.swift (1.6KB) — 数据模型

**功能页面（15 个）：**
ChatView, LoginView, ImageGenerationView, VideoGenerationView, AudioGenerationView, AgentView, FilesView, KnowledgeView, WorkflowView, MarketplaceView, PromptsView, SearchView, SettingsView, UsageView, CreditsView

**问题：**
- ⚠ 无 MVVM 架构（直接在 View 里调 API）
- ⚠ APIClient 5KB 相对简单
- ⚠ splash.png 1.8MB 太大

---

## 七、Desktop (Tauri) 客户端审计

**状态：已被 Qt 客户端替代，代码可能过时**

**前端：** React + TailwindCSS + i18n
**后端：** Rust (lib.rs 772B，很轻量)
**功能页面：** 19 个（与 Qt 端对齐）

**问题：**
- ⚠ 已废弃，建议标记 deprecated 或删除
- ⚠ splash.html 2.6MB + splash.png 1.9MB 太大
- ⚠ icon.icns 1.5MB 太大

---

## 八、全平台资源文件问题

| 文件 | 平台 | 大小 | 建议 |
|------|------|------|------|
| app-icon.png | Qt | 1.3MB | 压缩到 200KB |
| splash-pc.png | Qt | 1.9MB | 压缩到 300KB |
| splash-mobile.png | Qt | 1.8MB | 压缩到 300KB |
| splash.png | iOS | 1.8MB | 压缩到 300KB |
| splash.png (xxhdpi) | Android | 2.1MB | 压缩到 500KB |
| splash.png (xxxhdpi) | Android | 3.1MB | 压缩到 800KB |
| splash.html | Desktop | 2.6MB | 删除或压缩 |
| splash.png | Desktop | 1.9MB | 删除或压缩 |
| icon.icns | Desktop | 1.5MB | 压缩到 200KB |
| **总计** | | **~18MB** | **→ ~3MB** |

---

## 九、README 问题

当前 README 写的 Desktop 技术栈是 **Tauri 2 + React + Rust**，但实际已改为 **Qt 6 + QML + C++**。

需要更新：
1. Desktop 技术栈描述
2. 快速开始指南（Desktop 部分）
3. 功能列表对齐实际能力

---

## 十、GitHub 提交 TODO

### P0 必须修（提交前）

- [ ] 删除 `clients/qt/src/logger.h`（死代码）
- [ ] 压缩 app-icon.png (1.3MB → 200KB)
- [ ] 压缩所有平台 splash 图片 (~18MB → ~3MB)
- [ ] 更新 README：Desktop 技术栈 Tauri → Qt 6
- [ ] 删除或标记 Desktop(Tauri) 为 deprecated

### P1 建议修

- [ ] Qt: Main.qml 补全 19 个缺失的页面路由映射
- [ ] Qt: baseUrl 从硬编码改为可配置
- [ ] Qt: storemanager 默认模型改为 mimo-v2-pro
- [ ] Qt: 删除 5 个空壳组件或从 CMakeLists 移除
- [ ] Web: Xiaomi 适配器 header 格式确认
- [ ] Web: Xiaomi models() 补全模型列表

### P2 后续迭代

- [ ] Qt: 请求重试机制
- [ ] Qt: token 过期处理
- [ ] Qt: TopBar 模型选择器加下拉
- [ ] iOS: 加 MVVM 架构
- [ ] Web: Guest RPM 持久化（Redis）
- [ ] Web: Sidebar.tsx 拆分

---

## 十一、服务器配置（已完成）

**服务器：** 43.167.213.143 (Ubuntu 26.04, SSH key 已配置)

**已修改：**
- 主模型：mimo-v2-pro（自动转发到 V2.5，RPM 充裕）
- API Key：Max 套餐 key (tp-s7k...)
- 子任务并发：2 → 1
- session_search 并发：3 → 1
- 重试次数：3 → 10
- 辅助服务（视觉/压缩/标题）：改用 nous 免费模型
- delegation：改用 nous provider

**429 根因：** Xiaomi 平台对 mimo-v2.5-pro 的实际 RPM 限制远低于文档标注的 100 RPM。改用 mimo-v2-pro 后问题解决。

---

*报告生成完毕。所有代码已逐文件审计。*
