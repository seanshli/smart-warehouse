# 快速迁移指南
## Quick Migration Guide

## 🚨 问题 / Problem

Prisma migrate 命令运行时间过长（1.5+ 小时），可能的原因：
- 数据库连接慢
- 迁移过程复杂
- 网络问题

## ✅ 解决方案 / Solution

**直接使用 SQL 添加字段**，而不是使用 Prisma migrate。

### 方法 1: 使用 Supabase Dashboard（推荐）⭐

1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 运行以下 SQL：

```sql
-- 检查字段是否已存在，如果不存在则添加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'households' 
        AND column_name = 'tuya_home_id'
    ) THEN
        ALTER TABLE households 
        ADD COLUMN tuya_home_id TEXT UNIQUE;
        
        COMMENT ON COLUMN households.tuya_home_id IS 'Tuya Home ID (对应到 Tuya SDK 的 Home)';
        
        RAISE NOTICE 'Column tuya_home_id added successfully';
    ELSE
        RAISE NOTICE 'Column tuya_home_id already exists';
    END IF;
END $$;
```

4. 点击 "Run" 执行

### 方法 2: 使用 psql 命令行

```bash
# 从 .env.local 获取 DATABASE_URL
export DATABASE_URL=$(grep "^DATABASE_URL" .env.local | cut -d '=' -f2- | tr -d '"')

# 运行 SQL
psql "$DATABASE_URL" -f scripts/add-tuya-home-id-column.sql
```

### 方法 3: 使用 Prisma Studio（如果可用）

1. 运行 `npx prisma studio`
2. 手动添加字段（不推荐，容易出错）

---

## 📝 迁移后步骤 / After Migration

### 1. 更新 Prisma Client

```bash
npx prisma generate
```

### 2. 验证字段已添加

```bash
# 检查 schema
npx prisma db pull

# 或者直接查询数据库
npx prisma studio
```

### 3. 测试

- 运行应用
- 测试配网功能
- 验证 `tuyaHomeId` 字段是否正确保存

---

## 🔍 验证 / Verification

运行以下 SQL 验证字段已添加：

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'households' 
AND column_name = 'tuya_home_id';
```

应该返回：
```
column_name   | data_type | is_nullable
--------------|-----------|------------
tuya_home_id  | text      | YES
```

---

## ⚠️ 注意事项 / Notes

1. **备份数据库**（如果可能）
2. **字段是唯一的**（`UNIQUE` 约束）
3. **字段是可选的**（`NULL` 允许）
4. **不会影响现有数据**

---

## 🐛 如果遇到问题 / Troubleshooting

### 问题：字段已存在

**解决方案**: SQL 脚本会自动检查，如果已存在则跳过。

### 问题：权限错误

**解决方案**: 确保数据库用户有 `ALTER TABLE` 权限。

### 问题：唯一约束冲突

**解决方案**: 检查是否有重复的 `tuya_home_id` 值。

---

## 📚 相关文件 / Related Files

- `scripts/add-tuya-home-id-column.sql` - SQL 迁移脚本
- `prisma/schema.prisma` - Prisma Schema（已更新）
- `docs/TUYA_HOME_HOUSEHOLD_MAPPING.md` - 完整文档

