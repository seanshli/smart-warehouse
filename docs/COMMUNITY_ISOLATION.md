# 社区数据隔离文档

## 🔐 概述

Smart Warehouse 实现了严格的社区数据隔离机制，确保不同社区的管理员和成员只能访问自己社区的数据，无法看到其他社区的信息。

## 📋 权限层级

### 1. 超级管理员 (Super Admin)
- **标识**: `isAdmin = true` 在 `User` 表中
- **权限**: 可以查看和管理所有社区、建筑、住户的数据
- **用途**: 系统级管理，用于整体监控和管理

### 2. 社区管理员 (Community Admin)
- **标识**: `CommunityMember.role = 'ADMIN'` 或 `'MANAGER'`
- **权限**: 只能查看和管理自己社区的：
  - 社区信息
  - 社区内的建筑
  - 社区内的住户
  - 社区成员
  - 工作组
- **限制**: 无法看到其他社区的任何数据

### 3. 社区成员 (Community Member)
- **标识**: `CommunityMember.role = 'MEMBER'` 或 `'VIEWER'`
- **权限**: 根据角色有不同的查看权限
- **限制**: 只能访问自己所属社区的数据

## 🔒 数据隔离实现

### API 端点隔离

#### `/api/admin/communities`
- **超级管理员**: 返回所有社区
- **社区管理员**: 只返回用户是 ADMIN 或 MANAGER 的社区
- **实现**: 通过 `CommunityMember` 表查询用户的社区角色

#### `/api/admin/buildings`
- **超级管理员**: 返回所有建筑
- **社区管理员**: 只返回用户是 ADMIN 或 MANAGER 的社区的建筑
- **实现**: 先查询用户管理的社区 ID，然后过滤建筑

#### `/api/community/[id]`
- **检查**: 用户必须是社区成员 (`isCommunityMember`)
- **返回**: 只返回该社区的数据

#### `/api/community/[id]/buildings`
- **检查**: 用户必须是社区成员
- **返回**: 只返回该社区的建筑

#### `/api/building/[id]`
- **检查**: 用户必须是建筑所属社区的成员 (`checkBuildingAccess`)
- **返回**: 只返回该建筑的数据

#### `/api/building/[id]/households`
- **检查**: 用户必须是建筑所属社区的成员
- **返回**: 只返回该建筑的住户

## 🛡️ 权限检查函数

### `isCommunityMember(userId, communityId)`
检查用户是否是社区成员（任何角色）

### `checkCommunityPermission(userId, communityId, permission)`
检查用户在社区中是否有特定权限

### `checkBuildingAccess(userId, buildingId)`
检查用户是否可以访问建筑（通过社区成员身份）

### `checkBuildingManagement(userId, buildingId)`
检查用户是否可以管理建筑（需要 `canManageBuildings` 权限）

## 📊 数据访问流程

### 社区管理员查看建筑列表

1. 用户请求 `/api/admin/buildings`
2. 系统检查用户是否是超级管理员
   - 如果是：返回所有建筑
   - 如果不是：查询用户是 ADMIN/MANAGER 的社区
3. 只返回这些社区的建筑
4. 用户无法看到其他社区的建筑

### 社区管理员查看社区详情

1. 用户请求 `/api/community/[id]`
2. 系统检查 `isCommunityMember(userId, communityId)`
3. 如果用户不是成员，返回 403
4. 如果用户是成员，返回社区数据

### 建筑访问

1. 用户请求 `/api/building/[id]`
2. 系统通过 `checkBuildingAccess` 检查：
   - 获取建筑所属的社区 ID
   - 检查用户是否是社区成员
3. 如果不是成员，返回 403
4. 如果是成员，返回建筑数据

## ⚠️ 重要注意事项

1. **社区 ID 是隔离的关键**: 所有数据都通过 `communityId` 关联
2. **建筑属于社区**: 建筑通过 `building.communityId` 关联到社区
3. **住户属于建筑**: 住户通过 `household.buildingId` 关联到建筑
4. **权限继承**: 建筑权限继承自社区权限
5. **超级管理员例外**: 只有 `isAdmin=true` 的用户可以跨社区访问

## 🔍 测试建议

1. 创建两个不同的社区
2. 为每个社区分配不同的管理员
3. 验证管理员 A 无法看到社区 B 的数据
4. 验证超级管理员可以看到所有数据
5. 验证普通成员只能看到自己社区的数据

## 📝 相关文件

- `app/api/admin/communities/route.ts` - 管理员社区列表 API
- `app/api/admin/buildings/route.ts` - 管理员建筑列表 API
- `app/api/community/[id]/route.ts` - 社区详情 API
- `app/api/building/[id]/route.ts` - 建筑详情 API
- `lib/middleware/community-permissions.ts` - 权限检查函数

