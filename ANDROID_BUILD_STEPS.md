# Android 构建步骤
## Android Build Steps

**版本**: 1.0.19 (Code 19)  
**最后更新**: 2025-11-21

---

## 🚀 完整构建流程 / Complete Build Process

### 步骤 1: 准备构建环境

```bash
# 确保在项目根目录
cd /Users/seanli/smart-warehouse

# 检查版本号
grep "versionCode\|versionName" android/app/build.gradle
# 应该显示: versionCode 19, versionName "1.0.19"
```

### 步骤 2: 构建 Web 代码（如果需要）

```bash
# 如果还没有构建，运行：
npm run build:production

# 然后同步到 Android：
npx cap sync android
```

### 步骤 3: 打开 Android Studio

```bash
npx cap open android
```

这会自动打开 Android Studio 并加载项目。

---

## 📱 在 Android Studio 中构建 / Building in Android Studio

### 选项 A: 生成签名包（用于发布）⭐

#### 1. 打开构建菜单
- 点击顶部菜单: **Build**
- 选择: **Generate Signed Bundle / APK**

#### 2. 选择包类型
- **Android App Bundle (.aab)** - 用于 Google Play Store（推荐）
- **APK** - 用于直接安装测试

#### 3. 选择签名密钥
- 如果已有密钥文件 (`smart-warehouse-release-key.jks`):
  - 点击 "Choose existing..."
  - 选择密钥文件
  - 输入密钥密码和别名密码
- 如果没有密钥:
  - 点击 "Create new..."
  - 填写密钥信息:
    - Key store path: 选择保存位置
    - Password: 输入密钥库密码
    - Key alias: 输入别名（如 `smart-warehouse`）
    - Key password: 输入密钥密码
    - Validity: 10000 年
    - Certificate: 填写信息
  - **重要**: 保存密钥信息，丢失后无法更新应用！

#### 4. 选择构建类型
- 选择: **release**
- 点击: **Finish**

#### 5. 等待构建完成
- 构建完成后会显示通知
- 点击 "locate" 查看文件位置

#### 6. 找到构建文件

**AAB 文件** (用于 Play Store):
```
android/app/build/outputs/bundle/release/app-release.aab
```

**APK 文件** (用于直接安装):
```
android/app/build/outputs/apk/release/app-release.apk
```

---

### 选项 B: 直接运行（用于测试）

#### 1. 选择设备
- 点击顶部设备选择器
- 选择连接的设备或模拟器
- 如果没有设备: **Tools → Device Manager** 创建模拟器

#### 2. 运行应用
- 点击 **Run** 按钮 (▶️) 或按 `⌘R`
- 等待应用安装和启动

---

## 🔧 使用命令行构建（高级） / Command Line Build

### 构建 Release APK

```bash
cd android
./gradlew assembleRelease
```

**输出文件**:
```
android/app/build/outputs/apk/release/app-release.apk
```

### 构建 Release AAB

```bash
cd android
./gradlew bundleRelease
```

**输出文件**:
```
android/app/build/outputs/bundle/release/app-release.aab
```

### 清理构建

```bash
cd android
./gradlew clean
```

---

## 📤 上传到 Google Play Store / Upload to Play Store

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
   - 填写版本说明:
     ```
     Version: 1.0.19
     What's new:
     - Added Tuya Home to Household mapping
     - Improved provisioning flow
     - Bug fixes and performance improvements
     ```

5. **提交审核**
   - 检查所有信息
   - 点击 "Save" 然后 "Review release"
   - 提交审核

---

## 🧪 测试构建 / Testing Build

### 安装 APK 到设备

#### 方法 1: 通过 USB (ADB)

```bash
# 检查设备连接
adb devices

# 安装 APK
adb install android/app/build/outputs/apk/release/app-release.apk

# 如果已安装，使用 -r 覆盖
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

#### 方法 2: 通过文件传输

1. 将 APK 文件复制到设备
2. 在设备上打开文件管理器
3. 找到 APK 文件并点击
4. 允许"未知来源"安装（如需要）
5. 点击"安装"

### 验证安装

- 打开应用
- 检查版本号（应该是 1.0.19）
- 测试功能:
  - [ ] 登录功能
  - [ ] 配网功能
  - [ ] Tuya Home 对应关系

---

## ⚠️ 常见问题 / Common Issues

### 问题 1: Gradle 同步失败

**症状**: Android Studio 显示 Gradle 同步错误

**解决**:
```bash
cd android
./gradlew clean
./gradlew --refresh-dependencies
cd ..
```

然后在 Android Studio 中:
- **File → Invalidate Caches / Restart**
- 选择 "Invalidate and Restart"

### 问题 2: 找不到签名密钥

**症状**: 构建时提示找不到密钥文件

**解决**:
- 检查密钥文件是否存在
- 如果丢失，需要创建新密钥（但无法更新现有应用）
- 创建新密钥: 在 Android Studio 中选择 "Create new..."

### 问题 3: 构建错误

**症状**: 构建失败，显示错误信息

**解决**:
1. 查看 Android Studio 的 "Build" 标签页
2. 检查错误信息
3. 确保所有依赖已安装
4. 尝试清理构建:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```

### 问题 4: 版本号错误

**症状**: 构建的版本号不对

**解决**:
- 检查 `android/app/build.gradle`
- 当前应该是:
  ```gradle
  versionCode 19
  versionName "1.0.19"
  ```
- 如果不对，更新后重新构建

---

## 📋 构建前检查清单 / Pre-Build Checklist

- [ ] 版本号已更新 (`1.0.19`, Code `19`)
- [ ] Web 代码已构建 (`npm run build:production`)
- [ ] Android 已同步 (`npx cap sync android`)
- [ ] Gradle 同步成功
- [ ] 签名密钥已准备
- [ ] 测试设备已连接（如需要）

---

## 🎯 快速命令参考 / Quick Command Reference

```bash
# 完整构建流程
npm run build:production          # 构建 Web 代码
npx cap sync android              # 同步到 Android
npx cap open android              # 打开 Android Studio

# 在 Android Studio 中:
# Build → Generate Signed Bundle / APK
# 选择 AAB 或 APK
# 选择签名密钥
# 选择 Release
# 完成构建

# 命令行构建（高级）
cd android
./gradlew assembleRelease         # 构建 APK
./gradlew bundleRelease           # 构建 AAB
```

---

## 📚 相关文档 / Related Documents

- `docs/ANDROID_BUILD_GUIDE.md` - 详细构建指南
- `docs/ANDROID_RUN_TROUBLESHOOTING.md` - 故障排除
- `ANDROID_QUICK_STEPS.md` - 快速步骤
- `android/app/build.gradle` - 构建配置

---

## ✅ 构建完成后的文件位置

**AAB (Play Store)**:
```
android/app/build/outputs/bundle/release/app-release.aab
```

**APK (直接安装)**:
```
android/app/build/outputs/apk/release/app-release.apk
```

**未签名 APK** (如果使用命令行):
```
android/app/build/outputs/apk/release/app-release-unsigned.apk
```

---

## 🎉 完成！

构建完成后，你可以：
1. **测试**: 安装 APK 到设备测试
2. **发布**: 上传 AAB 到 Google Play Store
3. **分发**: 通过其他渠道分发 APK

