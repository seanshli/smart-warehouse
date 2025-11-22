# iOS 原生插件调试指南
## iOS Native Plugin Debugging Guide

**最后更新**: 2025-11-21

---

## 🔍 问题诊断

### 1. Tuya 原生插件不工作

#### 可能原因：
1. **ThingSmartUser 不可用**
   - 代码使用 `ThingSmartUser.sharedInstance()`
   - 但 `ThingSmartUserKit` 不在 Pod 仓库中
   - 可能包含在 `ThingSmartHomeKit` 中，也可能需要不同的导入方式

2. **插件未正确注册**
   - 使用 `CAP_PLUGIN` 宏应该自动注册
   - 但需要确保插件文件被包含在 Xcode 项目中

3. **SDK 初始化失败**
   - 环境变量未设置
   - SDK 凭证不正确

#### 调试步骤：

1. **检查编译错误**:
   ```bash
   # 在 Xcode 中构建
   # 查看是否有关于 ThingSmartUser 的错误
   ```

2. **检查插件注册**:
   ```swift
   // 在 AppDelegate.swift 中添加日志
   print("Plugins registered: \(CAPBridge.sharedInstance().pluginInstances)")
   ```

3. **检查 SDK 初始化**:
   ```swift
   // 在 TuyaProvisioningPlugin.swift 中添加日志
   print("Tuya SDK initialized: \(isInitialized)")
   ```

4. **测试插件调用**:
   ```javascript
   // 在浏览器控制台测试
   const { TuyaProvisioning } = await import('@/lib/plugins/tuya')
   const result = await TuyaProvisioning.initialize({ appKey: '...', appSecret: '...' })
   console.log('Tuya init result:', result)
   ```

---

### 2. WiFi 扫描不工作

#### 可能原因：
1. **iOS 14+ 限制**
   - iOS 14+ 需要位置权限才能获取 SSID
   - `CNCopyCurrentNetworkInfo` 在 iOS 14+ 中受限

2. **权限未授予**
   - 位置权限未请求或未授予
   - Info.plist 中缺少权限描述

3. **插件未正确实现**
   - `getCurrentSSIDiOS14()` 返回 `nil`
   - 需要改进实现

#### 调试步骤：

1. **检查权限**:
   ```swift
   // 在 WiFiPlugin.swift 中添加日志
   let locationManager = CLLocationManager()
   print("Location permission: \(locationManager.authorizationStatus)")
   ```

2. **测试插件调用**:
   ```javascript
   // 在浏览器控制台测试
   const WiFiPlugin = (await import('@/lib/plugins/wifi')).default
   const result = await WiFiPlugin.getCurrentSSID()
   console.log('Current SSID:', result)
   ```

3. **检查 Info.plist**:
   - 确保有 `NSLocationWhenInUseUsageDescription`
   - 确保有 `NSLocationAlwaysAndWhenInUseUsageDescription`

---

### 3. SSID 手动输入不工作

#### 可能原因：
1. **输入框未正确绑定**
   - `value` 和 `onChange` 未正确连接
   - 状态更新问题

2. **事件处理问题**
   - `onChange` 事件未触发
   - 状态更新被阻止

#### 调试步骤：

1. **检查输入框**:
   ```tsx
   // 在 ProvisioningModal.tsx 中检查
   <input
     type="text"
     value={ssid}
     onChange={(e) => {
       console.log('SSID changed:', e.target.value) // 添加日志
       setSsid(e.target.value)
     }}
   />
   ```

2. **检查状态**:
   ```tsx
   // 添加 useEffect 监听状态变化
   useEffect(() => {
     console.log('SSID state:', ssid)
   }, [ssid])
   ```

---

## 🔧 修复方案

### 1. ThingSmartUser 问题

**方案 A: 检查 ThingSmartHomeKit**
```swift
// 尝试使用 ThingSmartHomeKit 中的用户管理
// 检查 SDK 文档或头文件
```

**方案 B: 使用 Web API 后备**
```typescript
// 在 native-client.ts 中
if (!canUseNativeTuyaProvisioning()) {
  // 使用 Web API
  return startWebTuyaProvisioning(...)
}
```

**方案 C: 暂时禁用用户登录**
```swift
// 在 TuyaProvisioningPlugin.swift 中
// 暂时跳过用户登录，直接进行配网
// 注意：这可能限制某些功能
```

---

### 2. WiFi 扫描问题

**改进 getCurrentSSIDiOS14()**:
```swift
@available(iOS 14.0, *)
private func getCurrentSSIDiOS14() -> String? {
    let locationManager = CLLocationManager()
    let authStatus = locationManager.authorizationStatus
    
    if authStatus != .authorizedWhenInUse && authStatus != .authorizedAlways {
        return nil
    }
    
    // 尝试使用 legacy 方法
    return getCurrentSSIDLegacy()
}
```

**添加权限请求**:
```swift
@objc func requestPermission(_ call: CAPPluginCall) {
    let locationManager = CLLocationManager()
    locationManager.delegate = self
    locationManager.requestWhenInUseAuthorization()
    // 注意：需要实现 CLLocationManagerDelegate
}
```

---

### 3. SSID 输入问题

**确保正确绑定**:
```tsx
<input
  type="text"
  id="ssid-input"
  value={ssid}
  onChange={(e) => {
    const newValue = e.target.value
    console.log('SSID input changed:', newValue)
    setSsid(newValue)
  }}
  placeholder="输入 WiFi SSID"
/>
```

---

## 📋 检查清单

### Tuya 插件
- [ ] 编译无错误
- [ ] 插件正确注册
- [ ] SDK 初始化成功
- [ ] 环境变量已设置
- [ ] 可以调用插件方法

### WiFi 插件
- [ ] 编译无错误
- [ ] 插件正确注册
- [ ] 权限已请求和授予
- [ ] Info.plist 配置正确
- [ ] 可以获取当前 SSID
- [ ] 可以扫描网络

### SSID 输入
- [ ] 输入框正确渲染
- [ ] value 正确绑定
- [ ] onChange 事件触发
- [ ] 状态正确更新

---

## 🚀 下一步

1. **测试编译**: 在 Xcode 中构建，检查是否有错误
2. **测试插件**: 在应用中测试插件调用
3. **检查日志**: 查看 Xcode 控制台和浏览器控制台
4. **逐步调试**: 从最简单的功能开始测试

---

## 📝 相关文件

- `ios/App/App/Plugins/TuyaProvisioningPlugin.swift` - Tuya 插件
- `ios/App/App/Plugins/WiFiPlugin.swift` - WiFi 插件
- `lib/provisioning/native-client.ts` - 原生客户端封装
- `lib/plugins/wifi/index.ts` - WiFi 插件接口
- `components/mqtt/ProvisioningModal.tsx` - 配网模态框

