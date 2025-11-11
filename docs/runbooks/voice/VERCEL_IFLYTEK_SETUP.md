# 🚀 在 Vercel 生產環境配置 iFLYTEK

## 當前情況

您正在使用 **Vercel 生產環境**：
- 生產 URL: `https://smart-warehouse-five.vercel.app`
- 本地開發服務器（剛才啟動的）是為了測試

## 選擇測試環境

### 選項 1: 在生產環境測試（推薦）

需要在 Vercel 中添加 iFLYTEK 環境變數：

1. **登入 Vercel Dashboard**
   - 訪問：https://vercel.com/dashboard
   - 選擇項目：`smart-warehouse-five`

2. **添加環境變數**
   - 進入：Settings → Environment Variables
   - 添加以下變數：

   ```
   IFLYTEK_APP_KEY=4ba58cf3dc03c31f7262b183a5b1f575
   IFLYTEK_APP_SECRET=OGE5N2MxYzIzNGY4NzE0MTVhOTNkMmU0
   IFLYTEK_VERIFY_TOKEN=e1fd74d5b0f7c9f8
   IFLYTEK_AES_KEY=26a6a47e69471bb8
   ```

3. **重新部署**
   - 在 Vercel Dashboard 中點擊 "Redeploy"
   - 或推送代碼到 Git 觸發自動部署

4. **測試**
   - 訪問：https://smart-warehouse-five.vercel.app
   - 登入並測試語音功能

### 選項 2: 在本地開發環境測試

如果要在本地測試（剛才啟動的服務器）：

1. **使用本地服務器**
   - 本地訪問：`http://localhost:3000`
   - 或網絡訪問：`http://172.20.10.4:3000`

2. **環境變數已配置**
   - ✅ 已添加到 `.env.local`
   - ✅ 服務器已啟動

## 建議流程

### 推薦：先在本地測試，然後部署到生產

1. **本地測試**（當前）
   - 使用本地開發服務器測試 iFLYTEK 功能
   - 確認一切正常後再部署到生產

2. **部署到生產**
   - 在 Vercel 添加環境變數
   - 重新部署
   - 在生產環境驗證

## 當前狀態

### 本地開發服務器
- ✅ 已啟動（外部訪問模式）
- ✅ iFLYTEK 環境變數已配置
- 🌐 訪問地址：`http://localhost:3000` 或 `http://172.20.10.4:3000`

### Vercel 生產環境
- ⚠️ 需要添加 iFLYTEK 環境變數
- 🌐 訪問地址：https://smart-warehouse-five.vercel.app

## 快速操作

### 如果要停止本地服務器：
```bash
pkill -f "next dev"
```

### 如果要在 Vercel 添加環境變數：

1. 訪問：https://vercel.com/dashboard
2. 選擇項目：`smart-warehouse-five`
3. Settings → Environment Variables
4. 添加 4 個 iFLYTEK 變數
5. 重新部署

## 下一步

**您想要：**
- A. 在本地測試 iFLYTEK（使用當前本地服務器）
- B. 在生產環境測試（需要在 Vercel 添加環境變數）
- C. 兩者都要（先本地測試，然後部署）

請告訴我您的選擇，我可以協助完成配置！

