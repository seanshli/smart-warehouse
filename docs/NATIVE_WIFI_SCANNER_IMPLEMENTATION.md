# 原生 WiFi 扫描和密码记忆功能实现
## Native WiFi Scanner and Password Memory Implementation

**最后更新**: 2025-11-21

---

## 📊 实现总结 / Implementation Summary

### ✅ **已完成**

1. **原生 WiFi 插件接口** ✅
   - 创建了 `lib/plugins/wifi/index.ts` 接口定义
   - 定义了所有必要的方法

2. **Web 回退实现** ✅
   - 创建了 `lib/plugins/wifi/web.ts` Web 实现
   - 使用 localStorage 作为回退存储

3. **WiFiScanner 更新** ✅
   - 添加了 `scanNative()` 方法
   - 添加了 `scan()` 智能扫描方法
   - 更新了 `getSavedNetworks()` 支持原生 Keychain/Keystore
   - 更新了 `saveNetwork()` 支持原生存储
   - 更新了 `getSavedPassword()` 支持原生获取

4. **UI 组件更新** ✅
   - 更新了 `ProvisioningModal.tsx` 所有 WiFi 相关调用
   - 所有方法都改为异步调用
   - 支持自动填充保存的密码

---

## 🔍 实现细节 / Implementation Details

### 1. 原生 WiFi 插件接口

**文件**: `lib/plugins/wifi/index.ts`

**接口方法**:
- `getCurrentSSID()`: 获取当前连接的 WiFi SSID
- `scanNetworks()`: 扫描可用的 WiFi 网络（需要位置权限）
- `checkPermission()`: 检查是否有 WiFi 扫描权限
- `requestPermission()`: 请求 WiFi 扫描权限
- `savePassword()`: 保存 WiFi 密码到系统 Keychain/Keystore
- `getPassword()`: 从系统 Keychain/Keystore 获取 WiFi 密码
- `deletePassword()`: 删除保存的 WiFi 密码
- `getSavedSSIDs()`: 获取所有已保存的 WiFi SSID 列表

---

### 2. Web 回退实现

**文件**: `lib/plugins/wifi/web.ts`

**功能**:
- ✅ 所有方法都有 Web 实现
- ✅ 使用 localStorage 存储密码（作为回退）
- ✅ 提供友好的错误提示

**限制**:
- ❌ Web 环境无法扫描 WiFi 网络
- ❌ Web 环境无法获取当前 SSID
- ✅ Web 环境可以使用 localStorage 存储密码

---

### 3. WiFiScanner 智能扫描

**文件**: `lib/wifi-scanner.ts`

**新增方法**:

#### `scanNative()`
- 使用原生插件扫描 WiFi 网络
- 自动检查并请求权限
- 失败时回退到服务器扫描

#### `scan()`
- 智能扫描方法
- 优先使用原生扫描
- 失败时自动回退到服务器扫描

**工作流程**:
```
1. 检查平台（iOS/Android/Web）
2. 如果是原生平台，尝试原生扫描
3. 如果原生扫描失败，回退到服务器扫描
4. 如果服务器扫描也失败，抛出错误
```

---

### 4. 密码记忆功能

**存储方式**:

| 平台 | 存储方式 | 安全性 |
|------|---------|--------|
| **iOS** | Keychain | ✅ 高（系统级加密） |
| **Android** | Keystore | ✅ 高（系统级加密） |
| **Web** | localStorage | ⚠️ 中（浏览器存储） |

**功能特点**:
- ✅ 自动保存用户输入的 WiFi 密码
- ✅ 自动填充保存的密码
- ✅ 支持多个 WiFi 网络
- ✅ 跨会话持久化

---

## 📱 原生插件实现状态

### ⚠️ **待实现**

#### iOS 原生插件

**文件**: `ios/App/App/Plugins/WiFiPlugin.swift` (待创建)

**需要实现的功能**:
1. **获取当前 SSID**
   ```swift
   import SystemConfiguration.CaptiveNetwork
   import NetworkExtension
   
   // 使用 CNCopyCurrentNetworkInfo 获取当前 SSID
   ```

2. **扫描 WiFi 网络**
   ```swift
   import NetworkExtension
   
   // 使用 NEHotspotHelper 扫描网络（需要特殊权限）
   // 或者使用第三方库如 Reachability
   ```

3. **Keychain 存储**
   ```swift
   import Security
   
   // 使用 Keychain Services API 存储密码
   // SecItemAdd, SecItemCopyMatching, SecItemDelete
   ```

4. **位置权限**
   - iOS 13+ 需要位置权限才能获取 WiFi SSID
   - 需要在 `Info.plist` 中添加 `NSLocationWhenInUseUsageDescription`

#### Android 原生插件

**文件**: `android/app/src/main/java/com/smartwarehouse/app/plugins/WiFiPlugin.java` (待创建)

**需要实现的功能**:
1. **获取当前 SSID**
   ```java
   import android.net.wifi.WifiManager
   import android.content.Context
   
   // 使用 WifiManager.getConnectionInfo() 获取当前 SSID
   ```

