# 🔧 iFLYTEK 認證錯誤修復

## 問題
"invalid credential" - iFLYTEK API 認證失敗

## 原因
X-CheckSum 計算格式不正確

### 錯誤的格式
```javascript
X-CheckSum = MD5(APP_KEY + APP_SECRET + X-Param)
```

### 正確的格式
```javascript
X-CheckSum = MD5(APP_KEY + APP_SECRET + X-CurTime + X-Param)
```

## 已修復

### 1. X-CheckSum 計算
- ✅ 現在包含 `X-CurTime` 在計算中
- ✅ 格式：`MD5(APP_KEY + APP_SECRET + curTime + xParam)`

### 2. X-Param 生成
- ✅ 移除了 audio 字段（不應包含在 X-Param 中）
- ✅ audio 數據只在請求 body 中發送

### 3. 音頻格式
- ✅ 更新為 iFLYTEK 期望的格式：`audio/L16;rate=16000`

## 測試

### 檢查修復
1. 重新啟動開發服務器
2. 測試語音識別功能
3. 查看服務器日誌確認認證是否成功

### 預期結果
- ✅ 不再出現 "invalid credential" 錯誤
- ✅ iFLYTEK API 調用成功
- ✅ 返回轉錄文字

## 如果仍然失敗

### 可能的原因
1. **API 憑證錯誤**
   - 檢查 `IFLYTEK_APP_KEY` 和 `IFLYTEK_APP_SECRET` 是否正確
   - 確認在 iFLYTEK 控制台中服務已啟用

2. **API 端點錯誤**
   - 確認使用的端點是否正確
   - 檢查 iFLYTEK 文檔確認最新 API 地址

3. **音頻格式問題**
   - iFLYTEK 可能需要特定格式的音頻
   - 可能需要音頻轉換（WebM → PCM16）

4. **API 版本**
   - 確認使用的 API 版本是否正確
   - 檢查是否需要使用不同的 API 端點

## 下一步

1. 重新啟動服務器
2. 測試語音功能
3. 查看日誌確認錯誤信息
4. 如果仍然失敗，檢查 iFLYTEK 控制台中的服務狀態

