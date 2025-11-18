# 生產環境部署檢查清單
## Production Deployment Checklist

快速檢查清單，確保生產環境部署順利。
<!-- Quick checklist to ensure smooth production deployment. -->

## 📋 部署前準備 / Pre-Deployment Preparation

### 1. 環境變數配置 / Environment Variables

- [ ] `DATABASE_URL` - 生產資料庫連接字串
- [ ] `NEXTAUTH_URL` - 生產環境 URL（例如：`https://your-app.vercel.app`）
- [ ] `NEXTAUTH_SECRET` - 強密碼（使用 `openssl rand -base64 32` 生成）
- [ ] `MQTT_BROKER_URL` - EMQX Broker URL（使用 `mqtts://` 安全連接）
- [ ] `MQTT_USERNAME` - MQTT 用戶名
- [ ] `MQTT_PASSWORD` - MQTT 強密碼
- [ ] `OPENAI_API_KEY` - （可選）OpenAI API 金鑰
- [ ] `IFLYTEK_APP_KEY` - （可選）iFLYTEK API 金鑰
- [ ] `HOME_ASSISTANT_BASE_URL` - （可選）Home Assistant URL
- [ ] `HOME_ASSISTANT_ACCESS_TOKEN` - （可選）Home Assistant Token

### 2. 資料庫設定 / Database Setup

- [ ] 創建生產資料庫（Supabase/Railway/自架）
- [ ] 運行資料庫遷移：`npx prisma db push` 或 `npx prisma migrate deploy`
- [ ] 驗證資料庫結構正確
- [ ] 設定資料庫備份

### 3. MQTT Broker 設定 / MQTT Broker Setup

- [ ] 部署 EMQX（Cloud 或自架）
- [ ] 配置 TLS/SSL（生產環境必須）
- [ ] 創建 MQTT 用戶
- [ ] 設定 ACL 規則
- [ ] 測試 MQTT 連接

### 4. 域名和 SSL / Domain and SSL

- [ ] 購買/配置域名
- [ ] 設定 DNS 記錄
- [ ] 配置 SSL 證書（Vercel 自動）
- [ ] 驗證 HTTPS 正常工作

## 🚀 部署步驟 / Deployment Steps

### Vercel 部署（推薦）/ Vercel Deployment (Recommended)

1. **安裝 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登入 Vercel**
   ```bash
   vercel login
   ```

3. **連接專案**
   ```bash
   vercel link
   ```

4. **設定環境變數**
   - 前往 Vercel Dashboard
   - Settings > Environment Variables
   - 添加所有生產環境變數

5. **部署**
   ```bash
   vercel --prod
   ```

### Railway 部署 / Railway Deployment

1. **安裝 Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **登入並部署**
   ```bash
   railway login
   railway init
   railway up
   ```

3. **設定環境變數**
   - Railway Dashboard > Variables

## ✅ 部署後驗證 / Post-Deployment Verification

### 功能測試 / Functional Tests

- [ ] 應用程式可訪問（HTTPS）
- [ ] 用戶註冊功能正常
- [ ] 用戶登入功能正常
- [ ] 物品管理功能正常
- [ ] 房間管理功能正常
- [ ] 分類管理功能正常
- [ ] MQTT 設備連接正常
- [ ] MQTT 設備控制正常
- [ ] RESTful 設備連接正常（Philips/Panasonic）
- [ ] RESTful 設備控制正常
- [ ] 語音助理功能正常（如啟用）
- [ ] Home Assistant 整合正常（如啟用）

### 性能測試 / Performance Tests

- [ ] 頁面載入速度 < 3 秒
- [ ] API 響應時間 < 1 秒
- [ ] 資料庫查詢優化
- [ ] 圖片載入優化

### 安全檢查 / Security Checks

- [ ] HTTPS 已啟用
- [ ] 環境變數未暴露在前端
- [ ] API 路由已保護
- [ ] CORS 設定正確
- [ ] 密碼使用強密碼
- [ ] MQTT 使用 TLS/SSL

## 📊 監控設定 / Monitoring Setup

- [ ] Vercel Analytics 已啟用
- [ ] 錯誤追蹤已設定（可選：Sentry）
- [ ] 資料庫監控已設定
- [ ] MQTT Broker 監控已設定
- [ ] 告警已配置

## 🔄 持續部署 / Continuous Deployment

- [ ] GitHub 倉庫已連接
- [ ] 自動部署已啟用
- [ ] 預覽部署已設定（Pull Request）
- [ ] 部署通知已配置

## 📝 文檔 / Documentation

- [ ] 部署文檔已更新
- [ ] 環境變數文檔已更新
- [ ] 故障排除文檔已準備
- [ ] 團隊成員已培訓

## 🆘 緊急聯絡 / Emergency Contacts

- [ ] 部署團隊聯絡方式
- [ ] 技術支援聯絡方式
- [ ] 資料庫管理員聯絡方式
- [ ] MQTT Broker 管理員聯絡方式

---

**使用說明 / Usage:**
1. 複製此檢查清單
2. 逐項完成
3. 部署前確認所有項目已完成
4. 部署後驗證所有功能正常

**狀態 / Status:** ✅ **生產環境檢查清單完成 / Production Checklist Complete**

