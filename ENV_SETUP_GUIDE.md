# 環境變數設定指南
## Environment Variables Setup Guide

本指南說明如何設定 `.env.local` 文件。
<!-- This guide explains how to set up the `.env.local` file. -->

## 文件位置 / File Location

`.env.local` 文件應該放在**項目根目錄**（與 `package.json` 同一層級）。
<!-- The `.env.local` file should be placed in the **project root directory** (same level as `package.json`). -->

```
smart-warehouse/
├── .env.local          ← 在這裡創建這個文件
├── .env.example        ← 範例文件（參考用）
├── package.json
├── prisma/
├── app/
└── ...
```

## 創建步驟 / Creation Steps

### 方法 1: 從範例文件複製（推薦）/ Method 1: Copy from Example (Recommended)

```bash
# 在項目根目錄執行
cd /Users/seanli/smart-warehouse
cp env.example .env.local
```

### 方法 2: 手動創建 / Method 2: Manual Creation

1. 在項目根目錄創建 `.env.local` 文件
2. 複製 `env.example` 的內容
3. 填入您的實際配置值

## 必需配置 / Required Configuration

### 1. 資料庫配置 / Database Configuration

```bash
# PostgreSQL（生產環境）
DATABASE_URL="postgresql://username:password@host:port/database"

# SQLite（開發環境）
DATABASE_URL="file:./dev.db"
```

### 2. NextAuth 配置 / NextAuth Configuration

```bash
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

生成安全密鑰：
```bash
openssl rand -base64 32
```

### 3. MQTT Broker 配置（使用 EMQX）/ MQTT Broker Configuration (EMQX)

```bash
# 開發環境
MQTT_BROKER_URL="mqtt://localhost:1883"
MQTT_USERNAME="smart-warehouse"
MQTT_PASSWORD="your-mqtt-password"
MQTT_CLIENT_ID="smart-warehouse-client"

# 生產環境（使用 TLS）
# MQTT_BROKER_URL="mqtts://emqx.yourdomain.com:8883"
```

### 4. OpenAI API（可選）/ OpenAI API (Optional)

```bash
OPENAI_API_KEY="your-openai-api-key"
OPENAI_VISION_MODEL="gpt-4o"
OPENAI_TEXT_MODEL="gpt-4o-mini"
```

## 完整範例 / Complete Example

以下是 `.env.local` 的完整範例：

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/smartwarehouse"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-key-here"

# MQTT Broker (EMQX)
MQTT_BROKER_URL="mqtt://localhost:1883"
MQTT_USERNAME="smart-warehouse"
MQTT_PASSWORD="your-mqtt-password"
MQTT_CLIENT_ID="smart-warehouse-client"
MQTT_KEEPALIVE="60"
MQTT_RECONNECT_PERIOD="1000"
MQTT_CONNECT_TIMEOUT="30000"

# OpenAI API (Optional)
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

## 安全注意事項 / Security Notes

⚠️ **重要 / Important:**

1. **不要提交 `.env.local` 到 Git**
   - `.env.local` 已在 `.gitignore` 中
   - 只提交 `env.example` 作為範例

2. **生產環境使用環境變數**
   - Vercel: 在 Dashboard > Settings > Environment Variables 設定
   - Railway: 在 Variables 標籤設定
   - 其他平台: 根據平台文檔設定

3. **使用強密碼**
   ```bash
   # 生成強密碼
   openssl rand -base64 32
   ```

## 驗證配置 / Verify Configuration

創建 `.env.local` 後，驗證配置：

```bash
# 檢查文件是否存在
ls -la .env.local

# 檢查配置（不顯示敏感資訊）
grep -v "PASSWORD\|SECRET\|KEY" .env.local
```

## 故障排除 / Troubleshooting

### 問題 1: 找不到 `.env.local`

**解決方案:**
```bash
# 確認在項目根目錄
pwd
# 應該顯示: /Users/seanli/smart-warehouse

# 從範例文件創建
cp env.example .env.local
```

### 問題 2: 環境變數未生效

**解決方案:**
1. 確認文件名稱是 `.env.local`（不是 `.env`）
2. 重啟開發伺服器：`npm run dev`
3. 檢查是否有語法錯誤（每行一個變數，無空格）

### 問題 3: 資料庫連接失敗

**解決方案:**
1. 確認 `DATABASE_URL` 格式正確
2. 確認資料庫服務正在運行
3. 檢查用戶名和密碼是否正確

---

**狀態 / Status:** ✅ **環境變數設定指南完成 / Environment Variables Setup Guide Complete**

