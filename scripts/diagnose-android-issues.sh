#!/bin/bash

# Android 运行问题诊断脚本
# Diagnose Android Run Issues

echo "🔍 Android 运行问题诊断"
echo "======================"
echo ""

# 1. 检查 Android 项目
echo "1️⃣ 检查 Android 项目..."
if [ -d "android" ]; then
    echo "✅ Android 项目存在"
    if [ -d "android/app" ]; then
        echo "✅ app 目录存在"
    else
        echo "❌ app 目录不存在"
        exit 1
    fi
else
    echo "❌ Android 项目不存在"
    echo "   运行: npx cap add android"
    exit 1
fi

# 2. 检查 public 目录
echo ""
echo "2️⃣ 检查 public 目录..."
if [ -d "android/app/src/main/assets/public" ]; then
    file_count=$(find android/app/src/main/assets/public -type f 2>/dev/null | wc -l | tr -d ' ')
    echo "✅ public 目录存在，包含 $file_count 个文件"
    if [ "$file_count" -lt 10 ]; then
        echo "⚠️  文件数量较少，可能需要重新同步"
    fi
else
    echo "❌ public 目录不存在"
    echo "   运行: npx cap sync android"
fi

# 3. 检查 capacitor.config.json
echo ""
echo "3️⃣ 检查 Capacitor 配置..."
if [ -f "android/app/src/main/assets/capacitor.config.json" ]; then
    echo "✅ capacitor.config.json 存在"
    server_url=$(grep -o '"url": "[^"]*"' android/app/src/main/assets/capacitor.config.json | cut -d'"' -f4)
    echo "   服务器 URL: $server_url"
    if [[ "$server_url" == *"vercel.app"* ]]; then
        echo "✅ 配置指向 Vercel"
    else
        echo "⚠️  服务器 URL 不是 Vercel"
    fi
else
    echo "❌ capacitor.config.json 不存在"
fi

# 4. 检查 AndroidManifest.xml
echo ""
echo "4️⃣ 检查 AndroidManifest.xml..."
if [ -f "android/app/src/main/AndroidManifest.xml" ]; then
    echo "✅ AndroidManifest.xml 存在"
    if grep -q "android:usesCleartextTraffic" android/app/src/main/AndroidManifest.xml; then
        echo "✅ 网络安全配置已设置"
    fi
    if grep -q "INTERNET" android/app/src/main/AndroidManifest.xml; then
        echo "✅ INTERNET 权限已配置"
    else
        echo "⚠️  INTERNET 权限可能缺失"
    fi
else
    echo "❌ AndroidManifest.xml 不存在"
fi

# 5. 检查 Gradle
echo ""
echo "5️⃣ 检查 Gradle 配置..."
if [ -f "android/build.gradle" ]; then
    echo "✅ build.gradle 存在"
    compile_sdk=$(grep -o "compileSdkVersion [0-9]*" android/app/build.gradle | grep -o "[0-9]*" | head -1)
    if [ ! -z "$compile_sdk" ]; then
        echo "   compileSdkVersion: $compile_sdk"
        if [ "$compile_sdk" -ge 33 ]; then
            echo "✅ SDK 版本符合要求"
        else
            echo "⚠️  SDK 版本可能过低（建议 >= 33）"
        fi
    fi
else
    echo "⚠️  build.gradle 不存在"
fi

# 6. 检查构建输出
echo ""
echo "6️⃣ 检查构建输出..."
if [ -d "android/app/build" ]; then
    echo "✅ 构建输出目录存在"
    if [ -f "android/app/build/outputs/apk/debug/app-debug.apk" ]; then
        echo "✅ 找到 Debug APK"
    fi
    if [ -f "android/app/build/outputs/apk/release/app-release.apk" ]; then
        echo "✅ 找到 Release APK"
    fi
else
    echo "⚠️  构建输出目录不存在"
    echo "   需要在 Android Studio 中先构建项目"
fi

# 7. 检查 Java/Android SDK
echo ""
echo "7️⃣ 检查开发环境..."
if command -v java &> /dev/null; then
    java_version=$(java -version 2>&1 | head -1)
    echo "✅ Java: $java_version"
else
    echo "⚠️  Java 未安装或不在 PATH 中"
fi

if [ ! -z "$ANDROID_HOME" ]; then
    echo "✅ ANDROID_HOME: $ANDROID_HOME"
else
    echo "⚠️  ANDROID_HOME 未设置"
fi

# 8. 检查连接的设备
echo ""
echo "8️⃣ 检查连接的设备..."
if command -v adb &> /dev/null; then
    devices=$(adb devices | grep -v "List" | grep "device" | wc -l | tr -d ' ')
    if [ "$devices" -gt 0 ]; then
        echo "✅ 找到 $devices 个连接的设备/模拟器"
        adb devices | grep "device"
    else
        echo "⚠️  没有连接的设备或模拟器"
        echo "   运行: adb devices 查看设备列表"
    fi
else
    echo "⚠️  adb 未找到（Android SDK 可能未安装）"
fi

# 9. 常见问题检查
echo ""
echo "9️⃣ 常见问题检查..."
echo ""

echo "🔧 建议的修复步骤:"
echo "=================="
echo ""
echo "如果应用无法运行，请尝试以下步骤:"
echo ""
echo "1. 清理构建:"
echo "   cd android"
echo "   ./gradlew clean"
echo "   cd .."
echo ""
echo "2. 重新同步:"
echo "   npm run build:production"
echo "   npx cap sync android"
echo ""
echo "3. 检查设备/模拟器:"
echo "   adb devices"
echo "   # 确保有设备连接"
echo ""
echo "4. 检查签名:"
echo "   - 在 Android Studio 中: Build → Generate Signed Bundle/APK"
echo "   - 对于调试版本，使用默认调试密钥"
echo ""
echo "5. 查看 Logcat 错误:"
echo "   adb logcat | grep -i error"
echo "   # 或在 Android Studio 中查看 Logcat"
echo ""
echo "6. 检查网络连接:"
echo "   - 确保设备/模拟器可以访问互联网"
echo "   - 测试: curl https://smart-warehouse-five.vercel.app"
echo ""
echo "7. 检查网络安全配置:"
echo "   - 确认 android/app/src/main/res/xml/network_security_config.xml 存在"
echo "   - 确认 AndroidManifest.xml 引用了该配置"
echo ""

