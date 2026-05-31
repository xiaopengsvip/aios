# Changelog — AI Workspace OS

All notable changes to this project will be documented in this file.

Format: `主版本.次版本.补丁-阶段标识`

---

## [0.0.1-00A] — 2026-05-30

### Phase 1: 基础架构稳定化

### Added
- 站点配置系统 `src/config/site.ts` — 统一管理版本/名称/功能标志
- 版本号显示 — 首页 Footer + 管理后台
- CHANGELOG.md 版本变更日志
- 开发计划文档 `.hermes/plans/aios-development-plan.md`

### Changed
- 首页 Footer 显示版本号 `v0.0.1-00A`
- package.json 版本号更新

### 技术决策
- 版本格式: `主版本.次版本.补丁-阶段标识` (如 0.0.1-00A)
- 阶段标识: 00A=基础架构, 00B=核心功能, 00C=Agent/MCP, 00D=Workflow/Knowledge, 00E=SaaS/商业化
- 功能标志系统 — 未完成功能通过 feature flag 控制
