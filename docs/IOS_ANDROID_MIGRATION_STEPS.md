# iOS & Android 迁移后操作指南
## Post-Migration Steps for iOS & Android

## 📋 概述 / Overview

代码重构完成后，iOS 和 Android 应用需要同步最新的 Web 代码。由于这些是 Capacitor 应用，它们使用 WebView 来显示 Web 内容，所以需要将构建后的 Web 代码复制到原生项目中。

---

## 🍎 iOS 操作步骤 / iOS Steps

### 步骤 1: 确保环境准备就绪

```bash
# 检查 Node.js 版本
node --version
# 应该 >= 16.x

# 检查 npm 版本
npm --version

# 检查 Capacitor CLI
npx cap --version
```

### 步骤 2: 安装依赖（如果需要）

```bash
# 如果还没有安装依赖
npm install
```

### 步骤 3: 构建 Web 应用

```bash
# 构建生产版本（用于 iOS）
npm run build:production
```

**预期输出**:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

### 步骤 4: 同步到 iOS

```bash
# 同步 Web 代码到 iOS 项目
npx cap sync ios
```

**预期输出**:
```
✔ Copying web assets from out to ios/App/App/public in 2.12s
✔ Copying native bridge in 0.01s
✔ Copying capacitor.config.json in 0.01s
✔ Syncing iOS native dependencies with pod install
```

**注意**: 如果遇到 CocoaPods 编码错误，运行：
```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
npx cap sync ios
```

### 步骤 5: 在 Xcode 中打开项目

```bash
# 打开 iOS 项目
npx cap open ios
```

或者使用快捷命令：
```bash
npm run ios:production
```

### 步骤 6: 在 Xcode 中验证

1. **检查项目结构**:
   - 确认 `ios/App/App/public/` 目录包含最新的 Web 文件
   - 确认 `ios/App/App/capacitor.config.json` 已更新

2. **检查 API 路径**:
   - 打开 `ios/App/App/public/` 中的任何 `.js` 文件
   - 搜索 `/api/warehouse/` 或 `/api/mqtt/`
   - 确认路径已更新

3. **构建项目**:
   - 在 Xcode 中按 `⌘+B` 构建项目
   - 检查是否有编译错误

4. **运行测试**:
   - 选择模拟器或真机
   - 按 `⌘+R` 运行应用
   - 测试主要功能：
     - ✅ Dashboard 加载
     - ✅ 添加物品
     - ✅ 搜索功能
     - ✅ MQTT 设备管理
     - ✅ 设备配网

### 步骤 7: 检查网络请求

在 Xcode 控制台或 Safari Web Inspector 中检查：
- 所有 API 请求应该使用新路径（`/api/warehouse/...` 或 `/api/mqtt/...`）
- 不应该有 404 错误

---

## 🤖 Android 操作步骤 / Android Steps

### 步骤 1: 确保环境准备就绪

```bash
# 检查 Node.js 版本
node --version
# 应该 >= 16.x

# 检查 npm 版本
npm --version

# 检查 Java 版本（Android 需要）
java -version
# 应该 >= 11

# 检查 Android SDK（如果已安装）
echo $ANDROID_HOME
```

### 步骤 2: 安装依赖（如果需要）

```bash
# 如果还没有安装依赖
npm install
```

### 步骤 3: 构建 Web 应用

```bash
# 构建生产版本（用于 Android）
npm run build:production
```

**预期输出**:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

### 步骤 4: 同步到 Android

```bash
# 同步 Web 代码到 Android 项目
npx cap sync android
```

**预期输出**:
```
✔ Copying web assets from out to android/app/src/main/assets/public in 2.15s
✔ Copying native bridge in 0.01s
✔ Copying capacitor.config.json in 0.01s
✔ Syncing Gradle dependencies
```

### 步骤 5: 在 Android Studio 中打开项目

```bash
# 打开 Android 项目
npx cap open android
```

### 步骤 6: 在 Android Studio 中验证

1. **检查项目结构**:
   - 确认 `android/app/src/main/assets/public/` 目录包含最新的 Web 文件
   - 确认 `android/app/src/main/assets/capacitor.config.json` 已更新

2. **检查 API 路径**:
   - 打开 `android/app/src/main/assets/public/` 中的任何 `.js` 文件
   - 搜索 `/api/warehouse/` 或 `/api/mqtt/`
   - 确认路径已更新

3. **同步 Gradle**:
   - 在 Android Studio 中，点击 "Sync Project with Gradle Files"
   - 等待同步完成

4. **构建项目**:
   - 在 Android Studio 中，点击 "Build" → "Make Project"
   - 检查是否有编译错误

5. **运行测试**:
   - 选择模拟器或真机
   - 点击 "Run" 按钮运行应用
   - 测试主要功能：
     - ✅ Dashboard 加载
     - ✅ 添加物品
     - ✅ 搜索功能
     - ✅ MQTT 设备管理
     - ✅ 设备配网

