# EMQX 部署指南
## EMQX Deployment Guide

本指南詳細說明如何部署 EMQX MQTT Broker，支援 Smart Warehouse 的多品牌 IoT 設備。
<!-- This guide explains how to deploy EMQX MQTT Broker to support Smart Warehouse's multi-brand IoT devices. -->

## 部署方式選擇 / Deployment Options

### 方式 1: EMQX Cloud（推薦 - 最簡單）/ Option 1: EMQX Cloud (Recommended - Easiest)
✅ **優點**: 託管服務，無需維護，自動擴展  
✅ **適合**: 快速上線，不想維護伺服器

### 方式 2: Docker 部署（推薦 - 自架）/ Option 2: Docker Deployment (Recommended - Self-Hosted)
✅ **優點**: 完全控制，成本低，靈活  
✅ **適合**: 有伺服器，需要完全控制

### 方式 3: 本地安裝 / Option 3: Local Installation
✅ **優點**: 簡單直接  
✅ **適合**: 開發測試，本地使用

---

## 方式 1: EMQX Cloud（推薦）/ Option 1: EMQX Cloud (Recommended)

### 步驟 1: 註冊帳號 / Step 1: Register Account

1. **前往 EMQX Cloud**
   - 訪問 [emqx.com/cloud](https://www.emqx.com/en/cloud)
   - 點擊 **Sign Up** 註冊

2. **選擇方案**
   - **免費方案**: 100 連接，適合測試
   - **專業方案**: $49/月起，適合生產環境

### 步驟 2: 創建部署 / Step 2: Create Deployment

1. **登入後創建部署**
   - 點擊 **Create Deployment**
   - 選擇區域（建議選擇離您最近的區域）
   - 選擇方案

2. **配置部署**
   - **名稱**: `smart-warehouse-mqtt`
   - **區域**: 選擇最接近的區域（如：Singapore）
   - **版本**: 選擇最新穩定版

3. **等待部署完成**
   - 通常需要 5-10 分鐘
   - 部署完成後會顯示連接資訊

### 步驟 3: 獲取連接資訊 / Step 3: Get Connection Info

部署完成後，您會看到：

```
Broker URL: mqtts://xxx.hivemq.cloud:8883
Username: your-username
Password: your-password
```

### 步驟 4: 配置 Smart Warehouse / Step 4: Configure Smart Warehouse

在 Vercel Dashboard > Environment Variables 添加：

```bash
MQTT_BROKER_URL="mqtts://xxx.hivemq.cloud:8883"
MQTT_USERNAME="your-username"
MQTT_PASSWORD="your-password"
MQTT_CLIENT_ID="smart-warehouse-production"
```

### 步驟 5: 創建 MQTT 用戶（可選）/ Step 5: Create MQTT User (Optional)

1. 進入 EMQX Cloud Dashboard
2. 前往 **Authentication** > **Users**
3. 創建專用用戶：
   - Username: `smart-warehouse-prod`
   - Password: 強密碼

---

## 方式 2: Docker 部署（自架）/ Option 2: Docker Deployment (Self-Hosted)

### 前置需求 / Prerequisites

- Docker 和 Docker Compose 已安裝
- 伺服器（VPS/雲端實例）
- 域名（可選，但推薦）

### 步驟 1: 準備 Docker Compose 文件 / Step 1: Prepare Docker Compose File

項目中已包含 `docker-compose.emqx.yml`，可以直接使用：

```bash
# 在項目根目錄
docker-compose -f docker-compose.emqx.yml up -d
```

### 步驟 2: 基本部署（無域名）/ Step 2: Basic Deployment (No Domain)

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

**端口說明:**
- `1883`: MQTT TCP 端口
- `8083`: MQTT WebSocket 端口
- `8883`: MQTT SSL/TLS 端口
- `18083`: Dashboard Web UI 端口

### 步驟 3: 訪問 Dashboard / Step 3: Access Dashboard

打開瀏覽器訪問：`http://your-server-ip:18083`

**預設帳號:**
- 用戶名: `admin`
- 密碼: `public`

⚠️ **重要**: 首次登入後立即修改密碼！

### 步驟 4: 配置 TLS/SSL（生產環境必須）/ Step 4: Configure TLS/SSL (Required for Production)

#### 選項 A: 使用 Let's Encrypt（推薦）/ Option A: Use Let's Encrypt (Recommended)

1. **安裝 Certbot**
   ```bash
   sudo apt-get update
   sudo apt-get install certbot
   ```

2. **獲取 SSL 證書**
   ```bash
   sudo certbot certonly --standalone -d emqx.yourdomain.com
   ```

3. **配置 EMQX 使用 SSL**
   - 進入 EMQX Dashboard
   - Configuration > Listeners
   - 找到 SSL/TLS 監聽器（端口 8883）
   - 上傳證書：
     - Certificate: `/etc/letsencrypt/live/emqx.yourdomain.com/fullchain.pem`
     - Private Key: `/etc/letsencrypt/live/emqx.yourdomain.com/privkey.pem`

#### 選項 B: 使用 Nginx 反向代理 / Option B: Use Nginx Reverse Proxy

1. **安裝 Nginx**
   ```bash
   sudo apt-get install nginx
   ```

2. **配置 Nginx**
   創建 `/etc/nginx/sites-available/emqx`:

   ```nginx
   server {
       listen 443 ssl;
       server_name emqx.yourdomain.com;

       ssl_certificate /etc/letsencrypt/live/emqx.yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/emqx.yourdomain.com/privkey.pem;

       location / {
           proxy_pass http://localhost:18083;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }

       # MQTT over WebSocket
       location /mqtt {
           proxy_pass http://localhost:8083;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
       }
   }
   ```

3. **啟用配置**
   ```bash
   sudo ln -s /etc/nginx/sites-available/emqx /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### 步驟 5: 創建 MQTT 用戶 / Step 5: Create MQTT User

1. **進入 Dashboard**
   - 訪問 `http://your-server-ip:18083` 或 `https://emqx.yourdomain.com`

2. **創建用戶**
   - 進入 **Authentication** > **Users**
   - 點擊 **Create**
   - 填寫資訊：
     - Username: `smart-warehouse`
     - Password: 設定強密碼（使用 `openssl rand -base64 32` 生成）

3. **設定 ACL 規則（可選）**
   - 進入 **Authorization** > **ACL**
   - 創建規則限制主題訪問

### 步驟 6: 配置 Smart Warehouse / Step 6: Configure Smart Warehouse

在 Vercel Dashboard > Environment Variables 添加：

```bash
# 如果有域名和 SSL
MQTT_BROKER_URL="mqtts://emqx.yourdomain.com:8883"

# 或使用 IP（不推薦，不安全）
MQTT_BROKER_URL="mqtt://your-server-ip:1883"

MQTT_USERNAME="smart-warehouse"
MQTT_PASSWORD="your-strong-password"
MQTT_CLIENT_ID="smart-warehouse-production"
```

---

## 方式 3: 本地安裝 / Option 3: Local Installation

### macOS

```bash
# 使用 Homebrew
brew install emqx
brew services start emqx
```

### Linux (Ubuntu/Debian)

```bash
# 下載 EMQX
wget https://www.emqx.com/en/downloads/broker/5.3.0/emqx-5.3.0-el8-amd64.rpm

# 安裝
sudo rpm -ivh emqx-5.3.0-el8-amd64.rpm

# 啟動
sudo systemctl start emqx
sudo systemctl enable emqx
```

### 訪問 Dashboard

- URL: `http://localhost:18083`
- 用戶名: `admin`
- 密碼: `public`

---

## 配置 ACL 規則（推薦）/ Configure ACL Rules (Recommended)

為了安全，建議為不同品牌設備設定不同的主題權限：

### 規則 1: Tuya 設備狀態訂閱

```
Topic: tuya/+/state
Permission: Subscribe
```

### 規則 2: ESP 設備狀態訂閱

```
Topic: esp/+/status
Permission: Subscribe
```

### 規則 3: Midea 設備狀態訂閱

```
Topic: midea/+/status
Permission: Subscribe
```

### 規則 4: 命令發布（所有品牌）

```
Topic: +/+/command
Permission: Publish
```

### 規則 5: ESP 命令發布

```
Topic: esp/+/set
Permission: Publish
```

---

## 測試連接 / Test Connection

### 使用 MQTT 客戶端測試 / Test with MQTT Client

```bash
# 安裝 MQTT 客戶端工具
npm install -g mqtt

# 訂閱主題
mqtt sub -h your-broker-url -p 8883 -u username -P password -t 'tuya/+/state'

# 發布訊息
mqtt pub -h your-broker-url -p 8883 -u username -P password -t 'tuya/device_001/command' -m '{"action":"power_on"}'
```

### 使用 EMQX Dashboard 測試 / Test with EMQX Dashboard

1. 進入 **Tools** > **WebSocket Client**
2. 連接資訊：
   - Host: `your-broker-url`
   - Port: `8083` (WebSocket) 或 `8883` (SSL)
   - Client ID: `test-client`
   - Username: `smart-warehouse`
   - Password: `your-password`
3. 訂閱主題：`tuya/+/state`
4. 發布訊息到：`tuya/device_001/command`

---

## 監控和維護 / Monitoring and Maintenance

### 查看連接狀態 / View Connection Status

1. 進入 **Monitoring** > **Clients**
2. 查看所有連接的客戶端
3. 監控連接數、訊息流量

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

---

## 性能優化 / Performance Optimization

### 調整連接數限制 / Adjust Connection Limits

編輯 `emqx.conf` 或使用環境變數：

```bash
# Docker 方式
docker run -d \
  -e EMQX_NODE__MAX_CONNECTIONS=1000000 \
  emqx/emqx:latest
```

### 啟用持久化會話 / Enable Persistent Sessions

```bash
# 使用環境變數
-e EMQX_ZONES__DEFAULT__PERSISTENCE=true
```

---

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
docker-compose -f docker-compose.emqx.yml up -d
```

---

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

### 問題 3: SSL 連接失敗

**解決方案:**
1. 確認使用 `mqtts://` 協議
2. 檢查 SSL 證書是否有效
3. 確認端口 8883 已開放

---

## 快速開始（使用項目中的配置）/ Quick Start (Using Project Config)

項目中已包含 `docker-compose.emqx.yml`，可以直接使用：

```bash
# 啟動 EMQX
docker-compose -f docker-compose.emqx.yml up -d

# 查看日誌
docker-compose -f docker-compose.emqx.yml logs -f

# 停止
docker-compose -f docker-compose.emqx.yml down
```

訪問 Dashboard: `http://localhost:18083`

---

## 成本估算 / Cost Estimation

### EMQX Cloud
- **免費方案**: 100 連接，適合測試
- **專業方案**: $49/月起，適合生產環境

### 自架 EMQX
- **VPS 成本**: $5-20/月（DigitalOcean, Linode 等）
- **域名**: $10-15/年
- **SSL 證書**: 免費（Let's Encrypt）
- **總計**: ~$5-20/月

---

## 推薦配置 / Recommended Configuration

### 開發環境 / Development Environment

```bash
# 使用 Docker Compose（項目中已配置）
docker-compose -f docker-compose.emqx.yml up -d

# 環境變數
MQTT_BROKER_URL="mqtt://localhost:1883"
MQTT_USERNAME="smart-warehouse"
MQTT_PASSWORD="dev-password"
```

### 生產環境 / Production Environment

```bash
# 使用 EMQX Cloud（推薦）
MQTT_BROKER_URL="mqtts://xxx.hivemq.cloud:8883"

# 或自架 EMQX（需要配置 SSL）
MQTT_BROKER_URL="mqtts://emqx.yourdomain.com:8883"
MQTT_USERNAME="smart-warehouse-prod"
MQTT_PASSWORD="strong-production-password"
```

---

**狀態 / Status:** ✅ **EMQX 部署指南完成 / EMQX Deployment Guide Complete**

