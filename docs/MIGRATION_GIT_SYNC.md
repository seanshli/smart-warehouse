# 代码迁移 Git 同步指南
## Code Migration Git Sync Guide

## 📋 当前状态 / Current Status

所有代码重构更改已完成，但**尚未提交到 Git**。

---

## ✅ 需要提交的更改 / Changes to Commit

### 1. API Routes 迁移
- ✅ 所有仓库相关 API → `app/api/warehouse/`
- ✅ 所有 IoT/MQTT 相关 API → `app/api/mqtt/`
- ✅ 文件移动使用 `git mv`，保留了 Git 历史

### 2. Components 迁移
- ✅ 所有仓库相关组件 → `components/warehouse/`
- ✅ 所有 IoT/MQTT 相关组件 → `components/mqtt/`
- ✅ 文件移动使用 `git mv`，保留了 Git 历史

### 3. 导入路径更新
- ✅ 所有 API 路径引用已更新
- ✅ 所有组件导入路径已更新
- ✅ 相对导入路径已修复

**总计**: ~143 个文件更改

---

## 🔄 Git 同步步骤 / Git Sync Steps

### 步骤 1: 检查更改状态

```bash
git status
# 应该看到 ~143 个文件更改
```

### 步骤 2: 添加所有更改

```bash
git add -A
```

### 步骤 3: 提交更改

```bash
git commit -m "refactor: migrate warehouse and IoT/MQTT functions to modular structure

- Move all warehouse-related API routes to app/api/warehouse/
- Move all IoT/MQTT-related API routes to app/api/mqtt/
- Move all warehouse-related components to components/warehouse/
- Move all IoT/MQTT-related components to components/mqtt/
- Update all API path references (/api/items → /api/warehouse/items, etc.)
- Update all component import paths
- Fix relative import paths for shared components
- Preserve Git history using git mv

This refactoring improves code organization and maintainability."
```

### 步骤 4: 推送到远程仓库

```bash
git push origin main
# 或你的分支名称
```

---

## 📱 iOS/Android/Web 同步 / Platform Sync

### 🌐 Web (Vercel)

**自动部署**:
- 推送到 Git 后，Vercel 会自动检测更改
- 自动触发构建和部署
- 部署完成后，新的 API 路径即可使用

**验证**:
```bash
# 检查部署状态
vercel --prod

# 或访问 Vercel Dashboard
# https://vercel.com/dashboard
```

### 📱 iOS

**需要手动同步**:

1. **构建 Web 版本**:
   ```bash
   npm run build:production
   ```

2. **同步到 iOS**:
   ```bash
   npx cap sync ios
   ```

3. **在 Xcode 中打开**:
   ```bash
   npx cap open ios
   ```

4. **构建和测试**:
   - 在 Xcode 中构建项目 (⌘+B)
   - 在模拟器或真机上测试
   - 确保所有 API 调用正常工作

**重要**: iOS 应用会使用新的 API 路径，因为它们是动态的（通过 `fetch` 调用）。

### 🤖 Android

**需要手动同步**:

1. **构建 Web 版本**:
   ```bash
   npm run build:production
   ```

2. **同步到 Android**:
   ```bash
   npx cap sync android
   ```

3. **在 Android Studio 中打开**:
   ```bash
   npx cap open android
   ```

4. **构建和测试**:
   - 在 Android Studio 中构建项目
   - 在模拟器或真机上测试
   - 确保所有 API 调用正常工作

**重要**: Android 应用会使用新的 API 路径，因为它们是动态的（通过 `fetch` 调用）。

---

## ⚠️ 重要注意事项 / Important Notes

### 1. API 路径变更

**旧路径不再可用**:
- ❌ `/api/items` → ✅ `/api/warehouse/items`
- ❌ `/api/rooms` → ✅ `/api/warehouse/rooms`
- ❌ `/api/iot` → ✅ `/api/mqtt/iot`
- ❌ `/api/provisioning` → ✅ `/api/mqtt/provisioning`

**影响**:
- ✅ 前端代码已全部更新
- ⚠️ 如果有外部系统调用 API，需要更新路径
- ⚠️ 如果有书签或直接链接，需要更新

