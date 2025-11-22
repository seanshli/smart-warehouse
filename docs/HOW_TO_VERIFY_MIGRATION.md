# 如何验证数据库迁移
## How to Verify Database Migration

**最后更新**: 2025-11-21

---

## ✅ 验证方法（按推荐顺序）

### 方法 1: 在 Supabase Dashboard 验证（最简单）

1. **打开 Supabase Dashboard**
   - 登录 https://supabase.com/dashboard
   - 选择你的项目
   - 点击左侧菜单 **"Table Editor"**

2. **检查表是否存在**
   - 查看左侧表列表，应该看到以下新表：
     - ✅ `communities`
     - ✅ `buildings`
     - ✅ `community_members`
     - ✅ `working_groups`
     - ✅ `working_group_members`
     - ✅ `working_group_permissions`

3. **检查 households 表**
   - 点击 `households` 表
   - 查看列，应该看到 `building_id` 列（类型：text，可为空）

4. **运行验证 SQL**（可选但推荐）
   - 打开 **"SQL Editor"**
   - 运行 `scripts/verify-community-building-migration.sql`
   - 检查所有验证项都显示 ✅

---

### 方法 2: 通过 API 测试（如果应用正在运行）

#### 测试 1: 获取社区列表

```bash
# 需要先登录获取 session token
curl http://localhost:3000/api/community \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**预期结果**:
- ✅ 返回 200 状态码
- ✅ 返回 JSON: `{ "communities": [] }`（空数组是正常的，因为还没有创建社区）

**如果失败**:
- ❌ 500 错误：可能是数据库连接问题或表不存在
- ❌ 401 错误：需要先登录

#### 测试 2: 创建社区

```bash
curl -X POST http://localhost:3000/api/community \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "name": "Test Community",
    "description": "Test Description"
  }'
```

**预期结果**:
- ✅ 返回 201 状态码
- ✅ 返回创建的社区信息（包含 id, name 等）

**如果失败**:
- ❌ 500 错误：可能是表不存在或外键约束问题
- ❌ 400 错误：检查请求数据格式

---

### 方法 3: 通过 UI 测试（如果应用正在运行）

1. **访问社区页面**
   - 打开浏览器访问: `http://localhost:3000/community`
   - 或生产环境: `https://your-domain.com/community`

2. **检查页面是否正常加载**
   - ✅ 页面正常显示（即使没有社区，也应该显示空状态）
   - ❌ 如果显示错误或 500，可能是数据库问题

3. **尝试创建社区**
   - 点击 "创建社区" 按钮
   - 填写表单并提交
   - ✅ 如果成功创建，说明迁移正确
   - ❌ 如果失败，检查浏览器控制台错误

---

### 方法 4: 在 Supabase Dashboard 运行验证 SQL

1. **打开 SQL Editor**
   - 在 Supabase Dashboard 中点击 **"SQL Editor"**
   - 点击 **"New query"**

2. **运行验证脚本**
   - 打开文件: `scripts/verify-community-building-migration.sql`
   - 复制全部内容
   - 粘贴到 SQL Editor
   - 点击 **"Run"**

3. **检查结果**
   - 应该看到多个查询结果：
     - ✅ Table Check: 所有表都存在
     - ✅ Column Check: `households.building_id` 存在
     - ✅ Foreign Key Check: 所有外键约束存在
     - ✅ Index Check: 所有索引存在
     - ✅ Unique Constraint Check: 所有唯一约束存在
     - ✅ Record Count: 所有新表记录数为 0（正常）

---

## 📋 验证清单

### 数据库结构 ✅

- [ ] `communities` 表存在
- [ ] `buildings` 表存在
- [ ] `community_members` 表存在
- [ ] `working_groups` 表存在
- [ ] `working_group_members` 表存在
- [ ] `working_group_permissions` 表存在
- [ ] `households.building_id` 列存在

### 功能测试 ✅

- [ ] 可以访问 `/community` 页面
- [ ] 可以创建社区（通过 UI 或 API）
- [ ] 可以查看社区列表
- [ ] 可以查看社区详情
- [ ] 可以创建建筑
- [ ] 可以查看建筑列表

---

## 🔍 快速检查 SQL（在 Supabase Dashboard 运行）

```sql
-- 快速检查所有表是否存在
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
)
ORDER BY table_name;
```

**预期结果**: 返回 6 行

```sql
-- 检查 building_id 列
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'households' 
AND column_name = 'building_id';
```

**预期结果**: 返回 1 行，`data_type` 为 `text`，`is_nullable` 为 `YES`

---

## ⚠️ 常见问题

### 问题: 表不存在

**检查**:
1. 在 Supabase Dashboard 的 Table Editor 中查看
2. 确认是否执行了迁移 SQL

**解决**:
- 重新执行 `scripts/migrate-community-building-supabase.sql`

### 问题: API 返回 500 错误

**检查**:
1. 查看服务器日志
2. 检查数据库连接
3. 确认 Prisma Client 已生成

**解决**:
- 运行 `npx prisma generate`
- 检查 `DATABASE_URL` 环境变量

### 问题: UI 显示错误

**检查**:
1. 浏览器控制台错误
2. 网络请求状态
3. API 响应

**解决**:
- 检查 API 端点是否正常
- 确认数据库迁移已完成

---

## ✅ 验证通过标准

所有以下项都通过：

1. ✅ 在 Supabase Dashboard 可以看到所有 6 个新表
2. ✅ `households` 表有 `building_id` 列
3. ✅ 可以访问 `/community` 页面（不报错）
4. ✅ 可以创建社区（通过 UI 或 API）
5. ✅ 验证 SQL 脚本所有检查项都通过

---

## 📝 下一步

验证通过后：

1. **生成 Prisma Client**（如果还没做）
   ```bash
   npx prisma generate
   ```

2. **测试功能**
   - 创建测试社区
   - 创建测试建筑
   - 测试成员管理
   - 测试工作组功能

3. **开始使用**
   - 访问 `/community` 页面
   - 创建你的第一个社区

---

**验证完成后，Community 和 Building 功能就可以使用了！** 🎉

