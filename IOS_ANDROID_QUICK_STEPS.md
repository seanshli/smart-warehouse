# 🚀 iOS & Android 快速操作指南
## Quick Steps for iOS & Android After Migration

## 🍎 iOS - 3 个简单步骤

```bash
# 步骤 1: 构建 Web 应用
npm run build:production

# 步骤 2: 同步到 iOS
npx cap sync ios

# 步骤 3: 打开 Xcode
npx cap open ios
```

**或者一键完成**:
```bash
npm run ios:production
```

**在 Xcode 中**:
1. 按 `⌘+B` 构建项目
2. 按 `⌘+R` 运行应用
3. 测试功能是否正常

---

## 🤖 Android - 3 个简单步骤

```bash
# 步骤 1: 构建 Web 应用
npm run build:production

# 步骤 2: 同步到 Android
npx cap sync android

# 步骤 3: 打开 Android Studio
npx cap open android
```

**在 Android Studio 中**:
1. 点击 "Sync Project with Gradle Files"
2. 点击 "Build" → "Make Project"
3. 点击 "Run" 运行应用
4. 测试功能是否正常

---

## ✅ 验证清单

### 检查项目是否同步成功

**iOS**:
- 检查 `ios/App/App/public/` 目录包含最新文件
- 在 Xcode 中构建无错误

**Android**:
- 检查 `android/app/src/main/assets/public/` 目录包含最新文件
- 在 Android Studio 中构建无错误

### 检查 API 路径是否正确

运行应用后，检查网络请求应该看到：
- ✅ `/api/warehouse/items` (新路径)
- ✅ `/api/mqtt/iot/devices` (新路径)
- ❌ 不应该有 `/api/items` (旧路径)

---

## ⚠️ 常见问题

### iOS: CocoaPods 编码错误
```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
npx cap sync ios
```

### Android: Gradle 同步失败
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

---

## 📖 详细文档

完整指南请查看: `docs/IOS_ANDROID_MIGRATION_STEPS.md`

