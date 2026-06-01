#!/bin/bash
# AIOS Android 一键编译 + 安装到手机
set -e

export GRADLE_HOME="/c/Gradle/gradle-8.11.1"
export ANDROID_SDK_ROOT="/c/Users/XIAO2027/AppData/Local/Android/Sdk"
export ANDROID_NDK_ROOT="$ANDROID_SDK_ROOT/ndk/27.2.12479018"
export JAVA_HOME="/c/Program Files/Microsoft/jdk-17.0.18.8-hotspot"
export PATH="/d/QTS/6.11.0/android_arm64_v8a/bin:/d/QTS/Tools/CMake_64/bin:/d/QTS/Tools/Ninja:/d/QTS/Tools/mingw1310_64/bin:$GRADLE_HOME/bin:$PATH"
ADB="$ANDROID_SDK_ROOT/platform-tools/adb.exe"

PROJECT_DIR="/c/Users/XIAO2027/Desktop/aios-repo/clients/qt"
BUILD_DIR="$PROJECT_DIR/build-android"

echo "=== [1/4] 编译原生代码 ==="
cd "$BUILD_DIR"
cmake --build . --parallel 2>&1 | tail -3

echo "=== [2/4] 修复部署配置 ==="
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

echo "=== [3/4] 打包 APK ==="
/d/QTS/6.11.0/mingw_64/bin/androiddeployqt \
    --input android-aios-deployment-settings.json \
    --output android-build --gradle 2>&1 | tail -3

APK="android-build/build/outputs/apk/debug/android-build-debug.apk"

echo "=== [4/4] 安装到手机 ==="
"$ADB" install -r "$APK" 2>&1

echo "=== 完成！==="
