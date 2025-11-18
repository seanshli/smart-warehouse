# 統一 IoT 整合架構
## Unified IoT Integration Architecture

本文件說明統一 IoT 整合架構，支援 MQTT 和 RESTful API 設備。
<!-- This document explains the unified IoT integration architecture supporting both MQTT and RESTful API devices. -->

## 架構概述 / Architecture Overview

### 支援的連接類型 / Supported Connection Types

1. **MQTT** - 用於 Tuya、ESP、Midea 等設備
2. **RESTful API** - 用於 Philips、Panasonic 等設備
3. **WebSocket** - 預留擴展（未來支援）

### 支援的供應商 / Supported Vendors

#### MQTT 供應商
- **Tuya** (塗鴉智能)
- **ESP** (ESP32/ESP8266)
- **Midea** (美的)

#### RESTful API 供應商
- **Philips** (Philips Hue)
- **Panasonic** (Panasonic Cloud API)

## 架構設計 / Architecture Design

### 1. 統一適配器介面 / Unified Adapter Interface

所有適配器都繼承自 `BaseAdapter`，提供統一介面：

```typescript
abstract class BaseAdapter {
  readonly connectionType: ConnectionType // 'mqtt' | 'restful' | 'websocket'
  readonly vendor: string // 供應商名稱
  
  // 創建設備物件
  abstract createDevice(deviceId: string, name: string, config?: AdapterConfig): IoTDevice
  
  // 解析設備狀態
  abstract parseState(data: any): DeviceState | null
  
  // 生成控制命令
  abstract createCommand(action: string, value?: any): ControlCommand
  
  // RESTful API 專用方法
  async getDeviceState?(deviceId: string, config: AdapterConfig): Promise<DeviceState | null>
  async sendCommand?(deviceId: string, command: ControlCommand, config: AdapterConfig): Promise<boolean>
}
```

### 2. 適配器工廠 / Adapter Factory

`UnifiedAdapterFactory` 統一管理所有適配器：

```typescript
// 獲取適配器
const adapter = UnifiedAdapterFactory.getAdapter('philips')

// 獲取連接類型
const connectionType = UnifiedAdapterFactory.getConnectionType('philips') // 'restful'

// 創建設備
const device = UnifiedAdapterFactory.createDevice('philips', 'device_001', 'Living Room Light', {
  baseUrl: 'http://192.168.1.100',
  apiKey: 'your-api-key'
})
```

### 3. 資料庫模型 / Database Model

統一的 `IoTDevice` 模型支援所有連接類型：

```prisma
model IoTDevice {
  id            String
  deviceId      String
  name          String
  vendor        String // tuya, esp, midea, philips, panasonic
  connectionType String // mqtt, restful, websocket
  
  // MQTT 專用欄位
  topic         String?
  commandTopic  String?
  statusTopic   String?
  
  // RESTful API 專用欄位
  baseUrl       String?
  apiKey        String?
  accessToken   String?
  
  // 通用欄位
  householdId   String
  roomId        String?
  status        String
  state         Json?
  metadata      Json?
}
```

## 使用範例 / Usage Examples

### 添加 MQTT 設備（Tuya）

```typescript
// API 請求
POST /api/iot/devices
{
  "deviceId": "tuya_device_001",
  "name": "Living Room AC",
  "vendor": "tuya",
  "connectionType": "mqtt", // 可選，會自動檢測
  "householdId": "household_id",
  "roomId": "room_id"
}
```

### 添加 RESTful 設備（Philips Hue）

```typescript
// API 請求
POST /api/iot/devices
{
  "deviceId": "1", // Philips Hue 燈 ID
  "name": "Living Room Light",
  "vendor": "philips",
  "connectionType": "restful", // 可選，會自動檢測
  "baseUrl": "http://192.168.1.100", // Philips Hue Bridge URL
  "apiKey": "your-hue-api-key",
  "householdId": "household_id",
  "roomId": "room_id"
}
```

### 控制設備

```typescript
// 統一控制介面（自動處理 MQTT 或 RESTful）
POST /api/iot/devices/{deviceId}/control
{
  "action": "power_on",
  "value": true
}
```

## 擴展新供應商 / Adding New Vendors

