# 🔧 登入問題排查指南

## 當前狀態
- ✅ 密碼哈希驗證正確（已測試）
- ❌ 仍然無法登入
- ⚠️ 需要檢查實際數據

## 立即檢查步驟

### 步驟 1: 在 Supabase 檢查數據

運行以下 SQL 查詢：

```sql
-- 完整狀態檢查
SELECT 
  u.email,
  u.id as user_id,
  uc.user_id as credential_user_id,
  CASE WHEN uc.password IS NOT NULL THEN '✅' ELSE '❌' END as has_password,
  LENGTH(uc.password) as password_length,
  LEFT(uc.password, 7) as password_format,
  CASE WHEN hm.household_id IS NOT NULL THEN '✅' ELSE '❌' END as has_household
FROM users u
LEFT JOIN user_credentials uc ON u.id = uc.user_id
LEFT JOIN household_members hm ON u.id = hm.user_id
WHERE u.email IN ('sean.li@smtengo.com', 'demo@smartwarehouse.com');
```

**預期結果**:
- `has_password` = ✅
- `password_length` = 60
- `password_format` = `$2a$12$`
- `has_household` = ✅

### 步驟 2: 如果數據不正確，運行快速修復

在 Supabase SQL Editor 運行 `quick-fix-credentials.sql`

這個腳本會：
1. 刪除現有憑證
2. 重新插入正確的哈希
3. 驗證結果

### 步驟 3: 測試登入並查看日誌

1. **嘗試登入**
   - 本地：`http://localhost:3000`
   - 生產：`https://smart-warehouse-five.vercel.app`

2. **查看服務器日誌**
   - 本地：查看終端輸出
   - 生產：查看 Vercel Dashboard → Functions → Logs

3. **檢查錯誤信息**
   - `[auth] authorize: user not found` → 用戶不存在
   - `[auth] authorize: invalid password` → 密碼錯誤
   - `[auth] authorize: missing email or password` → 輸入問題

### 步驟 4: 使用 API 調試端點

如果服務器正在運行，測試：

```bash
# 測試 sean.li@smtengo.com
curl -X POST http://localhost:3000/api/debug/auth-test \
  -H "Content-Type: application/json" \
  -d '{"email":"sean.li@smtengo.com","password":"Smtengo1324!"}'
```

**預期響應**:
```json
{
  "email": "sean.li@smtengo.com",
  "userFound": true,
  "hasCredentials": true,
  "passwordVerification": true,
  "error": null
}
```

## 可能的原因

### 原因 1: SQL 腳本未正確執行
**解決**: 在 Supabase 重新運行 `quick-fix-credentials.sql`

### 原因 2: 表名或字段名不匹配
**解決**: 檢查 `user_credentials` 表的實際結構

### 原因 3: 用戶不存在
**解決**: 檢查 `users` 表中是否有這些用戶

### 原因 4: 密碼哈希格式錯誤
**解決**: 確保使用 bcrypt 格式（$2a$12$...）

## 緊急修復方案

如果以上都不工作，直接手動更新：

```sql
-- 手動更新（替換 YOUR_USER_ID）
UPDATE user_credentials 
SET password = '$2a$12$gJazZWyACNpheP989Ngch.FWm1bH40gtC8.PjtsPbMV8CB3zjQShe'
WHERE user_id = 'YOUR_USER_ID';
```

## 請提供的信息

如果仍然失敗，請提供：

1. **Supabase 查詢結果**（步驟 1 的結果）
2. **服務器日誌**（具體的錯誤信息）
3. **API 調試響應**（如果有）
4. **瀏覽器控制台錯誤**（如果有）

這樣我可以更準確地診斷問題。

