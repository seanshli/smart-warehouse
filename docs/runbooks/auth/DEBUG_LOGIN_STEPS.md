# 🔍 登入問題調試步驟

## 步驟 1: 在 Supabase 中檢查實際數據

運行 `debug-login-issue.sql` 來檢查：

### 關鍵檢查點：

1. **用戶是否存在？**
   ```sql
   SELECT id, email FROM users 
   WHERE email IN ('sean.li@smtengo.com', 'demo@smartwarehouse.com');
   ```

2. **憑證是否存在？**
   ```sql
   SELECT u.email, uc.password IS NOT NULL as has_password
   FROM users u
   LEFT JOIN user_credentials uc ON u.id = uc.user_id
   WHERE u.email IN ('sean.li@smtengo.com', 'demo@smartwarehouse.com');
   ```

3. **密碼格式是否正確？**
   - 應該是 bcrypt 格式：`$2a$12$...`
   - 長度應該約 60 字符

## 步驟 2: 使用 API 調試端點

### 測試 API 端點

在瀏覽器或使用 curl：

```bash
# 測試 sean.li@smtengo.com
curl -X POST http://localhost:3000/api/debug/auth-test \
  -H "Content-Type: application/json" \
  -d '{"email":"sean.li@smtengo.com","password":"Smtengo1324!"}'

# 測試 demo@smartwarehouse.com
curl -X POST http://localhost:3000/api/debug/auth-test \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@smartwarehouse.com","password":"demo123"}'
```

### 預期響應

**成功情況**:
```json
{
  "email": "sean.li@smtengo.com",
  "userFound": true,
  "hasCredentials": true,
  "passwordVerification": true,
  "error": null
}
```

**失敗情況** - 檢查具體錯誤：
- `userFound: false` → 用戶不存在
- `hasCredentials: false` → 沒有憑證記錄
- `passwordVerification: false` → 密碼不匹配

## 步驟 3: 檢查服務器日誌

查看本地服務器終端輸出，應該看到：

**成功**:
```
[auth] authorize: success for sean.li@smtengo.com isAdmin=true
```

**失敗** - 檢查具體錯誤：
- `[auth] authorize: user not found` → 用戶不存在
- `[auth] authorize: invalid password` → 密碼錯誤
- `[auth] authorize: missing email or password` → 輸入問題

## 步驟 4: 重新生成並插入密碼哈希

如果數據有問題，重新運行以下 SQL：

```sql
-- 重新生成哈希（使用 Node.js）
-- node generate-password-hashes.js

-- 然後手動更新（使用最新生成的哈希）
UPDATE user_credentials 
SET password = '$2a$12$YOUR_NEW_HASH_HERE'
WHERE user_id = (SELECT id FROM users WHERE email = 'sean.li@smtengo.com');
```

## 常見問題

### 問題 1: 用戶不存在
**解決**: 在 Supabase 中創建用戶

### 問題 2: 憑證不存在
**解決**: 運行憑證插入 SQL

### 問題 3: 密碼格式錯誤
**解決**: 確保使用正確的 bcrypt 哈希（60 字符，$2a$12$ 開頭）

### 問題 4: 表名或字段名不匹配
**解決**: 檢查 Prisma schema 中的實際表名和字段名

## 快速修復 SQL

如果所有檢查都失敗，運行這個完整的修復腳本：

```sql
-- 完整的修復（確保用戶、憑證、household 都存在）
-- 使用 fix-users-in-production.sql 的全部內容
```

