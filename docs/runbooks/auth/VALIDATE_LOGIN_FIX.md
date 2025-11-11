# ✅ 登入憑證修復驗證指南

## 步驟 1: 在 Supabase 中驗證數據

### 運行驗證查詢

在 Supabase SQL Editor 中運行 `validate-login-fix.sql` 或以下查詢：

```sql
-- 完整狀態檢查
SELECT 
  u.email,
  u.name,
  u."isAdmin",
  CASE WHEN uc.password IS NOT NULL THEN '✅' ELSE '❌' END as has_password,
  CASE WHEN hm.household_id IS NOT NULL THEN '✅' ELSE '❌' END as has_household,
  h.name as household_name
FROM users u
LEFT JOIN user_credentials uc ON u.id = uc.user_id
LEFT JOIN household_members hm ON u.id = hm.user_id
LEFT JOIN households h ON hm.household_id = h.id
WHERE u.email IN ('sean.li@smtengo.com', 'demo@smartwarehouse.com')
ORDER BY u.email;
```

### 預期結果

應該看到：
- ✅ `has_password` = ✅ (兩個用戶都有)
- ✅ `has_household` = ✅ (兩個用戶都有)
- ✅ `household_name` = 顯示 household 名稱

## 步驟 2: 測試本地環境登入

### 測試 1: sean.li@smtengo.com

1. **訪問本地服務器**
   - `http://localhost:3000` 或 `http://10.68.1.183:3000`

2. **嘗試登入**
   - Email: `sean.li@smtengo.com`
   - Password: `Smtengo1324!`
   - Household ID: (可選)

3. **檢查結果**
   - ✅ 成功登入 → 應該看到儀表板
   - ❌ 失敗 → 查看瀏覽器控制台和服務器日誌

### 測試 2: demo@smartwarehouse.com

1. **登出**（如果已登入）

2. **嘗試登入**
   - Email: `demo@smartwarehouse.com`
   - Password: `demo123`
   - Household ID: (可選)

3. **檢查結果**
   - ✅ 成功登入 → 應該看到儀表板
   - ❌ 失敗 → 查看錯誤信息

## 步驟 3: 測試生產環境登入

### 測試 1: 生產環境登入

1. **訪問生產環境**
   - https://smart-warehouse-five.vercel.app/auth/signin

2. **嘗試登入**
   - 使用相同的憑證測試

3. **檢查結果**
   - ✅ 成功登入 → 確認生產環境同步
   - ❌ 失敗 → 檢查 Vercel 環境變數

## 步驟 4: 檢查服務器日誌

### 本地環境日誌

查看終端中的服務器輸出，應該看到：

**成功情況**:
```
[auth] authorize: success for sean.li@smtengo.com isAdmin=true
```

**失敗情況**:
```
[auth] authorize: user not found sean.li@smtengo.com
[auth] authorize: invalid password for sean.li@smtengo.com
[auth] authorize: missing email or password
```

### 生產環境日誌

在 Vercel Dashboard 查看：
1. 選擇項目：`smart-warehouse-five`
2. 進入 "Functions" 或 "Logs"
3. 查看認證相關日誌

## 步驟 5: 測試功能

登入成功後，測試以下功能：

### ✅ 基本功能
- [ ] 查看儀表板
- [ ] 查看物品列表
- [ ] 查看房間/櫥櫃
- [ ] 查看分類

### ✅ 語音功能（新功能）
- [ ] 選擇一個物品
- [ ] 調整數量（減少）
- [ ] 錄製語音評論
- [ ] 查看歷史記錄中的轉錄文字

## 步驟 6: 驗證 iFLYTEK 功能

### 測試語音識別

1. **錄製語音評論**
   - 選擇物品 → 調整數量 → 錄製語音

2. **查看服務器日誌**
   - 應該看到：`Attempting transcription with iFLYTEK...`
   - 成功：`✓ iFLYTEK transcription successful`
   - 失敗並切換：`iFLYTEK transcription failed or empty, falling back to OpenAI...`

3. **檢查轉錄結果**
   - 查看物品歷史記錄
   - 應該看到語音播放按鈕和轉錄文字

## 常見問題排查

### 問題 1: 仍然無法登入

**檢查**:
1. 確認 SQL 腳本已成功運行
2. 檢查 Supabase 中的用戶和憑證是否存在
3. 查看服務器日誌的具體錯誤信息

### 問題 2: 可以登入但看不到數據

**檢查**:
1. 確認用戶有 household 成員資格
2. 檢查 household 中是否有物品
3. 確認用戶角色（OWNER/MEMBER）

### 問題 3: 語音識別不工作

**檢查**:
1. 確認 iFLYTEK 環境變數已配置
2. 查看服務器日誌中的錯誤信息
3. 確認是否自動切換到 OpenAI

## 驗證檢查清單

- [ ] SQL 腳本已成功運行
- [ ] Supabase 驗證查詢顯示 ✅
- [ ] 本地環境可以登入
- [ ] 生產環境可以登入
- [ ] 可以查看和操作數據
- [ ] 語音識別功能正常（如果測試）
- [ ] 轉錄文字顯示正常（如果測試）

## 完成標準

✅ **修復成功** 如果：
1. 兩個用戶都能在本地和生產環境登入
2. 可以查看和操作數據
3. 語音功能正常（如果測試）

❌ **需要進一步調試** 如果：
1. 仍然無法登入
2. 可以登入但看不到數據
3. 出現其他錯誤

## 下一步

驗證完成後：
1. ✅ 可以開始使用應用
2. ✅ 測試 iFLYTEK 語音識別功能
3. ✅ 在生產環境部署新功能

