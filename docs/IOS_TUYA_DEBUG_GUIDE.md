# iOS Tuya 配网调试指南
## iOS Tuya Provisioning Debug Guide

**最后更新**: 2025-11-21  
**状态**: 🔧 **调试中**

---

## 🔍 问题诊断 / Problem Diagnosis

### 错误消息: "The string did not match the expected pattern"

**可能来源**:
1. **Capacitor 插件参数验证**
   - 方法签名不匹配
   - 参数类型错误
   - 参数格式验证失败

2. **Tuya SDK 初始化失败**
   - SDK 凭证错误
   - SDK 版本不兼容
   - 网络连接问题

3. **参数传递问题**
   - SSID/密码格式不正确
   - 模式参数不匹配
   - 缺少必需参数

---

## 🔧 调试步骤 / Debugging Steps

### 1. 检查插件注册

**验证插件是否正确注册**:

```bash
# 在 Xcode 中检查
# Build Phases > Compile Sources
# 确保 TuyaProvisioningPlugin.swift 已包含
```

**检查 CAP_PLUGIN 宏**:
```swift
// ios/App/App/Plugins/TuyaProvisioningPlugin.swift
CAP_PLUGIN(TuyaProvisioningPlugin, "TuyaProvisioning",
           CAP_PLUGIN_METHOD(initialize, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(startProvisioning, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getStatus, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(stopProvisioning, CAPPluginReturnPromise);
           )
```

### 2. 检查 SDK 初始化

**验证环境变量**:
```bash
# 检查环境变量是否设置
echo $TUYA_IOS_SDK_APP_KEY
echo $TUYA_IOS_SDK_APP_SECRET
```

**验证 API 端点**:
```bash
# 测试 API 端点
curl http://localhost:3000/api/mqtt/tuya/sdk-config
```

**检查初始化日志**:
```swift
// 在 Xcode 控制台查看
// 应该看到: "Tuya SDK initialized successfully"
```

### 3. 检查参数传递

**验证参数格式**:
```typescript
// lib/provisioning/native-client.ts
const result = await TuyaProvisioning.startProvisioning({
  vendor: 'tuya',
  ssid: 'MyWiFi',        // ✅ 字符串
  password: 'password',  // ✅ 字符串
  mode: 'ez',            // ✅ 支持的模式
  householdId: '...',    // ✅ 可选
  householdName: '...',  // ✅ 可选
})
```

**检查参数验证**:
```swift
// ios/App/App/Plugins/TuyaProvisioningPlugin.swift
guard let mode = call.getString("mode") else {
    call.reject("Provisioning mode is required")
    return
}
```

### 4. 检查权限配置

**验证 Info.plist**:
```xml
<!-- ios/App/App/Info.plist -->
<key>NSLocalNetworkUsageDescription</key>
<string>Local network access is required for Tuya device provisioning</string>
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Bluetooth is required for Tuya device provisioning</string>
```

### 5. 检查 Xcode 控制台日志

**查看完整错误堆栈**:
1. 在 Xcode 中运行应用
2. 打开控制台 (View > Debug Area > Activate Console)
3. 查看错误消息和堆栈跟踪
4. 查找 "The string did not match the expected pattern" 的完整上下文

---

## 🐛 常见问题 / Common Issues

### 问题 1: SDK 初始化失败

**症状**:
- 错误: "Tuya SDK not initialized"
- 初始化返回 `false`

**解决方案**:
1. 检查环境变量 `TUYA_IOS_SDK_APP_KEY` 和 `TUYA_IOS_SDK_APP_SECRET`
2. 验证 API 端点 `/api/mqtt/tuya/sdk-config` 返回正确的凭证
3. 检查网络连接
4. 验证 SDK 版本兼容性

### 问题 2: 参数验证失败

**症状**:
- 错误: "The string did not match the expected pattern"
- 参数格式不正确

**解决方案**:
1. 检查 SSID 和密码格式（必须是字符串）
2. 验证模式参数（必须是支持的模式之一）
3. 检查是否有特殊字符需要转义
4. 验证参数类型（使用 `call.getString()` 获取字符串参数）

### 问题 3: 插件未加载

**症状**:
- 错误: "Plugin not found"
- 原生方法调用失败

**解决方案**:
1. 运行 `npx cap sync ios`
2. 在 Xcode 中清理构建 (Product > Clean Build Folder)
3. 重新构建项目
4. 验证插件文件在编译目标中

### 问题 4: 权限问题

**症状**:
- 配网失败
- 无法发现设备

**解决方案**:
1. 检查 Info.plist 权限配置
2. 在设备设置中授予权限
3. 验证权限请求是否正确触发

