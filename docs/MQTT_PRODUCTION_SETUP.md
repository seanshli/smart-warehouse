# MQTT 生產環境設定指南
## MQTT Production Environment Setup Guide

本指南說明如何在生產環境中設定 MQTT Broker 連接。
<!-- This guide explains how to set up MQTT Broker connection in production environment. -->

## 環境變數配置 / Environment Variables Configuration

### Vercel 部署 / Vercel Deployment

1. **前往 Vercel Dashboard**
2. **選擇您的專案**
3. **進入 Settings > Environment Variables**
4. **添加以下環境變數 / Add the following environment variables:**

```bash
MQTT_BROKER_URL=mqtts://your-production-broker.com:8883
MQTT_USERNAME=your-production-username
MQTT_PASSWORD=your-production-password
MQTT_CLIENT_ID=smart-warehouse-production-client
MQTT_KEEPALIVE=60
MQTT_RECONNECT_PERIOD=1000
MQTT_CONNECT_TIMEOUT=30000
```

5. **重新部署應用程式 / Redeploy Application**

### Railway 部署 / Railway Deployment

1. **前往 Railway Dashboard**
2. **選擇您的服務**
3. **進入 Variables 標籤**
4. **添加相同的環境變數**
5. **重新部署**

### 其他平台 / Other Platforms

在任何支援環境變數的平台（DigitalOcean、AWS、Google Cloud 等）上，添加相同的環境變數。

## MQTT Broker 選擇 / MQTT Broker Options

### 選項 1: 雲端 MQTT Broker 服務 / Cloud MQTT Broker Services

#### HiveMQ Cloud
- **URL**: `mqtts://your-instance.hivemq.cloud:8883`
- **優點**: 託管服務，易於設定
- **缺點**: 可能需要付費

#### AWS IoT Core
- **URL**: `mqtts://your-endpoint.iot.region.amazonaws.com:8883`
- **優點**: 與 AWS 生態系統整合
- **缺點**: 設定較複雜

#### Mosquitto (自架) / Self-Hosted
- **URL**: `mqtts://your-domain.com:8883`
- **優點**: 完全控制
- **缺點**: 需要自行維護

### 選項 2: 本地 MQTT Broker（透過 VPN/隧道） / Local MQTT Broker (via VPN/Tunnel)

如果您的 MQTT Broker 在本地網路中，可以使用：
<!-- If your MQTT Broker is on local network, you can use: -->

1. **VPN 連接** - 將生產伺服器連接到本地網路
2. **SSH 隧道** - 建立 SSH 隧道轉發 MQTT 端口
3. **ngrok/Cloudflare Tunnel** - 建立安全隧道

## 安全建議 / Security Recommendations

### 1. 使用 TLS/SSL 連接 / Use TLS/SSL Connection

**生產環境必須使用 `mqtts://` (MQTT over TLS)**
<!-- Production environment MUST use `mqtts://` (MQTT over TLS) -->

```bash
# ✅ 正確 / Correct
MQTT_BROKER_URL="mqtts://broker.example.com:8883"

# ❌ 錯誤（不安全）/ Wrong (Insecure)
MQTT_BROKER_URL="mqtt://broker.example.com:1883"
```

### 2. 強密碼 / Strong Passwords

使用強密碼保護 MQTT 連接：
<!-- Use strong passwords to protect MQTT connection: -->

```bash
# 生成強密碼 / Generate strong password
openssl rand -base64 32
```

### 3. 客戶端 ID 唯一性 / Unique Client IDs

為每個環境使用不同的客戶端 ID：
<!-- Use different client IDs for each environment: -->

```bash
# 開發環境 / Development
MQTT_CLIENT_ID="smart-warehouse-dev-${HOSTNAME}"

# 生產環境 / Production
MQTT_CLIENT_ID="smart-warehouse-prod-${HOSTNAME}"
```

### 4. 訪問控制 / Access Control

在 MQTT Broker 上設定訪問控制列表 (ACL)：
<!-- Set up Access Control List (ACL) on MQTT Broker: -->

