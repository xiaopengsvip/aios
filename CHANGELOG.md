# Changelog

## v0.0.6 (2026-06-01)

**更新类型: Bug Fix + 优化**

### 修复
- 修复 Tauri Desktop CORS 导致 `Failed to fetch`（根因：middleware 缺少 CORS 头）
- 修复 Desktop API 请求不显示真实错误原因
- 修复 Android SSE 连接失败只显示模糊错误

### 优化
- 增强 Desktop 错误提示：按 HTTP 状态码分类（401/403/429/500/网络/CORS/超时）
- 增强 Android SSE 错误提示：DNS/超时/连接/权限分类
- middleware 新增 CORS preflight 支持（OPTIONS 204）
- 支持 `tauri://localhost` 和 `https://tauri.localhost` 跨域来源
- `api/models` 加入公开路径列表

### 兼容平台
- ✅ Windows (Tauri Desktop)
- ✅ Android
- ✅ Web

### 风险等级: 低风险

---

## v0.0.5 (2026-06-01)

**更新类型: 新功能 + UI**

### 新增
- Windows + Android 统一版本号 0.0.5
- Desktop 完整 i18n 系统（zh-CN / en-US，120+ 翻译 key）
- Desktop 登录页主题切换（☀️/🌙）+ 语言切换（中/EN）
- Desktop 登录/注册/忘记密码三步流程（含验证码+重置密码）
- Android 忘记密码完整流程（发验证码 → 输入验证码+新密码）
- 设备统计页面：7 个统计卡片 + i18n + 标准管理页布局
- 设备统计 API 新增卸载量/更新量字段
- Android 设置页重写：企业级 SaaS 风格，分组卡片，8pt 间距系统
- Android 登录页顶部间距优化（80dp → 24dp）+ 主题/语言切换

### 优化
- 侧边栏「设备统计」标签 i18n
- Android BottomTabBar 颜色对齐规范（品牌蓝 #3B82F6）
- Desktop Layout.tsx 导航标签 i18n

### 修复
- Desktop Layout.tsx 未使用变量编译错误
- Android MainActivity VersionInfo 导入缺失
- 设备统计 i18n key 未写入 admin.json

---

## v0.0.1-beta (2026-05-31)

**初始版本**

### 新增
- 登录/注册/OAuth
- AI 对话流式输出
- 13 个功能页面
- 应用内在线更新
- Windows NSIS 安装器
- Android APK 构建
