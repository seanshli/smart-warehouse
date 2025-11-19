# EMQX Cloud 後續步驟
## EMQX Cloud Next Steps

您已經完成 EMQX Cloud 部署，現在需要完成剩餘的設定步驟。
<!-- You've completed EMQX Cloud deployment, now complete the remaining setup steps. -->

## ✅ 已完成 / Completed

- [x] EMQX Cloud 部署完成
- [x] 已獲取連接資訊

## 📋 下一步操作 / Next Steps

### 步驟 2: 在 Supabase 創建 IoT 設備表 / Step 2: Create IoT Device Table in Supabase

#### 2.1 獲取 EMQX Cloud 連接資訊

在 EMQX Cloud Dashboard 中，您應該看到：

```
Broker URL: mqtts://xxx.hivemq.cloud:8883
Username: your-username
Password: your-password
```

**請記錄這些資訊，稍後需要在 Vercel 中使用。**

#### 2.2 在 Supabase 執行 SQL

1. **登入 Supabase**
   - 前往 [supabase.com/dashboard](https://supabase.com/dashboard)
   - 選擇專案：`ddvjegjzxjaetpaptjlo`

2. **打開 SQL Editor**
   - 左側選單 > **SQL Editor**
   - 點擊 **New Query**

3. **複製並執行以下 SQL**

   打開項目中的 `scripts/create-iot-devices-table.sql` 文件，複製全部內容，或直接執行：

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

   -- 創建索引
   CREATE INDEX IF NOT EXISTS idx_iot_devices_household ON iot_devices(household_id);
   CREATE INDEX IF NOT EXISTS idx_iot_devices_vendor ON iot_devices(vendor);
   CREATE INDEX IF NOT EXISTS idx_iot_devices_connection_type ON iot_devices(connection_type);
   CREATE INDEX IF NOT EXISTS idx_iot_devices_status ON iot_devices(status);
   CREATE INDEX IF NOT EXISTS idx_iot_devices_room ON iot_devices(room_id);

   -- 更新時間觸發器
   CREATE OR REPLACE FUNCTION update_updated_at_column()
   RETURNS TRIGGER AS $$
   BEGIN
       NEW.updated_at = NOW();
       RETURN NEW;
   END;
   $$ language 'plpgsql';

   DROP TRIGGER IF EXISTS update_iot_devices_updated_at ON iot_devices;
   CREATE TRIGGER update_iot_devices_updated_at 
     BEFORE UPDATE ON iot_devices 
     FOR EACH ROW 
     EXECUTE FUNCTION update_updated_at_column();
   ```

4. **驗證表已創建**

   執行以下 SQL 確認：

   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name = 'iot_devices';
   ```

   應該返回一行：`iot_devices`

### 步驟 3: 在 Vercel 添加環境變數 / Step 3: Add Environment Variables in Vercel

#### 3.1 訪問 Vercel Dashboard

1. 前往 [vercel.com/dashboard](https://vercel.com/dashboard)
2. 選擇 **Smart Warehouse** 專案
3. 進入 **Settings** > **Environment Variables**

#### 3.2 添加 MQTT 環境變數

使用您在 EMQX Cloud 獲取的連接資訊，添加以下變數：

**變數 1: MQTT_BROKER_URL**
```
Key: MQTT_BROKER_URL
Value: mqtts://xxx.hivemq.cloud:8883
（替換為您的實際 Broker URL）
Environment: ✅ Production ✅ Preview ✅ Development
```

**變數 2: MQTT_USERNAME**
```
Key: MQTT_USERNAME
Value: your-username
（替換為您的實際用戶名）
Environment: ✅ Production ✅ Preview ✅ Development
```

**變數 3: MQTT_PASSWORD**
```
Key: MQTT_PASSWORD
Value: your-password
（替換為您的實際密碼）
Environment: ✅ Production ✅ Preview ✅ Development
```

**變數 4: MQTT_CLIENT_ID（可選）**
```
Key: MQTT_CLIENT_ID
Value: smart-warehouse-production
Environment: ✅ Production ✅ Preview ✅ Development
```

#### 3.3 保存並重新部署

1. **確認所有變數已添加**
   - 檢查每個變數的值是否正確
   - 確認選擇了正確的環境（Production, Preview, Development）

2. **重新部署**
   - 方法 1: 自動部署
     - 推送任何代碼更改到 GitHub，Vercel 會自動部署
   - 方法 2: 手動重新部署
     - 前往 **Deployments** 標籤
     - 找到最新部署
     - 點擊 **...** > **Redeploy**

## ✅ 驗證設定 / Verify Setup

### 1. 檢查 Vercel 環境變數

在 Vercel Dashboard > Settings > Environment Variables 確認：
- [ ] `MQTT_BROKER_URL` 已設定
- [ ] `MQTT_USERNAME` 已設定
- [ ] `MQTT_PASSWORD` 已設定
- [ ] 所有變數都選擇了 Production 環境

### 2. 檢查 Supabase 表

在 Supabase SQL Editor 執行：

```sql
-- 檢查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'iot_devices';

-- 檢查表結構
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'iot_devices';
```

### 3. 測試 MQTT 功能

1. **訪問生產環境**
   - 打開 `https://smart-warehouse-five.vercel.app`
   - 登入應用程式

2. **測試添加設備**
   - 前往 **MQTT Devices** 標籤
   - 點擊 **Add Device**
   - 填寫資訊：
     - Device ID: `test_device_001`
     - Name: `Test Device`
     - Vendor: `tuya`
   - 點擊 **Add Device**

3. **驗證設備**
   - 確認設備出現在列表中
   - 檢查設備狀態是否正確顯示

## 🔍 故障排除 / Troubleshooting

### 問題: 無法添加設備

**檢查:**
1. Vercel 環境變數是否正確設定
2. 資料庫表是否已創建
3. Vercel 是否已重新部署

**解決方案:**
- 檢查 Vercel 部署日誌
- 檢查瀏覽器控制台錯誤
- 確認 Supabase 表已創建

### 問題: MQTT 連接失敗

**檢查:**
1. Broker URL 是否正確（使用 `mqtts://`）
2. 用戶名和密碼是否正確
3. EMQX Cloud 部署是否正常運行

**解決方案:**
- 在 EMQX Cloud Dashboard 確認連接資訊
- 測試連接：使用 MQTT 客戶端工具

---

**狀態 / Status:** ✅ **後續步驟指南完成 / Next Steps Guide Complete**

