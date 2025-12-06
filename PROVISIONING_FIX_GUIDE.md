# 配網問題修復指南 / Provisioning Issues Fix Guide

## 問題 1: Tuya 配網錯誤

### 錯誤訊息
```
Tuya API credentials invalid: clientId is invalid. 
Please check TUYA_ACCESS_ID and TUYA_ACCESS_SECRET environment variables.
```

### 原因
Tuya API 憑證未正確配置或無效。需要設置 `TUYA_ACCESS_ID` 和 `TUYA_ACCESS_SECRET` 環境變數。

### 解決方案

#### Step 1: 獲取 Tuya API 憑證

1. 登入 [Tuya IoT Platform](https://iot.tuya.com/)
2. 進入 **Cloud** → **Cloud Development**
3. 選擇或創建一個 **Cloud Project**
4. 在項目設置中找到：
   - **Access ID** (Client ID)
   - **Access Secret** (Client Secret)
5. 記錄這些值

#### Step 2: 在 Vercel 設置環境變數

**方法 A: 使用 Vercel Dashboard (推薦)**

1. 前往 [Vercel Dashboard](https://vercel.com/sean-lis-projects-e3ebb6ec/smart-warehouse/settings/environment-variables)
2. 點擊 **"Add New"**
3. 添加以下環境變數：

   ```
   Key: TUYA_ACCESS_ID
   Value: [你的 Access ID]
   Environment: Production, Preview, Development (全選)
   ```

   ```
   Key: TUYA_ACCESS_SECRET
   Value: [你的 Access Secret]
   Environment: Production, Preview, Development (全選)
   ```

   ```
   Key: TUYA_REGION
   Value: us (美國西部) 或 cn (中國/新加坡)
   Environment: Production, Preview, Development (全選)
   ```

4. 點擊 **"Save"**

**方法 B: 使用 Vercel CLI**

```bash
# 設置 Tuya Access ID
vercel env add TUYA_ACCESS_ID production preview development

# 設置 Tuya Access Secret
vercel env add TUYA_ACCESS_SECRET production preview development

# 設置 Tuya Region (可選，默認為 cn)
vercel env add TUYA_REGION production preview development
# 輸入: us 或 cn
```

#### Step 3: 重新部署

環境變數設置後，需要重新部署才能生效：

```bash
# 觸發重新部署
git commit --allow-empty -m "Trigger redeploy for Tuya env vars"
git push
```

或直接在 Vercel Dashboard 點擊 **"Redeploy"**

#### Step 4: 驗證配置

訪問以下 URL 驗證配置：
```
https://smart-warehouse-five.vercel.app/api/test/tuya-config
```

應該看到：
```json
{
  "tuyaConfigured": true,
  "hasAccessId": true,
  "hasAccessSecret": true,
  "region": "us"
}
```

---

## 問題 2: Midea 配網問題

### 常見錯誤

#### 錯誤 1: "Midea provisioning requires native SDK"
**原因**: Midea 配網需要原生 SDK，在網頁端無法使用。

**解決方案**:
- ✅ 使用 **Android/iOS 原生應用**進行 Midea 配網
- ✅ 確保已集成 Midea MSmartSDK
- ❌ 網頁端不支持 Midea 配網

#### 錯誤 2: Midea SDK 初始化失敗
**原因**: Midea SDK 配置不正確或缺少必要的環境變數。

**解決方案**:

1. **檢查 Midea SDK 配置** (Android/iOS)
   - 確認已正確集成 Midea MSmartSDK
   - 檢查 SDK 初始化代碼

2. **設置 Midea API 憑證** (如果使用 API 方式)

   在 Vercel 設置：
   ```
   Key: MIDEA_APP_ID
   Value: [你的 Midea App ID]
   
   Key: MIDEA_APP_SECRET
   Value: [你的 Midea App Secret]
   ```

3. **獲取 Midea 憑證**:
   - 訪問 [Midea IoT Platform](https://iot.midea.com/)
   - 創建應用並獲取 App ID 和 App Secret

#### 錯誤 3: "Connection refused: Bad username or password"
**原因**: MQTT 連接配置錯誤。

**解決方案**:
1. 檢查 MQTT Broker 配置
2. 確認 MQTT 用戶名和密碼正確
3. 檢查網絡連接

---

## 快速檢查清單

### Tuya 配網檢查
- [ ] `TUYA_ACCESS_ID` 已設置且有效
- [ ] `TUYA_ACCESS_SECRET` 已設置且有效
- [ ] `TUYA_REGION` 已設置 (us 或 cn)
- [ ] 環境變數已應用到所有環境 (Production, Preview, Development)
- [ ] 已重新部署應用
- [ ] Tuya Cloud Project 已正確配置

### Midea 配網檢查
- [ ] 使用原生應用 (Android/iOS) 而非網頁
- [ ] Midea MSmartSDK 已正確集成
- [ ] `MIDEA_APP_ID` 已設置 (如果使用 API)
- [ ] `MIDEA_APP_SECRET` 已設置 (如果使用 API)
- [ ] Midea IoT Platform 應用已創建

---

## 測試配網功能

### Tuya 配網測試

1. 打開應用 → IoT 設備管理
2. 點擊 **"Tuya 配網"** 按鈕
3. 輸入 Wi-Fi SSID 和密碼
4. 選擇配網模式 (EZ Mode 或 AP Mode)
5. 點擊 **"開始配網"**

**預期結果**: 
- ✅ 成功獲取配網 token
- ✅ 設備進入配網模式
- ✅ 設備成功連接到 Wi-Fi
- ✅ 設備出現在設備列表中

### Midea 配網測試

1. 在 **Android/iOS 原生應用**中
2. 打開 IoT 設備管理
3. 點擊 **"Midea 配網"** 按鈕
4. 輸入 Wi-Fi SSID 和密碼
5. 選擇 AP 模式
6. 點擊 **"開始配網"**

**預期結果**:
- ✅ SDK 初始化成功
- ✅ 設備進入 AP 模式
- ✅ 配網流程完成
- ✅ 設備成功添加

---

## 故障排除

### Tuya 配網仍然失敗？

1. **檢查 Tuya Cloud Project 設置**:
   - 確認項目狀態為 "Published"
   - 檢查 API 權限是否開啟
   - 確認區域設置正確

2. **驗證憑證格式**:
   - Access ID 應該是字符串格式
   - Access Secret 應該是字符串格式
   - 不應包含引號或空格

3. **檢查網絡連接**:
   - 確認可以訪問 Tuya API
   - 檢查防火牆設置

4. **查看服務器日誌**:
   ```bash
   vercel logs --follow
   ```

### Midea 配網仍然失敗？

1. **確認使用原生應用**:
   - Midea 配網**不支持**網頁端
   - 必須使用 Android/iOS 原生應用

2. **檢查 SDK 集成**:
   - 確認 Midea MSmartSDK 已正確添加
   - 檢查 SDK 版本是否兼容

3. **檢查設備兼容性**:
   - 確認設備支持 Midea 配網
   - 檢查設備型號是否在支持列表中

---

## 相關文檔

- [Tuya Integration Guide](./docs/TUYA_INTEGRATION_STATUS.md)
- [Midea Implementation Guide](./docs/MIDEA_IMPLEMENTATION_COMPLETE.md)
- [Multi-Brand Provisioning Guide](./docs/MULTI_BRAND_PROVISIONING_GUIDE.md)

---

## 需要幫助？

如果問題仍然存在：

1. 檢查 Vercel 環境變數設置
2. 查看應用日誌: `vercel logs`
3. 驗證 API 憑證是否正確
4. 確認網絡連接正常