### 步驟 1: 創建適配器

```typescript
// lib/iot-adapters/new-vendor-adapter.ts
export class NewVendorAdapter extends BaseAdapter {
  readonly connectionType: ConnectionType = 'restful' // 或 'mqtt'
  readonly vendor = 'newvendor'
  
  createDevice(deviceId: string, name: string, config?: AdapterConfig): IoTDevice {
    // 實現創建設備邏輯
  }
  
  parseState(data: any): DeviceState | null {
    // 實現解析狀態邏輯
  }
  
  createCommand(action: string, value?: any): ControlCommand {
    // 實現生成命令邏輯
  }
  
  // 如果是 RESTful，實現這些方法
  async getDeviceState(deviceId: string, config: AdapterConfig): Promise<DeviceState | null> {
    // 實現獲取狀態邏輯
  }
  
  async sendCommand(deviceId: string, command: ControlCommand, config: AdapterConfig): Promise<boolean> {
    // 實現發送命令邏輯
  }
}
```

### 步驟 2: 註冊到工廠

```typescript
// lib/iot-adapters/index.ts
export class UnifiedAdapterFactory {
  static getAdapter(vendor: ExtendedDeviceVendor): BaseAdapter {
    switch (vendor) {
      // ... 現有適配器
      case 'newvendor':
        return new NewVendorAdapter()
      // ...
    }
  }
}
```

### 步驟 3: 更新資料庫（如需要）

如果新供應商需要額外的配置欄位，更新 Prisma schema：

```prisma
model IoTDevice {
  // ... 現有欄位
  newVendorSpecificField String? // 新欄位
}
```

## 最佳實踐 / Best Practices

### 1. MQTT Broker 選擇

對於支援多品牌的 MQTT 設備，建議使用：

- **EMQX** - 開源，功能強大，支援規則引擎
- **HiveMQ Cloud** - 託管服務，易於設定
- **Mosquitto** - 輕量級，適合小型部署

### 2. RESTful API 認證

不同供應商使用不同的認證方式：

- **Philips Hue**: API Key（首次配對後生成）
- **Panasonic**: API Key + Access Token（OAuth2）
- **其他**: 根據供應商文檔設定

### 3. 錯誤處理

所有適配器都應該：
- 捕獲並記錄錯誤
- 返回有意義的錯誤訊息
- 處理網路超時
- 處理認證失敗

### 4. 狀態同步

- **MQTT 設備**: 通過 MQTT 訂閱自動更新狀態
- **RESTful 設備**: 定期輪詢或命令後立即獲取狀態

## 場景支援 / Scenario Support

### 場景 1: 多品牌統一控制

所有設備（Tuya、Philips、Panasonic 等）都可以通過統一的 API 控制：

```typescript
// 控制所有設備的電源
devices.forEach(device => {
  await fetch(`/api/iot/devices/${device.id}/control`, {
    method: 'POST',
    body: JSON.stringify({ action: 'power_off' })
  })
})
```

### 場景 2: 房間場景控制

根據房間控制所有設備：

```typescript
// 獲取房間的所有設備
const roomDevices = await fetch(`/api/iot/devices?householdId=${householdId}&roomId=${roomId}`)

// 創建場景（例如：晚上模式）
const eveningScene = {
  lights: { action: 'set_brightness', value: 50 },
  ac: { action: 'set_temperature', value: 24 }
}
```

### 場景 3: 自動化規則

結合設備狀態創建自動化規則：

```typescript
// 當溫度超過 28°C 時自動開啟冷氣
if (device.state.temperature > 28 && device.vendor === 'midea') {
  await controlDevice(device.id, { action: 'power_on' })
  await controlDevice(device.id, { action: 'set_temperature', value: 24 })
}
```

## 未來擴展 / Future Extensions

1. **WebSocket 支援** - 實時雙向通訊
2. **設備發現** - 自動發現網路中的設備
3. **場景管理** - 預設場景和自訂場景
4. **自動化引擎** - 基於規則的自動化
5. **設備分組** - 將多個設備分組控制
6. **歷史記錄** - 設備操作和狀態歷史

---

**狀態 / Status:** ✅ **統一 IoT 架構已完成 / Unified IoT Architecture Complete**

