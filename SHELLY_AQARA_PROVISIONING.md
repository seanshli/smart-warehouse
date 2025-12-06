# Shelly 和 Aqara 配網說明 / Shelly & Aqara Provisioning Guide

## 概述 / Overview

Shelly 和 Aqara 設備的添加方式與其他品牌（Tuya、Midea 等）不同。它們**不需要傳統的配網流程**，而是通過 **MQTT 發現**來添加設備。

Shelly and Aqara devices are added differently from other brands (Tuya, Midea, etc.). They **do not require traditional provisioning**, but are added through **MQTT discovery**.

---

## Shelly 設備 / Shelly Devices

### 工作原理 / How It Works

1. **設備已連網** - Shelly 設備已經連接到 Wi-Fi 網絡
2. **MQTT 通信** - 設備通過 MQTT Broker 進行通信
3. **自動發現** - 系統掃描 MQTT Broker 自動發現設備

### 添加方法 / How to Add

#### 方法 1: 自動發現（推薦）

1. 確保 Shelly 設備已配置 MQTT：
   - 設備已連接到 Wi-Fi
   - 設備已配置 MQTT Broker 地址
   - 設備與應用使用同一個 MQTT Broker

2. 在應用中：
   - 點擊 **"Shelly 發現"** 按鈕
   - 系統會自動掃描 MQTT Broker
   - 發現的設備會自動出現在設備列表中

#### 方法 2: 手動添加

1. 打開 **"添加設備"** 對話框
2. 選擇 **"Shelly"** 作為品牌
3. 輸入設備 ID（例如：`shelly-plus-1pm-ABC123`）
4. 點擊 **"掃描 MQTT 設備"** 或直接添加

### MQTT 主題格式 / MQTT Topic Format

Shelly 設備使用以下 MQTT 主題：

- **狀態主題**: `shellies/{device-id}/status` 或 `{device-id}/status`
- **命令主題**: `shellies/{device-id}/command` 或 `{device-id}/command`

### 設備 ID 格式 / Device ID Format

- 格式: `shelly-{device-type}-{device-id}`
- 示例: `shelly-plus-1pm-ABC123`, `shelly-1pm-DEF456`

---

## Aqara 設備 / Aqara Devices

### 工作原理 / How It Works

1. **Zigbee 協議** - Aqara 設備使用 Zigbee 無線協議
2. **zigbee2mqtt 網關** - 需要 zigbee2mqtt 網關作為橋接
3. **MQTT 通信** - 網關將 Zigbee 設備橋接到 MQTT Broker
4. **自動發現** - 系統掃描 MQTT Broker 自動發現設備

### 前提條件 / Prerequisites

1. **設置 zigbee2mqtt 網關**:
   - 安裝並配置 zigbee2mqtt
   - 連接 Zigbee USB 適配器（如 CC2531、CC2652P）
   - 配置 MQTT Broker 連接

2. **配對 Aqara 設備**:
   - 在 zigbee2mqtt 中配對 Aqara 設備
   - 設備會自動出現在 zigbee2mqtt 中

### 添加方法 / How to Add

#### 方法 1: 自動發現（推薦）

1. 確保：
   - zigbee2mqtt 網關已運行
   - Aqara 設備已與網關配對
   - 網關已連接到 MQTT Broker

2. 在應用中：
   - 點擊 **"Aqara 發現"** 按鈕
   - 系統會自動掃描 MQTT Broker
   - 發現的設備會自動出現在設備列表中

#### 方法 2: 手動添加

1. 打開 **"添加設備"** 對話框
2. 選擇 **"Aqara"** 作為品牌
3. 輸入設備 ID（在 zigbee2mqtt 中配置的 `friendly_name`）
4. 點擊 **"掃描 MQTT 設備"** 或直接添加

### MQTT 主題格式 / MQTT Topic Format

Aqara 設備通過 zigbee2mqtt 使用以下 MQTT 主題：

- **狀態主題**: `zigbee2mqtt/{friendly_name}`
- **命令主題**: `zigbee2mqtt/{friendly_name}/set`

### 設備 ID 格式 / Device ID Format

- 格式: `{friendly_name}`（在 zigbee2mqtt 中配置的名稱）
- 示例: `Aqara Motion Sensor`, `Aqara Door Sensor`, `Aqara Temperature Sensor`

---

## 與其他品牌的區別 / Differences from Other Brands

### 傳統配網（Tuya、Midea、ESP）

```
設備 → 配網模式 → 輸入 Wi-Fi 信息 → 連接到網絡 → 添加到系統
```

### Shelly / Aqara

```
設備 → 已連網（或通過網關） → MQTT 發現 → 自動添加到系統
```

### 關鍵區別 / Key Differences

| 特性 | 傳統配網 | Shelly/Aqara |
|------|---------|--------------|
| 是否需要 Wi-Fi 配網 | ✅ 是 | ❌ 否 |
| 設備狀態 | 未配網 | 已連網 |
| 添加方式 | 配網流程 | MQTT 發現 |
| 需要輸入 Wi-Fi | ✅ 是 | ❌ 否 |
| 需要 MQTT Broker | ❌ 否（配網後自動） | ✅ 是（必須） |

---

## 常見問題 / FAQ

### Q: 為什麼 Shelly/Aqara 不需要配網？

**A**: 因為這些設備已經連接到網絡（Shelly 直接連 Wi-Fi，Aqara 通過 zigbee2mqtt 網關），只需要通過 MQTT 發現即可。

### Q: 如果設備沒有出現在發現列表中怎麼辦？

**A**: 
1. 檢查設備是否已連接到 MQTT Broker
2. 確認 MQTT Broker 配置正確
3. 檢查設備是否在線
4. 嘗試手動添加設備 ID

### Q: Aqara 設備需要 zigbee2mqtt 嗎？

**A**: 是的，Aqara 設備使用 Zigbee 協議，必須通過 zigbee2mqtt 網關才能連接到 MQTT。

### Q: Shelly 設備可以直接連 Wi-Fi 嗎？

**A**: 是的，Shelly 設備可以直接連接到 Wi-Fi 網絡，然後通過 MQTT 通信。

---

## 相關文檔 / Related Documentation

- [MQTT Setup Guide](./MQTT_SETUP_GUIDE.md)
- [Shelly Implementation Summary](./docs/SHELLY_IMPLEMENTATION_SUMMARY.md)
- [Aqara Integration Guide](./docs/AQARA_INTEGRATION_GUIDE.md)
- [Provisioning Fix Guide](./PROVISIONING_FIX_GUIDE.md)