### 步骤 7: 检查网络请求

在 Android Studio Logcat 或 Chrome DevTools 中检查：
- 所有 API 请求应该使用新路径（`/api/warehouse/...` 或 `/api/mqtt/...`）
- 不应该有 404 错误

---

## 🚀 快速命令 / Quick Commands

### iOS 一键同步

```bash
npm run ios:production
```

这个命令会：
1. 构建生产版本
2. 复制到 iOS
3. 打开 Xcode

### Android 一键同步

```bash
npm run build:production && npx cap sync android && npx cap open android
```

或者创建快捷脚本（可选）：

```bash
# 添加到 package.json scripts
"android:production": "npm run build:production && npx cap sync android && npx cap open android"
```

---

## ⚠️ 常见问题 / Troubleshooting

### iOS 问题

#### 问题 1: CocoaPods 编码错误

**错误信息**:
```
WARNING: CocoaPods requires your terminal to be using UTF-8 encoding.
```

**解决方法**:
```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
npx cap sync ios
```

#### 问题 2: Pod 安装失败

**错误信息**:
```
[!] CocoaPods could not find compatible versions
```

**解决方法**:
```bash
cd ios/App
pod repo update
pod install
cd ../..
npx cap sync ios
```

#### 问题 3: Xcode 构建错误

**检查**:
1. 确认 Xcode 版本 >= 14.0
2. 确认 iOS Deployment Target >= 12.0
3. 清理构建：`⌘+Shift+K`，然后重新构建

### Android 问题

#### 问题 1: Gradle 同步失败

**错误信息**:
```
Failed to sync Gradle project
```

**解决方法**:
```bash
cd android
./gradlew clean
./gradlew build
cd ..
npx cap sync android
```

#### 问题 2: SDK 版本不匹配

**检查**:
1. 打开 `android/build.gradle`
2. 确认 `compileSdkVersion` >= 33
3. 确认 `targetSdkVersion` >= 33

#### 问题 3: 构建错误

**解决方法**:
1. 在 Android Studio 中：`File` → `Invalidate Caches / Restart`
2. 清理构建：`Build` → `Clean Project`
3. 重新构建：`Build` → `Rebuild Project`

---

## ✅ 验证清单 / Verification Checklist

### iOS 验证

- [ ] `npm run build:production` 成功
- [ ] `npx cap sync ios` 成功
- [ ] Xcode 项目打开无错误
- [ ] 项目构建成功（⌘+B）
- [ ] 应用在模拟器/真机上运行
- [ ] Dashboard 正常加载
- [ ] API 请求使用新路径（检查网络请求）
- [ ] 无 404 错误
- [ ] 主要功能正常工作

### Android 验证

- [ ] `npm run build:production` 成功
- [ ] `npx cap sync android` 成功
- [ ] Android Studio 项目打开无错误
- [ ] Gradle 同步成功
- [ ] 项目构建成功
- [ ] 应用在模拟器/真机上运行
- [ ] Dashboard 正常加载
- [ ] API 请求使用新路径（检查网络请求）
- [ ] 无 404 错误
- [ ] 主要功能正常工作

---

## 📊 预期结果 / Expected Results

### 成功标志

1. **构建成功**: 没有编译错误
2. **应用运行**: 应用可以正常启动
3. **API 调用**: 所有 API 请求使用新路径
4. **功能正常**: 所有主要功能正常工作
5. **无错误**: 控制台/Logcat 中没有 404 或路径错误

### 需要检查的 API 路径

在应用运行时，检查网络请求应该看到：

**Warehouse API**:
- ✅ `/api/warehouse/items`
- ✅ `/api/warehouse/rooms`
- ✅ `/api/warehouse/categories`
- ✅ `/api/warehouse/search`
- ✅ `/api/warehouse/dashboard`

**MQTT API**:
- ✅ `/api/mqtt/iot/devices`
- ✅ `/api/mqtt/provisioning`
- ✅ `/api/mqtt/discover`

**不应该看到**:
- ❌ `/api/items` (旧路径)
- ❌ `/api/rooms` (旧路径)
- ❌ `/api/iot` (旧路径)

---

## 🎯 下一步 / Next Steps

完成同步后：

1. **测试所有功能**: 确保所有功能正常工作
2. **检查性能**: 确保应用性能没有下降
3. **准备发布**: 如果一切正常，可以准备新版本发布
4. **更新版本号**: 如果需要，更新 iOS/Android 版本号

---

## 📞 需要帮助？/ Need Help?

如果遇到问题：

1. **检查构建日志**: 查看详细的错误信息
2. **检查 Capacitor 状态**: `npx cap doctor`
3. **检查网络请求**: 使用浏览器开发者工具或网络监控
4. **查看文档**: `docs/MIGRATION_SUMMARY.md`

