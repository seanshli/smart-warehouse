# 🤖 Android 快速操作指南
## Quick Steps for Android After Migration

## 🚀 3 个简单步骤

```bash
# 步骤 1: 构建 Web 应用
npm run build:production

# 步骤 2: 同步到 Android
npx cap sync android

# 步骤 3: 打开 Android Studio
npx cap open android
```

**在 Android Studio 中**:
1. 点击 "Sync Project with Gradle Files" 🔄
2. 点击 "Build" → "Make Project" (⌘F9)
3. 选择设备/模拟器
4. 点击 "Run" 按钮 (▶️) 或按 `⌘R`
5. 测试功能是否正常

---

## ⚠️ 当前问题

诊断发现：
- ⚠️ **public 目录只有 2 个文件**（应该有很多文件）
- ⚠️ **ANDROID_HOME 未设置**（如果使用 Android Studio，这不是问题）
- ⚠️ **adb 未找到**（如果使用 Android Studio，这不是问题）

**需要立即修复**:
```bash
# 重新同步（这会修复 public 目录问题）
npm run build:production
npx cap sync android
```

---

## ✅ 验证清单

### 检查项目是否同步成功

**Android**:
- 检查 `android/app/src/main/assets/public/` 目录包含最新文件
- 应该看到 `index.html`、`_next/` 目录等

```bash
ls -la android/app/src/main/assets/public/
# 应该看到很多文件，不只是 2 个
```

### 检查 API 路径是否正确

运行应用后，检查网络请求应该看到：
- ✅ `/api/warehouse/items` (新路径)
- ✅ `/api/mqtt/iot/devices` (新路径)
- ❌ 不应该有 `/api/items` (旧路径)

---

## 🔧 常见问题修复

### 问题 1: public 目录文件太少

**症状**: 诊断显示只有 2 个文件

**修复**:
```bash
npm run build:production
npx cap sync android
```

### 问题 2: Gradle 同步失败

**修复**:
```bash
cd android
./gradlew clean
./gradlew --refresh-dependencies
cd ..
```

### 问题 3: 设备未连接

**检查**:
```bash
# 如果安装了 Android SDK
adb devices

# 或在 Android Studio 中
# Tools → Device Manager
```

### 问题 4: 网络连接错误

**检查**:
1. 在设备/模拟器上打开浏览器
2. 访问: `https://smart-warehouse-five.vercel.app`
3. 确认可以访问

---

## 📋 Android Studio 操作步骤

### 1. 打开项目
```bash
npx cap open android
```

### 2. 同步 Gradle
- 点击 "Sync Project with Gradle Files" 按钮（顶部）
- 等待同步完成

### 3. 清理项目
- Build → Clean Project

### 4. 构建项目
- Build → Make Project (⌘F9)
- 或点击工具栏的锤子图标 🔨

### 5. 选择设备
- 点击设备选择器（顶部工具栏）
- 选择模拟器或连接的设备
- 如果没有设备，点击 "Device Manager" 创建模拟器

### 6. 运行应用
- 点击 Run 按钮 (▶️) 或按 `⌘R`
- 等待应用安装和启动

### 7. 查看日志
- 打开 Logcat 窗口（底部）
- 过滤: `error` 或应用包名 `com.smartwarehouse.app`

---

## 🎯 快速修复命令

```bash
# 完整重置
npm run build:production
npx cap sync android

# 清理构建
cd android
./gradlew clean
cd ..

# 在 Android Studio 中
# Build → Clean Project
# Build → Rebuild Project
# Run (▶️)
```

---

## 📖 详细文档

完整指南请查看: `docs/ANDROID_RUN_TROUBLESHOOTING.md`

