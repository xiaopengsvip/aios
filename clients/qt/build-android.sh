#!/bin/bash
# Build AIOS for Android (arm64-v8a)
set -e

export ANDROID_SDK_ROOT="/c/Users/XIAO2027/AppData/Local/Android/Sdk"
export ANDROID_NDK_ROOT="$ANDROID_SDK_ROOT/ndk/27.2.12479018"
export JAVA_HOME="/c/Program Files/Microsoft/jdk-17.0.18.8-hotspot"
export PATH="/d/QTS/6.11.0/android_arm64_v8a/bin:/d/QTS/Tools/CMake_64/bin:/d/QTS/Tools/Ninja:/d/QTS/Tools/mingw1310_64/bin:$PATH"

PROJECT_DIR="/c/Users/XIAO2027/Desktop/aios-repo/clients/qt"
BUILD_DIR="$PROJECT_DIR/build-android"

echo "=== Building AIOS for Android arm64-v8a ==="

mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

cmake "$PROJECT_DIR" \
    -G Ninja \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_TOOLCHAIN_FILE="$ANDROID_NDK_ROOT/build/cmake/android.toolchain.cmake" \
    -DCMAKE_PREFIX_PATH="/d/QTS/6.11.0/android_arm64_v8a/lib/cmake" \
    -DCMAKE_FIND_ROOT_PATH="/d/QTS/6.11.0/android_arm64_v8a" \
    -DANDROID_SDK_ROOT="$ANDROID_SDK_ROOT" \
    -DANDROID_ABI=arm64-v8a \
    -DANDROID_PLATFORM=android-34 \
    -DANDROID_STL=c++_shared \
    -DQT_HOST_PATH="/d/QTS/6.11.0/mingw_64" \
    -DQT_ANDROID_TARGET_SDK_VERSION=34 \
    -DQT_ANDROID_BUILD_ALL_ABIS=OFF

cmake --build . --parallel

echo "=== Build complete ==="
find . -name "*.apk" 2>/dev/null
