# Tuya 配网模式状态
## Tuya Provisioning Modes Status

**最后更新**: 2025-11-21

---

## 📊 各模式实现状态 / Mode Implementation Status

| 模式 | iOS 原生 | Web API | 状态 | 说明 |
|------|---------|---------|------|------|
| **WiFi (EZ)** | ✅ 完成 | ✅ 完成 | 🟢 可用 | EZ 模式配网 |
| **WiFi/BT** | ⚠️ 部分 | ✅ 完成 | 🟡 部分可用 | 使用 EZ 模式实现 |
| **BT** | ❌ 未实现 | ⚠️ 占位符 | 🔴 不可用 | 需要蓝牙 SDK |
| **Zigbee** | ❌ 未实现 | ⚠️ 占位符 | 🔴 不可用 | 需要网关设置 |

---

## 🔍 详细状态 / Detailed Status

### 1. WiFi (EZ 模式) ✅

#### iOS 原生
- ✅ **状态**: 完全实现
- ✅ **方法**: `startEZMode()`
- ✅ **SDK**: 使用 `ThingSmartActivator.startConfigWiFi(withMode: .EZ)`
- ✅ **功能**: 
  - WiFi 快速配网
  - 设备发现
  - 超时处理
  - Home 自动创建

#### Web API
- ✅ **状态**: 完全实现
- ✅ **文件**: `lib/tuya-provisioning.ts`
- ✅ **功能**: 通过 Tuya Cloud API 进行配网

**总结**: ✅ **完全可用**

---

### 2. WiFi/BT (混合模式) ⚠️

#### iOS 原生
- ⚠️ **状态**: 部分实现
- ⚠️ **方法**: `startWiFiBTMode()`
- ⚠️ **实现**: 当前只是调用 `startEZMode()`（WiFi 部分）
- ❌ **问题**: 蓝牙辅助功能未实现
- ⚠️ **说明**: 使用 EZ 模式，蓝牙功能未启用

```swift
private func startWiFiBTMode(_ call: CAPPluginCall, householdId: String?, householdName: String?) {
    // WiFi/BT mode uses EZ mode with Bluetooth assistance
    startEZMode(call, householdId: householdId, householdName: householdName)
}
```

#### Web API
- ✅ **状态**: 完全实现
- ✅ **功能**: 通过 Tuya Cloud API 支持 WiFi/BT 模式

**总结**: ⚠️ **部分可用**（WiFi 部分可用，BT 辅助未实现）

---

### 3. BT (蓝牙模式) ❌

#### iOS 原生
- ❌ **状态**: 未实现
- ❌ **方法**: `startBTMode()`
- ❌ **错误**: 返回 "Bluetooth mode provisioning not yet implemented in native SDK."
- ❌ **原因**: 需要蓝牙 SDK 支持

```swift
private func startBTMode(_ call: CAPPluginCall) {
    guard let bluetoothMac = call.getString("bluetoothMac") else {
        call.reject("Bluetooth MAC address is required for BT mode")
        return
    }
    
    // Bluetooth provisioning
    call.reject("Bluetooth mode provisioning not yet implemented in native SDK.")
}
```

#### Web API
- ⚠️ **状态**: 占位符
- ⚠️ **功能**: 基本框架，但需要蓝牙支持

**总结**: ❌ **不可用**（需要实现）

---

### 4. Zigbee ❌

#### iOS 原生
- ❌ **状态**: 未实现
- ❌ **方法**: `startZigbeeMode()`
- ❌ **错误**: 返回 "Zigbee mode provisioning requires additional gateway setup. Not yet implemented."
- ❌ **原因**: 需要 Zigbee 网关配置

```swift
private func startZigbeeMode(_ call: CAPPluginCall) {
    guard let gatewayId = call.getString("zigbeeGatewayId") else {
        call.reject("Zigbee gateway ID is required for Zigbee mode")
        return
    }
    
    // Zigbee provisioning requires gateway
    call.reject("Zigbee mode provisioning requires additional gateway setup. Not yet implemented.")
}
```

#### Web API
- ⚠️ **状态**: 占位符
- ⚠️ **功能**: 基本框架，但需要网关配置

**总结**: ❌ **不可用**（需要实现）

---

## 📋 功能对比表 / Feature Comparison

| 功能 | WiFi (EZ) | WiFi/BT | BT | Zigbee |
|------|-----------|---------|----|--------|
| **iOS 原生** | ✅ | ⚠️ | ❌ | ❌ |
| **Web API** | ✅ | ✅ | ⚠️ | ⚠️ |
| **设备发现** | ✅ | ⚠️ | ❌ | ❌ |
| **配网流程** | ✅ | ⚠️ | ❌ | ❌ |
| **Home 管理** | ✅ | ✅ | ❌ | ❌ |
| **总体可用性** | 🟢 高 | 🟡 中 | 🔴 低 | 🔴 低 |

---

## ⚠️ 已知限制 / Known Limitations

### WiFi/BT 模式
- ⚠️ **当前实现**: 只使用 WiFi (EZ) 部分
- ⚠️ **蓝牙辅助**: 未实现
- ⚠️ **影响**: 功能可用，但蓝牙辅助功能缺失

### BT 模式
- ❌ **完全未实现**: 需要蓝牙 SDK 集成
- ❌ **需要**: Tuya 蓝牙 SDK 或 Core Bluetooth 实现

### Zigbee 模式
- ❌ **完全未实现**: 需要网关配置
- ❌ **需要**: Zigbee 网关 ID 和网关 SDK 支持

---

## 🎯 总结 / Summary

### ✅ 完全可用的模式

1. **WiFi (EZ)** - ✅ iOS 原生 + Web API
   - 功能完整
   - 已测试
   - 推荐使用

### ⚠️ 部分可用的模式

2. **WiFi/BT** - ⚠️ 部分可用
   - iOS: 使用 EZ 模式（WiFi 部分）
   - Web: 完全支持
   - 蓝牙辅助功能未实现

### ❌ 不可用的模式

3. **BT** - ❌ 未实现
   - 需要蓝牙 SDK 集成
   - 预计工作量: 2-3 周

4. **Zigbee** - ❌ 未实现
   - 需要网关配置和 SDK
   - 预计工作量: 3-4 周

---

## 📝 建议 / Recommendations

### 当前使用建议

1. **推荐**: 使用 **WiFi (EZ)** 模式
   - 功能完整
   - 支持最好
   - 最稳定

2. **可选**: 使用 **WiFi/BT** 模式（Web）
   - Web API 完全支持
   - iOS 原生部分可用（WiFi 部分）

3. **避免**: 使用 **BT** 或 **Zigbee** 模式
   - 当前未实现
   - 会返回错误

### 未来开发优先级

1. **高优先级**: BT 模式实现
   - 蓝牙设备需求
   - 需要蓝牙 SDK

2. **中优先级**: Zigbee 模式实现
   - 网关设备需求
   - 需要网关配置

3. **低优先级**: WiFi/BT 蓝牙辅助功能
   - 当前 WiFi 部分已可用
   - 蓝牙辅助是增强功能

---

## ✅ 结论 / Conclusion

**完全可用的模式**: 1/4 (WiFi/EZ)  
**部分可用的模式**: 1/4 (WiFi/BT)  
**不可用的模式**: 2/4 (BT, Zigbee)

**当前推荐**: 使用 **WiFi (EZ)** 模式进行配网 🟢

