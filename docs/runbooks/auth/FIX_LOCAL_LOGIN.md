# 🔧 修復本地登入問題

## 問題
- ✅ 生產環境可以登入
- ❌ 本地環境無法登入

## 可能的原因

### 1. Prisma 客戶端緩存問題
本地開發環境可能使用了舊的 Prisma 客戶端緩存。

### 2. 環境變量配置問題
本地 `.env.local` 可能缺少必要的配置。

### 3. 數據庫連接問題
本地環境可能無法正確連接到 Supabase。

## 解決步驟

### 步驟 1: 清除 Prisma 客戶端緩存並重新生成

```bash
# 停止開發服務器（如果正在運行）
# Ctrl+C

# 清除 Prisma 客戶端
rm -rf node_modules/.prisma
rm -rf .next

# 重新生成 Prisma 客戶端
npx prisma generate

# 重新啟動開發服務器
npm run dev
```

### 步驟 2: 檢查環境變量

確保 `.env.local` 包含：

```env
# 數據庫連接（必須與生產環境相同）
DATABASE_URL="postgresql://postgres:Smtengo1324@db.ddvjegjzxjaetpaptjlo.supabase.co:5432/postgres"

# NextAuth 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"  # 必須與生產環境相同或重新設置

# 其他配置...
```

### 步驟 3: 驗證數據庫連接

運行測試端點（如果服務器正在運行）：

```bash
curl http://localhost:3000/api/debug/auth-test \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"sean.li@smtengo.com","password":"Smtengo1324!"}'
```

### 步驟 4: 檢查服務器日誌

查看終端輸出中的 `[auth]` 日誌，應該會看到：
- `[auth] authorize: user not found` → 用戶查找問題
- `[auth] authorize: invalid password` → 密碼驗證問題
- `[auth] authorize: success` → 成功（但可能被其他問題阻止）

### 步驟 5: 如果仍然失敗，檢查 NEXTAUTH_SECRET

如果 `NEXTAUTH_SECRET` 與生產環境不同，可能會導致會話問題。

**解決方案 1**: 使用與生產環境相同的 `NEXTAUTH_SECRET`

**解決方案 2**: 清除瀏覽器緩存和 cookies，然後重試

## 快速修復腳本

運行以下命令：

```bash
# 1. 停止服務器
# 按 Ctrl+C

# 2. 清除緩存
rm -rf node_modules/.prisma .next

# 3. 重新生成
npx prisma generate

# 4. 重新啟動
npm run dev
```

## 調試端點

如果服務器正在運行，測試：

```bash
# 測試認證流程
curl -X POST http://localhost:3000/api/debug/auth-test \
  -H "Content-Type: application/json" \
  -d '{"email":"sean.li@smtengo.com","password":"Smtengo1324!"}'
```

預期響應：
```json
{
  "email": "sean.li@smtengo.com",
  "userFound": true,
  "hasCredentials": true,
  "passwordVerification": true,
  "error": null
}
```

