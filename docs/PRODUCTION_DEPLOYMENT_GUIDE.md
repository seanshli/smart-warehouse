# 生產環境部署指南
## Production Deployment Guide

本指南說明如何將 Smart Warehouse 部署到生產環境。

**注意 / Note:** Smart Warehouse 已經在 Vercel 和 Supabase 上運行（`https://smart-warehouse-five.vercel.app`）。如果您只需要添加 MQTT 功能，請參考 [MQTT_PRODUCTION_UPDATE.md](./MQTT_PRODUCTION_UPDATE.md)。
<!-- This guide explains how to deploy Smart Warehouse to production environment. -->
<!-- Note: Smart Warehouse is already running on Vercel and Supabase. If you only need to add MQTT functionality, see MQTT_PRODUCTION_UPDATE.md. -->

## 部署前檢查清單 / Pre-Deployment Checklist

### ✅ 必需準備 / Required

- [ ] 生產資料庫（PostgreSQL）
- [ ] 生產 MQTT Broker（EMQX）
- [ ] 域名和 SSL 證書
- [ ] 環境變數配置
- [ ] 資料庫遷移完成
- [ ] 測試所有功能

### ✅ 可選準備 / Optional

- [ ] OpenAI API 金鑰（AI 功能）
- [ ] iFLYTEK API 金鑰（語音功能）
- [ ] Home Assistant 整合
- [ ] Google OAuth 設定

## 步驟 1: 選擇部署平台 / Step 1: Choose Deployment Platform

### 選項 1: Vercel（推薦 - 最簡單）/ Option 1: Vercel (Recommended - Easiest)

**優點:**
- 自動部署（GitHub 推送即部署）
- 免費 SSL 證書
- 全球 CDN
- 簡單易用

**步驟:**

1. **安裝 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登入 Vercel**
   ```bash
   vercel login
   ```

3. **部署**
   ```bash
   vercel --prod
   ```

4. **設定環境變數**
   - 前往 Vercel Dashboard
   - 選擇專案 > Settings > Environment Variables
   - 添加所有生產環境變數（見下方）

### 選項 2: Railway / Option 2: Railway

**優點:**
- 支援 PostgreSQL 資料庫
- 簡單的環境變數管理
- 自動部署

**步驟:**

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
   - 在 Railway Dashboard > Variables 標籤設定

### 選項 3: DigitalOcean App Platform / Option 3: DigitalOcean App Platform

**優點:**
- 可預測的定價
- 支援資料庫和應用程式

**步驟:**

1. 連接 GitHub 倉庫
2. 設定 Build Command: `npm run build`
3. 設定 Run Command: `npm start`
4. 添加環境變數

## 步驟 2: 設定生產資料庫 / Step 2: Setup Production Database

### 選項 A: Supabase（推薦）/ Option A: Supabase (Recommended)

