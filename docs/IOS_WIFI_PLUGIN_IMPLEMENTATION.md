# iOS WiFi 插件实现指南
## iOS WiFi Plugin Implementation Guide

**最后更新**: 2025-11-21  
**状态**: ✅ **已实现**

---

## 📊 实现状态 / Implementation Status

### ✅ 已完成

1. **WiFiPlugin.swift** - iOS 原生插件已创建
2. **Info.plist** - 权限说明已更新
3. **ProvisioningModal.tsx** - 已更新使用原生扫描
4. **插件注册** - 使用 `CAP_PLUGIN` 宏自动注册

---

## 📁 文件位置 / File Locations

- **原生插件**: `ios/App/App/Plugins/WiFiPlugin.swift`
- **TypeScript 接口**: `lib/plugins/wifi/index.ts`
- **Web 回退**: `lib/plugins/wifi/web.ts`
- **扫描工具**: `lib/wifi-scanner.ts`
- **UI 集成**: `components/mqtt/ProvisioningModal.tsx`

---

## 🔧 实现功能 / Implemented Features

### 1. WiFi 扫描 / WiFi Scanning

**限制**:
- ⚠️ iOS 14+ 无法直接扫描 WiFi 网络（系统安全限制）
- ✅ 只能获取当前连接的 WiFi SSID
- ✅ 需要位置权限才能获取当前 SSID

**实现**:
```swift
@objc func scanNetworks(_ call: CAPPluginCall) {
    // 检查权限
    // 返回当前连接的 WiFi 网络
    // iOS 14+ 无法扫描其他网络
}
```

### 2. 权限管理 / Permission Management

**实现**:
- `checkPermission()` - 检查位置权限
- `requestPermission()` - 请求位置权限

**权限要求**:
- `NSLocationWhenInUseUsageDescription` - 已在 Info.plist 中配置

### 3. 密码管理 / Password Management

**实现**:
- `savePassword()` - 保存 WiFi 密码到 UserDefaults
- `getPassword()` - 从 UserDefaults 获取密码
- `deletePassword()` - 删除保存的密码
- `getSavedSSIDs()` - 获取所有已保存的 SSID 列表

**存储方式**:
- 使用 `UserDefaults` 存储（非系统 Keychain）
- 原因：iOS 不允许应用直接访问系统 WiFi 密码

---

## 🚀 使用步骤 / Usage Steps

### 1. 同步 Capacitor

```bash
npx cap sync ios
```

### 2. 在 Xcode 中验证

1. 打开 Xcode 项目
2. 检查 `WiFiPlugin.swift` 是否在编译目标中
3. 确保文件已添加到项目

### 3. 构建并测试

```bash
# 在 Xcode 中构建
# 或使用命令行
xcodebuild -workspace ios/App/App.xcworkspace \
           -scheme App \
           -configuration Debug \
           -sdk iphonesimulator
```

---

## ⚠️ iOS 限制 / iOS Limitations

### WiFi 扫描限制

1. **iOS 14+ 无法扫描 WiFi 网络**
   - 系统安全限制
   - 只能获取当前连接的 WiFi SSID
   - 需要位置权限

2. **获取当前 SSID 的限制**
   - iOS 13 及以下：可以使用 `CNCopyCurrentNetworkInfo`
   - iOS 14+：需要特殊权限和配置

3. **替代方案**
   - 使用服务器端扫描（如果可用）
   - 手动输入 WiFi 信息
   - 使用已保存的 WiFi 网络

---

## 🔍 调试指南 / Debugging Guide

### 检查插件是否加载

1. **Xcode 控制台**
   ```
   查看是否有插件加载错误
   ```

2. **JavaScript 控制台**
   ```javascript
   import WiFiPlugin from '@/lib/plugins/wifi'
   WiFiPlugin.scanNetworks().then(console.log)
   ```

### 检查权限

1. **设备设置**
   - 设置 > 隐私 > 位置服务
   - 确保应用有位置权限

2. **代码检查**
   ```swift
   let status = CLLocationManager.authorizationStatus()
   print("Location permission status: \(status)")
   ```

---

## 📝 代码示例 / Code Examples

### TypeScript 使用

```typescript
import WiFiPlugin from '@/lib/plugins/wifi'

// 扫描网络
const result = await WiFiPlugin.scanNetworks()
console.log('Networks:', result.networks)

// 检查权限
const permission = await WiFiPlugin.checkPermission()
if (!permission.granted) {
  await WiFiPlugin.requestPermission()
}

// 保存密码
await WiFiPlugin.savePassword({
  ssid: 'MyWiFi',
  password: 'password123'
})

// 获取密码
const password = await WiFiPlugin.getPassword({ ssid: 'MyWiFi' })
```

### Swift 原生调用

```swift
// 在 iOS 原生代码中
let plugin = WiFiPlugin()
plugin.scanNetworks { result in
    if let networks = result?["networks"] as? [[String: Any]] {
        print("Found \(networks.count) networks")
    }
}
```

---

## 🐛 已知问题 / Known Issues

1. **iOS 14+ 无法扫描 WiFi 网络**
   - 系统限制，无法解决
   - 只能获取当前连接的 WiFi

2. **密码存储安全性**
   - 使用 UserDefaults 而非 Keychain
   - 安全性较低，但功能可用

3. **权限请求异步**
   - 权限请求是异步的
   - 需要延迟检查权限状态

---

## 🔄 未来改进 / Future Improvements

1. **使用 Keychain 存储密码**
   - 提高安全性
   - 需要额外的 Keychain 配置

2. **支持 NEHotspotConfiguration**
   - iOS 11+ 支持
   - 需要特殊权限和配置
   - 可以配置 WiFi 网络

3. **改进错误处理**
   - 更详细的错误消息
   - 更好的用户提示

---

## 📚 参考资源 / Reference Resources

### Apple 文档

- [CNCopyCurrentNetworkInfo](https://developer.apple.com/documentation/systemconfiguration/1614126-cncopycurrentnetworkinfo)
- [NEHotspotConfiguration](https://developer.apple.com/documentation/networkextension/nehotspotconfiguration)
- [CLLocationManager](https://developer.apple.com/documentation/corelocation/cllocationmanager)

### 相关文件

- `ios/App/App/Plugins/WiFiPlugin.swift` - 原生插件实现
- `lib/plugins/wifi/index.ts` - TypeScript 接口
- `lib/plugins/wifi/web.ts` - Web 回退实现
- `lib/wifi-scanner.ts` - WiFi 扫描工具

---

## ✅ 总结 / Summary

iOS WiFi 插件已成功实现，但受到 iOS 系统限制：

- ✅ **已实现**: 获取当前 WiFi SSID、权限管理、密码存储
- ⚠️ **限制**: iOS 14+ 无法扫描 WiFi 网络
- ✅ **可用**: 在 iOS 13 及以下可以获取当前 SSID
- ✅ **集成**: 已集成到 ProvisioningModal

**下一步**: 测试插件功能，验证权限请求和密码存储是否正常工作。

