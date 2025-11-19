# 多品牌設備配網指南
## Multi-Brand Device Provisioning Guide

本指南說明如何在 Smart Warehouse 中為不同品牌的 IoT 設備進行配網。
<!-- This guide explains how to provision IoT devices from different brands in Smart Warehouse. -->

## 📋 支持的品牌 / Supported Brands

### MQTT 設備
- **Tuya（塗鴉）**：支持 EZ 模式和 AP 模式配網
- **Midea（美的）**：支持 AP 模式和藍牙配網（需要美的 SDK）
- **ESP (ESP32/ESP8266)**：支持 SmartConfig（ESP-TOUCH）和 AP 模式配網

### RESTful API 設備
- **Philips Hue**：通過本地網絡發現和配對 Hue Bridge
- **Panasonic（松下）**：通過 Panasonic Cloud API 進行配網

## 🚀 使用步驟 / Usage Steps

### 步驟 1: 選擇品牌並啟動配網

1. **前往 MQTT Devices 標籤**
   - 在 Dashboard 中找到 **MQTT Devices** 標籤
   - 點擊對應品牌的配網按鈕：
     - **Tuya 配網**（綠色按鈕）
     - **Midea 配網**（綠色按鈕）
     - **Hue 配網**（紫色按鈕）
     - **Panasonic 配網**（藍色按鈕）

### 步驟 2: 配置配網參數

#### MQTT 設備（Tuya, Midea, ESP）

1. **填寫 Wi-Fi 資訊**
   - **Wi-Fi SSID**：輸入您的 Wi-Fi 網絡名稱
   - **Wi-Fi 密碼**：輸入您的 Wi-Fi 密碼
   - **配網模式**：
     - **Tuya**：
       - **自動選擇**（推薦）
       - **EZ 模式**：設備指示燈快速閃爍時使用
       - **AP 模式**：設備指示燈慢速閃爍時使用
     - **ESP**：
       - **SmartConfig（ESP-TOUCH）**：設備指示燈快速閃爍時使用（需要本地工具或手機 App）
       - **AP 模式**：連接設備熱點（ESP_XXXXXX）後訪問 192.168.4.1 進行配置

2. **開始配網**
   - 點擊 **開始配網** 按鈕
   - 確保設備已進入配網模式
   - **ESP 設備**：按照提示進行手動配網操作

#### RESTful API 設備（Philips, Panasonic）

1. **填寫 API 配置**
   - **API Base URL**：
     - Philips Hue: `http://192.168.1.100`（Hue Bridge IP）
     - Panasonic: `https://api.panasonic.com`
   - **API Key**：
     - Philips Hue: 留空以自動配對，或輸入已有 API Key
     - Panasonic: 輸入 Panasonic API Key
   - **Access Token**（僅 Panasonic）：可選

2. **發現設備**（可選）
   - 點擊 **發現設備** 按鈕
   - 系統會掃描本地網絡中的設備
   - 從列表中選擇要配網的設備

3. **開始配網**
   - 點擊 **開始配網** 按鈕
   - 對於 Philips Hue，需要按下 Bridge 上的按鈕

### 步驟 3: 等待配網完成

- **MQTT 設備**：配網過程需要 30-60 秒，系統會自動輪詢狀態
- **RESTful 設備**：配網通常是即時的

### 步驟 4: 添加設備

配網成功後：
1. 系統會自動填充設備信息到添加設備表單
2. 確認設備信息
3. 選擇房間（可選）
4. 點擊 **Add Device** 完成添加

## 🔧 品牌特定說明 / Brand-Specific Notes

### Tuya（塗鴉）

**配網模式**：
- **EZ 模式**：設備指示燈快速閃爍，配網速度快
- **AP 模式**：設備指示燈慢速閃爍，適用於複雜網絡環境
- **自動選擇**：系統自動選擇最佳模式

**要求**：
- 使用 2.4 GHz Wi-Fi 網絡
- 設備距離路由器 1-2 米內
- 需要配置 Tuya API 憑證（環境變數）

### Midea（美的）

**配網模式**：
- **AP 模式**：通過 Wi-Fi 熱點配網
- **藍牙配網**：通過藍牙進行配網（需要美的 SDK）

**注意**：
- Midea 配網需要集成美的 MSmartSDK
- 目前提供基本框架，實際配網可能需要使用美的官方 App
- 需要配置 Midea API 憑證（環境變數）