1. **創建 Supabase 專案**
   - 前往 [supabase.com](https://supabase.com)
   - 創建新專案
   - 獲取連接字串

2. **獲取資料庫 URL**
   ```
   postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
   ```

3. **運行資料庫遷移**
   ```bash
   # 設定生產資料庫 URL
   export DATABASE_URL="postgresql://..."
   
   # 運行遷移
   npx prisma db push
   npx prisma generate
   ```

### 選項 B: Railway PostgreSQL / Option B: Railway PostgreSQL

1. 在 Railway 創建 PostgreSQL 服務
2. 獲取連接字串
3. 運行遷移

### 選項 C: 自架 PostgreSQL / Option C: Self-Hosted PostgreSQL

1. 在伺服器上安裝 PostgreSQL
2. 創建資料庫和用戶
3. 設定連接字串
4. 運行遷移

## 步驟 3: 設定生產 MQTT Broker（EMQX）/ Step 3: Setup Production MQTT Broker (EMQX)

### 選項 A: EMQX Cloud（推薦 - 託管服務）/ Option A: EMQX Cloud (Recommended - Hosted)

1. **註冊 EMQX Cloud**
   - 前往 [emqx.com/cloud](https://www.emqx.com/en/cloud)
   - 創建帳號
   - 創建實例

2. **獲取連接資訊**
   - Broker URL: `mqtts://xxx.hivemq.cloud:8883`
   - 用戶名和密碼

3. **設定環境變數**
   ```bash
   MQTT_BROKER_URL="mqtts://xxx.hivemq.cloud:8883"
   MQTT_USERNAME="your-username"
   MQTT_PASSWORD="your-password"
   ```

### 選項 B: 自架 EMQX / Option B: Self-Hosted EMQX

1. **在伺服器上部署 EMQX**
   ```bash
   # 使用 Docker
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

3. **創建 MQTT 用戶**
   - 訪問 Dashboard: `https://emqx.yourdomain.com:18083`
   - 創建用戶和設定 ACL

## 步驟 4: 配置生產環境變數 / Step 4: Configure Production Environment Variables

### Vercel 設定 / Vercel Configuration

在 Vercel Dashboard > Settings > Environment Variables 添加：

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# NextAuth.js
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-production-secret-key"

# MQTT Broker (EMQX)
MQTT_BROKER_URL="mqtts://emqx.yourdomain.com:8883"
MQTT_USERNAME="smart-warehouse-prod"
MQTT_PASSWORD="your-strong-password"
MQTT_CLIENT_ID="smart-warehouse-production"

# OpenAI (Optional)
OPENAI_API_KEY="your-openai-api-key"
OPENAI_VISION_MODEL="gpt-4o"
OPENAI_TEXT_MODEL="gpt-4o-mini"

# iFLYTEK (Optional)
IFLYTEK_APP_KEY="your-iflytek-app-key"
IFLYTEK_APP_SECRET="your-iflytek-app-secret"
AIUI_DEVICE_SERIAL="SMARTPAD000037"

# Home Assistant (Optional)
HOME_ASSISTANT_BASE_URL="https://your-home-assistant-instance.com"
HOME_ASSISTANT_ACCESS_TOKEN="your-long-lived-access-token"
```

### 生成安全密鑰 / Generate Secure Keys

```bash
# 生成 NEXTAUTH_SECRET
openssl rand -base64 32

# 生成 MQTT 密碼
openssl rand -base64 32
```

## 步驟 5: 資料庫遷移 / Step 5: Database Migration

### 在生產環境運行遷移 / Run Migration in Production

```bash
# 方法 1: 使用 Prisma Migrate（推薦）
npx prisma migrate deploy

# 方法 2: 使用 Prisma Push（開發/測試用）
npx prisma db push
```

### 驗證遷移 / Verify Migration

```bash
# 檢查資料庫結構
npx prisma studio
# 或
npx prisma db pull
```

## 步驟 6: 設定自訂域名和 SSL / Step 6: Setup Custom Domain and SSL

### Vercel 設定 / Vercel Configuration

1. 在 Vercel Dashboard > Settings > Domains
2. 添加您的域名
3. 按照指示設定 DNS 記錄
4. SSL 證書自動配置

### DNS 設定範例 / DNS Configuration Example

```
Type: CNAME
Name: @
Value: cname.vercel-dns.com

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## 步驟 7: 安全設定 / Step 7: Security Configuration

### 1. 使用強密碼 / Use Strong Passwords

```bash
# 所有密碼都應該使用強密碼
openssl rand -base64 32
```

### 2. 啟用 HTTPS / Enable HTTPS

- Vercel: 自動啟用
- 其他平台: 配置 SSL 證書（Let's Encrypt）

### 3. 設定 CORS（如需要）/ Configure CORS (If Needed)

已在 `next.config.js` 和 `middleware.ts` 中配置。

### 4. 保護 API 路由 / Protect API Routes

所有 API 路由都已使用 NextAuth 保護。

## 步驟 8: 測試生產環境 / Step 8: Test Production Environment

### 功能測試清單 / Functional Test Checklist

- [ ] 用戶註冊和登入
- [ ] 物品管理（添加、編輯、刪除）
- [ ] 房間和分類管理
- [ ] MQTT 設備連接和控制
- [ ] RESTful 設備連接和控制（Philips、Panasonic）
- [ ] 語音助理功能
- [ ] Home Assistant 整合
- [ ] 多語言支援

### 性能測試 / Performance Testing

```bash
# 使用 Lighthouse 測試
npm install -g lighthouse
lighthouse https://your-app.vercel.app
```

## 步驟 9: 監控和維護 / Step 9: Monitoring and Maintenance

### 1. 應用程式監控 / Application Monitoring

**Vercel Analytics:**
- 自動啟用
- 查看 Dashboard > Analytics

**自訂監控:**
- 使用 Sentry 追蹤錯誤
- 使用 LogRocket 記錄用戶會話

### 2. 資料庫監控 / Database Monitoring

- Supabase: 內建監控面板
- Railway: Dashboard 監控
- 自架: 使用 pgAdmin 或類似工具

### 3. MQTT Broker 監控 / MQTT Broker Monitoring

- EMQX Dashboard: `https://emqx.yourdomain.com:18083`
- 監控連接數、訊息流量
- 設定告警

### 4. 定期備份 / Regular Backups

**資料庫備份:**
```bash
# PostgreSQL 備份
pg_dump -h host -U user -d database > backup.sql

# 恢復
psql -h host -U user -d database < backup.sql
```

**自動備份:**
- Supabase: 自動每日備份
- Railway: 設定自動備份
- 自架: 使用 cron 任務

## 步驟 10: 持續部署 / Step 10: Continuous Deployment

### GitHub Actions（可選）/ GitHub Actions (Optional)

創建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      # Vercel 自動部署，無需額外步驟
```

### Vercel 自動部署 / Vercel Auto-Deploy

1. 連接 GitHub 倉庫
2. 每次推送到 `main` 分支自動部署
3. 預覽部署用於 Pull Request

## 故障排除 / Troubleshooting

### 問題 1: 資料庫連接失敗

**解決方案:**
1. 檢查 `DATABASE_URL` 是否正確
2. 確認資料庫服務正在運行
3. 檢查防火牆設定
4. 驗證用戶名和密碼

### 問題 2: MQTT 連接失敗

**解決方案:**
1. 檢查 `MQTT_BROKER_URL` 是否正確
2. 確認使用 `mqtts://`（TLS）在生產環境
3. 檢查 MQTT Broker 是否可訪問
4. 驗證用戶名和密碼

### 問題 3: 環境變數未生效

**解決方案:**
1. 確認在正確的環境（Production）設定
2. 重新部署應用程式
3. 檢查變數名稱是否正確
4. 確認沒有拼寫錯誤

### 問題 4: 構建失敗

**解決方案:**
1. 檢查構建日誌
2. 確認所有依賴已安裝
3. 檢查 TypeScript 錯誤
4. 驗證環境變數是否完整

## 生產環境檢查清單 / Production Checklist

### 部署前 / Before Deployment

- [ ] 所有環境變數已設定
- [ ] 資料庫已創建並遷移
- [ ] MQTT Broker 已配置
- [ ] SSL 證書已配置
- [ ] 域名 DNS 已設定
- [ ] 所有功能已測試

### 部署後 / After Deployment

- [ ] 應用程式可訪問
- [ ] 用戶可以註冊和登入
- [ ] 資料庫連接正常
- [ ] MQTT 連接正常
- [ ] 所有功能正常運作
- [ ] 監控已設定
- [ ] 備份已配置

## 成本估算 / Cost Estimation

### Vercel
- **免費方案**: 適合小型專案
- **Pro 方案**: $20/月（更多功能）

### Supabase
- **免費方案**: 500MB 資料庫
- **Pro 方案**: $25/月起

### EMQX Cloud
- **免費方案**: 100 連接
- **專業方案**: $49/月起

### 總計（小型專案）
- **免費**: 使用免費方案
- **小型生產**: ~$50-100/月

## 參考資源 / Reference Resources

- [Vercel 部署文檔](https://vercel.com/docs)
- [Railway 文檔](https://docs.railway.app)
- [Supabase 文檔](https://supabase.com/docs)
- [EMQX 文檔](https://www.emqx.io/docs)

---

**狀態 / Status:** ✅ **生產環境部署指南完成 / Production Deployment Guide Complete**

