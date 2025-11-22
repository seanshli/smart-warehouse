# 社区和建筑层级实现计划
## Community and Building Hierarchy Implementation Plan

**创建日期**: 2025-11-21  
**状态**: 🚧 进行中

---

## ✅ 已完成

### 1. Schema 设计
- ✅ 设计完整的数据库 schema
- ✅ 添加 Community 模型
- ✅ 添加 Building 模型
- ✅ 添加 CommunityMember 模型
- ✅ 添加 WorkingGroup 模型
- ✅ 添加 WorkingGroupMember 模型
- ✅ 添加 WorkingGroupPermission 模型
- ✅ 更新 Household 模型（添加 buildingId）
- ✅ 更新 User 模型（添加关联）
- ✅ Schema 验证通过

### 2. 文档
- ✅ 架构设计文档 (`docs/COMMUNITY_BUILDING_ARCHITECTURE.md`)
- ✅ 迁移脚本 (`scripts/migrate-community-building.sql`)

---

## 📋 待实现

### 阶段 1: 数据库迁移

- [ ] 运行 Prisma 迁移
  ```bash
  npx prisma migrate dev --name add_community_building_hierarchy
  ```
- [ ] 生成 Prisma Client
  ```bash
  npx prisma generate
  ```
- [ ] 验证数据库结构

### 阶段 2: 权限系统扩展

- [ ] 扩展 `lib/permissions.ts`
  - [ ] 添加 `CommunityRole` 类型
  - [ ] 添加 `CommunityPermissions` 接口
  - [ ] 添加 `getCommunityPermissions()` 函数
  - [ ] 添加 `WorkingGroupPermissionType` 类型
  - [ ] 添加权限检查函数

### 阶段 3: API 实现

#### Community API
- [ ] `app/api/community/route.ts` - GET, POST
- [ ] `app/api/community/[id]/route.ts` - GET, PATCH, DELETE
- [ ] `app/api/community/[id]/members/route.ts` - GET, POST
- [ ] `app/api/community/[id]/members/[memberId]/route.ts` - PUT, DELETE
- [ ] `app/api/community/[id]/buildings/route.ts` - GET, POST
- [ ] `app/api/community/[id]/buildings/[buildingId]/route.ts` - GET, PATCH, DELETE
- [ ] `app/api/community/[id]/buildings/[buildingId]/households/route.ts` - GET
- [ ] `app/api/community/[id]/working-groups/route.ts` - GET, POST
- [ ] `app/api/community/[id]/working-groups/[groupId]/route.ts` - GET, PATCH, DELETE
- [ ] `app/api/community/[id]/working-groups/[groupId]/members/route.ts` - GET, POST
- [ ] `app/api/community/[id]/working-groups/[groupId]/members/[memberId]/route.ts` - DELETE
- [ ] `app/api/community/[id]/working-groups/[groupId]/permissions/route.ts` - GET, POST
- [ ] `app/api/community/[id]/working-groups/[groupId]/permissions/[permissionId]/route.ts` - DELETE

#### Building API
- [ ] `app/api/building/[id]/route.ts` - GET, PATCH, DELETE
- [ ] `app/api/building/[id]/households/route.ts` - GET

### 阶段 4: 权限检查中间件

- [ ] 创建 `lib/middleware/community-permissions.ts`
- [ ] 实现社区权限检查
- [ ] 实现建筑权限检查
- [ ] 实现工作组权限检查
- [ ] 集成到 API 路由

### 阶段 5: UI 组件

- [ ] Community 管理界面
- [ ] Building 管理界面
- [ ] Working Group 管理界面
- [ ] 权限配置界面
- [ ] 成员管理界面

---

## 🔄 迁移策略

### 向后兼容性

1. **Household.buildingId** 是可选的（nullable）
   - 现有 Household 可以独立存在
   - 逐步迁移到 Building 结构

2. **Household.community** 字段保留
   - 作为遗留字段，用于向后兼容
   - 新数据使用 Building → Community 关系

3. **数据迁移**
   - 创建默认 Community（如果需要）
   - 创建默认 Building（如果需要）
   - 可选：将现有 Household 关联到 Building

---

## 📊 数据模型关系

```
Community (1) ──< (N) Building
Building (1) ──< (N) Household
Household (1) ──< (N) HouseholdMember

Community (1) ──< (N) CommunityMember
Community (1) ──< (N) WorkingGroup
WorkingGroup (1) ──< (N) WorkingGroupMember
WorkingGroup (1) ──< (N) WorkingGroupPermission
```

---

## 🔐 权限层级

### Community 角色
- **ADMIN**: 完全控制社区
- **MANAGER**: 管理建筑和成员
- **MEMBER**: 基本成员权限
- **VIEWER**: 只读权限

### Working Group 角色
- **LEADER**: 工作组负责人
- **MEMBER**: 工作组成员

### 权限类型
- **VIEW**: 查看
- **EDIT**: 编辑
- **ADD**: 添加
- **REMOVE**: 删除
- **ADD_MEMBER**: 添加成员
- **REVOKE_MEMBER**: 移除成员
- **MANAGE_BUILDING**: 管理建筑
- **MANAGE_HOUSEHOLD**: 管理家庭
- **VIEW_REPORTS**: 查看报告
- **MANAGE_SECURITY**: 管理安全

### 权限范围
- **ALL_BUILDINGS**: 所有建筑
- **SPECIFIC_BUILDING**: 特定建筑
- **SPECIFIC_HOUSEHOLD**: 特定家庭
- **ALL_HOUSEHOLDS**: 所有家庭

---

## 🎯 实现优先级

### 高优先级（核心功能）
1. ✅ Schema 设计
2. ⏳ 数据库迁移
3. ⏳ 权限系统扩展
4. ⏳ Community CRUD API
5. ⏳ Building CRUD API

### 中优先级（管理功能）
1. ⏳ Working Group CRUD API
2. ⏳ 成员管理 API
3. ⏳ 权限管理 API
4. ⏳ 权限检查中间件

### 低优先级（UI 和优化）
1. ⏳ UI 组件
2. ⏳ 数据迁移工具
3. ⏳ 审计日志
4. ⏳ 性能优化

---

## 📝 注意事项

1. **数据完整性**
   - 删除 Community 时级联删除 Building
   - 删除 Building 时设置 Household.buildingId 为 null（不删除 Household）

2. **性能考虑**
   - 添加适当的数据库索引
   - 优化查询性能
   - 考虑缓存策略

3. **安全性**
   - 所有 API 都需要权限检查
   - 验证用户身份
   - 防止权限提升

4. **测试**
   - 单元测试
   - 集成测试
   - 权限测试

---

## 🔗 相关文件

- `prisma/schema.prisma` - 数据库 schema
- `lib/permissions.ts` - 权限系统
- `docs/COMMUNITY_BUILDING_ARCHITECTURE.md` - 架构设计文档
- `scripts/migrate-community-building.sql` - 迁移脚本

---

## 📅 时间估算

- **阶段 1** (数据库迁移): 1-2 小时
- **阶段 2** (权限系统): 2-3 小时
- **阶段 3** (API 实现): 4-6 小时
- **阶段 4** (中间件): 2-3 小时
- **阶段 5** (UI 组件): 6-8 小时

**总计**: 15-22 小时

---

**下一步**: 运行数据库迁移并生成 Prisma Client

