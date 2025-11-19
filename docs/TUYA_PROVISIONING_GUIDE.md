# Tuya 設備配網指南
## Tuya Device Provisioning Guide

本指南說明如何在 Smart Warehouse 中使用 Tuya 配網功能來添加新的 Tuya 設備。
<!-- This guide explains how to use Tuya provisioning functionality in Smart Warehouse to add new Tuya devices. -->

## 📋 前置需求 / Prerequisites

### 1. Tuya IoT 平台帳號
- 前往 [Tuya IoT Platform](https://iot.tuya.com/)
- 註冊並登入帳號
- 創建一個雲端專案

### 2. 獲取 API 憑證
1. 在 Tuya IoT Platform 中，前往 **Cloud** > **Cloud Development**
2. 創建或選擇一個雲端專案
3. 獲取以下資訊：
   - **Access ID** (Client ID)
   - **Access Secret** (Client Secret)
   - **Region** (區域：cn, us, eu, in)

### 3. 配置環境變數
在 `.env.local` 或 Vercel 環境變數中添加：

```bash
# Tuya API Configuration
TUYA_ACCESS_ID="your-tuya-access-id"
TUYA_ACCESS_SECRET="your-tuya-access-secret"
TUYA_REGION="cn"  # Options: cn, us, eu, in
```

## 🚀 使用步驟 / Usage Steps

### 步驟 1: 準備設備
1. **確保設備已進入配網模式**
   - **EZ 模式**：設備指示燈快速閃爍
   - **AP 模式**：設備指示燈慢速閃爍
   - 參考設備說明書了解如何進入配網模式

2. **檢查 Wi-Fi 網絡**
   - 使用 **2.4 GHz** Wi-Fi 網絡（Tuya 設備通常不支持 5 GHz）
   - 確保設備距離路由器 **1-2 米** 內

### 步驟 2: 啟動配網
1. **打開 Smart Warehouse 應用**
   - 前往 **MQTT Devices** 標籤
   - 點擊 **Tuya 配網** 按鈕（綠色 Wi-Fi 圖標）

2. **填寫配網資訊**
   - **Wi-Fi SSID**：輸入您的 Wi-Fi 網絡名稱
   - **Wi-Fi 密碼**：輸入您的 Wi-Fi 密碼
   - **配網模式**：
     - **自動選擇**（推薦）：系統會自動選擇最佳模式
     - **EZ 模式**：設備指示燈快速閃爍時使用
     - **AP 模式**：設備指示燈慢速閃爍時使用

3. **開始配網**
   - 點擊 **開始配網** 按鈕
   - 系統會自動獲取配網 Token 並啟動配網流程

### 步驟 3: 等待配網完成
1. **配網進行中**
   - 系統會每 2 秒自動查詢配網狀態
   - 請確保設備已進入配網模式
   - 配網過程通常需要 **30-60 秒**

2. **配網成功**
   - 顯示設備 ID 和設備名稱
   - 系統會自動填充設備信息到添加設備表單
   - 確認設備信息並點擊 **Add Device** 完成添加

3. **配網失敗**
   - 檢查設備是否已進入配網模式
   - 確認 Wi-Fi SSID 和密碼正確
   - 確保使用 2.4 GHz Wi-Fi 網絡
   - 點擊 **重新配網** 重試

## 🔧 配網模式說明 / Provisioning Modes

### EZ 模式（快速配網）
- **適用場景**：設備指示燈快速閃爍
- **優點**：配網速度快，操作簡單
- **要求**：手機和設備在同一 Wi-Fi 網絡下

### AP 模式（熱點配網）
- **適用場景**：設備指示燈慢速閃爍
- **優點**：適用於複雜網絡環境
- **要求**：設備會創建一個臨時 Wi-Fi 熱點

### 自動選擇模式
- **適用場景**：不確定設備配網模式時
- **優點**：系統自動選擇最佳模式
- **推薦**：首次使用時選擇此模式

## ⚠️ 常見問題 / Troubleshooting

### 問題 1: 配網超時
**可能原因**：
- 設備未進入配網模式
- Wi-Fi SSID 或密碼錯誤
- 設備距離路由器太遠
- 使用 5 GHz Wi-Fi 網絡

**解決方案**：
1. 確認設備指示燈閃爍狀態
2. 重新檢查 Wi-Fi 資訊
3. 將設備移至路由器附近
4. 切換到 2.4 GHz Wi-Fi 網絡

### 問題 2: 無法獲取配網 Token
**可能原因**：
- Tuya API 憑證配置錯誤
- 網絡連接問題
- Tuya 服務暫時不可用

**解決方案**：
1. 檢查環境變數配置
2. 確認 `TUYA_ACCESS_ID` 和 `TUYA_ACCESS_SECRET` 正確
3. 檢查網絡連接
4. 稍後重試

### 問題 3: 配網成功但無法添加設備
**可能原因**：
- 設備信息未正確填充
- 設備 ID 格式錯誤

**解決方案**：
1. 手動檢查並確認設備信息
2. 如果設備信息不正確，手動輸入設備 ID 和名稱
3. 確保設備 ID 格式正確

## 📝 API 端點 / API Endpoints

### POST `/api/tuya/provisioning`
啟動配網流程

**請求體**：
```json
{
  "ssid": "your-wifi-ssid",
  "password": "your-wifi-password",
  "mode": "auto"  // "ez", "ap", or "auto"
}
```

**響應**：
```json
{
  "success": true,
  "token": "provisioning-token",
  "deviceId": "device-id",
  "deviceName": "device-name",
  "status": "success"
}
```

### GET `/api/tuya/provisioning?token={token}`
查詢配網狀態

**響應**：
```json
{
  "success": true,
  "deviceId": "device-id",
  "deviceName": "device-name",
  "status": "success"
}
```

### DELETE `/api/tuya/provisioning?token={token}`
停止配網流程

**響應**：
```json
{
  "success": true,
  "message": "Provisioning stopped"
}
```

## 🔐 安全注意事項 / Security Notes

1. **API 憑證安全**
   - 不要在代碼中硬編碼 API 憑證
   - 使用環境變數存儲敏感信息
   - 定期輪換 API 憑證

2. **Wi-Fi 密碼**
   - 配網過程中 Wi-Fi 密碼會發送到 Tuya 雲端
   - 確保使用安全的網絡連接
   - 配網完成後，密碼不會被存儲

3. **設備安全**
   - 配網完成後，設備會連接到您的 Wi-Fi 網絡
   - 建議在路由器中設置設備隔離
   - 定期更新設備固件

## 📚 參考資源 / References

- [Tuya IoT Platform](https://iot.tuya.com/)
- [Tuya Open API Documentation](https://developer.tuya.com/en/docs/cloud/)
- [Tuya Device Provisioning Guide](https://developer.tuya.com/en/docs/iot/device-activation)

---

**狀態 / Status:** ✅ **配網功能已實現 / Provisioning Feature Implemented**

