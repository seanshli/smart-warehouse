# EMQX Cloud 設定指南
## EMQX Cloud Setup Guide

本指南說明如何使用 EMQX Cloud 作為 Smart Warehouse 的 MQTT Broker，並在 Supabase 中創建 IoT 設備表。
<!-- This guide explains how to use EMQX Cloud as Smart Warehouse's MQTT Broker and create IoT device table in Supabase. -->

## 步驟 1: 註冊並創建 EMQX Cloud 部署 / Step 1: Register and Create EMQX Cloud Deployment

### 1.1 註冊帳號

1. **前往 EMQX Cloud**
   - 訪問 [emqx.com/cloud](https://www.emqx.com/en/cloud)
   - 點擊 **Sign Up** 或 **Try Free**

2. **註冊方式**
   - 使用 Email 註冊
   - 或使用 GitHub/Google 帳號登入

### 1.2 創建部署

1. **登入後創建部署**
   - 點擊 **Create Deployment** 或 **New Deployment**
   - 選擇 **Standard** 方案（免費方案：100 連接）

2. **配置部署資訊**
   - **Deployment Name**: `smart-warehouse-mqtt`
   - **Region**: 選擇最接近的區域
     - 如果 Supabase 在 Singapore，選擇 **Southeast Asia (Singapore)**
   - **Version**: 選擇最新穩定版（如：5.3.0）
   - **Plan**: Standard（免費）或 Professional（$49/月）

3. **等待部署完成**
   - 通常需要 5-10 分鐘
   - 部署完成後會顯示連接資訊

### 1.3 獲取連接資訊

部署完成後，您會看到：

```
Broker URL: mqtts://xxx.hivemq.cloud:8883
Username: your-username
Password: your-password
```

**記錄這些資訊，稍後需要在 Vercel 中設定。**

## 步驟 2: 在 Supabase 創建 IoT 設備表 / Step 2: Create IoT Device Table in Supabase

### 2.1 訪問 Supabase SQL Editor

1. **登入 Supabase**
   - 前往 [supabase.com/dashboard](https://supabase.com/dashboard)
   - 選擇專案：`ddvjegjzxjaetpaptjlo`

2. **打開 SQL Editor**
   - 左側選單 > **SQL Editor**
   - 點擊 **New Query**

### 2.2 執行 SQL 創建表

複製以下 SQL 並執行：

```sql
-- 創建 IoT 設備表（統一支援 MQTT 和 RESTful API）
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

-- 創建索引以提升查詢性能
CREATE INDEX IF NOT EXISTS idx_iot_devices_household ON iot_devices(household_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_vendor ON iot_devices(vendor);
CREATE INDEX IF NOT EXISTS idx_iot_devices_connection_type ON iot_devices(connection_type);
CREATE INDEX IF NOT EXISTS idx_iot_devices_status ON iot_devices(status);
CREATE INDEX IF NOT EXISTS idx_iot_devices_room ON iot_devices(room_id);

-- 添加更新時間觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_iot_devices_updated_at 
  BEFORE UPDATE ON iot_devices 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

### 2.3 驗證表已創建

執行以下 SQL 驗證：

```sql
-- 檢查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'iot_devices';

-- 檢查表結構
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'iot_devices'
ORDER BY ordinal_position;
```

## 步驟 3: 在 Vercel 配置環境變數 / Step 3: Configure Environment Variables in Vercel

### 3.1 訪問 Vercel Dashboard

1. **登入 Vercel**
   - 前往 [vercel.com/dashboard](https://vercel.com/dashboard)
   - 選擇 **Smart Warehouse** 專案

2. **進入環境變數設定**
   - Settings > **Environment Variables**

### 3.2 添加 MQTT 環境變數

點擊 **Add New** 並添加以下變數：

#### 變數 1: MQTT_BROKER_URL
```
Key: MQTT_BROKER_URL
Value: mqtts://xxx.hivemq.cloud:8883
Environment: Production, Preview, Development
```

#### 變數 2: MQTT_USERNAME
```
Key: MQTT_USERNAME
Value: your-emqx-username
Environment: Production, Preview, Development
```

#### 變數 3: MQTT_PASSWORD
```
Key: MQTT_PASSWORD
Value: your-emqx-password
Environment: Production, Preview, Development
```

#### 變數 4: MQTT_CLIENT_ID（可選）
```
Key: MQTT_CLIENT_ID
Value: smart-warehouse-production
Environment: Production, Preview, Development
```

#### 變數 5-7: MQTT 連接參數（可選，有預設值）
```
Key: MQTT_KEEPALIVE
Value: 60

Key: MQTT_RECONNECT_PERIOD
Value: 1000

Key: MQTT_CONNECT_TIMEOUT
Value: 30000
```

### 3.3 保存並重新部署

1. **保存所有環境變數**
   - 確認所有變數已添加
   - 點擊 **Save**

2. **重新部署應用**
   - 前往 **Deployments** 標籤
   - 找到最新部署
   - 點擊 **...** > **Redeploy**
   - 或推送代碼到 GitHub 觸發自動部署

## 步驟 4: 驗證設定 / Step 4: Verify Setup

### 4.1 檢查 Vercel 部署

1. **確認部署成功**
   - 前往 Vercel Dashboard > Deployments
   - 確認最新部署狀態為 **Ready**

2. **檢查環境變數**
   - Settings > Environment Variables
   - 確認所有 MQTT 變數已設定

### 4.2 測試 MQTT 連接

1. **訪問生產環境**
   - 打開 `https://smart-warehouse-five.vercel.app`
   - 登入應用程式

2. **測試 MQTT 功能**
   - 前往 **MQTT Devices** 標籤
   - 點擊 **Add Device**
   - 嘗試添加一個測試設備：
     - Device ID: `test_device_001`
     - Name: `Test Device`
     - Vendor: `tuya` (或 `esp`, `midea`)
     - Room: （可選）

3. **驗證設備添加**
   - 確認設備出現在列表中
   - 檢查設備狀態

### 4.3 檢查資料庫

在 Supabase SQL Editor 中執行：

```sql
-- 檢查是否有設備
SELECT * FROM iot_devices;

-- 檢查表結構
\d iot_devices
```

## 完整環境變數清單 / Complete Environment Variables List

### 已在 Vercel 設定的變數 / Already Configured

- [x] `DATABASE_URL` - Supabase 資料庫連接
- [x] `NEXTAUTH_URL` - `https://smart-warehouse-five.vercel.app`
- [x] `NEXTAUTH_SECRET` - 生產環境密鑰
- [x] `CAP_SERVER_URL` - `https://smart-warehouse-five.vercel.app`

### 需要添加的 MQTT 變數 / MQTT Variables to Add

- [ ] `MQTT_BROKER_URL` - EMQX Cloud Broker URL
- [ ] `MQTT_USERNAME` - EMQX Cloud 用戶名
- [ ] `MQTT_PASSWORD` - EMQX Cloud 密碼
- [ ] `MQTT_CLIENT_ID` - 客戶端 ID（可選）

## 故障排除 / Troubleshooting

### 問題 1: EMQX Cloud 連接失敗

**檢查:**
1. Broker URL 是否正確（使用 `mqtts://` 協議）
2. 用戶名和密碼是否正確
3. 端口是否為 8883（SSL）

**解決方案:**
- 在 EMQX Cloud Dashboard 確認連接資訊
- 測試連接：使用 MQTT 客戶端工具測試

### 問題 2: 資料庫表創建失敗

**檢查:**
1. 是否在正確的 Supabase 專案中
2. SQL 語法是否正確
3. 是否有權限創建表

**解決方案:**
- 確認在 Supabase SQL Editor 中執行
- 檢查錯誤訊息
- 確認 `households` 和 `rooms` 表已存在

### 問題 3: 設備無法添加

**檢查:**
1. Vercel 環境變數是否正確
2. 資料庫表是否已創建
3. MQTT Broker 是否可連接

**解決方案:**
- 檢查 Vercel 部署日誌
- 檢查瀏覽器控制台錯誤
- 確認資料庫遷移已完成

## 下一步 / Next Steps

設定完成後，您可以：

1. **添加 MQTT 設備**
   - Tuya、ESP、Midea 設備

2. **添加 RESTful 設備**
   - Philips Hue
   - Panasonic

3. **測試設備控制**
   - 電源開關
   - 溫度控制
   - 模式設定

4. **設定場景**
   - 房間場景控制
   - 自動化規則

---

**狀態 / Status:** ✅ **EMQX Cloud 設定指南完成 / EMQX Cloud Setup Guide Complete**

