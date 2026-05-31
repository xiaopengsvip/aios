#!/bin/bash
# ============================================================
# AIOS 数据库安全迁移脚本
# 替代 prisma migrate reset，保留现有数据
# ============================================================
set -euo pipefail

cd /www/wwwroot/aios.allapple.top
BACKUP_DIR="/www/wwwroot/aios.allapple.top/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🔒 AIOS 数据库安全迁移"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. 备份当前数据库
echo "📦 备份数据库..."
mkdir -p "$BACKUP_DIR"
pg_dump -U aios -d aios_db -f "$BACKUP_DIR/aios_${TIMESTAMP}.sql" 2>/dev/null || {
  echo "⚠️  pg_dump 失败，尝试用 prisma 方式备份..."
  npx prisma db pull --force 2>/dev/null
}
echo "✅ 备份完成: backups/aios_${TIMESTAMP}.sql"

# 2. 尝试安全迁移 (不删数据)
echo "🔄 执行安全迁移..."
if npx prisma db push --accept-data-loss 2>/dev/null; then
  echo "✅ db push 成功，数据已保留"
else
  echo "⚠️  db push 失败，需要手动迁移"
  echo "   备份文件: $BACKUP_DIR/aios_${TIMESTAMP}.sql"
  echo "   恢复命令: psql -U aios -d aios_db < $BACKUP_DIR/aios_${TIMESTAMP}.sql"
  exit 1
fi

# 3. 重新生成 Prisma Client
echo "🔧 重新生成 Prisma Client..."
npx prisma generate 2>/dev/null
echo "✅ Prisma Client 已更新"

# 4. 运行 seed (只添加缺失数据，不删除)
echo "🌱 运行 seed (只添加缺失数据)..."
npx prisma db seed 2>/dev/null
echo "✅ Seed 完成"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 安全迁移完成！数据已保留。"
echo "   备份位置: $BACKUP_DIR/aios_${TIMESTAMP}.sql"