- 限制每個用戶只能訪問其家庭的主題
- 使用主題前綴：`household/{householdId}/...`

## 測試連接 / Testing Connection

### 1. 檢查環境變數 / Check Environment Variables

```bash
# 在生產環境中檢查
echo $MQTT_BROKER_URL
echo $MQTT_USERNAME
```

### 2. 測試 MQTT 連接 / Test MQTT Connection

使用 MQTT 客戶端工具測試：
<!-- Use MQTT client tool to test: -->

```bash
# 安裝 mosquitto-clients
npm install -g mqtt

# 測試連接
mqtt pub -h your-broker.com -p 8883 -u username -P password -t test/topic -m "test message"
```

### 3. 檢查應用程式日誌 / Check Application Logs

查看應用程式日誌確認 MQTT 連接狀態：
<!-- Check application logs to confirm MQTT connection status: -->

```bash
# 應該看到類似訊息 / Should see messages like:
# MQTT: Using production configuration
# MQTT: Broker URL: mqtts://your-broker.com:8883
# MQTT: Connected successfully
```

## 故障排除 / Troubleshooting

### 問題 1: 無法連接到 MQTT Broker
<!-- Problem 1: Cannot connect to MQTT Broker -->

**解決方案 / Solution:**
1. 確認 MQTT Broker URL 正確
2. 檢查防火牆設定
3. 確認 TLS 證書有效
4. 檢查用戶名和密碼

### 問題 2: 連接被拒絕
<!-- Problem 2: Connection refused -->

**解決方案 / Solution:**
1. 確認 MQTT Broker 正在運行
2. 檢查端口是否正確（8883 for TLS, 1883 for non-TLS）
3. 確認客戶端 ID 唯一
4. 檢查 ACL 設定

### 問題 3: TLS 握手失敗
<!-- Problem 3: TLS handshake failed -->

**解決方案 / Solution:**
1. 確認使用 `mqtts://` 協議
2. 檢查 TLS 證書是否有效
3. 確認 Broker 支援 TLS
4. 檢查系統時鐘是否正確

## 範例配置 / Example Configurations

### 開發環境 / Development

```bash
MQTT_BROKER_URL="mqtt://localhost:1883"
MQTT_USERNAME="dev_user"
MQTT_PASSWORD="dev_password"
MQTT_CLIENT_ID="smart-warehouse-dev"
```

### 生產環境（HiveMQ Cloud）/ Production (HiveMQ Cloud)

```bash
MQTT_BROKER_URL="mqtts://abc123.hivemq.cloud:8883"
MQTT_USERNAME="your-hivemq-username"
MQTT_PASSWORD="your-hivemq-password"
MQTT_CLIENT_ID="smart-warehouse-prod"
```

### 生產環境（自架 Mosquitto）/ Production (Self-Hosted Mosquitto)

```bash
MQTT_BROKER_URL="mqtts://mqtt.yourdomain.com:8883"
MQTT_USERNAME="production_user"
MQTT_PASSWORD="strong-production-password"
MQTT_CLIENT_ID="smart-warehouse-prod-${HOSTNAME}"
```

## 監控和維護 / Monitoring and Maintenance

### 監控 MQTT 連接狀態 / Monitor MQTT Connection Status

在應用程式中，MQTT 連接狀態會自動記錄在日誌中。您也可以：

1. **檢查設備狀態** - 在 MQTT 面板中查看設備是否在線
2. **查看應用程式日誌** - 檢查 MQTT 連接錯誤
3. **使用 MQTT Broker 監控工具** - 查看連接數和訊息流量

### 維護建議 / Maintenance Recommendations

1. **定期更新密碼** - 每 3-6 個月更新一次
2. **監控連接數** - 確保不會超過 Broker 限制
3. **備份配置** - 保存環境變數配置
4. **測試故障轉移** - 準備備用 MQTT Broker

---

**狀態 / Status:** ✅ **生產環境 MQTT 配置已就緒 / Production MQTT Configuration Ready**

