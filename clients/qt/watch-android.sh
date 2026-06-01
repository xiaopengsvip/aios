#!/bin/bash
# AIOS Android 热部署 - 监听文件变化自动编译安装
# 用法: bash watch-android.sh

export GRADLE_HOME="/c/Gradle/gradle-8.11.1"
export ANDROID_SDK_ROOT="/c/Users/XIAO2027/AppData/Local/Android/Sdk"
export ANDROID_NDK_ROOT="$ANDROID_SDK_ROOT/ndk/27.2.12479018"
export JAVA_HOME="/c/Program Files/Microsoft/jdk-17.0.18.8-hotspot"
export PATH="/d/QTS/6.11.0/android_arm64_v8a/bin:/d/QTS/Tools/CMake_64/bin:/d/QTS/Tools/Ninja:/d/QTS/Tools/mingw1310_64/bin:$GRADLE_HOME/bin:$PATH"
ADB="$ANDROID_SDK_ROOT/platform-tools/adb.exe"

PROJECT_DIR="/c/Users/XIAO2027/Desktop/aios-repo/clients/qt"
BUILD_DIR="$PROJECT_DIR/build-android"
WATCH_DIRS="$PROJECT_DIR/src $PROJECT_DIR/qml"

echo "========================================="
echo "  AIOS Android 热部署模式"
echo "  监听: src/ qml/"
echo "  改代码自动编译 → 推送到手机"
echo "  Ctrl+C 退出"
echo "========================================="
echo ""

last_hash=""

while true; do
    # 计算源文件 hash
    current_hash=$(find $WATCH_DIRS -name "*.cpp" -o -name "*.h" -o -name "*.qml" -o -name "*.txt" | sort | xargs md5sum 2>/dev/null | md5sum | cut -d' ' -f1)

    if [ "$current_hash" != "$last_hash" ] && [ -n "$last_hash" ]; then
        echo ""
        echo "[$(date +%H:%M:%S)] 检测到文件变化，开始编译..."
        echo ""

        # 编译
        cd "$BUILD_DIR"
        cmake --build . --parallel 2>&1 | tail -3

        if [ $? -eq 0 ]; then
            echo "[$(date +%H:%M:%S)] 编译成功，打包中..."

            # 修复部署配置
            python << 'PY'
import json
with open('android-aios-deployment-settings.json', 'r') as f:
    s = json.load(f)
p = s.get('android-deploy-plugins', '')
s['android-deploy-plugins'] = ';'.join([x for x in p.split(';') if 'qopensslbackend' not in x])
with open('android-aios-deployment-settings.json', 'w') as f:
    json.dump(s, f, indent=3)
PY
            rm -f android-build/libs/arm64-v8a/libplugins_tls_qopensslbackend_arm64-v8a.so

            # 打包
            /d/QTS/6.11.0/mingw_64/bin/androiddeployqt \
                --input android-aios-deployment-settings.json \
                --output android-build --gradle 2>&1 | tail -1

            echo "[$(date +%H:%M:%S)] 安装到手机..."
            "$ADB" install -r android-build/build/outputs/apk/debug/android-build-debug.apk 2>&1

            # 启动应用
            "$ADB" shell am start -n com.aios.workspace/org.qtproject.qt.android.bindings.QtActivity 2>&1

            echo "[$(date +%H:%M:%S)] 部署完成！"
        else
            echo "[$(date +%H:%M:%S)] 编译失败，请检查代码"
        fi
    fi

    last_hash="$current_hash"
    sleep 3
done
