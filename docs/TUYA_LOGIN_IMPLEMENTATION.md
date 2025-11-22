# Tuya 用户登录实现指南
## Tuya User Login Implementation Guide

**最后更新**: 2025-11-21

---

## 🔍 当前状态

### 已实现 ✅
- SDK 初始化（appKey/appSecret）
- Home 创建/获取
- 配网功能框架

### 未实现 ⚠️
- **用户登录** - 这是关键缺失部分

---

## 📋 Tuya SDK 认证流程

### 完整流程

1. **SDK 初始化** ✅
   ```swift
   ThingSmartSDK.sharedInstance().start(withAppKey: appKey, secretKey: appSecret)
   ```

2. **用户登录** ⚠️ **需要实现**
   ```swift
   // 方式 1: 访客登录（推荐）
   ThingSmartUser.sharedInstance().loginOrRegister(withCountryCode: "1",
                                                    phoneNumber: nil,
                                                    password: nil,
                                                    createHome: true)
   
   // 方式 2: 账户登录
   ThingSmartUser.sharedInstance().login(withCountryCode: "1",
                                         phoneNumber: "13800138000",
                                         password: "password")
   ```

3. **创建/获取 Home** ✅
   ```swift
   ThingSmartHomeManager.sharedInstance().getCurrentHome()
   ```

4. **配网** ✅
   ```swift
   ThingSmartActivator.sharedInstance().startConfigWiFi(...)
   ```

---

## 🔧 实现方案

### 方案 1: 自动访客登录（推荐）

在 SDK 初始化后自动进行访客登录：

```swift
@objc func initialize(_ call: CAPPluginCall) {
    // ... SDK 初始化 ...
    
    // 检查是否已登录
    if ThingSmartUser.sharedInstance().isLogin {
        isInitialized = true
        call.resolve([...])
        return
    }
    
    // 自动访客登录
    ThingSmartUser.sharedInstance().loginOrRegister(
        withCountryCode: "1",
        phoneNumber: nil,
        password: nil,
        createHome: true
    ) { result in
        if result.success {
            self.isInitialized = true
            call.resolve([
                "initialized": true,
                "loggedIn": true,
                "message": "Tuya SDK initialized and logged in successfully"
            ])
        } else {
            call.reject("Failed to login: \(result.errorMsg ?? "Unknown error")")
        }
    }
}
```

---

### 方案 2: 用户账户登录

如果需要完整功能，实现用户账户登录：

```swift
// 添加登录方法
@objc func login(_ call: CAPPluginCall) {
    guard let countryCode = call.getString("countryCode") ?? "1",
          let phoneNumber = call.getString("phoneNumber"),
          let password = call.getString("password") else {
        call.reject("Phone number and password are required")
        return
    }
    
    ThingSmartUser.sharedInstance().login(
        withCountryCode: countryCode,
        phoneNumber: phoneNumber,
        password: password
    ) { result in
        if result.success {
            call.resolve([
                "success": true,
                "loggedIn": true,
                "message": "Login successful"
            ])
        } else {
            call.reject("Login failed: \(result.errorMsg ?? "Unknown error")")
        }
    }
}
```

---

## ⚠️ 重要说明

### Tuya SDK 版本差异

不同版本的 Tuya SDK 对登录的要求可能不同：

1. **旧版本**: 可能不需要登录就能配网
2. **新版本**: 通常需要登录才能配网和控制

### 检查方法

1. **测试当前实现**:
   - 尝试配网
   - 如果失败，查看错误信息
   - 检查 Xcode 控制台日志

2. **常见错误**:
   - "User not logged in"
   - "Please login first"
   - "Authentication required"

---

## 🚀 实施步骤

### 步骤 1: 检查是否需要登录

1. 运行 iOS 应用
2. 尝试配网
3. 查看是否失败
4. 检查错误信息

### 步骤 2: 如果失败，实现访客登录

1. 更新 `initialize()` 方法
2. 添加自动访客登录
3. 测试配网功能

### 步骤 3: 如果访客登录不支持

1. 实现用户账户登录
2. 添加登录 UI
3. 要求用户输入 Tuya 账户

---

## 📝 代码更新

### iOS 插件更新

已更新 `TuyaProvisioningPlugin.swift`:
- ✅ 检查用户登录状态
- ⚠️ 需要添加访客登录逻辑（如果测试失败）

### 需要添加的 Pod

确保 `Podfile` 包含：
```ruby
pod 'ThingSmartUserKit'  # 用户管理
```

---

## 🔗 相关文件

- `ios/App/App/Plugins/TuyaProvisioningPlugin.swift` - iOS 插件（已更新）
- `ios/App/Podfile` - 需要确认包含 `ThingSmartUserKit`
- `docs/TUYA_USER_LOGIN_REQUIREMENT.md` - 详细说明

---

## ✅ 下一步

1. **测试当前实现** - 尝试配网，看是否失败
2. **如果失败** - 实现访客登录
3. **如果成功** - 说明当前 SDK 版本不需要登录

---

**建议**: 先测试，如果配网失败，再实现登录功能。

