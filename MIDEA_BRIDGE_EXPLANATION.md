# Midea Bridge 說明 / Midea Bridge Explanation

## 什麼是 Bridge？ / What is Bridge?

**Bridge（橋接器）** 是一個服務，用於將 **Midea Cloud API** 的設備橋接到本地 **MQTT Broker**。

**Bridge** is a service that bridges **Midea Cloud API** devices to a local **MQTT Broker**.

### Bridge 的作用 / Bridge Purpose

1. **連接 Midea Cloud** - 通過 Midea Cloud API 獲取設備列表和狀態
2. **轉換到 MQTT** - 將 Midea Cloud 設備狀態發布到 MQTT Broker
3. **雙向通信** - 接收 MQTT 命令並轉發到 Midea Cloud API
4. **統一管理** - 讓 Midea 設備可以通過 MQTT 統一管理

### Bridge vs Aqara

- **Bridge** = Midea 專用，連接 Midea Cloud 到 MQTT
- **Aqara** = 使用 zigbee2mqtt，是 Zigbee 網關，不需要 Bridge

## Bridge 配置要求 / Bridge Configuration Requirements

### 必需的環境變數 / Required Environment Variables

1. **MIDEA_CLIENT_ID** (MIDEA_CLIENT_ID)
   - Midea Cloud API Client ID
   - 從 [Midea IoT Platform](https://iot.midea.com/) 獲取

2. **MIDEA_CLIENT_SECRET** (MIDEA_CLIENT_SECRET)
   - Midea Cloud API Client Secret
   - 從 Midea IoT Platform 獲取

3. **MQTT_BROKER_URL** (MQTT_BROKER_URL)
   - MQTT Broker 地址
   - 格式: `mqtt://broker.example.com:1883` 或 `mqtts://broker.example.com:8883`
   - 示例: `mqtts://xxx.emqx.cloud:8883`

### 可選的環境變數 / Optional Environment Variables

4. **MQTT_USERNAME** (MQTT_USERNAME)
   - MQTT Broker 用戶名（如果 Broker 需要認證）

5. **MQTT_PASSWORD** (MQTT_PASSWORD)
   - MQTT Broker 密碼（如果 Broker 需要認證）

## 如何設置 Bridge / How to Setup Bridge

### Step 1: 獲取 Midea API 憑證

1. 訪問 [Midea IoT Platform](https://iot.midea.com/)
2. 登入並創建應用
3. 獲取 **Client ID** 和 **Client Secret**

### Step 2: 設置 MQTT Broker

如果你還沒有 MQTT Broker，可以：

**選項 A: 使用 EMQX Cloud（推薦）**
- 訪問 [EMQX Cloud](https://www.emqx.com/en/cloud)
- 創建免費帳號
- 創建一個 Broker 實例
- 獲取連接 URL（格式: `mqtts://xxx.emqx.cloud:8883`）

**選項 B: 使用本地 MQTT Broker**
- 安裝 Mosquitto 或 EMQX
- 使用 `mqtt://localhost:1883`

### Step 3: 在 Vercel 設置環境變數

1. 前往 [Vercel Dashboard](https://vercel.com/sean-lis-projects-e3ebb6ec/smart-warehouse/settings/environment-variables)
2. 添加以下環境變數：

```
Key: MIDEA_CLIENT_ID
Value: [你的 Midea Client ID]
Environment: Production, Preview, Development
```

```
Key: MIDEA_CLIENT_SECRET
Value: [你的 Midea Client Secret]
Environment: Production, Preview, Development
```

```
Key: MQTT_BROKER_URL
Value: mqtts://xxx.emqx.cloud:8883 (或你的 Broker URL)
Environment: Production, Preview, Development
```

```
Key: MQTT_USERNAME (如果 Broker 需要)
Value: [你的 MQTT 用戶名]
Environment: Production, Preview, Development
```

```
Key: MQTT_PASSWORD (如果 Broker 需要)
Value: [你的 MQTT 密碼]
Environment: Production, Preview, Development
```

### Step 4: 重新部署

環境變數設置後，需要重新部署：

```bash
git commit --allow-empty -m "Trigger redeploy for Bridge config"
git push
```

### Step 5: 啟動 Bridge

1. 打開應用 → MQTT 設備管理
2. 點擊 **"啟動 Bridge"** 按鈕
3. 等待幾秒鐘，Bridge 會自動掃描 Midea 設備
4. 設備會自動出現在設備列表中

## Bridge 錯誤排查 / Bridge Troubleshooting

### 錯誤: "Missing required configuration"

**原因**: 缺少必需的環境變數

**解決方案**:
1. 檢查 Vercel 環境變數是否已設置
2. 確認所有必需的變數都已添加
3. 重新部署應用

### 錯誤: "Failed to connect to MQTT Broker"

**原因**: MQTT Broker 連接失敗

**解決方案**:
1. 檢查 `MQTT_BROKER_URL` 是否正確
2. 確認 Broker 是否可訪問
3. 檢查防火牆設置
4. 如果使用 TLS (`mqtts://`)，確認證書有效

### 錯誤: "Midea API authentication failed"

**原因**: Midea API 憑證無效

**解決方案**:
1. 檢查 `MIDEA_CLIENT_ID` 和 `MIDEA_CLIENT_SECRET` 是否正確
2. 確認憑證沒有過期
3. 在 Midea IoT Platform 重新生成憑證

## Bridge 工作流程 / Bridge Workflow

```
Midea Cloud API
    ↓
Bridge Service (輪詢設備狀態)
    ↓
MQTT Broker (發布狀態到 midea/+/status)
    ↓
Smart Warehouse App (訂閱並顯示設備)
```

## 相關文檔 / Related Documentation

- [Midea MQTT Bridge Guide](./docs/MIDEA_MQTT_BRIDGE_GUIDE.md)
- [MQTT Setup Guide](./MQTT_SETUP_GUIDE.md)
- [EMQX Cloud Setup](./docs/EMQX_CLOUD_SETUP.md)

