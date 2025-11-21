# Android 运行问题排查指南
## Android Run Issues Troubleshooting Guide

## 🔍 常见问题 / Common Issues

### 问题 1: 应用无法启动 / App Won't Launch

**症状**:
- 构建成功，但应用无法安装或启动
- 应用启动后立即崩溃

**可能原因**:
1. 缺少必要的文件或资源
2. 网络连接问题
3. 签名问题
4. 设备/模拟器问题

**解决方法**:

#### 步骤 1: 检查 Logcat 错误
在 Android Studio 中：
1. 打开 Logcat 窗口（底部）
2. 过滤错误: 输入 `error` 或 `exception`
3. 查看红色错误消息

或在终端中：
```bash
adb logcat | grep -i error
```

#### 步骤 2: 清理并重新构建
```bash
cd android
./gradlew clean
./gradlew build
cd ..
```

#### 步骤 3: 重新同步
```bash
npm run build:production
npx cap sync android
```

#### 步骤 4: 检查设备/模拟器
```bash
# 查看连接的设备
adb devices

# 如果没有设备，启动模拟器
# 在 Android Studio 中: Tools → Device Manager
```

---

### 问题 2: 网络连接错误 / Network Connection Error

**症状**:
- 应用启动但无法加载内容
- 显示网络错误或空白页面

**可能原因**:
1. 无法连接到 Vercel 服务器
2. HTTPS 证书问题
3. 网络安全配置问题

**解决方法**:

#### 检查网络连接
```bash
# 在设备/模拟器上测试
adb shell "curl https://smart-warehouse-five.vercel.app"
```

#### 检查 AndroidManifest.xml
确保有 INTERNET 权限：
```xml
<uses-permission android:name="android.permission.INTERNET" />
```

#### 检查网络安全配置
确保 `android/app/src/main/res/xml/network_security_config.xml` 存在：
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
```

并在 AndroidManifest.xml 中引用：
```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

#### 检查 Capacitor 配置
确保 `capacitor.config.json` 中的服务器 URL 正确：
```json
{
  "server": {
    "url": "https://smart-warehouse-five.vercel.app",
    "cleartext": false
  }
}
```

---

### 问题 3: 构建错误 / Build Error

**症状**:
- Gradle 构建失败
- 依赖项错误

**解决方法**:

#### 清理 Gradle 缓存
```bash
cd android
./gradlew clean
rm -rf .gradle
rm -rf app/build
cd ..
```

#### 重新同步依赖
```bash
cd android
./gradlew --refresh-dependencies
cd ..
```

#### 检查 Gradle 版本
确保 `android/gradle/wrapper/gradle-wrapper.properties` 中的 Gradle 版本正确：
```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.0-bin.zip
```

---

### 问题 4: 签名错误 / Signing Error

**症状**:
- 构建失败，显示签名错误
- "No signing config found"

**解决方法**:

#### 调试版本（自动签名）
调试版本使用默认调试密钥，通常不需要配置。

#### 发布版本（需要签名）
在 `android/app/build.gradle` 中配置：
```gradle
android {
    signingConfigs {
        release {
            storeFile file('path/to/keystore.jks')
            storePassword 'your-store-password'
            keyAlias 'your-key-alias'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

---

### 问题 5: 文件缺失 / Missing Files

**症状**:
- 构建成功但运行时崩溃
- Logcat 显示 "file not found" 错误

**解决方法**:

#### 检查 public 目录
```bash
ls -la android/app/src/main/assets/public/
```

应该看到：
- `index.html`
- `_next/` 目录
- 其他静态文件

如果没有，运行：
```bash
npm run build:production
npx cap sync android
```

---

### 问题 6: 设备未连接 / Device Not Connected

**症状**:
- 无法选择设备运行
- "No devices found"

**解决方法**:

#### 检查 ADB 连接
```bash
adb devices
```

如果列表为空：
1. 确保设备已连接并启用 USB 调试
2. 确保模拟器已启动
3. 重启 ADB:
   ```bash
   adb kill-server
   adb start-server
   adb devices
   ```

#### 启用 USB 调试（真机）
1. 设置 → 关于手机
2. 连续点击 "版本号" 7 次
3. 返回设置 → 开发者选项
4. 启用 "USB 调试"

---

## 🔧 完整诊断流程 / Complete Diagnostic Process

### 步骤 1: 运行诊断脚本
```bash
./scripts/diagnose-android-issues.sh
```

### 步骤 2: 检查 Android Studio Logcat
1. 在 Android Studio 中打开 Logcat（底部窗口）
2. 过滤错误: 输入 `error` 或 `exception`
3. 查看所有错误和警告
4. 特别关注红色错误消息

### 步骤 3: 检查设备日志
```bash
# 查看所有日志
adb logcat

