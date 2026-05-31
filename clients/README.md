# AIOS 客户端应用

AI Workspace OS 跨平台客户端 — Android / Windows Desktop / iOS

## 项目结构

```
aios-clients/
├── shared/              # 共享 API 定义
├── android/             # Android 原生 (Kotlin + Jetpack Compose)
│   └── app/src/main/java/com/aios/app/
│       ├── core/        # 核心层 (网络/认证/DI/主题/导航)
│       ├── data/        # 数据层 (模型/仓库)
│       └── feature/     # 功能层 (页面/组件)
├── desktop/             # 桌面端 (Tauri 2 + React + TypeScript)
│   ├── src/             # React 前端
│   └── src-tauri/       # Rust 后端
└── ios/                 # iOS (SwiftUI)
    └── AiOS/
        ├── App/         # 应用入口
        ├── Core/        # 核心层
        └── Features/    # 功能页面
```

## 架构设计

### 组件化模块化

每个平台采用分层架构:
- **Core 层**: 网络客户端、认证管理、DI 容器、主题系统、导航路由
- **Data 层**: 数据模型定义、Repository 模式
- **Feature 层**: 各功能模块独立页面和组件

### API 对接

所有客户端对接 AIOS 后端 API (https://aios.vios.top):
- 67 个 REST API 端点
- SSE 流式对话 (POST /api/chat/stream)
- Cookie-based 认证 (aios_token)

## 编译指南

### Android APK

```bash
# 需要: JDK 17 + Android SDK 35 + Gradle
cd android/
./gradlew assembleDebug    # Debug APK
./gradlew assembleRelease  # Release APK
# 输出: app/build/outputs/apk/
```

### Windows EXE

```bash
# 需要: Rust toolchain + Node.js
cd desktop/
npm install
npm run tauri build       # 生成 .exe 和 .msi
# 输出: src-tauri/target/release/bundle/
```

### iOS (仅代码)

```bash
# 需要: macOS + Xcode 15+
# 用 Xcode 打开 ios/ 目录
# 设置 Development Team
# Build → Run
```

## 功能清单

| 功能 | Android | Desktop | iOS |
|------|---------|---------|-----|
| 登录/注册 | ✅ | ✅ | ✅ |
| SSE 流式对话 | ✅ | ✅ | ✅ |
| 模型选择 | ✅ | ✅ | ✅ |
| 会话管理 | ✅ | ✅ | ✅ |
| Agent 执行 | ✅ | ✅ | ✅ |
| 深色主题 | ✅ | ✅ | ✅ |
| 设置/退出 | ✅ | ✅ | ✅ |
| 多语言 | 🔜 | 🔜 | 🔜 |
| 工作流 | 🔜 | 🔜 | 🔜 |
| 知识库 | 🔜 | 🔜 | 🔜 |

## 后端 API 参考

- 后端仓库: https://github.com/xiaopengsvip/aios
- 线上地址: https://aios.vios.top
- OpenAI 兼容: https://aios.vios.top/v1/chat/completions
