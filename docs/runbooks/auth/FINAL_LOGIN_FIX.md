# ✅ 最終登入憑證修復指南

## 確認：本地和生產使用同一個數據庫

✅ **數據庫同步狀態**：
- 本地開發：`db.ddvjegjzxjaetpaptjlo.supabase.co`
- Vercel 生產：`db.ddvjegjzxjaetpaptjlo.supabase.co`
- **完全同步** - 只需修復一次

## 🔧 修復步驟

### 步驟 1: 在 Supabase Dashboard 運行 SQL

1. **訪問 Supabase Dashboard**
   - https://supabase.com/dashboard
   - 選擇項目：`ddvjegjzxjaetpaptjlo`

2. **打開 SQL Editor**
   - 點擊左側 "SQL Editor"
   - 點擊 "New Query"

3. **運行 SQL 腳本**
   - 複製 `fix-users-in-production.sql` 的全部內容
   - 貼上到 SQL Editor
   - 點擊 "Run"

### 步驟 2: 驗證修復

運行驗證查詢：

```sql
SELECT 
  u.email,
  u.name,
  u."isAdmin",
  CASE WHEN uc.password IS NOT NULL THEN '✅ Has password' ELSE '❌ No password' END as password_status,
  CASE WHEN hm.household_id IS NOT NULL THEN '✅ Has household' ELSE '❌ No household' END as household_status
FROM users u
LEFT JOIN user_credentials uc ON u.id = uc.user_id
LEFT JOIN household_members hm ON u.id = hm.user_id
WHERE u.email IN ('sean.li@smtengo.com', 'demo@smartwarehouse.com');
```

### 步驟 3: 測試登入

修復後，可以在**任何環境**測試：

**本地環境**:
- `http://localhost:3000`
- `http://10.68.1.183:3000`

**生產環境**:
- `https://smart-warehouse-five.vercel.app`

**登入憑證**:
1. `sean.li@smtengo.com` / `Smtengo1324!`
2. `demo@smartwarehouse.com` / `demo123`

## 📋 已準備的文件

1. ✅ `fix-users-in-production.sql` - 完整的 SQL 修復腳本（已包含正確的密碼哈希）
2. ✅ `generate-password-hashes.js` - 密碼哈希生成腳本（已運行）
3. ✅ `PRODUCTION_USER_FIX.md` - 詳細說明文檔

## ✅ 密碼哈希（已生成）

- **sean.li@smtengo.com**: `$2a$12$gJazZWyACNpheP989Ngch.FWm1bH40gtC8.PjtsPbMV8CB3zjQShe`
- **demo@smartwarehouse.com**: `$2a$12$sveHtUfw3XxykjAfbQ.2Zunj0ALU5YxOZPtWTsDR3UszYBqhDwo.i`

這些哈希已經包含在 SQL 腳本中。

## 🎯 下一步

1. **在 Supabase Dashboard 運行 SQL 腳本**
2. **驗證憑證已設置**
3. **測試登入**（本地或生產環境都可以）

修復後，所有環境（本地、生產、移動應用）都能使用這些憑證登入！

