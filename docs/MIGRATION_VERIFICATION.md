# 迁移验证报告
## Migration Verification Report

**最后更新**: 2025-11-21

---

## ✅ 验证步骤

### 1. Prisma Schema 验证

```bash
npx prisma validate
```

**预期结果**: ✅ Schema 验证通过

---

### 2. Prisma Client 生成

```bash
npx prisma generate
```

**预期结果**: ✅ Prisma Client 生成成功

---

### 3. 数据库模型访问测试

运行验证脚本：

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  try {
    // 测试所有新模型
    await prisma.community.findMany({ take: 1 });
    await prisma.building.findMany({ take: 1 });
    await prisma.communityMember.findMany({ take: 1 });
    await prisma.workingGroup.findMany({ take: 1 });
    await prisma.workingGroupMember.findMany({ take: 1 });
    await prisma.workingGroupPermission.findMany({ take: 1 });
    
    // 测试更新的模型
    await prisma.household.findMany({ 
      take: 1,
      select: { id: true, buildingId: true }
    });
    
    console.log('✅ 所有模型验证通过！');
    await prisma.\$disconnect();
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    await prisma.\$disconnect();
    process.exit(1);
  }
}

verify();
"
```

**预期结果**: ✅ 所有模型可访问

---

### 4. 数据库结构验证（Supabase Dashboard）

在 Supabase Dashboard SQL Editor 中运行：

```sql
-- 文件: scripts/verify-community-building-migration.sql
```

**检查项**:
- ✅ 所有表已创建
- ✅ building_id 列已添加到 households
- ✅ 所有外键约束已创建
- ✅ 所有索引已创建
- ✅ 所有唯一约束已创建

---

### 5. API 端点测试

#### 测试 Community API

```bash
# 创建 Community
curl -X POST http://localhost:3000/api/community \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Community",
    "description": "Test Description"
  }'

# 获取 Community 列表
curl http://localhost:3000/api/community
```

#### 测试 Building API

```bash
# 创建 Building（需要先有 Community）
curl -X POST http://localhost:3000/api/community/{communityId}/buildings \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Building",
    "description": "Test Building Description"
  }'
```

---

## 📋 验证清单

### 数据库结构

- [ ] communities 表已创建
- [ ] buildings 表已创建
- [ ] community_members 表已创建
- [ ] working_groups 表已创建
- [ ] working_group_members 表已创建
- [ ] working_group_permissions 表已创建
- [ ] households.building_id 列已添加
- [ ] 所有外键约束已创建
- [ ] 所有索引已创建
- [ ] 所有唯一约束已创建

### Prisma Client

- [ ] Prisma Client 已生成
- [ ] Community 模型可访问
- [ ] Building 模型可访问
- [ ] CommunityMember 模型可访问
- [ ] WorkingGroup 模型可访问
- [ ] WorkingGroupMember 模型可访问
- [ ] WorkingGroupPermission 模型可访问
- [ ] Household.buildingId 字段可访问

### API 端点

- [ ] Community CRUD API 正常
- [ ] Community 成员管理 API 正常
- [ ] Building CRUD API 正常
- [ ] Working Group API 正常
- [ ] 权限检查正常工作

---

## 🔍 常见问题

### 问题: Prisma Client 找不到模型

**解决方案**:
```bash
npx prisma generate
```

### 问题: 表不存在错误

**解决方案**: 
- 检查是否在 Supabase Dashboard 执行了 SQL 脚本
- 运行验证 SQL 脚本检查表是否存在

### 问题: 外键约束错误

**解决方案**:
- 确保所有表都已创建
- 检查外键引用的表是否存在

---

## ✅ 验证通过标准

所有以下项都通过：

1. ✅ Prisma Schema 验证通过
2. ✅ Prisma Client 生成成功
3. ✅ 所有数据库模型可访问
4. ✅ 数据库结构验证通过（在 Supabase Dashboard）
5. ✅ API 端点可以正常调用

---

**验证完成后，可以开始使用 Community 和 Building 功能！**

