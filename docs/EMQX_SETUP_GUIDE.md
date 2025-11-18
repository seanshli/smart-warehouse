# EMQX MQTT Broker 設定指南
## EMQX MQTT Broker Setup Guide

本指南說明如何設定 EMQX 作為 Smart Warehouse 的 MQTT Broker，支援多品牌 IoT 設備。
<!-- This guide explains how to set up EMQX as the MQTT Broker for Smart Warehouse, supporting multi-brand IoT devices. -->

## 為什麼選擇 EMQX？ / Why EMQX?

✅ **開源且功能強大** - 企業級 MQTT Broker
✅ **支援多品牌設備** - 靈活的主題管理和 ACL
✅ **規則引擎** - 支援數據轉換和自動化
✅ **高併發** - 支援數百萬連接
✅ **易於擴展** - 支援集群部署
✅ **豐富的認證方式** - 用戶名密碼、JWT、LDAP 等

## 安裝方式 / Installation Options

### 選項 1: Docker 部署（推薦） / Option 1: Docker Deployment (Recommended)

```bash
# 拉取 EMQX 映像
docker pull emqx/emqx:latest

# 運行 EMQX
docker run -d \
  --name emqx \
  -p 1883:1883 \
  -p 8083:8083 \
  -p 8084:8084 \
  -p 8883:8883 \
  -p 18083:18083 \
  -e EMQX_NAME=emqx \
  -e EMQX_HOST=localhost \
  emqx/emqx:latest
```

**端口說明 / Ports:**
- `1883`: MQTT TCP 端口
- `8083`: MQTT WebSocket 端口
- `8084`: MQTT SSL/TLS 端口
- `8883`: MQTT SSL/TLS TCP 端口
- `18083`: Dashboard Web UI 端口

### 選項 2: 雲端託管 EMQX Cloud / Option 2: EMQX Cloud (Hosted)

