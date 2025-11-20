# Tuya Native SDK Setup

此文件說明如何設定 Tuya 官方 iOS / Android App SDK，並與 Smart Warehouse 專案整合。

## 1. 取得 App SDK 憑證

1. 登入 [Tuya Developer Console](https://developer.tuya.com/)。  
2. 進入 **App SDK > App > 應用資訊**。  
3. 為 iOS、Android 各自取得：
   - App Key
   - App Secret
   - （Android）App 的簽章 SHA-256
4. 將值填入環境變數，在 `.env.local` / Vercel 導入：

```
TUYA_IOS_SDK_APP_KEY="xxx"
TUYA_IOS_SDK_APP_SECRET="xxx"
TUYA_ANDROID_SDK_APP_KEY="xxx"
TUYA_ANDROID_SDK_APP_SECRET="xxx"
TUYA_ANDROID_SDK_SHA256="xx:xx:..."
```

> Android SHA256 可使用 `keytool -list -v -keystore your.keystore` 取得。

## 2. 用途
- 這組憑證用於 **原生 App（iOS/Android）** 直接呼叫 Tuya SDK，例如：
  - Wi-Fi / BLE 配網
  - 裝置控制
  - Tuya 智慧場景等原生功能
- 與伺服器端 `TUYA_ACCESS_ID / SECRET` 不同，後者供雲端 API 使用。

## 3. Capacitor / 原生整合

在下一階段將建立 Capacitor Plugin：
1. iOS (Swift) / Android (Kotlin) 初始化 Tuya SDK，讀取上述環境變數。
2. 封裝配網、掃描、控制等功能，供 React UI (`ProvisioningModal`) 呼叫。
3. 若 App 運行在 Web / Vercel 上，則仍透過 `/api/provisioning`（雲端模式）。

## 4. 安全建議
- 在 Vercel Dashboard / Xcode Build Settings / Gradle Properties 安全儲存 AppKey/Secret。
- Android SHA256 確保與發佈版本一致；若 keystore 改變，需更新 Tuya 後台。

完成上述設定後，即可著手建立原生 Plugin，讓 iOS/Android App 取得 Tuya 原生能力，同時與現有 Web/雲端架構共存。 

