# Android 构建指南
## Android Build Guide

**最后更新**: 2025-11-21

---

## 🚀 快速构建步骤 / Quick Build Steps

### 方法 1: 使用 Android Studio（推荐）⭐

1. **打开项目**
   ```bash
   npx cap open android
   ```

2. **在 Android Studio 中**:
   - 等待 Gradle 同步完成
   - 点击菜单: **Build → Generate Signed Bundle / APK**
   - 选择: **Android App Bundle (.aab)** (推荐用于 Play Store)
     - 或选择: **APK** (用于直接安装测试)

3. **选择签名密钥**:
   - 如果已有密钥: 选择 `smart-warehouse-release-key.jks`
   - 如果没有: 创建新密钥

4. **选择构建类型**:
   - **Release** (用于发布)
   - **Debug** (用于测试)

5. **完成构建**:
   - 等待构建完成
   - APK/AAB 文件会在 `android/app/release/` 目录

---

### 方法 2: 使用命令行（高级）

```bash
# 1. 进入 Android 目录
cd android

# 2. 构建 Release APK
./gradlew assembleRelease

# 或构建 Release AAB (用于 Play Store)
./gradlew bundleRelease

# 3. 输出文件位置
# APK: android/app/build/outputs/apk/release/app-release.apk
# AAB: android/app/build/outputs/bundle/release/app-release.aab
```

---

## 📋 详细步骤 / Detailed Steps

### 步骤 1: 准备环境

确保已安装：
- ✅ Android Studio (最新版本)
- ✅ Java JDK 17+
- ✅ Android SDK
- ✅ Gradle

### 步骤 2: 打开项目

```bash
# 从项目根目录
npx cap open android
```

这会：
- 打开 Android Studio
- 自动同步 Gradle
- 加载项目配置

### 步骤 3: 等待 Gradle 同步

- Android Studio 会自动开始 Gradle 同步
- 等待 "Gradle sync finished" 消息
- 如果有错误，查看 "Build" 标签页

### 步骤 4: 生成签名包

#### 选项 A: Android App Bundle (.aab) - 用于 Play Store

1. **菜单**: `Build → Generate Signed Bundle / APK`
2. **选择**: `Android App Bundle`
3. **点击**: `Next`
4. **选择密钥**:
   - 如果已有: 选择 `smart-warehouse-release-key.jks`
   - 如果没有: 点击 `Create new...` 创建新密钥
5. **输入密钥信息**:
   - Key store path: 选择或创建 `.jks` 文件
   - Key store password: 输入密码
   - Key alias: 输入别名
   - Key password: 输入密钥密码
6. **选择构建类型**: `release`
7. **点击**: `Finish`
8. **等待构建完成**

#### 选项 B: APK - 用于直接安装

1. **菜单**: `Build → Generate Signed Bundle / APK`
2. **选择**: `APK`
3. **后续步骤同选项 A**

### 步骤 5: 找到构建文件

构建完成后，文件位置：

**AAB (Play Store)**:
```
android/app/build/outputs/bundle/release/app-release.aab
```

**APK (直接安装)**:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 🔑 签名密钥管理 / Signing Key Management

### 如果已有密钥

密钥文件应该在项目根目录或 `android/` 目录：
- `smart-warehouse-release-key.jks`

### 如果没有密钥（创建新密钥）

1. **在 Android Studio 中**:
   - `Build → Generate Signed Bundle / APK`
   - 选择 `Create new...`
   - 填写密钥信息

2. **或使用命令行**:
   ```bash
   keytool -genkey -v -keystore smart-warehouse-release-key.jks \
     -alias smart-warehouse -keyalg RSA -keysize 2048 -validity 10000
   ```

3. **保存密钥信息**:
   - 密钥文件位置
   - 密钥密码
   - 密钥别名
   - **重要**: 丢失密钥将无法更新应用！

---

## 🧪 测试构建 / Testing Build

### 安装 APK 到设备

1. **通过 USB**:
   ```bash
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

2. **通过文件传输**:
   - 将 APK 文件复制到设备
   - 在设备上打开文件
   - 允许"未知来源"安装（如需要）

### 验证安装

- 打开应用
- 检查版本号（应该是 1.0.19）
- 测试功能

---

## 📤 上传到 Play Store / Upload to Play Store

### 使用 AAB 文件

1. **登录 Google Play Console**
   - https://play.google.com/console

2. **选择应用**
   - 选择 "Smart Warehouse"

3. **创建新版本**
   - 进入 "Production" 或 "Internal testing"
   - 点击 "Create new release"

4. **上传 AAB**
   - 上传 `app-release.aab` 文件
   - 填写版本说明
   - 提交审核

---

## ⚠️ 常见问题 / Common Issues

### 问题 1: Gradle 同步失败

**解决方案**:
```bash
# 清理 Gradle 缓存
cd android
./gradlew clean

# 重新同步
./gradlew build
```

### 问题 2: 找不到签名密钥

**解决方案**:
- 检查密钥文件是否存在
- 如果丢失，需要创建新密钥（但无法更新现有应用）

### 问题 3: 构建错误

**解决方案**:
1. 检查 Android Studio 的 "Build" 标签页
2. 查看错误信息
3. 确保所有依赖已安装
4. 尝试 `File → Invalidate Caches / Restart`

### 问题 4: 版本号错误

**解决方案**:
- 检查 `android/app/build.gradle`
- 确保 `versionCode` 和 `versionName` 已更新
- 当前版本: `1.0.19 (Code 19)`

---

## 📝 构建检查清单 / Build Checklist

在构建之前：

- [ ] 版本号已更新 (`1.0.19`)
- [ ] 版本代码已更新 (`19`)
- [ ] Web 代码已构建 (`npm run build:production`)
- [ ] Android 已同步 (`npx cap sync android`)
- [ ] Gradle 同步成功
- [ ] 签名密钥已准备
- [ ] 测试设备已连接（如需要）

---

## 🎯 快速参考 / Quick Reference

```bash
# 1. 构建 Web 代码
npm run build:production

# 2. 同步到 Android
npx cap sync android

# 3. 打开 Android Studio
npx cap open android

# 4. 在 Android Studio 中:
#    Build → Generate Signed Bundle / APK
```

---

## 📚 相关文档 / Related Documents

- `ANDROID_QUICK_STEPS.md` - 快速步骤
- `docs/ANDROID_RUN_TROUBLESHOOTING.md` - 故障排除
- `android/app/build.gradle` - 构建配置

