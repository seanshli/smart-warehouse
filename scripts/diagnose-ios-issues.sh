#!/bin/bash

# iOS 运行问题诊断脚本
# Diagnose iOS Run Issues

echo "🔍 iOS 运行问题诊断"
echo "===================="
echo ""

# 1. 检查 Xcode 项目
echo "1️⃣ 检查 Xcode 项目..."
if [ -d "ios/App/App.xcodeproj" ]; then
    echo "✅ Xcode 项目存在"
else
    echo "❌ Xcode 项目不存在"
    exit 1
fi

# 2. 检查 public 目录
echo ""
echo "2️⃣ 检查 public 目录..."
if [ -d "ios/App/App/public" ]; then
    file_count=$(find ios/App/App/public -type f | wc -l | tr -d ' ')
    echo "✅ public 目录存在，包含 $file_count 个文件"
    if [ "$file_count" -lt 10 ]; then
        echo "⚠️  文件数量较少，可能需要重新同步"
    fi
else
    echo "❌ public 目录不存在"
    echo "   运行: npx cap sync ios"
fi

# 3. 检查 capacitor.config.json
echo ""
echo "3️⃣ 检查 Capacitor 配置..."
if [ -f "ios/App/App/capacitor.config.json" ]; then
    echo "✅ capacitor.config.json 存在"
    server_url=$(grep -o '"url": "[^"]*"' ios/App/App/capacitor.config.json | cut -d'"' -f4)
    echo "   服务器 URL: $server_url"
    if [[ "$server_url" == *"vercel.app"* ]]; then
        echo "✅ 配置指向 Vercel"
    else
        echo "⚠️  服务器 URL 不是 Vercel"
    fi
else
    echo "❌ capacitor.config.json 不存在"
fi

# 4. 检查 Info.plist 网络配置
echo ""
echo "4️⃣ 检查网络安全配置..."
if grep -q "NSAppTransportSecurity" ios/App/App/Info.plist; then
    echo "✅ NSAppTransportSecurity 已配置"
    if grep -q "NSAllowsArbitraryLoads" ios/App/App/Info.plist; then
        echo "✅ 允许网络访问"
    fi
else
    echo "⚠️  NSAppTransportSecurity 未配置"
fi

# 5. 检查 Pods
echo ""
echo "5️⃣ 检查 CocoaPods..."
if [ -d "ios/App/Pods" ]; then
    echo "✅ Pods 目录存在"
    pod_count=$(find ios/App/Pods -name "*.framework" | wc -l | tr -d ' ')
    echo "   找到 $pod_count 个 framework"
else
    echo "⚠️  Pods 目录不存在"
    echo "   运行: cd ios/App && pod install"
fi

# 6. 检查构建输出
echo ""
echo "6️⃣ 检查构建输出..."
if [ -d "ios/App/build" ]; then
    echo "✅ 构建输出目录存在"
    if [ -f "ios/App/build/Debug-iphonesimulator/App.app/Info.plist" ]; then
        echo "✅ 找到 Debug 构建"
    fi
    if [ -f "ios/App/build/Release-iphonesimulator/App.app/Info.plist" ]; then
        echo "✅ 找到 Release 构建"
    fi
else
    echo "⚠️  构建输出目录不存在"
    echo "   需要在 Xcode 中先构建项目"
fi

# 7. 常见问题检查
echo ""
echo "7️⃣ 常见问题检查..."
echo ""

# 检查是否有模拟器
echo "📱 可用的 iOS 模拟器:"
xcrun simctl list devices available | grep -i "iphone" | head -5 || echo "   无法列出模拟器"

echo ""
echo "🔧 建议的修复步骤:"
echo "=================="
echo ""
echo "如果应用无法运行，请尝试以下步骤:"
echo ""
echo "1. 清理构建:"
echo "   - 在 Xcode 中: Product → Clean Build Folder (⇧⌘K)"
echo ""
echo "2. 重新同步:"
echo "   npm run build:production"
echo "   npx cap sync ios"
echo ""
echo "3. 检查设备/模拟器:"
echo "   - 在 Xcode 中选择正确的设备或模拟器"
echo "   - 确保设备已启动"
echo ""
echo "4. 检查签名:"
echo "   - 在 Xcode 中: Signing & Capabilities"
echo "   - 确保选择了正确的 Team"
echo ""
echo "5. 查看控制台错误:"
echo "   - 在 Xcode 中打开控制台 (⇧⌘C)"
echo "   - 查看运行时错误信息"
echo ""
echo "6. 检查网络连接:"
echo "   - 确保设备/模拟器可以访问互联网"
echo "   - 测试: https://smart-warehouse-five.vercel.app"
echo ""