1. 前往 [EMQX Cloud](https://www.emqx.com/en/cloud)
2. 註冊帳號
3. 創建實例
4. 獲取連接資訊（Broker URL、用戶名、密碼）

### 選項 3: 本地安裝 / Option 3: Local Installation

#### macOS
```bash
brew install emqx
brew services start emqx
```

#### Linux
```bash
# 下載 EMQX
wget https://www.emqx.com/en/downloads/broker/5.3.0/emqx-5.3.0-el8-amd64.rpm

# 安裝
sudo rpm -ivh emqx-5.3.0-el8-amd64.rpm

# 啟動
sudo systemctl start emqx
sudo systemctl enable emqx
```

## 初始設定 / Initial Configuration

### 1. 訪問 Dashboard

打開瀏覽器訪問：`http://localhost:18083`

**預設帳號密碼 / Default Credentials:**
- 用戶名: `admin`
- 密碼: `public`

⚠️ **重要**: 首次登入後立即修改密碼！

### 2. 創建 MQTT 用戶 / Create MQTT User

1. 進入 **Authentication** > **Users**
2. 點擊 **Create**
3. 填寫資訊：
   - **Username**: `smart-warehouse`
   - **Password**: 設定強密碼
4. 點擊 **Create**

### 3. 設定 ACL（訪問控制列表）/ Configure ACL

為了安全，建議為不同品牌設備設定不同的主題權限：

#### 創建 ACL 規則 / Create ACL Rules

進入 **Authorization** > **ACL**，創建以下規則：

**規則 1: Tuya 設備**
```
Topic: tuya/+/state
Permission: Subscribe
```

**規則 2: ESP 設備**
```
Topic: esp/+/status
Permission: Subscribe
```

**規則 3: Midea 設備**
```
Topic: midea/+/status
Permission: Subscribe
```

**規則 4: 命令發送（所有品牌）**
```
Topic: +/+/command
Permission: Publish
```

**規則 5: 命令發送（ESP）**
```
Topic: esp/+/set
Permission: Publish
```

### 4. 啟用 TLS/SSL（生產環境必須）/ Enable TLS/SSL (Required for Production)

1. 進入 **Configuration** > **Listeners**
2. 找到 **SSL/TLS** 監聽器（端口 8883）
3. 點擊 **Settings**
4. 上傳 SSL 證書或使用自簽名證書

**生成自簽名證書（測試用）:**
```bash
# 生成私鑰
openssl genrsa -out emqx.key 2048

# 生成證書
openssl req -new -x509 -key emqx.key -out emqx.crt -days 365
```

## Smart Warehouse 配置 / Smart Warehouse Configuration

### 開發環境 / Development Environment

在 `.env.local` 中設定：

```bash
# EMQX MQTT Broker Configuration (Development)
MQTT_BROKER_URL="mqtt://localhost:1883"
MQTT_USERNAME="smart-warehouse"
MQTT_PASSWORD="your-password"
MQTT_CLIENT_ID="smart-warehouse-dev"
```

### 生產環境 / Production Environment

在生產環境變數中設定：

```bash
# EMQX MQTT Broker Configuration (Production)
MQTT_BROKER_URL="mqtts://emqx.yourdomain.com:8883"
MQTT_USERNAME="smart-warehouse-prod"
MQTT_PASSWORD="strong-production-password"
MQTT_CLIENT_ID="smart-warehouse-production"
```

## 主題結構建議 / Recommended Topic Structure

為了支援多品牌設備，建議使用以下主題結構：

```
# 狀態主題（設備發布）
tuya/{device_id}/state
esp/{device_id}/status
midea/{device_id}/status

# 命令主題（應用發布）
tuya/{device_id}/command
esp/{device_id}/set
midea/{device_id}/command
```

## 測試連接 / Testing Connection

### 使用 MQTT 客戶端測試 / Test with MQTT Client

```bash
# 安裝 MQTT 客戶端工具
npm install -g mqtt

# 訂閱主題
mqtt sub -h localhost -p 1883 -u smart-warehouse -P your-password -t 'tuya/+/state'

# 發布訊息
mqtt pub -h localhost -p 1883 -u smart-warehouse -P your-password -t 'tuya/device_001/command' -m '{"action":"power_on"}'
```

### 使用 EMQX Dashboard 測試 / Test with EMQX Dashboard

1. 進入 **Tools** > **WebSocket Client**
2. 連接資訊：
   - **Host**: `localhost`
   - **Port**: `8083`
   - **Client ID**: `test-client`
   - **Username**: `smart-warehouse`
   - **Password**: `your-password`
3. 訂閱主題：`tuya/+/state`
4. 發布訊息到：`tuya/device_001/command`

## 監控和維護 / Monitoring and Maintenance

### 查看連接狀態 / View Connection Status

1. 進入 **Monitoring** > **Clients**
2. 查看所有連接的客戶端
3. 監控連接數、訊息流量等

### 查看主題訂閱 / View Topic Subscriptions

1. 進入 **Monitoring** > **Subscriptions**
2. 查看所有主題訂閱
3. 監控訊息流量

### 日誌查看 / View Logs

```bash
# Docker 方式
docker logs emqx

# 本地安裝
tail -f /var/log/emqx/emqx.log
```

## 性能優化 / Performance Optimization

### 1. 調整連接數限制 / Adjust Connection Limits

在 `emqx.conf` 中設定：

```conf
# 最大連接數
node.max_connections = 1000000

# 每個客戶端最大訂閱數
zone.default.max_subscriptions = 0
```

### 2. 啟用持久化會話 / Enable Persistent Sessions

```conf
# 啟用持久化
zone.default.persistence = true
```

### 3. 設定訊息保留 / Configure Message Retention

```conf
# 保留訊息數量
retainer.max_retained_messages = 1000000
```

## 安全建議 / Security Recommendations

### 1. 使用強密碼 / Use Strong Passwords

```bash
# 生成強密碼
openssl rand -base64 32
```

### 2. 啟用 TLS/SSL / Enable TLS/SSL

生產環境必須使用 `mqtts://` 協議。

### 3. 設定 ACL 規則 / Configure ACL Rules

限制每個用戶只能訪問其需要的主題。

### 4. 定期更新 / Regular Updates

```bash
# 更新 EMQX
docker pull emqx/emqx:latest
docker stop emqx
docker rm emqx
# 重新運行（使用新版本）
```

## 故障排除 / Troubleshooting

### 問題 1: 無法連接到 EMQX

**解決方案:**
1. 確認 EMQX 正在運行：`docker ps` 或 `systemctl status emqx`
2. 檢查端口是否開放：`netstat -tuln | grep 1883`
3. 檢查防火牆設定

### 問題 2: 認證失敗

**解決方案:**
1. 確認用戶名和密碼正確
2. 檢查 ACL 規則是否允許訪問
3. 查看 EMQX 日誌：`docker logs emqx`

### 問題 3: 訊息無法接收

**解決方案:**
1. 確認主題訂閱正確
2. 檢查 QoS 等級（建議使用 QoS 1）
3. 確認 ACL 規則允許訂閱該主題

## 生產環境部署建議 / Production Deployment Recommendations

### 1. 使用 Docker Compose

創建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  emqx:
    image: emqx/emqx:latest
    container_name: emqx
    ports:
      - "1883:1883"
      - "8083:8083"
      - "8883:8883"
      - "18083:18083"
    environment:
      - EMQX_NAME=emqx
      - EMQX_HOST=emqx.yourdomain.com
    volumes:
      - emqx-data:/opt/emqx/data
      - emqx-log:/opt/emqx/log
    restart: unless-stopped

volumes:
  emqx-data:
  emqx-log:
```

### 2. 使用反向代理（Nginx）

```nginx
# MQTT over WebSocket
location /mqtt {
    proxy_pass http://localhost:8083;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### 3. 設定域名和 SSL 證書

使用 Let's Encrypt 獲取免費 SSL 證書：

```bash
certbot certonly --standalone -d emqx.yourdomain.com
```

## 參考資源 / Reference Resources

- [EMQX 官方文檔](https://www.emqx.io/docs)
- [EMQX GitHub](https://github.com/emqx/emqx)
- [EMQX Cloud](https://www.emqx.com/en/cloud)

---

**狀態 / Status:** ✅ **EMQX 設定指南完成 / EMQX Setup Guide Complete**

