# Tuya 多區域配置指南
## Tuya Multi-Region Configuration Guide

本指南說明如何配置 Tuya API 以支持多個區域（美國西部和新加坡）。
<!-- This guide explains how to configure Tuya API to support multiple regions (US West and Singapore). -->

## 🌍 多區域支持 / Multi-Region Support

Smart Warehouse 現在支持同時使用多個 Tuya 區域：
- **美國西部 (US West)**: `us` 區域
- **新加坡 (Singapore)**: `cn` 區域（Tuya 的新加坡服務器使用中國區域 API）

## 📋 環境變數配置 / Environment Variables

### 方案一：單一區域（當前實現）
**適用於**：所有設備都在同一個區域

```bash
# Tuya API Configuration (Single Region)
TUYA_ACCESS_ID="your-tuya-access-id"
TUYA_ACCESS_SECRET="your-tuya-access-secret"
TUYA_REGION="us"  # 或 "cn" 用於新加坡
```

### 方案二：多區域配置（推薦）
**適用於**：設備分佈在多個區域

```bash
# Tuya US West Configuration
TUYA_ACCESS_ID_US="your-us-tuya-access-id"
TUYA_ACCESS_SECRET_US="your-us-tuya-access-secret"

# Tuya Singapore/China Configuration
TUYA_ACCESS_ID_CN="your-cn-tuya-access-id"
TUYA_ACCESS_SECRET_CN="your-cn-tuya-access-secret"

# Default Region (fallback)
TUYA_REGION="us"  # 預設區域
```

## 🔧 如何選擇區域 / How to Choose Region

### 根據 Tuya 項目區域選擇

1. **登入 Tuya IoT Platform**
   - 訪問：https://iot.tuya.com/
   - 查看您的項目設置

2. **確認項目區域**
   - 如果項目在 **美國區域** → 使用 `us`
   - 如果項目在 **中國/亞太區域** → 使用 `cn`

3. **重要提示**
   - Region 必須與您的 Tuya 項目區域一致
   - 不同區域的 Access ID 和 Secret 不能混用
   - 如果您的設備分佈在多個區域，需要：
     - 在 Tuya 平台創建多個項目（每個區域一個）
     - 使用對應的 Access ID 和 Secret

## 📝 配置步驟 / Configuration Steps

### 步驟 1: 獲取 Tuya 憑證

#### 美國西部項目
1. 登入 Tuya IoT Platform
2. 選擇或創建 **美國區域** 項目
3. 前往：雲開發 > API 授權
4. 複製 **Access ID** 和 **Access Secret**
5. 設置為 `TUYA_ACCESS_ID_US` 和 `TUYA_ACCESS_SECRET_US`

#### 新加坡/中國項目
1. 登入 Tuya IoT Platform
2. 選擇或創建 **中國/亞太區域** 項目
3. 前往：雲開發 > API 授權
4. 複製 **Access ID** 和 **Access Secret**
5. 設置為 `TUYA_ACCESS_ID_CN` 和 `TUYA_ACCESS_SECRET_CN`

### 步驟 2: 配置環境變數

#### 本地開發 (`.env.local`)

```bash
# 方案一：單一區域
TUYA_ACCESS_ID="your-tuya-access-id"
TUYA_ACCESS_SECRET="your-tuya-access-secret"
TUYA_REGION="us"  # 或 "cn"

# 方案二：多區域（需要更新代碼支持）
TUYA_ACCESS_ID_US="your-us-access-id"
TUYA_ACCESS_SECRET_US="your-us-access-secret"
TUYA_ACCESS_ID_CN="your-cn-access-id"
TUYA_ACCESS_SECRET_CN="your-cn-access-secret"
TUYA_REGION="us"  # 預設區域
```

#### Vercel 生產環境

1. 前往 Vercel Dashboard
2. 選擇您的專案
3. 前往 **Settings > Environment Variables**
4. 添加環境變數：
   - `TUYA_ACCESS_ID` 或 `TUYA_ACCESS_ID_US` / `TUYA_ACCESS_ID_CN`
   - `TUYA_ACCESS_SECRET` 或 `TUYA_ACCESS_SECRET_US` / `TUYA_ACCESS_SECRET_CN`
   - `TUYA_REGION`

### 步驟 3: 配網時選擇區域

在配網流程中：
1. 打開 **Tuya 配網** 模態框
2. 選擇設備所在的區域：
   - **美國西部** → 使用 `us` 配置
   - **新加坡** → 使用 `cn` 配置
3. 輸入 Wi-Fi 資訊
4. 開始配網

## 🗺️ 區域映射 / Region Mapping

| 區域代碼 | API 端點 | 適用地區 |
|---------|---------|---------|
| `us` | `https://openapi.tuyaus.com` | 美國、加拿大 |
| `cn` | `https://openapi.tuyacn.com` | 中國、新加坡、亞太地區 |
| `eu` | `https://openapi.tuyaeu.com` | 歐洲 |
| `in` | `https://openapi.tuyain.com` | 印度 |

## ⚠️ 重要注意事項 / Important Notes

### 1. 區域與項目匹配
- **必須**使用與 Tuya 項目區域一致的 region 代碼
- 不同區域的 Access ID 和 Secret 不能混用
- 如果項目在中國區域，即使設備在新加坡，也應使用 `cn`

### 2. 多區域設備管理
- 如果設備分佈在多個區域，建議：
  - 在 Tuya 平台為每個區域創建獨立的項目
  - 使用對應的 Access ID 和 Secret
  - 在配網時選擇正確的區域

### 3. 數據庫位置
- Tuya Region **不是**您的數據庫位置
- 您的 Supabase 數據庫在新加坡，但這不影響 Tuya Region 選擇
- Tuya Region 只影響與 Tuya API 服務器的連接

## 🔍 驗證配置 / Verify Configuration

### 測試單一區域配置

```bash
# 檢查環境變數
echo $TUYA_ACCESS_ID
echo $TUYA_ACCESS_SECRET
echo $TUYA_REGION
```

### 測試配網功能

1. 打開應用程式
2. 前往 **MQTT Devices** 標籤
3. 點擊 **Tuya 配網**
4. 輸入 Wi-Fi 資訊
5. 開始配網
6. 確認配網成功

## 🚀 當前實現狀態 / Current Implementation Status

### ✅ 已支持
- 單一區域配置（通過 `TUYA_REGION`）
- 動態區域選擇（在配網時）

### 🔄 待實現（如需要）
- 多區域同時配置（`TUYA_ACCESS_ID_US`, `TUYA_ACCESS_ID_CN`）
- 根據家庭位置自動選擇區域
- 設備區域標記和過濾

## 📞 需要幫助？/ Need Help?

如果您需要同時支持多個區域的完整實現，請告知：
1. 您有多少個 Tuya 項目（每個區域一個？）
2. 您希望如何選擇區域（手動選擇、自動檢測、根據家庭位置？）
3. 是否需要同時管理多個區域的設備？

---

**當前建議**：如果您的設備主要分佈在一個區域，使用單一區域配置即可。如果需要支持多個區域，可以：
1. 使用不同的環境變數（開發/生產）
2. 在配網時手動選擇區域
3. 或聯繫我們實現完整的多區域支持

