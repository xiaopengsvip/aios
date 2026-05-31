# AIOS 数据库安全指南

## ⚠️ 为什么数据会丢失？

`prisma migrate reset` 会：
1. 删除整个数据库
2. 重新创建空数据库
3. 运行所有迁移
4. 运行 seed 脚本

**所有自定义数据（Provider、Key、模型、用户）都会丢失！**

## ✅ 安全操作指南

### 1. 修改 Schema 后的安全迁移

```bash
# 方式1: 使用安全迁移脚本（推荐）
bash scripts/safe-migrate.sh

# 方式2: 使用 db push（不删数据）
npx prisma db push --accept-data-loss
```

### 2. 定期备份

```bash
# 手动备份
bash scripts/backup-db.sh

# 自动备份（添加到 crontab）
# 每天凌晨3点备份
0 3 * * * cd /www/wwwroot/aios.allapple.top && bash scripts/backup-db.sh
```

### 3. 恢复数据

```bash
# 从备份恢复
psql -U aios -d aios_db < backups/aios_20260531_030000.sql
```

## 📁 备份文件位置

```
/www/wwwroot/aios.allapple.top/backups/
├── aios_20260531_030000.sql
├── aios_20260530_030000.sql
└── ...（保留最近7天）
```

## 🚫 禁止操作

```bash
# ❌ 不要直接运行
npx prisma migrate reset

# ❌ 不要直接运行
npx prisma db push --force-reset
```

## ✅ 推荐操作

```bash
# ✅ 安全迁移
bash scripts/safe-migrate.sh

# ✅ 安全 prisma 命令
bash scripts/prisma-safe.sh migrate dev
bash scripts/prisma-safe.sh db push
```
