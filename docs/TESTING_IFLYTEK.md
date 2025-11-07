# iFLYTEK 語音識別測試指南

## 前置準備

### 1. 配置環境變數

確保 `.env.local` 文件包含 iFLYTEK 配置：

```env
# iFLYTEK (科大訊飛) API Configuration
IFLYTEK_APP_KEY="4ba58cf3dc03c31f7262b183a5b1f575"
IFLYTEK_APP_SECRET="OGE5N2MxYzIzNGY4NzE0MTVhOTNkMmU0"
IFLYTEK_VERIFY_TOKEN="e1fd74d5b0f7c9f8"
IFLYTEK_AES_KEY="26a6a47e69471bb8"

# OpenAI (備選引擎)
OPENAI_API_KEY="your-openai-api-key"
```

### 2. 確認數據庫遷移

確保已運行語音轉錄相關的數據庫遷移：

```sql
-- 如果還沒有運行，請執行：
ALTER TABLE item_history 
ADD COLUMN IF NOT EXISTS voice_transcript TEXT;
```

## 測試步驟

### 步驟 1: 啟動開發服務器

```bash
cd /Users/seanli/smart-warehouse
npm run dev
```

### 步驟 2: 打開應用

在瀏覽器中打開 `http://localhost:3000`

### 步驟 3: 測試語音評論功能

1. **登入系統**
   - 使用您的帳號登入

2. **選擇一個物品**
   - 進入物品列表頁面
   - 選擇任意一個物品

3. **調整數量（減少）**
   - 點擊物品的「調整數量」按鈕
   - 輸入要減少的數量（例如：1）
   - 點擊「減少數量」

4. **錄製語音評論**
   - 在彈出的模態框中，您會看到「語音評論」選項
   - 點擊麥克風圖標開始錄音
   - 說一段話（例如：「這個物品已經用完了」）
   - 點擊停止按鈕結束錄音

5. **提交**
   - 點擊「確認」按鈕提交

### 步驟 4: 查看服務器日誌

在終端中查看服務器日誌，您應該看到：

```
Attempting transcription with iFLYTEK...
✓ iFLYTEK transcription successful
```

或者如果 iFLYTEK 失敗：

```
Attempting transcription with iFLYTEK...
iFLYTEK transcription failed or empty, falling back to OpenAI...
✓ OpenAI transcription successful (fallback)
```

### 步驟 5: 驗證轉錄結果

1. **查看物品歷史**
   - 回到物品列表
   - 點擊物品的「歷史」按鈕

2. **檢查轉錄文字**
   - 在歷史記錄中，找到剛才的操作
   - 您應該看到：
     - 語音播放按鈕（可以播放錄音）
     - 轉錄文字框（顯示識別的文字）

## 測試不同場景

### 場景 1: 中文語音識別

1. 設置語言為繁體中文或簡體中文
2. 錄製中文語音評論
3. 驗證轉錄結果是否正確

### 場景 2: 英文語音識別

1. 設置語言為英文
2. 錄製英文語音評論
3. 驗證轉錄結果

### 場景 3: iFLYTEK 失敗情況

如果 iFLYTEK API 不可用或返回錯誤：
1. 系統應該自動切換到 OpenAI
2. 查看日誌確認切換過程
3. 驗證最終結果是否正確

### 場景 4: 搜索功能

1. 錄製包含特定關鍵詞的語音評論（例如：「這個咖啡杯」）
2. 在搜索框中輸入轉錄文字中的關鍵詞
3. 驗證是否能找到對應的物品

## 調試提示

### 查看完整日誌

在服務器終端中，您會看到詳細的日誌：

```bash
# 成功案例
Attempting transcription with iFLYTEK...
✓ iFLYTEK transcription successful
Transcription: "這個物品已經用完了"

# 失敗案例
Attempting transcription with iFLYTEK...
iFLYTEK API error: 401 Unauthorized
iFLYTEK transcription failed or empty, falling back to OpenAI...
✓ OpenAI transcription successful (fallback)
Transcription: "This item is used up"
```

### 常見問題排查

#### 問題 1: iFLYTEK API 認證失敗

**症狀**: 日誌顯示 `401 Unauthorized` 或 `403 Forbidden`

**解決方案**:
- 檢查 `IFLYTEK_APP_KEY` 和 `IFLYTEK_APP_SECRET` 是否正確
- 確認 API 憑證是否有效
- 檢查 iFLYTEK 控制台中的服務狀態

#### 問題 2: 轉錄結果為空

**症狀**: API 調用成功但沒有轉錄文字

**解決方案**:
- 檢查音頻格式是否支持
- 確認音頻文件不為空
- 查看 iFLYTEK 響應格式是否正確

#### 問題 3: 自動切換到 OpenAI

**症狀**: 總是使用 OpenAI 而不是 iFLYTEK

**解決方案**:
- 檢查 iFLYTEK 配置是否正確
- 查看具體的錯誤信息
- 確認 API 端點是否可訪問

## 測試檢查清單

- [ ] 環境變數已正確配置
- [ ] 開發服務器正常啟動
- [ ] 可以錄製語音評論
- [ ] 語音成功提交到服務器
- [ ] 服務器日誌顯示轉錄過程
- [ ] 轉錄文字正確顯示在歷史記錄中
- [ ] 語音播放功能正常
- [ ] 搜索功能可以找到轉錄文字
- [ ] 中文語音識別正常
- [ ] 英文語音識別正常
- [ ] 備選引擎（OpenAI）正常工作

## 下一步

測試完成後，您可以：

1. **檢查轉錄準確度**: 比較錄音內容和轉錄結果
2. **測試搜索功能**: 使用轉錄文字搜索物品
3. **優化配置**: 根據測試結果調整 API 參數
4. **性能監控**: 觀察響應時間和成功率

## 需要幫助？

如果遇到問題，請：

1. 查看服務器日誌的詳細錯誤信息
2. 檢查瀏覽器控制台的錯誤
3. 確認網絡連接正常
4. 驗證 API 憑證是否有效

