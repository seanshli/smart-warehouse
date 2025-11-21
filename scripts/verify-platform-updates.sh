#!/bin/bash

# 验证所有平台的更新状态
# Verify all platform update status

echo "🔍 验证所有平台的更新状态"
echo "=========================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 验证 Web 构建
echo "1. 🌐 Web 平台验证"
echo "-------------------"
if [ -d "out" ] && [ "$(ls -A out 2>/dev/null)" ]; then
    echo -e "${GREEN}✅ Web 构建输出目录存在${NC}"
    echo "   目录: ./out"
    echo "   文件数: $(find out -type f | wc -l | tr -d ' ') 个文件"
else
    echo -e "${RED}❌ Web 构建输出目录不存在或为空${NC}"
fi
echo ""

# 2. 验证 Web 代码更改
echo "2. 📝 Web 代码更改验证"
echo "----------------------"
if grep -q "householdId\|householdName" components/mqtt/ProvisioningModal.tsx 2>/dev/null; then
    echo -e "${GREEN}✅ ProvisioningModal 已更新（包含 householdId/householdName）${NC}"
else
    echo -e "${RED}❌ ProvisioningModal 未找到或未更新${NC}"
fi

if grep -q "tuyaHomeId" app/api/mqtt/tuya/home/route.ts 2>/dev/null; then
    echo -e "${GREEN}✅ Tuya Home API 已更新${NC}"
else
    echo -e "${RED}❌ Tuya Home API 未找到或未更新${NC}"
fi
echo ""

# 3. 验证 iOS
echo "3. 🍎 iOS 平台验证"
echo "------------------"
if [ -f "ios/App/App/Plugins/TuyaProvisioningPlugin.swift" ]; then
    if grep -q "householdName\|householdId" ios/App/App/Plugins/TuyaProvisioningPlugin.swift 2>/dev/null; then
        echo -e "${GREEN}✅ iOS 插件已更新（包含 householdId/householdName）${NC}"
    else
        echo -e "${YELLOW}⚠️ iOS 插件文件存在但可能未更新${NC}"
    fi
    echo "   文件: ios/App/App/Plugins/TuyaProvisioningPlugin.swift"
else
    echo -e "${RED}❌ iOS 插件文件不存在${NC}"
fi

if [ -d "ios/App/App/public" ] || [ -d "ios/App/App/App/public" ]; then
    echo -e "${GREEN}✅ iOS Web 资源目录存在${NC}"
else
    echo -e "${YELLOW}⚠️ iOS Web 资源目录未找到（可能在不同位置）${NC}"
fi
echo ""

# 4. 验证 Android
echo "4. 🤖 Android 平台验证"
echo "----------------------"
if [ -d "android/app/src/main/assets/public" ]; then
    FILE_COUNT=$(find android/app/src/main/assets/public -type f 2>/dev/null | wc -l | tr -d ' ')
    if [ "$FILE_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ Android Web 资源已同步${NC}"
        echo "   目录: android/app/src/main/assets/public"
        echo "   文件数: $FILE_COUNT 个文件"
    else
        echo -e "${YELLOW}⚠️ Android Web 资源目录存在但为空${NC}"
    fi
else
    echo -e "${RED}❌ Android Web 资源未同步${NC}"
fi

if [ -f "android/app/src/main/java/com/smartwarehouse/app/plugins/TuyaProvisioningPlugin.java" ]; then
    echo -e "${GREEN}✅ Android 插件文件存在${NC}"
    echo "   文件: android/app/src/main/java/com/smartwarehouse/app/plugins/TuyaProvisioningPlugin.java"
else
    echo -e "${RED}❌ Android 插件文件不存在${NC}"
fi
echo ""

# 5. 验证数据库 Schema
echo "5. 🗄️ 数据库 Schema 验证"
echo "----------------------"
if grep -q "tuyaHomeId" prisma/schema.prisma 2>/dev/null; then
    echo -e "${GREEN}✅ Prisma Schema 已更新（包含 tuyaHomeId）${NC}"
else
    echo -e "${RED}❌ Prisma Schema 未更新${NC}"
fi
echo ""

# 总结
echo "📊 验证总结"
echo "============"
echo ""
echo "✅ = 已更新"
echo "⚠️ = 需要检查"
echo "❌ = 未更新"
echo ""