### 2. 组件导入路径变更

**旧路径不再可用**:
- ❌ `@/components/Dashboard` → ✅ `@/components/warehouse/Dashboard`
- ❌ `@/components/MQTTPanel` → ✅ `@/components/mqtt/MQTTPanel`

**影响**:
- ✅ 所有组件导入已更新
- ✅ 不会影响运行时（因为都是编译时检查）

### 3. Capacitor 同步

**iOS/Android 需要同步**:
- 代码更改后，需要运行 `npx cap sync` 来更新原生项目
- 这会将构建后的 Web 代码复制到原生项目中
- 原生项目本身不需要更改（因为它们只是容器）

---

## 🧪 测试清单 / Testing Checklist

### Web 测试
- [ ] 访问主页，检查 Dashboard 是否正常加载
- [ ] 测试添加物品功能
- [ ] 测试搜索功能
- [ ] 测试房间管理
- [ ] 测试分类管理
- [ ] 测试 MQTT 设备管理
- [ ] 测试设备配网功能
- [ ] 检查浏览器控制台是否有错误

### iOS 测试
- [ ] 运行 `npx cap sync ios`
- [ ] 在 Xcode 中打开项目
- [ ] 构建并运行在模拟器
- [ ] 测试所有主要功能
- [ ] 检查网络请求是否使用新路径
- [ ] 检查控制台是否有错误

### Android 测试
- [ ] 运行 `npx cap sync android`
- [ ] 在 Android Studio 中打开项目
- [ ] 构建并运行在模拟器
- [ ] 测试所有主要功能
- [ ] 检查网络请求是否使用新路径
- [ ] 检查 Logcat 是否有错误

---

## 🚀 快速同步命令 / Quick Sync Commands

### 完整同步（所有平台）

```bash
# 1. 提交到 Git
git add -A
git commit -m "refactor: migrate to modular structure"
git push origin main

# 2. Web (自动部署到 Vercel)
# 无需操作，Vercel 会自动部署

# 3. iOS
npm run build:production
npx cap sync ios
npx cap open ios

# 4. Android
npm run build:production
npx cap sync android
npx cap open android
```

### 仅同步 iOS

```bash
npm run ios:production
```

### 仅同步 Android

```bash
npm run build:production
npx cap sync android
npx cap open android
```

---

## 📊 迁移影响总结 / Migration Impact Summary

| 平台 | 需要操作 | 自动/手动 | 影响 |
|------|---------|----------|------|
| **Web** | Git push | 自动部署 | ✅ 无影响，自动更新 |
| **iOS** | `npx cap sync ios` | 手动 | ✅ 无影响，API 路径是动态的 |
| **Android** | `npx cap sync android` | 手动 | ✅ 无影响，API 路径是动态的 |

---

## ❓ 常见问题 / FAQ

### Q: 为什么 iOS/Android 需要手动同步？

A: Capacitor 使用原生 WebView 来显示 Web 应用。当你更改 Web 代码后，需要：
1. 构建 Web 版本 (`npm run build`)
2. 复制到原生项目 (`npx cap sync`)
3. 原生项目才能看到最新更改

### Q: 如果我不运行 `npx cap sync` 会怎样？

A: iOS/Android 应用会继续使用旧的构建版本，可能包含旧的 API 路径，导致功能异常。

### Q: 这些更改会影响已发布的 iOS/Android 应用吗？

A: 不会立即影响。只有当你：
1. 提交新版本到 App Store/Play Store
2. 用户更新应用后
才会使用新的代码。

### Q: 如何验证更改已同步？

A: 
- **Web**: 检查 Vercel 部署日志
- **iOS**: 在 Xcode 中检查 `ios/App/App/public/` 目录
- **Android**: 在 Android Studio 中检查 `android/app/src/main/assets/public/` 目录

---

## 📞 需要帮助？/ Need Help?

如果遇到问题：
1. 检查 Git 状态: `git status`
2. 检查构建错误: `npm run build`
3. 检查 Capacitor 状态: `npx cap doctor`
4. 查看迁移文档: `docs/MIGRATION_SUMMARY.md`

