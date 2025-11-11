# 快速測試 iFLYTEK 語音識別

## 🚀 快速開始（3 步）

### 步驟 1: 確認環境配置

檢查 `.env.local` 文件是否包含 iFLYTEK 配置：

```bash
cat .env.local | grep IFLYTEK
```

如果沒有，請添加：

```env
IFLYTEK_APP_KEY="4ba58cf3dc03c31f7262b183a5b1f575"
IFLYTEK_APP_SECRET="OGE5N2MxYzIzNGY4NzE0MTVhOTNkMmU0"
IFLYTEK_VERIFY_TOKEN="e1fd74d5b0f7c9f8"
IFLYTEK_AES_KEY="26a6a47e69471bb8"
```

### 步驟 2: 啟動服務器

```bash
npm run dev
```

### 步驟 3: 測試語音功能

1. 打開瀏覽器：`http://localhost:3000`
2. 登入系統
3. 選擇任意物品
4. 點擊「調整數量」
5. 輸入負數（例如：-1）來減少數量
6. **錄製語音評論**（會自動出現麥克風圖標）
7. 說一段話並停止錄音
8. 點擊「確認」

## 📊 查看結果

### 在終端查看日誌

您應該看到類似這樣的日誌：

```
Attempting transcription with iFLYTEK...
✓ iFLYTEK transcription successful
```

或如果 iFLYTEK 失敗：

```
Attempting transcription with iFLYTEK...
iFLYTEK transcription failed or empty, falling back to OpenAI...
✓ OpenAI transcription successful (fallback)
```

### 在應用中查看結果

1. 點擊物品的「歷史」按鈕
2. 找到剛才的操作記錄
3. 您應該看到：
   - 🎵 語音播放按鈕
   - 📝 轉錄文字（藍色框顯示）

## 🔍 測試搜索功能

1. 錄製包含物品名稱的語音（例如：「這個咖啡杯」）
2. 在搜索框輸入轉錄文字中的關鍵詞
3. 確認能找到對應物品

## ❗ 常見問題

### 問題：看不到語音評論選項

**解決方案**：確保您是在「減少數量」時（調整值為負數），語音評論只在減少數量時顯示。

### 問題：轉錄失敗

**解決方案**：
1. 檢查服務器日誌查看具體錯誤
2. 確認網絡連接正常
3. 驗證 API 憑證是否正確

### 問題：只看到 OpenAI 日誌，沒有 iFLYTEK

**解決方案**：
1. 檢查 `.env.local` 中的 iFLYTEK 配置
2. 確認 API 憑證是否有效
3. 查看是否有 iFLYTEK 相關的錯誤日誌

## 📝 測試檢查清單

- [ ] 環境變數已配置
- [ ] 服務器正常啟動
- [ ] 可以錄製語音
- [ ] 語音成功提交
- [ ] 服務器日誌顯示轉錄過程
- [ ] 轉錄文字顯示在歷史記錄中
- [ ] 可以播放語音
- [ ] 搜索功能可以找到轉錄文字

## 🎯 下一步

測試完成後，您可以：
- 測試不同語言的語音識別
- 測試長語音（超過 10 秒）
- 測試搜索功能的準確度
- 檢查轉錄準確度

