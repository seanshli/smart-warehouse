# MQTT 快速驗證指南
## MQTT Quick Validation Guide

快速驗證 MQTT 功能是否正常運作的步驟。
<!-- Quick steps to verify MQTT functionality is working correctly. -->

## ✅ 驗證步驟 / Validation Steps

### 步驟 1: 驗證 Supabase 資料庫表 / Step 1: Verify Supabase Database Table

1. **登入 Supabase Dashboard**
   - 前往: https://supabase.com/dashboard
   - 選擇專案: `ddvjegjzxjaetpaptjlo`

2. **檢查表是否存在**
   - 點擊左側 **SQL Editor**
   - 點擊 **New Query**
   - 執行以下 SQL：

   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
     AND table_name = 'iot_devices';
   ```

   **預期結果**: 應該返回一行 `iot_devices`

3. **如果表不存在，執行創建腳本**
   - 打開 `scripts/create-iot-devices-table.sql`
   - 複製全部內容
   - 在 Supabase SQL Editor 中貼上並執行
   - 點擊 **Run** 或按 `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)

### 步驟 2: 驗證 Vercel 環境變數 / Step 2: Verify Vercel Environment Variables

1. **檢查環境變數**
   - 前往: https://vercel.com/dashboard
   - 選擇 **Smart Warehouse** 專案
   - 點擊 **Settings** > **Environment Variables**
   - 確認以下變數已設定：
     - ✅ `MQTT_BROKER_URL` (格式: `mqtts://xxx.emqx.cloud:8883`)
     - ✅ `MQTT_USERNAME` (EMQX Cloud 用戶名)
     - ✅ `MQTT_PASSWORD` (EMQX Cloud 密碼)
     - ⚪ `MQTT_CLIENT_ID` (可選，預設為 `smart-warehouse-production`)

2. **確認已重新部署**
   - 前往 **Deployments** 標籤
   - 確認最新部署狀態為 **Ready** ✅
   - 如果還沒有重新部署，點擊最新部署的 **...** > **Redeploy**

### 步驟 3: 測試 MQTT 功能 / Step 3: Test MQTT Functionality

#### 3.1 訪問生產環境

1. **打開應用程式**
   - 訪問: https://smart-warehouse-five.vercel.app
   - 登入您的帳號

2. **前往 MQTT Devices 標籤**
   - 在 Dashboard 中找到 **MQTT Devices** 標籤
   - 點擊進入

#### 3.2 測試添加設備

1. **添加測試設備**
   - 點擊 **Add Device** 按鈕
   - 填寫資訊：
     ```
     Device ID: test_device_001
     Name: Test Device
     Vendor: tuya (或 esp, midea)
     Room: (可選)
     ```
   - 點擊 **Add Device**

2. **驗證設備添加成功**
   - ✅ 確認設備出現在設備列表中
   - ✅ 檢查設備狀態顯示（應該顯示 "offline"）
   - ✅ 確認沒有錯誤訊息

#### 3.3 測試設備控制

1. **測試電源控制**
   - 在設備卡片上點擊 **Power On**
   - ✅ 確認顯示成功訊息（綠色 toast）
   - 點擊 **Power Off**
   - ✅ 確認顯示成功訊息

2. **檢查設備狀態更新**
   - 確認設備狀態有更新（如果設備有回應）
   - 檢查 `lastSeen` 時間是否更新

### 步驟 4: 檢查日誌和錯誤 / Step 4: Check Logs and Errors

#### 4.1 檢查 Vercel 日誌

1. **查看部署日誌**
   - Vercel Dashboard > Deployments
   - 點擊最新部署
   - 查看 **Build Logs** 和 **Function Logs**

2. **檢查錯誤**
   - 查看是否有 MQTT 連接錯誤
   - 檢查環境變數是否正確讀取

#### 4.2 檢查瀏覽器控制台

1. **打開開發者工具**
   - 按 `F12` 或 `Cmd+Option+I` (Mac)
   - 前往 **Console** 標籤

2. **檢查錯誤**
   - 查看是否有 JavaScript 錯誤
   - 檢查 API 請求是否成功（Network 標籤）
   - 查看 MQTT 相關錯誤訊息

#### 4.3 檢查 EMQX Cloud Dashboard

1. **查看連接狀態**
   - 登入 EMQX Cloud Dashboard
   - 查看 **Clients** 或 **Connections**
   - ✅ 確認有客戶端連接（應該看到 `smart-warehouse-production`）

2. **查看訊息流量**
   - 檢查是否有訊息發布和訂閱
   - 確認主題訂閱正常

## 🔍 故障排除 / Troubleshooting

### 問題 1: 無法添加設備

**症狀**: 點擊 "Add Device" 後出現錯誤

**可能原因**:
- Supabase 表未創建
- Vercel 環境變數未設定
- 資料庫連接失敗

**解決方案**:
1. 確認 Supabase 表已創建（步驟 1）
2. 確認 Vercel 環境變數已設定（步驟 2）
3. 檢查 Vercel 部署日誌中的錯誤訊息

### 問題 2: MQTT 連接失敗

**症狀**: 設備控制失敗，顯示連接錯誤

**可能原因**:
- Broker URL 錯誤
- 用戶名或密碼錯誤
- 端口錯誤

**解決方案**:
1. 確認使用 `mqtts://` 協議（SSL/TLS）
2. 確認端口是 `8883`
3. 確認用戶名和密碼正確
4. 在 EMQX Cloud Dashboard 確認連接資訊

### 問題 3: 設備狀態不更新

**症狀**: 設備控制成功，但狀態不更新

**可能原因**:
- MQTT 訂閱失敗
- 設備未發送狀態訊息
- 主題不匹配

**解決方案**:
1. 檢查 EMQX Cloud Dashboard 中的訂閱
2. 確認設備正在發送狀態訊息
3. 檢查主題格式是否正確（例如: `tuya/{device_id}/state`）

## ✅ 驗證檢查清單 / Verification Checklist

完成所有驗證後，確認：

- [ ] Supabase `iot_devices` 表已創建
- [ ] Vercel 環境變數已設定（MQTT_BROKER_URL, MQTT_USERNAME, MQTT_PASSWORD）
- [ ] Vercel 已重新部署（狀態為 Ready）
- [ ] 可以訪問 MQTT Devices 標籤
- [ ] 可以添加設備（無錯誤）
- [ ] 設備出現在列表中
- [ ] 可以控制設備（Power On/Off）
- [ ] 設備狀態可以更新（如果有真實設備）
- [ ] EMQX Cloud Dashboard 顯示連接
- [ ] 瀏覽器控制台沒有錯誤

## 🎉 完成後 / After Completion

所有驗證通過後，您可以：

1. **添加真實設備**
   - Tuya 設備
   - ESP 設備
   - Midea 設備

2. **添加 RESTful 設備**
   - Philips Hue
   - Panasonic

3. **設定場景**
   - 房間場景控制
   - 自動化規則

---

**狀態 / Status:** ✅ **驗證指南完成 / Validation Guide Complete**

