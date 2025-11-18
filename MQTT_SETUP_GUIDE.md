# MQTT 整合設定指南
## MQTT Integration Setup Guide

本指南說明如何設定 MQTT 整合以支援 Tuya、ESP 和 Midea IoT 設備。
<!-- This guide explains how to set up MQTT integration to support Tuya, ESP, and Midea IoT devices. -->

## 功能特色 / Features

✅ **多供應商支援 / Multi-Vendor Support**
- Tuya（塗鴉智能）
- ESP32/ESP8266
- Midea（美的）

✅ **即時狀態同步 / Real-Time Status Sync**
- 自動訂閱設備狀態主題
- 即時更新設備狀態
- 顯示在線/離線狀態

✅ **設備控制 / Device Control**
- 電源開關（Power On/Off）
- 溫度控制（Temperature Control）
- 模式設定（Mode Setting）
- 風速控制（Fan Speed Control）

## 設定步驟 / Setup Steps

### 1. 配置 MQTT Broker / Configure MQTT Broker

在 `.env` 或環境變數中設定以下參數：
<!-- Set the following parameters in `.env` or environment variables: -->

```bash
# MQTT Broker Configuration
MQTT_BROKER_URL="mqtt://localhost:1883"
# 安全連接使用：mqtts://broker.example.com:8883
# For secure connection: mqtts://broker.example.com:8883

MQTT_USERNAME="your-mqtt-username"
MQTT_PASSWORD="your-mqtt-password"
MQTT_CLIENT_ID="smart-warehouse-client"
MQTT_KEEPALIVE="60"
MQTT_RECONNECT_PERIOD="1000"
MQTT_CONNECT_TIMEOUT="30000"
```

### 2. 更新資料庫 / Update Database

執行 Prisma 遷移以創建 MQTT 設備表：
<!-- Run Prisma migration to create MQTT device table: -->

```bash
npx prisma generate
npx prisma db push
```

### 3. 使用 MQTT 面板 / Using MQTT Panel

1. **登入應用程式 / Login to Application**
2. **前往 MQTT 標籤 / Go to MQTT Tab**
3. **添加設備 / Add Device**：
   - 點擊 "Add Device" 按鈕
   - 輸入設備 ID（例如：`tuya_device_001`）
   - 輸入設備名稱（例如：`Living Room AC`）
   - 選擇供應商（Tuya/ESP/Midea）
   - 可選：選擇房間
   - 點擊 "Add Device" 完成

4. **控制設備 / Control Device**：
   - 點擊設備卡片上的 "Power On" 或 "Power Off"
   - 對於支援的設備，可以調整溫度、模式等

## MQTT 主題格式 / MQTT Topic Formats

### Tuya
- **狀態主題 / Status Topic**: `tuya/{device_id}/state`
- **命令主題 / Command Topic**: `tuya/{device_id}/command`

### ESP
- **狀態主題 / Status Topic**: `esp/{device_id}/status`
- **控制主題 / Control Topic**: `esp/{device_id}/set`

### Midea
- **狀態主題 / Status Topic**: `midea/{device_id}/status`
- **命令主題 / Command Topic**: `midea/{device_id}/command`

## 支援的控制命令 / Supported Control Commands

### 通用命令 / Common Commands
- `power_on` - 開啟電源
- `power_off` - 關閉電源

### Tuya 特定 / Tuya Specific
- `set_temperature` - 設定溫度
- `set_mode` - 設定模式
- `set_fan_speed` - 設定風速

### ESP 特定 / ESP Specific
- `ON` / `OFF` - 簡單開關
- `SET_TEMP` - 設定溫度
- `SET_STATE` - 設定狀態

### Midea 特定 / Midea Specific
- `set_temp` - 設定溫度
- `set_mode` - 設定模式
- `set_fan` - 設定風速
- `set_swing` - 設定擺風

## API 端點 / API Endpoints

### 獲取設備列表 / Get Devices
```
GET /api/mqtt/devices?householdId={householdId}&vendor={vendor}
```

### 創建設備 / Create Device
```
POST /api/mqtt/devices
Body: {
  deviceId: string,
  name: string,
  vendor: 'tuya' | 'esp' | 'midea',
  householdId: string,
  roomId?: string,
  metadata?: object
}
```

### 更新設備 / Update Device
```
PATCH /api/mqtt/devices/{id}
Body: {
  name?: string,
  roomId?: string,
  metadata?: object
}
```

### 刪除設備 / Delete Device
```
DELETE /api/mqtt/devices/{id}
```

### 控制設備 / Control Device
```
POST /api/mqtt/devices/{id}/control
Body: {
  action: string,
  value?: any
}
```

## 故障排除 / Troubleshooting

### 設備無法連接 / Device Cannot Connect
1. 檢查 MQTT Broker URL 是否正確
2. 確認用戶名和密碼正確
3. 檢查防火牆設定
4. 確認 MQTT Broker 正在運行

### 設備狀態未更新 / Device Status Not Updating
1. 確認設備正在發送狀態訊息到正確的主題
2. 檢查設備是否在線
3. 查看瀏覽器控制台是否有錯誤

### 控制命令無效 / Control Commands Not Working
1. 確認設備支援該命令
2. 檢查命令格式是否正確
3. 查看 MQTT Broker 日誌

## 注意事項 / Notes

- MQTT 連接會在應用程式啟動時自動建立
- 設備狀態每 5 秒自動刷新
- 所有設備操作都會記錄在活動歷史中
- 支援多語言介面（英文、繁體中文、簡體中文、日文）

---

**狀態 / Status:** ✅ **MQTT 整合已完成 / MQTT Integration Complete**

