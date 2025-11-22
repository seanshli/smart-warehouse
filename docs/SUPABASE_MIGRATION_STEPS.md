# Supabase 数据库迁移步骤
## Database Migration Steps for Supabase

**最后更新**: 2025-11-21

---

## 🎯 目标

在 Supabase 数据库中创建 Community 和 Building 层级结构所需的所有表、列、索引和约束。

---

## 📋 执行步骤

### 步骤 1: 打开 Supabase Dashboard

1. 登录 https://supabase.com/dashboard
2. 选择你的项目
3. 点击左侧菜单 **"SQL Editor"**
4. 点击 **"New query"** 创建新查询

---

### 步骤 2: 执行迁移 SQL

1. **打开文件**: `scripts/migrate-community-building-supabase.sql`
2. **复制全部内容** (138 行)
3. **粘贴到 SQL Editor**
4. **点击 "Run" 执行**

**预期结果**:
- ✅ 所有表创建成功
- ✅ 所有索引创建成功
- ✅ 所有约束创建成功
- ✅ 显示验证查询结果（6 个表的记录数，应该都是 0）

**如果遇到错误**:
- 检查是否已经存在表（脚本使用 `IF NOT EXISTS`，可以安全重复执行）
- 检查外键约束（确保先创建被引用的表）

---

### 步骤 3: 验证迁移（可选但推荐）

1. **打开文件**: `scripts/verify-community-building-migration.sql`
2. **复制全部内容**
3. **粘贴到 SQL Editor**
4. **点击 "Run" 执行**

**预期结果**:
- ✅ 所有表都存在
- ✅ `households.building_id` 列存在
- ✅ 所有外键约束存在
- ✅ 所有索引存在
- ✅ 所有唯一约束存在

---

## 📝 SQL 脚本内容概览

### 迁移脚本 (`migrate-community-building-supabase.sql`)

创建以下表：

1. **communities** - 社区表
   - 基本信息（名称、描述、地址等）
   - 邀请码
   - 地理位置信息

2. **buildings** - 建筑表
   - 关联到社区
   - 建筑信息（楼层数、单元数等）

3. **community_members** - 社区成员表
   - 用户与社区的关联
   - 角色（ADMIN, MANAGER, MEMBER, VIEWER）

4. **working_groups** - 工作组表
   - 关联到社区
   - 工作组类型和描述

5. **working_group_members** - 工作组成员表
   - 用户与工作组的关联

6. **working_group_permissions** - 工作组权限表
   - 权限类型和范围

**修改现有表**:
- 在 `households` 表中添加 `building_id` 列（可选，向后兼容）

**创建索引**:
- 所有外键都有索引
- 优化查询性能

---

## ✅ 验证清单

执行迁移后，检查以下项：

### 1. 表是否存在

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

**预期**: 返回 6 行

---

### 2. building_id 列是否存在

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'households' 
AND column_name = 'building_id';
```

**预期**: 返回 1 行，`data_type` 为 `text`

---

### 3. 外键约束是否存在

```sql
SELECT 
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name IN (
  'buildings',
  'community_members',
  'working_groups',
  'working_group_members',
  'working_group_permissions',
  'households'
);
```

**预期**: 返回多个外键约束

---

## 🔄 迁移后步骤

### 1. 生成 Prisma Client

在本地运行：

```bash
npx prisma generate
```

### 2. 测试 API

访问以下端点测试功能：

- `GET /api/community` - 获取社区列表
- `POST /api/community` - 创建社区
- `GET /api/community/[id]` - 获取社区详情

### 3. 测试 UI

访问以下页面：

- `/community` - 社区列表页
- `/community/[id]` - 社区详情页

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

4. **安全执行**
   - 脚本使用 `IF NOT EXISTS`，可以安全地重复执行
   - 不会删除或修改现有数据

---

## 🆘 故障排除

### 问题: 表已存在错误

**解决方案**: 脚本使用 `IF NOT EXISTS`，可以安全地重复执行。

### 问题: 外键约束错误

**解决方案**: 确保先创建被引用的表（communities 在 buildings 之前）。

### 问题: 权限错误

**解决方案**: 确保使用有足够权限的数据库用户执行脚本。

---

## 📚 相关文件

- `scripts/migrate-community-building-supabase.sql` - 迁移 SQL 脚本
- `scripts/verify-community-building-migration.sql` - 验证 SQL 脚本
- `docs/DATABASE_MIGRATION_GUIDE.md` - 详细迁移指南
- `docs/MIGRATION_VERIFICATION_COMPLETE.md` - 验证报告

---

**执行完成后，Community 和 Building 功能就可以使用了！** ✅

