#!/bin/bash
# ============================================================
# AIOS Prisma 安全包装器
# 阻止危险操作，自动备份
# ============================================================

# 检查是否是危险命令
for arg in "$@"; do
  if [[ "$arg" == "migrate" ]]; then
    for subarg in "$@"; do
      if [[ "$subarg" == "reset" ]]; then
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "⚠️  检测到 prisma migrate reset!"
        echo "   此操作会清空所有数据！"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "建议使用安全迁移脚本:"
        echo "  bash scripts/safe-migrate.sh"
        echo ""
        read -p "确定要继续吗？(输入 YES 继续): " confirm
        if [[ "$confirm" != "YES" ]]; then
          echo "❌ 已取消"
          exit 1
        fi
        echo "🔄 先备份数据库..."
        bash scripts/backup-db.sh
        break
      fi
    done
  fi
done

# 执行原始命令
exec npx prisma "$@"
