# Tuya SDK 原生配网流程与 MQTT 集成

## 📱 原生配网流程

### iOS 实现

1. **使用 Tuya SDK 原生配网**
   - `ThingSmartActivator.sharedInstance().startConfigWiFi()` 会自动显示 Tuya SDK 的原生配网 UI
   - 用户按照 SDK 提供的界面指引完成配网
   - 配网结果通过 `ThingSmartActivatorDelegate` 回调返回

2. **配网成功后的处理**
   - 设备自动添加到 Tuya Home
   - 返回设备信息（deviceId, deviceName, deviceInfo）
   - 包含 `householdId` 和 `tuyaHomeId` 用于后续映射

3. **自动连接到 MQTT Broker**
   - 配网成功后，前端调用 `autoAddDevice()` 函数
   - 延迟 3 秒后自动添加设备到数据库
   - 设备自动连接到我们的 MQTT broker

### Android 实现（待完成）

1. **使用 Tuya Android SDK 原生配网**
   - 集成 Tuya Android SDK 后，使用 `TuyaActivator` 进行配网
   - SDK 会提供原生配网 UI
   - 配网结果通过回调返回

2. **配网成功后的处理**
   - 与 iOS 相同的流程
   - 自动添加到数据库并连接到 MQTT broker

## 🔄 完整流程

```
1. 用户点击"配网"按钮
   ↓
2. 前端调用 startNativeTuyaProvisioning()
   ↓
3. iOS/Android 插件调用 Tuya SDK 原生配网
   ↓
4. Tuya SDK 显示原生配网 UI
   ↓
5. 用户按照 SDK 指引完成配网
   ↓
6. 配网成功，设备添加到 Tuya Home
   ↓
7. ThingSmartActivatorDelegate 回调返回设备信息
   ↓
8. 前端接收配网成功结果
   ↓
9. 自动调用 autoAddDevice() 函数
   ↓
10. 延迟 3 秒后，设备添加到数据库
   ↓
11. 设备自动连接到 MQTT broker
   ↓
12. 设备可以正常使用
```

## 📋 关键代码位置

### iOS 插件
- `ios/App/App/Plugins/TuyaProvisioningPlugin.swift`
  - `startEZMode()` - EZ 模式配网
  - `startAPMode()` - AP 模式配网
  - `ThingSmartActivatorDelegate` - 配网结果回调

### 前端处理
- `components/mqtt/ProvisioningModal.tsx`
  - `handleProvisioningResponse()` - 处理配网响应
  - `autoAddDevice()` - 自动添加设备到数据库和 MQTT

### 自动添加设备
- `components/mqtt/ProvisioningModal.tsx` (line 198-275)
  - 创建设备记录
  - 连接到 MQTT broker
  - 订阅设备状态主题

## ✅ 优势

1. **使用 Tuya SDK 原生 UI**
   - 用户体验与官方 Tuya App 一致
   - 减少自定义 UI 的维护成本
   - 自动适配不同设备类型

2. **自动 MQTT 连接**
   - 配网成功后自动添加到我们的系统
   - 无需手动操作
   - 设备立即可用

3. **完整的错误处理**
   - 超时处理
   - 错误回调
   - 用户友好的错误提示

## 🔧 配置要求

1. **环境变量**
   - `TUYA_IOS_SDK_APP_KEY`
   - `TUYA_IOS_SDK_APP_SECRET`
   - `TUYA_ANDROID_SDK_APP_KEY`
   - `TUYA_ANDROID_SDK_APP_SECRET`
   - `TUYA_ANDROID_SDK_SHA256`

2. **权限配置**
   - iOS: `Info.plist` 中的网络、蓝牙、位置权限
   - Android: `AndroidManifest.xml` 中的相应权限

3. **Tuya Home 映射**
   - 每个 Household 对应一个 Tuya Home
   - 配网时自动创建或使用现有 Home

## 📝 注意事项

1. **配网超时**
   - EZ/AP 模式：100 秒
   - Zigbee/BT 模式：120 秒
   - 超时后自动停止配网

2. **设备连接延迟**
   - 配网成功后延迟 3 秒再添加到数据库
   - 给设备时间连接到 MQTT broker

3. **Tuya Home 管理**
   - 如果不存在，自动创建
   - 使用 Household 名称作为 Home 名称
   - 支持多个 Household 对应多个 Tuya Home

