#!/bin/bash
# AIOS Windows 热部署 - 监听文件变化自动编译启动
# 用法: bash watch-windows.sh

export PATH="/d/QTS/6.11.0/mingw_64/bin:/d/QTS/Tools/mingw1310_64/bin:/d/QTS/Tools/CMake_64/bin:/d/QTS/Tools/Ninja:$PATH"

PROJECT_DIR="/c/Users/XIAO2027/Desktop/aios-repo/clients/qt"
BUILD_DIR="$PROJECT_DIR/build"
WATCH_DIRS="$PROJECT_DIR/src $PROJECT_DIR/qml"

echo "========================================="
echo "  AIOS Windows 热部署模式"
echo "  监听: src/ qml/"
echo "  改代码自动编译 → 启动应用"
echo "  Ctrl+C 退出"
echo "========================================="
echo ""

last_hash=""

while true; do
    current_hash=$(find $WATCH_DIRS -name "*.cpp" -o -name "*.h" -o -name "*.qml" -o -name "*.txt" | sort | xargs md5sum 2>/dev/null | md5sum | cut -d' ' -f1)

    if [ "$current_hash" != "$last_hash" ] && [ -n "$last_hash" ]; then
        echo ""
        echo "[$(date +%H:%M:%S)] 检测到文件变化，开始编译..."

        # 关闭旧进程
        taskkill //F //IM aios.exe 2>/dev/null
        sleep 1

        cd "$BUILD_DIR"
        cmake --build . 2>&1 | tail -3

        if [ $? -eq 0 ]; then
            echo "[$(date +%H:%M:%S)] 编译成功，启动应用..."
            cmd.exe //c "start /b aios.exe"
            echo "[$(date +%H:%M:%S)] 已启动！"
        else
            echo "[$(date +%H:%M:%S)] 编译失败"
        fi
    fi

    last_hash="$current_hash"
    sleep 3
done
