# 平台更新指南
## Platform Update Guide

## 📋 更新范围 / Update Scope

由于我们做了以下更改，**所有三个平台都需要更新**：

### 已更改的文件 / Changed Files

1. **Web 代码** (影响所有平台):
   - ✅ `components/mqtt/ProvisioningModal.tsx` - 前端组件
   - ✅ `app/api/mqtt/tuya/home/route.ts` - API 端点
   - ✅ `lib/provisioning/native-client.ts` - 原生客户端工具
   - ✅ `lib/plugins/tuya/index.ts` - 类型定义

2. **iOS 原生代码**:
   - ✅ `ios/App/App/Plugins/TuyaProvisioningPlugin.swift` - iOS 插件

3. **Android 原生代码**:
   - ⚠️ `android/app/src/main/java/com/smartwarehouse/app/plugins/TuyaProvisioningPlugin.java` - Android 插件（尚未更新）

4. **数据库 Schema**:
   - ✅ `prisma/schema.prisma` - 添加了 `tuyaHomeId` 字段

---

## 🔄 为什么所有平台都需要更新？/ Why All Platforms Need Updates?

### Capacitor 架构说明

```
┌─────────────────────────────────────────┐
│         Web Code (Next.js)              │
│  - React Components                     │
│  - API Routes                            │
│  - Business Logic                        │
└─────────────────────────────────────────┘
           │              │
           ▼              ▼
    ┌──────────┐    ┌──────────┐
    │   iOS    │    │ Android  │
    │ (WebView)│    │ (WebView)│
    └──────────┘    └──────────┘
```

**关键点**:
- iOS 和 Android 使用 **WebView** 来显示 Web 内容
- Web 代码的更改需要重新构建并同步到原生项目
- 原生插件（iOS/Android）的更改需要重新同步原生项目

---

## 📱 更新步骤 / Update Steps

### 1. Web 平台 ✅

**状态**: 代码已更新，需要重新部署

**步骤**:
```bash
# 1. 构建
npm run build

# 2. 部署到 Vercel（自动）
# 或者手动部署
vercel --prod
```

**更改内容**:
- ✅ API 端点已更新
- ✅ 前端组件已更新
- ✅ 类型定义已更新

---

### 2. iOS 平台 ✅

**状态**: Web 代码 + iOS 原生插件都已更新，需要重新构建和同步

**步骤**:
```bash
# 1. 构建 Web 代码（用于 Capacitor）
npm run build:production

# 2. 同步到 iOS（包括 Web 代码和原生插件）
npx cap sync ios

# 3. 打开 Xcode
npx cap open ios
```

**更改内容**:
- ✅ Web 代码已更新（通过 Capacitor 同步）
- ✅ iOS 原生插件已更新（`TuyaProvisioningPlugin.swift`）
- ✅ 支持 `householdId` 和 `householdName` 参数
- ✅ 使用 Household 名称创建 Tuya Home

**在 Xcode 中**:
1. 检查 `TuyaProvisioningPlugin.swift` 是否已更新
2. 构建项目 (⌘+B)
3. 测试配网功能

---

### 3. Android 平台 ⚠️

**状态**: Web 代码已更新，但 Android 原生插件尚未更新

**步骤**:
```bash
# 1. 构建 Web 代码（用于 Capacitor）
npm run build:production

# 2. 同步到 Android（包括 Web 代码）
npx cap sync android

# 3. 打开 Android Studio
npx cap open android
```

**更改内容**:
- ✅ Web 代码已更新（通过 Capacitor 同步）
- ⚠️ Android 原生插件尚未更新（需要后续实现）

**注意**:
- Android 插件目前是占位符实现
- Web 代码的更改仍然会生效（通过 API 调用）
- 但原生 Tuya SDK 集成需要后续完成

---

## 🎯 快速更新命令 / Quick Update Commands

### 更新所有平台

```bash
# 1. 构建 Web 代码
npm run build:production

# 2. 同步 iOS
npx cap sync ios

# 3. 同步 Android
npx cap sync android

# 4. 打开 iOS（可选）
npx cap open ios

# 5. 打开 Android（可选）
npx cap open android
```

### 或者使用脚本

```bash
# 使用现有的构建脚本
npm run build:all-platforms:production
```

---

## ✅ 验证清单 / Verification Checklist

### Web 平台
- [ ] 构建成功 (`npm run build`)
- [ ] API 端点可访问 (`/api/mqtt/tuya/home`)
- [ ] 前端组件正常工作
- [ ] 部署到 Vercel

### iOS 平台
- [ ] Web 代码已同步 (`npx cap sync ios`)
- [ ] iOS 插件已更新 (`TuyaProvisioningPlugin.swift`)
- [ ] Xcode 项目可以构建
- [ ] 配网功能可以测试

### Android 平台
- [ ] Web 代码已同步 (`npx cap sync android`)
- [ ] Android Studio 项目可以构建
- [ ] Web API 调用正常工作
- [ ] 原生插件待后续实现

---

## 📝 总结 / Summary

| 平台 | Web 代码 | 原生代码 | 需要更新 | 优先级 |
|------|---------|---------|---------|--------|
| **Web** | ✅ 已更新 | N/A | ✅ 是 | 🔴 高 |
| **iOS** | ✅ 已更新 | ✅ 已更新 | ✅ 是 | 🔴 高 |
| **Android** | ✅ 已更新 | ⚠️ 待更新 | ✅ 是 | 🟡 中 |

**结论**: **所有三个平台都需要更新**，因为：
1. Web 代码更改影响所有平台（通过 Capacitor）
2. iOS 原生插件已更新
3. Android 原生插件待更新，但 Web 代码更改仍然需要同步

---

## 🚀 下一步 / Next Steps

1. **立即更新**: Web 和 iOS（功能完整）
2. **后续更新**: Android 原生插件（当前通过 Web API 工作）

---

## 📚 相关文档 / Related Documents

- `docs/TUYA_HOME_HOUSEHOLD_MAPPING.md` - Tuya Home 与 Household 对应关系
- `docs/VERIFICATION_REPORT.md` - 验证报告
- `docs/IOS_ANDROID_MIGRATION_STEPS.md` - iOS/Android 迁移步骤