### Philips Hue

**配網流程**：
1. **發現 Bridge**：系統會自動掃描本地網絡中的 Hue Bridge
2. **配對 Bridge**：需要按下 Bridge 上的按鈕進行配對
3. **獲取 API Key**：配對成功後會自動獲取 API Key

**要求**：
- Hue Bridge 必須連接到本地網絡
- 手機/電腦和 Bridge 在同一網絡下
- 首次配對需要按下 Bridge 上的按鈕

**設備發現**：
- 系統會嘗試通過 Hue 發現服務查找 Bridge
- 如果發現服務不可用，會嘗試掃描常見 IP 地址
- 也可以手動輸入 Bridge IP 地址

### Panasonic（松下）

**配網流程**：
1. **配置 API 憑證**：輸入 Base URL 和 API Key
2. **發現設備**：系統會查詢 Panasonic API 獲取設備列表
3. **選擇設備**：從發現的設備中選擇要添加的設備

**要求**：
- 需要 Panasonic Cloud API 憑證
- 設備必須已註冊到 Panasonic 雲端
- 需要有效的 API Key 和 Access Token（可選）

## ⚙️ 環境變數配置 / Environment Variables

### Tuya
```bash
TUYA_ACCESS_ID="your-tuya-access-id"
TUYA_ACCESS_SECRET="your-tuya-access-secret"
TUYA_REGION="cn"  # Options: cn, us, eu, in
```

### Midea
```bash
MIDEA_APP_ID="your-midea-app-id"
MIDEA_APP_KEY="your-midea-app-key"
```

### Philips Hue
- 無需環境變數配置
- 通過本地網絡發現和配對

### Panasonic
- 無需環境變數配置
- 通過用戶輸入的 API 憑證進行配網

## 📝 API 端點 / API Endpoints

### POST `/api/provisioning`
啟動配網流程

**請求體**：
```json
{
  "vendor": "tuya" | "midea" | "philips" | "panasonic",
  "ssid": "wifi-ssid",  // MQTT 設備需要
  "password": "wifi-password",  // MQTT 設備需要
  "mode": "auto",  // Tuya: "ez", "ap", "auto"
  "baseUrl": "http://192.168.1.100",  // RESTful 設備需要
  "apiKey": "api-key",  // RESTful 設備需要
  "accessToken": "access-token"  // Panasonic 可選
}
```

### GET `/api/provisioning?vendor={vendor}&token={token}`
查詢配網狀態

### GET `/api/provisioning?vendor={vendor}&action=discover`
發現設備（Philips, Panasonic）

### DELETE `/api/provisioning?vendor={vendor}&token={token}`
停止配網流程

## ⚠️ 常見問題 / Troubleshooting

### 問題 1: MQTT 設備配網超時

**可能原因**：
- 設備未進入配網模式
- Wi-Fi SSID 或密碼錯誤
- 使用 5 GHz Wi-Fi 網絡

**解決方案**：
1. 確認設備指示燈閃爍狀態
2. 重新檢查 Wi-Fi 資訊
3. 切換到 2.4 GHz Wi-Fi 網絡

### 問題 2: Philips Hue 無法發現 Bridge

**可能原因**：
- Bridge 未連接到網絡
- 不在同一網絡下
- Bridge IP 地址不正確

**解決方案**：
1. 確認 Bridge 已連接並指示燈正常
2. 確保手機/電腦和 Bridge 在同一網絡
3. 手動輸入 Bridge IP 地址

### 問題 3: Panasonic 設備發現失敗

**可能原因**：
- API 憑證錯誤
- 設備未註冊到雲端
- 網絡連接問題

**解決方案**：
1. 檢查 API Key 和 Base URL 是否正確
2. 確認設備已在 Panasonic 雲端註冊
3. 檢查網絡連接

### 問題 4: Midea 配網不工作

**注意**：
- Midea 配網需要集成美的 MSmartSDK
- 目前提供基本框架
- 建議使用美的官方 App 進行配網，然後手動添加設備

## 📚 參考資源 / References

- [Tuya IoT Platform](https://iot.tuya.com/)
- [Midea IoT Platform](https://iot.midea.com/)
- [Philips Hue API](https://developers.meethue.com/)
- [Panasonic Developer Portal](https://developer.panasonic.com/)

---

**狀態 / Status:** ✅ **多品牌配網功能已實現 / Multi-Brand Provisioning Feature Implemented**

