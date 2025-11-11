# 🔐 登入憑證修復指南

## 問題
無法使用以下帳號登入：
- `sean.li@smtengo.com` / `Smtengo1324!`
- `demo@smartwarehouse.com` / `demo123`

## 解決方案

### 方法 1: 使用 API 端點（推薦）

1. **訪問 API 端點**（需要先登入為管理員）：
   ```
   POST /api/admin/setup-credentials
   ```

2. **或使用現有腳本**：
   ```bash
   node scripts/setup-user-credentials.js
   ```

### 方法 2: 直接在 Supabase 中運行 SQL

1. **登入 Supabase Dashboard**
   - 訪問：https://supabase.com/dashboard
   - 選擇項目：`ddvjegjzxjaetpaptjlo`

2. **打開 SQL Editor**
   - 點擊左側 "SQL Editor"
   - 點擊 "New Query"

3. **運行以下 SQL**：

```sql
-- 創建或更新用戶
INSERT INTO users (email, name, "isAdmin", "created_at", "updated_at")
VALUES 
  ('sean.li@smtengo.com', 'Sean Li', true, NOW(), NOW()),
  ('demo@smartwarehouse.com', 'Demo User', false, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  "isAdmin" = EXCLUDED."isAdmin",
  "updated_at" = NOW();

-- 注意：需要生成正確的 bcrypt 密碼哈希
-- 可以使用以下 Node.js 腳本生成：
```

### 方法 3: 使用 Node.js 腳本生成密碼哈希

創建臨時腳本生成正確的哈希：

```javascript
const bcrypt = require('bcryptjs');

async function generateHashes() {
  const seanHash = await bcrypt.hash('Smtengo1324!', 12);
  const demoHash = await bcrypt.hash('demo123', 12);
  
  console.log('sean.li@smtengo.com:', seanHash);
  console.log('demo@smartwarehouse.com:', demoHash);
}

generateHashes();
```

然後在 Supabase 中使用生成的哈希：

```sql
-- 使用上面生成的哈希值替換 YOUR_HASH_HERE
UPDATE user_credentials 
SET password = 'YOUR_HASH_HERE'
WHERE user_id = (SELECT id FROM users WHERE email = 'sean.li@smtengo.com');
```

## 快速修復步驟

### 步驟 1: 檢查用戶是否存在

在 Supabase SQL Editor 中運行：

```sql
SELECT id, email, name, "isAdmin" 
FROM users 
WHERE email IN ('sean.li@smtengo.com', 'demo@smartwarehouse.com');
```

### 步驟 2: 檢查憑證是否存在

```sql
SELECT uc.user_id, u.email, uc.password IS NOT NULL as has_password
FROM user_credentials uc
RIGHT JOIN users u ON uc.user_id = u.id
WHERE u.email IN ('sean.li@smtengo.com', 'demo@smartwarehouse.com');
```

### 步驟 3: 使用現有腳本

如果數據庫連接正常，運行：

```bash
node scripts/setup-user-credentials.js
```

這個腳本會：
- ✅ 創建用戶（如果不存在）
- ✅ 生成正確的 bcrypt 哈希
- ✅ 設置憑證
- ✅ 創建 household（如果不存在）

## 測試登入

修復後，嘗試登入：

1. **sean.li@smtengo.com** / **Smtengo1324!**
2. **demo@smartwarehouse.com** / **demo123**

## 如果仍然失敗

檢查服務器日誌中的錯誤信息：
- `[auth] authorize: user not found` - 用戶不存在
- `[auth] authorize: invalid password` - 密碼錯誤
- `[auth] authorize: missing email or password` - 輸入錯誤

## 注意事項

⚠️ **密碼哈希**：
- 必須使用 bcrypt 哈希（12 rounds）
- 不能使用明文密碼
- 哈希必須與應用程序中的驗證邏輯匹配

⚠️ **用戶和憑證**：
- 用戶必須存在於 `users` 表
- 憑證必須存在於 `user_credentials` 表
- 兩者通過 `user_id` 關聯