2. **扫描 WiFi 网络**
   ```java
   import android.net.wifi.ScanResult
   import android.net.wifi.WifiManager
   
   // 使用 WifiManager.startScan() 和 getScanResults()
   // 需要位置权限（Android 6.0+）
   ```

3. **Keystore 存储**
   ```java
   import android.security.keystore.KeyGenParameterSpec
   import javax.crypto.KeyGenerator
   
   // 使用 Android Keystore System 存储密码
   ```

4. **位置权限**
   - Android 6.0+ 需要位置权限才能扫描 WiFi
   - 需要在 `AndroidManifest.xml` 中添加权限声明

---

## 🔧 配置要求

### iOS 配置

**Info.plist** (已配置):
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Location is used to set household location and find nearby items</string>
```

**需要添加**:
```xml
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Location is required to scan WiFi networks</string>
```

### Android 配置

**AndroidManifest.xml** (已配置):
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

**需要添加**:
```xml
<uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
```

---

## 📋 使用示例

### 扫描 WiFi 网络

```typescript
import { WiFiScanner } from '@/lib/wifi-scanner'

// 智能扫描（自动选择最佳方式）
const networks = await WiFiScanner.scan()

// 或使用特定方法
const nativeNetworks = await WiFiScanner.scanNative()
const serverNetworks = await WiFiScanner.scanFromServer()
```

### 保存 WiFi 密码

```typescript
// 保存密码（自动选择存储方式）
await WiFiScanner.saveNetwork(
  { ssid: 'MyWiFi', security: 'wpa2' },
  'password123'
)
```

### 获取保存的密码

```typescript
// 获取密码（自动从 Keychain/Keystore 或 localStorage 获取）
const password = await WiFiScanner.getSavedPassword('MyWiFi')
if (password) {
  console.log('Found saved password')
}
```

### 获取已保存的网络列表

```typescript
const savedNetworks = await WiFiScanner.getSavedNetworks()
console.log(`Found ${savedNetworks.length} saved networks`)
```

---

## 🎯 用户体验改进

### 改进前

```
1. 用户手动输入 WiFi SSID
2. 用户手动输入 WiFi 密码
3. 每次配网都需要重新输入
```

### 改进后

```
1. 点击"扫描 WiFi"按钮
2. 系统自动扫描并显示可用网络
3. 选择网络后自动填充保存的密码
4. 如果密码未保存，用户输入一次
5. 系统自动保存密码（勾选"记住密码"）
6. 下次配网时自动填充
```

---

## ⚠️ 注意事项

### 1. 权限要求

**iOS**:
- ✅ 位置权限（已配置）
- ⚠️ WiFi 扫描需要特殊权限（需要企业证书或系统权限）

**Android**:
- ✅ 位置权限（已配置）
- ✅ WiFi 状态权限（需要添加）
- ⚠️ WiFi 扫描需要位置权限（Android 6.0+）

### 2. 平台限制

**iOS**:
- iOS 13+ 需要位置权限才能获取 WiFi SSID
- WiFi 网络扫描需要特殊权限（通常不可用）
- 建议使用服务器端扫描或 ESP 设备扫描

**Android**:
- Android 6.0+ 需要位置权限才能扫描 WiFi
- 需要动态请求权限
- 扫描结果可能不完整（系统限制）

**Web**:
- 无法扫描 WiFi 网络
- 无法获取当前 SSID
- 只能使用服务器端扫描

### 3. 安全性

**Keychain/Keystore**:
- ✅ 系统级加密存储
- ✅ 应用间隔离
- ✅ 设备绑定

**localStorage**:
- ⚠️ 浏览器存储（未加密）
- ⚠️ 可被其他脚本访问
- ⚠️ 清除浏览器数据会丢失

---

## 📝 后续工作

### 1. 实现 iOS 原生插件

- [ ] 创建 `WiFiPlugin.swift`
- [ ] 实现 Keychain 存储
- [ ] 实现当前 SSID 获取
- [ ] 处理权限请求

### 2. 实现 Android 原生插件

- [ ] 创建 `WiFiPlugin.java`
- [ ] 实现 Keystore 存储
- [ ] 实现 WiFi 扫描
- [ ] 处理权限请求

### 3. 测试

- [ ] iOS 设备测试
- [ ] Android 设备测试
- [ ] Web 环境测试
- [ ] 权限测试
- [ ] 密码存储测试

---

## ✅ 结论

**当前状态**:
- ✅ 接口和 Web 实现已完成
- ✅ UI 组件已更新
- ⚠️ 原生插件待实现

**推荐**:
- ✅ 可以开始实现原生插件
- ✅ 可以先在 Web 环境测试功能
- ✅ 原生插件实现后可以完整测试

---

## 📚 参考资料

- [iOS Keychain Services](https://developer.apple.com/documentation/security/keychain_services)
- [Android Keystore System](https://developer.android.com/training/articles/keystore)
- [Capacitor Plugin Development](https://capacitorjs.com/docs/plugins)
- [iOS WiFi Scanning](https://developer.apple.com/documentation/networkextension)
- [Android WiFi Scanning](https://developer.android.com/guide/topics/connectivity/wifi-scan)

