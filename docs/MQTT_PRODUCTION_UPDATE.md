# MQTT 生產環境更新指南
## MQTT Production Environment Update Guide

Smart Warehouse 已經在 Vercel 和 Supabase 上運行。本指南說明如何添加 MQTT 功能到現有的生產環境。
<!-- Smart Warehouse is already running on Vercel and Supabase. This guide explains how to add MQTT functionality to the existing production environment. -->

## 當前生產環境狀態 / Current Production Status

✅ **已部署 / Already Deployed:**
- **Vercel**: `https://smart-warehouse-five.vercel.app`
- **Supabase**: `db.ddvjegjzxjaetpaptjlo.supabase.co`
- **資料庫**: PostgreSQL (Supabase)
- **狀態**: 正常運行中

## 需要添加的配置 / Configuration to Add

### 步驟 1: 在 Vercel 添加 MQTT 環境變數 / Step 1: Add MQTT Environment Variables in Vercel

1. **前往 Vercel Dashboard**
   - 訪問 [vercel.com/dashboard](https://vercel.com/dashboard)
   - 選擇 **Smart Warehouse** 專案

2. **進入環境變數設定**
   - Settings > Environment Variables

3. **添加以下 MQTT 環境變數 / Add the following MQTT environment variables:**

```bash
# MQTT Broker Configuration (Production)
MQTT_BROKER_URL="mqtts://emqx.yourdomain.com:8883"
MQTT_USERNAME="smart-warehouse-prod"
MQTT_PASSWORD="your-strong-production-password"
MQTT_CLIENT_ID="smart-warehouse-production-client"
MQTT_KEEPALIVE="60"
MQTT_RECONNECT_PERIOD="1000"
MQTT_CONNECT_TIMEOUT="30000"
```

4. **選擇環境 / Select Environment:**
   - 選擇 **Production**（或 Production, Preview, Development 全部）
   - 點擊 **Save**

5. **重新部署 / Redeploy:**
   - 前往 Deployments 標籤
   - 點擊最新部署的 **...** 選單
   - 選擇 **Redeploy**

### 步驟 2: 設定 EMQX MQTT Broker / Step 2: Setup EMQX MQTT Broker

#### 選項 A: EMQX Cloud（推薦 - 最簡單）/ Option A: EMQX Cloud (Recommended - Easiest)

1. **註冊 EMQX Cloud**
   - 前往 [emqx.com/cloud](https://www.emqx.com/en/cloud)
   - 創建帳號並創建實例

2. **獲取連接資訊**
   - Broker URL: `mqtts://xxx.hivemq.cloud:8883`
   - 用戶名和密碼

3. **更新 Vercel 環境變數**
   ```bash
   MQTT_BROKER_URL="mqtts://xxx.hivemq.cloud:8883"
   MQTT_USERNAME="your-emqx-username"
   MQTT_PASSWORD="your-emqx-password"
   ```

#### 選項 B: 自架 EMQX / Option B: Self-Hosted EMQX

1. **在伺服器上部署 EMQX**
   ```bash
   docker run -d \
     --name emqx \
     -p 1883:1883 \
     -p 8883:8883 \
     -p 18083:18083 \
     -e EMQX_HOST=emqx.yourdomain.com \
     emqx/emqx:latest
   ```

2. **設定域名和 SSL**
   - 使用 Nginx 反向代理
   - 配置 Let's Encrypt SSL 證書

3. **更新 Vercel 環境變數**
   ```bash
   MQTT_BROKER_URL="mqtts://emqx.yourdomain.com:8883"
   MQTT_USERNAME="smart-warehouse-prod"
   MQTT_PASSWORD="your-strong-password"
   ```

### 步驟 3: 更新 Supabase 資料庫 / Step 3: Update Supabase Database

由於我們已經在使用 Supabase，只需要運行資料庫遷移來添加新的 IoT 設備表：

1. **連接到 Supabase 資料庫**
   ```bash
   # 使用現有的 DATABASE_URL（已在 Vercel 中設定）
   # 或從 Supabase Dashboard 獲取新的連接字串
   ```

2. **運行 Prisma 遷移**
   ```bash
   # 設定資料庫 URL
   export DATABASE_URL="postgresql://postgres:password@db.ddvjegjzxjaetpaptjlo.supabase.co:5432/postgres"
   
   # 運行遷移（添加 IoTDevice 表）
   npx prisma db push
   ```

   或者使用 Supabase SQL Editor：
   ```sql
   -- 創建 IoT 設備表
   CREATE TABLE IF NOT EXISTS iot_devices (
     id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
     device_id TEXT NOT NULL,
     name TEXT NOT NULL,
     vendor TEXT NOT NULL,
     connection_type TEXT DEFAULT 'mqtt',
     topic TEXT,
     command_topic TEXT,
     status_topic TEXT,
     base_url TEXT,
     api_key TEXT,
     access_token TEXT,
     household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
     room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
     status TEXT DEFAULT 'offline',
     state JSONB,
     metadata JSONB,
     last_seen TIMESTAMPTZ,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW(),
     UNIQUE(household_id, device_id, vendor)
   );
   
   CREATE INDEX IF NOT EXISTS idx_iot_devices_household ON iot_devices(household_id);
   CREATE INDEX IF NOT EXISTS idx_iot_devices_vendor ON iot_devices(vendor);
   CREATE INDEX IF NOT EXISTS idx_iot_devices_connection_type ON iot_devices(connection_type);
   CREATE INDEX IF NOT EXISTS idx_iot_devices_status ON iot_devices(status);
   ```

### 步驟 4: 驗證部署 / Step 4: Verify Deployment

1. **檢查 Vercel 部署狀態**
   - 前往 Vercel Dashboard > Deployments
   - 確認最新部署成功

2. **測試 MQTT 功能**
   - 訪問 `https://smart-warehouse-five.vercel.app`
   - 登入應用程式
   - 前往 **MQTT Devices** 標籤
   - 嘗試添加設備

3. **檢查環境變數**
   ```bash
   # 在 Vercel Dashboard 確認所有環境變數已設定
   # 特別是 MQTT_BROKER_URL, MQTT_USERNAME, MQTT_PASSWORD
   ```

## 現有環境變數檢查 / Existing Environment Variables Check

### 已在 Vercel 設定的變數 / Already Configured in Vercel

確認以下變數已設定：

- [x] `DATABASE_URL` - Supabase 資料庫連接
- [x] `NEXTAUTH_URL` - `https://smart-warehouse-five.vercel.app`
- [x] `NEXTAUTH_SECRET` - 生產環境密鑰
- [x] `CAP_SERVER_URL` - `https://smart-warehouse-five.vercel.app`
- [ ] `MQTT_BROKER_URL` - **需要添加**
- [ ] `MQTT_USERNAME` - **需要添加**
- [ ] `MQTT_PASSWORD` - **需要添加**
- [ ] `MQTT_CLIENT_ID` - **需要添加**（可選，有預設值）

### 可選變數（如已設定則保留）/ Optional Variables (Keep if Already Set)

- [ ] `OPENAI_API_KEY` - OpenAI API
- [ ] `IFLYTEK_APP_KEY` - iFLYTEK API
- [ ] `HOME_ASSISTANT_BASE_URL` - Home Assistant
- [ ] `HOME_ASSISTANT_ACCESS_TOKEN` - Home Assistant Token

## 快速更新步驟摘要 / Quick Update Summary

### 最小化更新（僅添加 MQTT）/ Minimal Update (MQTT Only)

1. **設定 EMQX**（選擇一個）:
   - EMQX Cloud: 註冊並創建實例
   - 自架: 部署 EMQX 並配置 SSL

2. **在 Vercel 添加環境變數**:
   ```
   MQTT_BROKER_URL=mqtts://...
   MQTT_USERNAME=...
   MQTT_PASSWORD=...
   ```

3. **更新資料庫**:
   ```bash
   npx prisma db push
   ```

4. **重新部署 Vercel**:
   - 自動觸發（推送代碼）或手動 Redeploy

5. **測試**:
   - 訪問生產環境
   - 測試 MQTT 設備功能

## 不需要的操作 / What You DON'T Need to Do

❌ **不需要重新部署整個應用程式**
- Vercel 會自動部署代碼更改

❌ **不需要更改資料庫**
- 繼續使用現有的 Supabase 資料庫

❌ **不需要更改域名**
- 繼續使用 `smart-warehouse-five.vercel.app`

❌ **不需要重新設定認證**
- NextAuth 配置保持不變

## 驗證清單 / Verification Checklist

部署後驗證：

- [ ] Vercel 部署成功
- [ ] 環境變數已添加
- [ ] 資料庫遷移完成（IoTDevice 表存在）
- [ ] MQTT Broker 可連接
- [ ] 可以添加 MQTT 設備
- [ ] 可以控制 MQTT 設備
- [ ] 可以添加 RESTful 設備（Philips、Panasonic）
- [ ] 所有現有功能正常運作

## 故障排除 / Troubleshooting

### 問題: MQTT 連接失敗

**檢查:**
1. Vercel 環境變數是否正確設定
2. MQTT Broker URL 是否可訪問
3. 用戶名和密碼是否正確
4. 是否使用 `mqtts://`（TLS）在生產環境

### 問題: 資料庫錯誤

**檢查:**
1. 確認 `DATABASE_URL` 仍然正確
2. 確認資料庫遷移已運行
3. 檢查 Supabase Dashboard 確認表已創建

### 問題: 功能不顯示

**檢查:**
1. 確認代碼已推送到 GitHub
2. 確認 Vercel 已自動部署
3. 清除瀏覽器快取
4. 檢查瀏覽器控制台錯誤

---

**狀態 / Status:** ✅ **MQTT 生產環境更新指南完成 / MQTT Production Update Guide Complete**

