# 原生配网要求
## Native Provisioning Requirement

**最后更新**: 2025-11-21

---

## 🎯 目标 / Goal

确保 iOS 和 Android 的 Tuya 配网功能**完全使用原生实现**，避免回退到 Web API，从而解决当前遇到的问题。

---

## 📊 当前状态 / Current Status

### iOS
- ✅ **原生插件**: `TuyaProvisioningPlugin.swift` 已实现
- ✅ **SDK 集成**: Tuya iOS SDK 已集成
- ✅ **功能完整**: 所有配网模式已实现
- ⚠️ **问题**: 可能在某些情况下回退到 Web API

### Android
- ⚠️ **原生插件**: `TuyaProvisioningPlugin.java` 已创建
- ❌ **SDK 集成**: Tuya Android SDK 未集成
- ❌ **功能实现**: 所有方法都是占位符
- ❌ **问题**: 当前回退到 Web API

---

## 🔧 修复方案 / Fix Solution

### 1. 增强原生平台检测

**文件**: `lib/provisioning/native-client.ts`

**改进**:
- 更严格的平台检测
- 明确检查 iOS 和 Android
- 避免在 Web 环境下使用原生功能

```typescript
export const canUseNativeTuyaProvisioning = (): boolean => {
  try {
    if (typeof window === 'undefined') {
      return false // Server-side rendering
    }
    
    if (!Capacitor) {
      return false
    }
    
    const platform = Capacitor.getPlatform()
    const isNative = platform === 'ios' || platform === 'android'
    const isNativePlatform = Capacitor?.isNativePlatform?.() ?? false
    
    return isNative && isNativePlatform
  } catch (error) {
    return false
  }
}
```

### 2. 改进错误处理

**文件**: `lib/provisioning/native-client.ts`

**改进**:
- 添加明确的错误消息
- 确保原生功能失败时不会静默回退
- 提供清晰的错误反馈

### 3. Android 原生实现（待完成）

**文件**: `android/app/src/main/java/com/smartwarehouse/app/plugins/TuyaProvisioningPlugin.java`

**需要**:
- 集成 Tuya Android SDK
- 实现所有配网方法
- 确保原生功能正常工作

---

## ✅ 已实施的修复 / Implemented Fixes

### 1. 增强平台检测

- ✅ 更严格的 iOS/Android 检测
- ✅ 避免 Web 环境误判
- ✅ 明确的错误消息

### 2. 改进错误处理

- ✅ 原生功能失败时的明确错误
- ✅ 避免静默回退到 Web API
- ✅ 更好的调试信息

---

## 📋 Android 待完成任务 / Android Pending Tasks

### 优先级 1: SDK 集成

1. **解压 Tuya Android SDK**
   ```bash
   cd Android_SDK-3
   tar -xzf Android_SDK.tar.gz
   tar -xzf security-algorithm.tar.gz
   ```

2. **添加到 Gradle 依赖**
   ```gradle
   // android/app/build.gradle
   dependencies {
       implementation files('libs/tuya-sdk.aar')
       // 或使用 Maven
       implementation 'com.tuya.smart:tuya-sdk:xxx'
   }
   ```

3. **配置 SHA256 签名**
   - 在 Tuya 开发者平台配置
   - 添加到环境变量 `TUYA_ANDROID_SDK_SHA256`

### 优先级 2: 功能实现

1. **实现 `initialize()` 方法**
   ```java
   @PluginMethod
   public void initialize(PluginCall call) {
       String appKey = call.getString("appKey");
       String appSecret = call.getString("appSecret");
       
       // 初始化 Tuya SDK
       TuyaHomeSdk.init(getContext(), appKey, appSecret);
       
       JSObject result = new JSObject();
       result.put("initialized", true);
       result.put("native", true);
       call.resolve(result);
   }
   ```

2. **实现 `startProvisioning()` 方法**
   - EZ 模式配网
   - AP 模式配网
   - 其他模式

3. **实现 `getStatus()` 和 `stopProvisioning()` 方法**

### 优先级 3: 权限配置

1. **添加 Android 权限**
   ```xml
   <!-- android/app/src/main/AndroidManifest.xml -->
   <uses-permission android:name="android.permission.INTERNET" />
   <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
   <uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   <uses-permission android:name="android.permission.BLUETOOTH" />
   <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
   ```

---

## 🔍 验证步骤 / Verification Steps

### iOS 验证

1. **检查平台检测**
   ```javascript
   // 在浏览器控制台或 React DevTools
   console.log('Platform:', Capacitor.getPlatform())
   console.log('Is Native:', Capacitor.isNativePlatform())
   console.log('Can Use Native:', canUseNativeTuyaProvisioning())
   ```

2. **测试配网流程**
   - 打开配网界面
   - 检查是否使用原生插件
   - 查看控制台日志
   - 验证配网成功

### Android 验证

1. **检查平台检测**（SDK 集成后）
   - 同上 iOS 验证步骤

2. **测试配网流程**（功能实现后）
   - 同上 iOS 验证步骤

---

## 🚨 常见问题 / Common Issues

### 问题 1: 仍然使用 Web API

**原因**:
- 平台检测失败
- SDK 初始化失败
- 原生插件未注册

**解决**:
1. 检查 `canUseNativeTuyaProvisioning()` 返回值
2. 检查 SDK 初始化日志
3. 验证插件注册（`MainActivity.java` / `AppDelegate.swift`）

### 问题 2: "Tuya SDK not initialized"

**原因**:
- 环境变量未设置
- API 端点返回错误
- SDK 凭证无效

**解决**:
1. 检查 Vercel 环境变量
2. 测试 `/api/mqtt/tuya/sdk-config` 端点
3. 验证 SDK 凭证

### 问题 3: Android 回退到 Web API

**原因**:
- Android SDK 未集成
- 功能未实现
- 平台检测失败

**解决**:
1. 集成 Tuya Android SDK
2. 实现所有配网方法
3. 验证平台检测

---

## 📝 代码更改摘要 / Code Changes Summary

### 已修改文件

1. **`lib/provisioning/native-client.ts`**
   - ✅ 增强 `canUseNativeTuyaProvisioning()` 检测
   - ✅ 改进 `startNativeTuyaProvisioning()` 错误处理
   - ✅ 添加明确的错误消息

### 待修改文件

1. **`android/app/src/main/java/com/smartwarehouse/app/plugins/TuyaProvisioningPlugin.java`**
   - ❌ 集成 Tuya Android SDK
   - ❌ 实现所有配网方法
   - ❌ 添加错误处理

---

## ✅ 总结 / Summary

### iOS
- ✅ **原生检测**: 已增强
- ✅ **错误处理**: 已改进
- ✅ **功能完整**: 已实现
- ⏳ **测试**: 待验证

### Android
- ✅ **原生检测**: 已增强
- ✅ **错误处理**: 已改进
- ❌ **SDK 集成**: 待完成
- ❌ **功能实现**: 待完成

---

**下一步**: 完成 Android SDK 集成和功能实现，确保所有平台都使用原生配网。🚀