# 只查看错误
adb logcat *:E

# 查看应用特定日志
adb logcat | grep "com.smartwarehouse.app"
```

### 步骤 4: 测试网络连接
在设备/模拟器上：
1. 打开浏览器
2. 访问: `https://smart-warehouse-five.vercel.app`
3. 确认可以访问

---

## 📋 检查清单 / Checklist

在报告问题前，请确认：

- [ ] 已运行 `npm run build:production`
- [ ] 已运行 `npx cap sync android`
- [ ] 已清理构建 (`./gradlew clean`)
- [ ] 已检查设备连接 (`adb devices`)
- [ ] 已检查 Android Studio Logcat 错误
- [ ] 已检查网络连接
- [ ] 已检查签名配置
- [ ] 已查看设备日志

---

## 🆘 获取帮助 / Getting Help

如果问题仍然存在，请提供以下信息：

1. **错误消息**: Logcat 中的完整错误
2. **构建日志**: `./gradlew build` 的输出
3. **设备信息**: Android 版本、设备型号
4. **Android Studio 版本**: Help → About
5. **诊断脚本输出**: `./scripts/diagnose-android-issues.sh`

---

## 🎯 快速修复命令 / Quick Fix Commands

```bash
# 完整重置
npm run build:production
npx cap sync android

# 清理构建
cd android
./gradlew clean
./gradlew build
cd ..

# 在 Android Studio 中
# Build → Clean Project
# Build → Rebuild Project
# Run (▶️)
```

---

## 📱 Android Studio 操作步骤

### 1. 打开项目
```bash
npx cap open android
```

### 2. 同步 Gradle
- 点击 "Sync Project with Gradle Files" 按钮
- 或: File → Sync Project with Gradle Files

### 3. 清理项目
- Build → Clean Project

### 4. 构建项目
- Build → Make Project (⌘F9)

### 5. 运行应用
- 选择设备/模拟器
- 点击 Run 按钮 (▶️) 或按 `⌘R`

### 6. 查看日志
- 打开 Logcat 窗口（底部）
- 过滤: `error` 或应用包名 `com.smartwarehouse.app`

---

## 🔍 常见错误消息 / Common Error Messages

### "INSTALL_FAILED_INSUFFICIENT_STORAGE"
**原因**: 设备存储空间不足
**解决**: 清理设备存储空间

### "INSTALL_FAILED_UPDATE_INCOMPATIBLE"
**原因**: 已安装的版本不兼容
**解决**: 卸载旧版本后重新安装

### "INSTALL_PARSE_FAILED_NO_CERTIFICATES"
**原因**: APK 签名问题
**解决**: 检查签名配置

### "NetworkSecurityConfig: No Network Security Config specified"
**原因**: 缺少网络安全配置
**解决**: 创建并配置 `network_security_config.xml`

---

## 📚 相关文档

- `docs/IOS_ANDROID_MIGRATION_STEPS.md` - iOS/Android 迁移步骤
- `docs/CAPACITOR_BUILD_FIX.md` - Capacitor 构建修复
- `IOS_ANDROID_QUICK_STEPS.md` - 快速参考

