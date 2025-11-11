# 🔐 快速修復登入問題

## 問題
無法使用以下帳號登入：
- `sean.li@smtengo.com` / `Smtengo1324!`
- `demo@smartwarehouse.com` / `demo123`

## ✅ 解決方案

### 方法 1: 使用現有腳本（推薦）

腳本已更新，包含兩個用戶。運行：

```bash
node scripts/setup-user-credentials.js
```

**注意**：如果遇到數據庫連接錯誤，使用下面的方法 2。

### 方法 2: 在 Supabase Dashboard 運行 SQL

1. **訪問 Supabase Dashboard**
   - https://supabase.com/dashboard
   - 選擇項目：`ddvjegjzxjaetpaptjlo`

2. **打開 SQL Editor**
   - 點擊左側 "SQL Editor"
   - 點擊 "New Query"

3. **運行以下 SQL**（需要先生成密碼哈希）：

```sql
-- 首先生成密碼哈希（使用 Node.js）
-- 運行: node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Smtengo1324!', 12).then(h => console.log('Sean:', h)); bcrypt.hash('demo123', 12).then(h => console.log('Demo:', h));"

-- 然後使用生成的哈希更新憑證
-- 替換 YOUR_SEAN_HASH 和 YOUR_DEMO_HASH

UPDATE user_credentials 
SET password = 'YOUR_SEAN_HASH'
WHERE user_id = (SELECT id FROM users WHERE email = 'sean.li@smtengo.com');

UPDATE user_credentials 
SET password = 'YOUR_DEMO_HASH'
WHERE user_id = (SELECT id FROM users WHERE email = 'demo@smartwarehouse.com');
```

### 方法 3: 使用 API 端點

如果已登入為管理員，可以使用：

```bash
curl -X POST https://smart-warehouse-five.vercel.app/api/admin/setup-credentials
```

## 📋 測試登入

修復後，嘗試登入：

1. **sean.li@smtengo.com** / **Smtengo1324!**
2. **demo@smartwarehouse.com** / **demo123**

## 🔍 檢查問題

如果仍然無法登入，檢查服務器日誌：

- `[auth] authorize: user not found` → 用戶不存在
- `[auth] authorize: invalid password` → 密碼錯誤
- `[auth] authorize: missing email or password` → 輸入錯誤

## ⚠️ 重要提示

1. **密碼必須是 bcrypt 哈希**（12 rounds）
2. **用戶必須存在於 `users` 表**
3. **憑證必須存在於 `user_credentials` 表**
4. **用戶必須有 household 成員資格**

## 📝 已更新的文件

- ✅ `scripts/setup-user-credentials.js` - 已添加 `sean.li@smtengo.com`
- ✅ `scripts/fix-user-credentials.js` - 新的修復腳本
- ✅ `fix-login-credentials.sql` - SQL 腳本
- ✅ `LOGIN_CREDENTIALS_FIX.md` - 詳細說明

