# 构建和部署指南
## Build and Deploy Guide

**最后更新**: 2025-11-21  
**状态**: ✅ **所有平台已准备好构建和部署**

---

## 📊 当前版本 / Current Versions

| 平台 | 版本号 | 构建号 | 状态 |
|------|--------|--------|------|
| **Web** | `0.1.9` | - | ✅ 已部署 (Vercel) |
| **iOS** | `1.0.22` | `31` | ✅ 已准备好 |
| **Android** | `1.0.22` | `22` | ✅ 已准备好 |

---

## 🚀 iOS 构建和部署 / iOS Build and Deploy

### 准备工作

**状态**: ✅ **已准备好**

**版本信息**:
- **Marketing Version**: 1.0.22
- **Build Number**: 31
- **Bundle ID**: com.smartwarehouse.app

**新功能**:
- ✅ iOS WiFi 原生插件 (`WiFiPlugin.swift`)
- ✅ iOS Tuya 配网完整实现
- ✅ 所有权限已配置

### 构建步骤

#### 1. 同步 Capacitor

```bash
npx cap sync ios
```

#### 2. 打开 Xcode

```bash
npm run ios:production
# 或
npx cap open ios
```

#### 3. 在 Xcode 中构建

1. **选择目标设备**
   - 选择 "Any iOS Device" 或真实设备

2. **构建项目**
   - 按 `⌘ + B` 或 Product → Build

3. **创建 Archive**
   - Product → Archive
   - 等待 Archive 完成

4. **分发应用**
   - 在 Organizer 窗口点击 "Distribute App"
   - 选择 "App Store Connect"
   - 选择 "Upload"
   - 按照向导完成上传

#### 4. TestFlight 部署

1. **等待处理**
   - 上传后等待 App Store Connect 处理（通常 10-30 分钟）

2. **在 App Store Connect 中**
   - 登录 https://appstoreconnect.apple.com
   - 选择应用 → TestFlight
   - 等待构建处理完成

3. **添加测试员**
   - 添加内部测试员或外部测试员
   - 发送测试邀请

---

## 🤖 Android 构建和部署 / Android Build and Deploy

### 准备工作

**状态**: ✅ **框架已准备好**

**版本信息**:
- **Version Name**: 1.0.22
- **Version Code**: 22
- **Package Name**: com.smartwarehouse.app

**新功能**:
- ✅ Android Tuya 配网框架
- ✅ 所有权限已配置
- ⚠️ 等待 SDK 集成

### 构建步骤

#### 1. 同步 Capacitor

```bash
npx cap sync android
```

#### 2. 打开 Android Studio

```bash
npx cap open android
```

#### 3. 在 Android Studio 中构建

1. **等待 Gradle 同步**
   - Android Studio 会自动同步 Gradle
   - 等待同步完成

2. **生成签名密钥**（如果还没有）
   ```bash
   keytool -genkey -v -keystore smart-warehouse-release.keystore \
     -alias smart-warehouse -keyalg RSA -keysize 2048 -validity 10000
   ```

3. **配置签名**
   - 在 `android/app/build.gradle` 中添加签名配置
   - 或使用 Android Studio 的签名配置向导

4. **构建 Release APK/AAB**
   - Build → Generate Signed Bundle/APK
   - 选择 "Android App Bundle (.aab)" 或 "APK"
   - 选择签名密钥
   - 选择 Release 构建类型
   - 点击 "Finish"

#### 4. Google Play 部署

1. **上传到 Google Play Console**
   - 登录 https://play.google.com/console
   - 选择应用 → 发布 → 创建新版本
   - 上传 .aab 文件

2. **填写发布信息**
   - 版本说明
   - 功能亮点
   - 截图和描述

3. **提交审核**
   - 检查所有信息
   - 提交审核

---

## 🌐 Web 部署状态 / Web Deployment Status

**状态**: ✅ **已部署**

- **URL**: https://smart-warehouse-five.vercel.app
- **版本**: 0.1.9
- **部署方式**: Vercel 自动部署
- **状态**: ✅ 已准备好

---

## ✅ 构建前检查清单 / Pre-Build Checklist

### iOS

- [x] 版本号已更新 (1.0.22, Build 31)
- [x] Capacitor 已同步
- [x] 所有插件文件已添加
- [x] 权限配置完整
- [x] Info.plist 配置正确
- [ ] Xcode 项目打开并验证
- [ ] 代码签名配置正确
- [ ] 构建成功
- [ ] Archive 创建成功

### Android

- [x] 版本号已更新 (1.0.22, Code 22)
- [x] Capacitor 已同步
- [x] 所有插件文件已添加
- [x] 权限配置完整
- [x] AndroidManifest.xml 配置正确
- [ ] Android Studio 项目打开并验证
- [ ] Gradle 同步成功
- [ ] 签名密钥配置
- [ ] 构建成功

---

## 🔧 故障排除 / Troubleshooting

### iOS 构建问题

**问题**: CocoaPods 错误
```bash
# 解决方案
cd ios/App
pod install --repo-update
```

**问题**: 代码签名错误
- 检查 Xcode → Signing & Capabilities
- 选择正确的开发团队
- 确保证书有效

### Android 构建问题

**问题**: Gradle 同步失败
```bash
# 解决方案
cd android
./gradlew clean
./gradlew build
```

**问题**: 签名错误
- 检查签名密钥路径
- 验证密钥密码
- 检查 build.gradle 签名配置

---

## 📋 部署后验证 / Post-Deployment Verification

### Web

- [ ] 访问 https://smart-warehouse-five.vercel.app
- [ ] 验证版本号显示正确
- [ ] 测试所有功能
- [ ] 检查控制台错误

### iOS (TestFlight)

- [ ] 在 TestFlight 中安装
- [ ] 测试 WiFi 扫描功能
- [ ] 测试 Tuya 配网功能
- [ ] 验证所有权限请求
- [ ] 检查崩溃报告

### Android (Internal Testing)

- [ ] 在测试设备上安装
- [ ] 测试应用启动
- [ ] 验证权限请求
- [ ] 检查崩溃报告

---

## 🎯 下一步 / Next Steps

1. **iOS 构建**
   - 在 Xcode 中打开项目
   - 构建并创建 Archive
   - 上传到 App Store Connect

2. **Android 构建**
   - 在 Android Studio 中打开项目
   - 生成签名 Bundle
   - 上传到 Google Play Console

3. **测试**
   - 在 TestFlight 中测试 iOS
   - 在内部测试中测试 Android
   - 验证所有功能

---

## 📚 相关文档 / Related Documentation

- `docs/DEPLOYMENT_READY.md` - 部署就绪报告
- `docs/IOS_WIFI_PLUGIN_IMPLEMENTATION.md` - iOS WiFi 插件
- `docs/ANDROID_TUYA_NATIVE_IMPLEMENTATION.md` - Android Tuya 实现
- `APP_STORE_DEPLOYMENT_GUIDE.md` - App Store 部署指南
- `MOBILE_APP_DISTRIBUTION_GUIDE.md` - 移动应用分发指南

---

**所有平台已准备好构建和部署！** 🚀

