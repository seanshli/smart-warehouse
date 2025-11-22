# 数据库迁移指南
## Database Migration Guide

**最后更新**: 2025-11-21

---

## 🎯 迁移目标

添加 Community 和 Building 层级结构到数据库：
- Community (社区)
- Building (建筑)
- CommunityMember (社区成员)
- WorkingGroup (工作组)
- WorkingGroupMember (工作组成员)
- WorkingGroupPermission (工作组权限)

---

## 📋 迁移方法

### 方法 1: 直接在 Supabase Dashboard 执行（推荐）

**优点**:
- ✅ 不需要配置环境变量
- ✅ 可以直接看到执行结果
- ✅ 更灵活，可以逐步执行

**步骤**:

1. **打开 Supabase Dashboard**
   - 登录 https://supabase.com/dashboard
   - 选择你的项目

2. **进入 SQL Editor**
   - 点击左侧菜单 "SQL Editor"
   - 点击 "New query"

3. **执行迁移脚本**
   - 打开 `scripts/migrate-community-building-supabase.sql`
   - 复制全部内容
   - 粘贴到 SQL Editor
   - 点击 "Run" 执行

4. **验证迁移**
   - 检查执行结果
   - 确认所有表都已创建
   - 检查索引是否创建成功

5. **生成 Prisma Client**
   ```bash
   npx prisma generate
   ```

---

### 方法 2: 使用 Prisma 迁移

**前提条件**:
- 需要设置 `DATABASE_URL` 环境变量

**步骤**:

1. **设置环境变量**
   ```bash
   # 临时设置（仅当前终端会话）
   export DATABASE_URL='your-supabase-connection-string'
   
   # 或添加到 .env 文件（Prisma 会读取）
   echo "DATABASE_URL=your-supabase-connection-string" >> .env
   ```

2. **运行迁移**
   ```bash
   npx prisma migrate dev --name add_community_building_hierarchy
   ```

3. **生成 Prisma Client**
   ```bash
   npx prisma generate
   ```

---

## 🔍 验证迁移

### 在 Supabase Dashboard 中验证

1. **检查表是否创建**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN (
     'communities',
     'buildings',
     'community_members',
     'working_groups',
     'working_group_members',
     'working_group_permissions'
   );
   ```

2. **检查 building_id 列是否添加**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'households' 
   AND column_name = 'building_id';
   ```

3. **检查索引是否创建**
   ```sql
   SELECT indexname 
   FROM pg_indexes 
   WHERE tablename IN (
     'communities',
     'buildings',
     'households',
     'community_members',
     'working_groups',
     'working_group_members',
     'working_group_permissions'
   );
   ```

### 在代码中验证

```bash
# 生成 Prisma Client
npx prisma generate

# 验证 schema
npx prisma validate
```

---

## ⚠️ 注意事项

1. **向后兼容性**
   - `households.building_id` 是可选的（nullable）
   - 现有 Household 数据不受影响
   - 可以逐步迁移数据

2. **数据完整性**
   - 删除 Community 时会级联删除 Building
   - 删除 Building 时会将 Household.buildingId 设置为 null（不删除 Household）

3. **唯一约束**
   - `community_members`: (user_id, community_id) 唯一
   - `working_group_members`: (working_group_id, user_id) 唯一
   - `working_group_permissions`: (working_group_id, permission, scope, scope_id) 唯一

4. **索引**
   - 所有外键都有索引
   - 查询性能已优化

---

## 🔄 回滚（如果需要）

如果需要回滚迁移：

```sql
-- 删除表（注意：会删除所有数据）
DROP TABLE IF EXISTS working_group_permissions CASCADE;
DROP TABLE IF EXISTS working_group_members CASCADE;
DROP TABLE IF EXISTS working_groups CASCADE;
DROP TABLE IF EXISTS community_members CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;
DROP TABLE IF EXISTS communities CASCADE;

-- 删除 building_id 列（如果已添加）
ALTER TABLE households DROP COLUMN IF EXISTS building_id;
```

---

## 📝 迁移后步骤

1. **生成 Prisma Client**
   ```bash
   npx prisma generate
   ```

2. **验证 API**
   - 测试 Community API
   - 测试 Building API
   - 测试 Working Group API

3. **更新现有数据（可选）**
   - 创建默认 Community
   - 创建默认 Building
   - 将现有 Household 关联到 Building

---

## 🆘 故障排除

### 问题: 表已存在错误

**解决方案**: 脚本使用 `IF NOT EXISTS`，可以安全地重复执行。

### 问题: 外键约束错误

**解决方案**: 确保先创建被引用的表（communities 在 buildings 之前）。

### 问题: Prisma Client 未更新

**解决方案**: 运行 `npx prisma generate` 重新生成客户端。

---

## 📚 相关文件

- `scripts/migrate-community-building-supabase.sql` - Supabase SQL 脚本
- `prisma/schema.prisma` - Prisma schema
- `docs/COMMUNITY_BUILDING_ARCHITECTURE.md` - 架构设计文档

---

**推荐使用方法 1（直接在 Supabase Dashboard 执行）**，更简单直接！