---

## 🔍 调试代码 / Debug Code

### 添加日志

**在 Swift 代码中添加日志**:
```swift
@objc func startProvisioning(_ call: CAPPluginCall) {
    print("🔍 [TuyaProvisioning] startProvisioning called")
    print("🔍 [TuyaProvisioning] Mode: \(call.getString("mode") ?? "nil")")
    print("🔍 [TuyaProvisioning] SSID: \(call.getString("ssid") ?? "nil")")
    
    guard isInitialized else {
        print("❌ [TuyaProvisioning] SDK not initialized")
        call.reject("Tuya SDK not initialized. Call initialize() first.")
        return
    }
    
    // ... rest of the code
}
```

**在 TypeScript 代码中添加日志**:
```typescript
export const startNativeTuyaProvisioning = async (
  options: TuyaStartProvisioningOptions,
): Promise<TuyaProvisioningResult> => {
  console.log('🔍 [NativeClient] Starting Tuya provisioning:', options)
  
  const initialized = await ensureTuyaInitialized()
  console.log('🔍 [NativeClient] SDK initialized:', initialized)
  
  if (!initialized) {
    return {
      success: false,
      status: 'failed',
      error: 'Tuya SDK not initialized',
    }
  }
  
  try {
    const result = await TuyaProvisioning.startProvisioning(options)
    console.log('🔍 [NativeClient] Provisioning result:', result)
    return result
  } catch (error) {
    console.error('❌ [NativeClient] Provisioning error:', error)
    return {
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
```

---

## 📋 检查清单 / Checklist

### 插件注册
- [ ] `TuyaProvisioningPlugin.swift` 在编译目标中
- [ ] `CAP_PLUGIN` 宏正确配置
- [ ] 所有方法都有 `@objc` 标记
- [ ] 方法签名匹配 TypeScript 接口

### SDK 初始化
- [ ] 环境变量已设置
- [ ] API 端点返回正确的凭证
- [ ] SDK 初始化成功（查看日志）
- [ ] SDK 版本兼容

### 参数传递
- [ ] SSID 和密码格式正确
- [ ] 模式参数匹配
- [ ] 所有必需参数已提供
- [ ] 参数类型正确

### 权限配置
- [ ] Info.plist 权限已配置
- [ ] 设备权限已授予
- [ ] 权限请求正确触发

### 网络和连接
- [ ] 设备连接到 WiFi
- [ ] 网络连接正常
- [ ] Tuya 服务器可访问

---

## 🚀 测试步骤 / Testing Steps

### 1. 基本测试

```typescript
// 测试初始化
const initResult = await TuyaProvisioning.initialize({
  appKey: 'test-key',
  appSecret: 'test-secret',
})
console.log('Init result:', initResult)

// 测试配网
const provisionResult = await TuyaProvisioning.startProvisioning({
  vendor: 'tuya',
  ssid: 'TestWiFi',
  password: 'test123',
  mode: 'ez',
})
console.log('Provision result:', provisionResult)
```

### 2. 完整流程测试

1. **初始化 SDK**
   - 调用 `initialize()`
   - 验证返回 `initialized: true`

2. **启动配网**
   - 调用 `startProvisioning()`
   - 验证返回 `success: true` 或错误消息

3. **查询状态**
   - 调用 `getStatus()`
   - 验证状态更新

4. **停止配网**
   - 调用 `stopProvisioning()`
   - 验证成功停止

---

## 📚 参考资源 / Reference Resources

### 相关文件
- `ios/App/App/Plugins/TuyaProvisioningPlugin.swift` - 原生插件实现
- `lib/provisioning/native-client.ts` - TypeScript 客户端
- `lib/plugins/tuya/index.ts` - 插件接口定义
- `app/api/mqtt/tuya/sdk-config/route.ts` - SDK 凭证 API

### Tuya 文档
- [Tuya iOS SDK 文档](https://developer.tuya.com/en/docs/ios-sdk)
- [Tuya 配网指南](https://developer.tuya.com/en/docs/iot/device-activation)

---

## ✅ 下一步 / Next Steps

1. **收集错误信息**
   - 查看 Xcode 控制台完整错误堆栈
   - 检查 JavaScript 控制台错误
   - 记录错误发生的具体步骤

2. **验证配置**
   - 检查环境变量
   - 验证 API 端点
   - 确认权限配置

3. **测试修复**
   - 根据错误信息修复问题
   - 重新测试功能
   - 验证修复是否有效

---

**关键提示**: "The string did not match the expected pattern" 错误通常来自参数验证。请检查所有参数的类型和格式是否正确。

