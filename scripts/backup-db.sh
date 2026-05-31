#!/bin/bash
# ============================================================
# AIOS 数据库备份脚本
# 定期备份，保留最近7天
# ============================================================
set -euo pipefail

cd /www/wwwroot/aios.allapple.top
BACKUP_DIR="/www/wwwroot/aios.allapple.top/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=7

# 从 .env 读取数据库连接
source .env 2>/dev/null || true

mkdir -p "$BACKUP_DIR"

# 使用 DATABASE_URL 备份
if [ -n "${DATABASE_URL:-}" ]; then
  pg_dump "$DATABASE_URL" -f "$BACKUP_DIR/aios_${TIMESTAMP}.sql" 2>/dev/null && {
    echo "✅ 备份完成: aios_${TIMESTAMP}.sql"
    
    # 清理旧备份
    find "$BACKUP_DIR" -name "aios_*.sql" -mtime +$KEEP_DAYS -delete 2>/dev/null
    echo "🗑️  已清理 ${KEEP_DAYS} 天前的备份"
  } || {
    echo "❌ 备份失败"
    exit 1
  }
else
  echo "❌ 未找到 DATABASE_URL"
  exit 1
fi
