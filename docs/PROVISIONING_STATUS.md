# 配網功能狀態說明 / Provisioning Status

## ✅ **已支持的配網品牌**

以下品牌已經實現了完整的配網功能：

### 1. **Tuya（塗鴉）** ✅
- ✅ WiFi 配網支持
- ✅ 原生 SDK 配網（iOS/Android）
- ✅ Web 配網支持
- ✅ 自動發現設備
- ✅ 自動添加到數據庫

### 2. **Midea（美的）** ✅
- ✅ WiFi 配網支持
- ✅ AP 模式配網
- ✅ Midea SDK 集成
- ✅ 自動發現設備
- ✅ 自動添加到數據庫

### 3. **ESP (ESP32/ESP8266)** ✅
- ✅ AP 模式配網
- ✅ WiFi 掃描和配置
- ✅ 自動發現設備
- ✅ 自動添加到數據庫

### 4. **Philips Hue** ✅
- ✅ Bridge 發現
- ✅ API Key 配置
- ✅ RESTful API 集成

### 5. **Panasonic** ✅
- ✅ RESTful API 配置
- ✅ API Key 和 Access Token 支持

### 6. **Home Assistant** ✅
- ✅ RESTful API 集成
- ✅ Access Token 配置
- ✅ 設備自動發現

## ⚠️ **不需要配網按鈕的品牌**

以下品牌**不需要**配網按鈕，因為它們使用不同的配網方式：

### 1. **Shelly** ⚠️
**配網方式：**
- Shelly 設備有**內建的 Web UI**
- 用戶通過設備自己的界面（通常是 `http://192.168.x.x`）配置 WiFi 和 MQTT
- **不需要**特殊的配網流程

**添加設備方式：**
1. **手動配置設備**：
   - 訪問 Shelly 設備 Web UI
   - 配置 WiFi 連接
   - 配置 MQTT Broker 地址
   - 保存設置

2. **在 Smart Warehouse 中添加**：
   - 點擊 **"掃描設備"** → 選擇 "Shelly" 或 "All"
   - 或點擊 **"添加設備"** → 選擇 "Shelly" → 輸入設備 ID

**為什麼不需要配網按鈕：**
- Shelly 設備已經有完整的 Web UI
- 用戶可以直接在設備上配置
- 配網完成後設備自動連接到 MQTT Broker
- Smart Warehouse 只需要掃描或手動添加已配置的設備

### 2. **Aqara** ⚠️
**配網方式：**
- Aqara 設備使用 **Zigbee 協議**
- 需要通過 **Zigbee2MQTT** 橋接器配對
- **不需要** WiFi 配網

**添加設備方式：**
1. **在 Zigbee2MQTT 中配對**：
   - 打開 Zigbee2MQTT Web UI
   - 點擊 "Permit join" 按鈕
   - 將 Aqara 設備置於配對模式
   - 設備出現在 Zigbee2MQTT 設備列表中

2. **在 Smart Warehouse 中添加**：
   - 點擊 **"掃描設備"** → 選擇 "Aqara" 或 "All"
   - 或點擊 **"添加設備"** → 選擇 "Aqara" → 輸入設備友好名稱

**為什麼不需要配網按鈕：**
- Aqara 設備使用 Zigbee 協議（不是 WiFi）
- 配對過程在 Zigbee2MQTT 中完成
- Smart Warehouse 只需要連接到 MQTT Broker 即可發現設備
- 不需要 WiFi 配網流程

## 📋 **配網功能對比表**

| 品牌 | 配網按鈕 | 配網方式 | 添加設備方式 |
|------|---------|---------|-------------|
| **Tuya** | ✅ 有 | WiFi 配網 | 配網按鈕 → 自動添加 |
| **Midea** | ✅ 有 | WiFi/AP 配網 | 配網按鈕 → 自動添加 |
| **ESP** | ✅ 有 | AP 模式配網 | 配網按鈕 → 自動添加 |
| **Philips Hue** | ✅ 有 | Bridge 發現 | 配網按鈕 → 配置 API |
| **Panasonic** | ✅ 有 | RESTful API | 配網按鈕 → 配置 API |
| **Home Assistant** | ✅ 有 | RESTful API | 配網按鈕 → 配置 API |
| **Shelly** | ❌ 不需要 | 設備 Web UI | 掃描設備 / 手動添加 |
| **Aqara** | ❌ 不需要 | Zigbee2MQTT | 掃描設備 / 手動添加 |

## 🎯 **總結**

### ✅ **配網功能完整**
- Tuya、Midea、ESP、Philips、Panasonic、Home Assistant 都有完整的配網支持

### ⚠️ **不需要配網按鈕**
- **Shelly**: 通過設備自己的 Web UI 配置，然後掃描或手動添加
- **Aqara**: 通過 Zigbee2MQTT 配對，然後掃描或手動添加

### 📝 **建議**
對於 Shelly 和 Aqara：
1. **不需要**添加配網按鈕
2. **使用**"掃描設備"功能來發現已配置的設備
3. **或**使用"添加設備"手動輸入設備信息

這樣的設計是合理的，因為：
- Shelly 和 Aqara 的配網流程與其他品牌不同
- 它們已經有各自的配網工具（Shelly Web UI、Zigbee2MQTT）
- Smart Warehouse 只需要連接到 MQTT Broker 即可發現和控制設備

## 🔧 **如果需要添加配網按鈕**

如果未來需要為 Shelly 或 Aqara 添加配網按鈕，需要：

### Shelly 配網按鈕：
- 實現 Shelly 設備的 AP 模式連接
- 發送 WiFi 配置到設備
- 配置 MQTT Broker 設置
- **複雜度**: 中等（需要實現 Shelly 配網協議）

### Aqara 配網按鈕：
- 集成 Zigbee2MQTT API
- 觸發 Zigbee 配對模式
- 等待設備配對完成
- **複雜度**: 高（需要 Zigbee2MQTT API 集成）

**當前建議**: 保持現狀，使用掃描和手動添加方式，因為：
- ✅ 更簡單
- ✅ 不需要額外實現
- ✅ 用戶已經有配網工具
- ✅ 功能完整可用
