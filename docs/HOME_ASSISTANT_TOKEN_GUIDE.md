# Home Assistant 訪問令牌指南

## 🔐 認證方式

**只需要 Long-Lived Access Token（長期訪問令牌），不需要用戶名和密碼。**

這是 Home Assistant 推薦的安全認證方式。

## 📋 如何獲取 Long-Lived Access Token

### 步驟 1: 登錄 Home Assistant
1. 打開 Home Assistant Web 界面
2. 使用您的用戶名和密碼登錄

### 步驟 2: 創建長期訪問令牌
1. 點擊左下角的**用戶圖標**（您的頭像）
2. 滾動到頁面底部，找到 **"長期存取令牌"** (Long-Lived Access Tokens) 部分
3. 點擊 **"創建令牌"** (Create Token)
4. 為令牌命名（例如："Smart Warehouse - Unit 3A"）
5. 點擊 **"確定"** (OK)
6. **立即複製令牌** - 這是最後一次可以看到完整令牌的機會！

### 步驟 3: 安全保存令牌
- 將令牌保存在安全的地方
- 不要將令牌分享給他人
- 如果令牌洩露，立即撤銷並創建新令牌

## 🔗 鏈接 Home Assistant 到 Household

### 方法 1: 使用腳本
```bash
tsx scripts/link-ha-to-unit3a.ts <baseUrl> <accessToken>
```

**示例：**
```bash
tsx scripts/link-ha-to-unit3a.ts https://homeassistant.local:8123 eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### 方法 2: 使用 API
```bash
POST /api/household/{householdId}/homeassistant
Content-Type: application/json

{
  "baseUrl": "https://homeassistant.local:8123",
  "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## ✅ 驗證連接

鏈接後，系統會自動驗證連接：
- 測試連接到 Home Assistant API
- 驗證令牌是否有效
- 如果失敗，會返回錯誤信息

## 🔒 安全注意事項

1. **令牌格式**：Long-Lived Access Token 是一個長字符串（通常以 `eyJ` 開頭的 JWT）
2. **權限**：令牌擁有創建它的用戶的所有權限
3. **撤銷**：如果令牌洩露，可以在 Home Assistant 用戶設置中撤銷
4. **存儲**：令牌在數據庫中存儲為明文（生產環境建議加密）

## 📝 令牌示例格式

```
eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJhYzE5YzU1YzE1NGI0ODM5OTllNTkwODdkYWIyZGRjOCIsImlhdCI6MTY5OTU2ODgwMCwiZXhwIjo5OTk5OTk5OTk5OX0.abc123def456...
```

## 🆘 常見問題

### Q: 忘記保存令牌怎麼辦？
A: 需要撤銷舊令牌並創建新令牌。

### Q: 令牌會過期嗎？
A: 不會，Long-Lived Access Token 不會自動過期，除非手動撤銷。

### Q: 可以為不同的 household 使用不同的令牌嗎？
A: 可以！每個 household 可以鏈接到不同的 Home Assistant 實例，使用不同的令牌。

### Q: 如果 Home Assistant URL 改變了怎麼辦？
A: 使用 API 更新配置：
```bash
POST /api/household/{householdId}/homeassistant
{
  "baseUrl": "新的URL",
  "accessToken": "相同的令牌或新令牌"
}
```

## 🔗 相關文檔

- [Home Assistant 認證文檔](https://www.home-assistant.io/docs/authentication/)
- [Home Assistant API 文檔](https://developers.home-assistant.io/docs/api/rest/)

