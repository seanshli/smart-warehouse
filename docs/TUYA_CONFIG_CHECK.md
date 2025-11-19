# Tuya 配置檢查指南
## Tuya Configuration Check Guide

本指南幫助您驗證 Tuya API 配置是否正確設置。
<!-- This guide helps you verify that Tuya API configuration is correctly set up. -->

## 🔍 快速檢查 / Quick Check

運行驗證腳本：

```bash
node scripts/verify-tuya-config.js
```

## 📋 需要檢查的環境變數 / Required Environment Variables

### 本地開發 (`.env.local`)

確保您的 `.env.local` 文件包含：

```bash
TUYA_ACCESS_ID="your-actual-access-id"
TUYA_ACCESS_SECRET="your-actual-access-secret"
TUYA_REGION="us"  # 或 "cn" 用於新加坡
```

### 生產環境 (Vercel)

1. 前往 Vercel Dashboard
2. 選擇您的專案
3. 前往 **Settings > Environment Variables**
4. 確認以下變數已設置：
   - `TUYA_ACCESS_ID`
   - `TUYA_ACCESS_SECRET`
   - `TUYA_REGION`

## ✅ 驗證步驟 / Verification Steps

### 步驟 1: 檢查本地配置

```bash
# 檢查 .env.local 文件
cat .env.local | grep TUYA

# 或運行驗證腳本
node scripts/verify-tuya-config.js
```

### 步驟 2: 檢查 Vercel 配置

1. 登入 https://vercel.com/dashboard
2. 選擇 **Smart Warehouse** 專案
3. 前往 **Settings > Environment Variables**
4. 確認以下變數存在且已設置：
   - `TUYA_ACCESS_ID` ✅
   - `TUYA_ACCESS_SECRET` ✅
   - `TUYA_REGION` ✅

### 步驟 3: 測試配網功能

1. 打開應用程式
2. 前往 **MQTT Devices** 標籤
3. 點擊 **Tuya 配網** 按鈕
4. 輸入 Wi-Fi 資訊
5. 開始配網
6. 如果配置正確，配網應該能夠啟動

## ⚠️ 常見問題 / Common Issues

### 問題 1: 環境變數未設置

**症狀**：
- 驗證腳本顯示 "Not set or using placeholder"
- 配網時出現 "Tuya API credentials not configured" 錯誤

**解決方案**：
1. 確認 `.env.local` 文件存在
2. 確認變數名稱正確（大小寫敏感）
3. 確認值不包含引號（或正確使用引號）
4. 重新啟動開發服務器

### 問題 2: 區域配置錯誤

**症狀**：
- 配網失敗，API 返回錯誤
- 驗證腳本顯示 "Invalid region"

**解決方案**：
1. 確認 `TUYA_REGION` 是以下之一：`cn`, `us`, `eu`, `in`
2. 確認區域與您的 Tuya 項目區域一致
3. 檢查 Tuya IoT Platform 中的項目設置

### 問題 3: Vercel 環境變數未同步

**症狀**：
- 本地配網正常，但生產環境失敗
- Vercel 日誌顯示 "Tuya API credentials not configured"

**解決方案**：
1. 確認 Vercel 環境變數已設置
2. 確認變數已部署到所有環境（Production, Preview, Development）
3. 重新部署應用程式

## 🔧 手動檢查 / Manual Check

### 檢查 .env.local

```bash
# 查看文件內容（不顯示敏感值）
grep TUYA .env.local | sed 's/=.*/=***HIDDEN***/'
```

### 檢查環境變數是否加載

在 Next.js API 路由中添加臨時日誌：

```typescript
console.log('TUYA_ACCESS_ID:', process.env.TUYA_ACCESS_ID ? 'SET' : 'NOT SET')
console.log('TUYA_ACCESS_SECRET:', process.env.TUYA_ACCESS_SECRET ? 'SET' : 'NOT SET')
console.log('TUYA_REGION:', process.env.TUYA_REGION || 'NOT SET')
```

## 📝 配置檢查清單 / Configuration Checklist

- [ ] `.env.local` 文件存在
- [ ] `TUYA_ACCESS_ID` 已設置且不是佔位符
- [ ] `TUYA_ACCESS_SECRET` 已設置且不是佔位符
- [ ] `TUYA_REGION` 已設置且有效（cn/us/eu/in）
- [ ] Vercel 環境變數已設置（生產環境）
- [ ] 驗證腳本通過 (`node scripts/verify-tuya-config.js`)
- [ ] 配網功能可以啟動

## 🚀 下一步 / Next Steps

配置驗證通過後：

1. **測試配網功能**
   - 使用真實的 Tuya 設備
   - 確認配網流程正常

2. **檢查日誌**
   - 查看瀏覽器控制台
   - 查看 Vercel 函數日誌

3. **驗證設備連接**
   - 確認設備成功添加到系統
   - 測試設備控制功能

---

**需要幫助？** 如果配置檢查後仍有問題，請提供：
1. 驗證腳本的完整輸出
2. 錯誤訊息（如有）
3. 您是在本地還是生產環境遇到問題

