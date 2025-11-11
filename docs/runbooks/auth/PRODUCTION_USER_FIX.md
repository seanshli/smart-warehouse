# 🔐 生產環境用戶憑證修復

## 數據庫同步狀態

### ✅ 確認：本地和生產使用同一個數據庫

根據 `DATABASE_SYNC_STATUS.md`：
- **本地開發**: 連接到 Supabase (`db.ddvjegjzxjaetpaptjlo.supabase.co`)
- **Vercel 生產**: 連接到相同的 Supabase 數據庫
- **iOS/Android App**: 通過 Vercel → Supabase

**這意味著**：
- ✅ 用戶數據完全同步
- ✅ 在生產環境修復憑證 = 本地也會修復
- ✅ 在本地修復憑證 = 生產環境也會修復

## 修復方法

由於兩個環境使用同一個數據庫，**只需修復一次**即可。

### 方法 1: 在 Supabase Dashboard 直接修復（推薦）

1. **訪問 Supabase Dashboard**
   - https://supabase.com/dashboard
   - 選擇項目：`ddvjegjzxjaetpaptjlo`

2. **打開 SQL Editor**
   - 點擊左側 "SQL Editor"
   - 點擊 "New Query"

3. **運行以下 SQL**（創建或更新用戶和憑證）：

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

-- 生成密碼哈希並更新憑證
-- 注意：需要先運行 Node.js 腳本生成正確的 bcrypt 哈希
-- 或使用以下臨時方法
```

### 方法 2: 使用 Node.js 生成正確的哈希

創建臨時腳本 `generate-hashes.js`:

```javascript
const bcrypt = require('bcryptjs');

async function generate() {
  const sean = await bcrypt.hash('Smtengo1324!', 12);
  const demo = await bcrypt.hash('demo123', 12);
  console.log('Sean hash:', sean);
  console.log('Demo hash:', demo);
}

generate();
```

運行後，在 Supabase 中使用生成的哈希：

```sql
-- 替換 YOUR_SEAN_HASH 和 YOUR_DEMO_HASH
UPDATE user_credentials 
SET password = 'YOUR_SEAN_HASH'
WHERE user_id = (SELECT id FROM users WHERE email = 'sean.li@smtengo.com');

UPDATE user_credentials 
SET password = 'YOUR_DEMO_HASH'
WHERE user_id = (SELECT id FROM users WHERE email = 'demo@smartwarehouse.com');
```

### 方法 3: 使用生產環境 API（如果已登入）

如果能夠以管理員身份登入生產環境，可以使用：

```
POST https://smart-warehouse-five.vercel.app/api/admin/setup-credentials
```

## 驗證修復

修復後，可以在**任何環境**測試登入：

1. **本地環境**: `http://localhost:3000` 或 `http://10.68.1.183:3000`
2. **生產環境**: `https://smart-warehouse-five.vercel.app`

使用相同的憑證：
- `sean.li@smtengo.com` / `Smtengo1324!`
- `demo@smartwarehouse.com` / `demo123`

## 檢查用戶狀態

在 Supabase SQL Editor 中運行：

```sql
-- 檢查用戶是否存在
SELECT id, email, name, "isAdmin" 
FROM users 
WHERE email IN ('sean.li@smtengo.com', 'demo@smartwarehouse.com');

-- 檢查憑證是否存在
SELECT u.email, uc.password IS NOT NULL as has_password
FROM users u
LEFT JOIN user_credentials uc ON u.id = uc.user_id
WHERE u.email IN ('sean.li@smtengo.com', 'demo@smartwarehouse.com');

-- 檢查 household 成員資格
SELECT u.email, h.name as household_name, hm.role
FROM users u
JOIN household_members hm ON u.id = hm.user_id
JOIN households h ON hm.household_id = h.id
WHERE u.email IN ('sean.li@smtengo.com', 'demo@smartwarehouse.com');
```

## 重要提示

1. **只需修復一次** - 因為使用同一個數據庫
2. **在所有環境生效** - 本地、生產、移動應用都會同步
3. **密碼必須是 bcrypt 哈希** - 不能使用明文
4. **確保用戶有 household** - 否則無法使用應用

## 下一步

建議在 Supabase Dashboard 直接修復，這樣：
- ✅ 立即生效
- ✅ 所有環境同步
- ✅ 不需要部署

