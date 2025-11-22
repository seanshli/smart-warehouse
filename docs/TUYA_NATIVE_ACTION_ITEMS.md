# Tuya 原生实现待办事项
## Tuya Native Implementation Action Items

**最后更新**: 2025-11-21

---

## 🎯 总结

### iOS
- **状态**: ✅ **基本完成，需要测试**
- **关键问题**: `ThingSmartUser` 可能包含在 `ThingSmartHomeKit` 中

### Android
- **状态**: ❌ **需要完整实现**
- **主要工作**: SDK 集成和方法实现

---

## ✅ iOS 待办事项

### 1. 验证 ThingSmartUser 可用性 ⚠️

**问题**:
- 代码中使用 `ThingSmartUser.sharedInstance()`
- 但 `ThingSmartUserKit` 不在 Pod 仓库中
- 可能包含在 `ThingSmartHomeKit` 中

**验证步骤**:
1. 在 Xcode 中打开项目
2. 尝试构建
3. 如果编译错误，检查 `ThingSmartHomeKit` 是否包含用户管理功能
4. 如果不可用，可能需要：
   - 从本地 SDK 添加 `ThingSmartUserKit`
   - 或使用不同的 API

**当前状态**: ⚠️ 需要测试构建

---

### 2. 设置环境变量 ⚠️

**在 Vercel Dashboard 中设置**:
- `TUYA_IOS_SDK_APP_KEY` - iOS SDK App Key
- `TUYA_IOS_SDK_APP_SECRET` - iOS SDK App Secret

**验证**:
```bash
curl https://smart-warehouse-five.vercel.app/api/mqtt/tuya/sdk-config?platform=ios
```

**应该返回**:
```json
{
  "appKey": "...",
  "appSecret": "..."
}
```

---

### 3. 测试功能 ✅

**测试步骤**:
1. 在 Xcode 中构建应用
2. 运行应用
3. 尝试配网功能
4. 检查控制台日志
5. 验证自动账户创建

---

## ❌ Android 待办事项

### 1. 集成 Tuya SDK ❌

**步骤**:
1. **解压 SDK**:
   ```bash
   cd Android_SDK-3
   tar -xzf Android_SDK.tar.gz
   ```

2. **配置 Gradle**:
   - 检查 `android/build.gradle` - Maven 仓库已添加 ✅
   - 在 `android/app/build.gradle` 中添加 SDK 依赖
   - 可能需要添加本地 AAR 文件

3. **添加依赖**:
   ```gradle
   // 在 android/app/build.gradle 的 dependencies 中添加
   implementation 'com.tuya.smart:tuyasmart:3.34.5'
   // 或使用本地 AAR
   implementation(name: 'tuya-sdk-release', ext: 'aar')
   ```

---

### 2. 实现插件方法 ❌

**需要实现的方法**:
- `initialize()` - SDK 初始化
- `login()` - 用户登录
- `logout()` - 用户登出
- `isLoggedIn()` - 检查登录状态
- `startProvisioning()` - 配网（所有模式）
- `getStatus()` - 查询状态
- `stopProvisioning()` - 停止配网

**参考**: iOS 实现 (`ios/App/App/Plugins/TuyaProvisioningPlugin.swift`)

---

### 3. 设置环境变量 ⚠️

**在 Vercel Dashboard 中设置**:
- `TUYA_ANDROID_SDK_APP_KEY` - Android SDK App Key
- `TUYA_ANDROID_SDK_APP_SECRET` - Android SDK App Secret
- `TUYA_ANDROID_SDK_SHA256` - Android App SHA256 签名

**验证**:
```bash
curl https://smart-warehouse-five.vercel.app/api/mqtt/tuya/sdk-config?platform=android
```

---

## 📋 优先级

### 高优先级（iOS）
1. ✅ 测试 iOS 构建（验证 ThingSmartUser 可用性）
2. ⚠️ 设置 iOS SDK 环境变量
3. ✅ 测试配网功能

### 中优先级（Android）
1. ❌ 集成 Android SDK
2. ❌ 实现插件方法
3. ⚠️ 设置 Android SDK 环境变量

---

## 🔍 验证清单

### iOS
- [ ] Xcode 构建成功（无编译错误）
- [ ] ThingSmartUser 可用（无运行时错误）
- [ ] 环境变量已设置
- [ ] SDK Config API 返回正确值
- [ ] 配网功能测试通过

### Android
- [ ] SDK 已集成
- [ ] Gradle 构建成功
- [ ] 所有插件方法已实现
- [ ] 环境变量已设置
- [ ] SDK Config API 返回正确值
- [ ] 配网功能测试通过

---

## 📝 相关文档

- `docs/TUYA_NATIVE_READINESS_CHECKLIST.md` - 详细检查清单
- `docs/ANDROID_TUYA_NATIVE_IMPLEMENTATION.md` - Android 实现指南
- `docs/TUYA_AUTO_ACCOUNT_CREATION.md` - 自动账户创建文档

---

## ✅ 总结

**iOS**: 基本完成，需要测试验证  
**Android**: 需要完整实现 SDK 集成和方法

**下一步**: 
1. 测试 iOS 构建
2. 设置环境变量
3. 开始 Android SDK 集成

