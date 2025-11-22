# 社区和建筑层级架构设计
## Community and Building Hierarchy Architecture

**最后更新**: 2025-11-21

---

## 📊 层级结构

```
Community (社区)
  └── Building (建筑)
      └── Household (家庭)
          └── Members (成员)
```

---

## 🗄️ 数据库 Schema 设计

### 1. Community (社区)

```prisma
model Community {
  id              String            @id @default(dbgenerated("(gen_random_uuid())::text"))
  name            String
  description     String?
  address         String?
  city            String?
  district        String?
  country         String?
  latitude        Float?
  longitude       Float?
  invitationCode  String?           @unique @default(dbgenerated("(gen_random_uuid())::text")) @map("invitation_code")
  createdAt       DateTime?         @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime?         @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  
  buildings       Building[]
  members         CommunityMember[]
  workingGroups   WorkingGroup[]
  activities      CommunityActivity[]
  
  @@map("communities")
}
```

### 2. Building (建筑)

```prisma
model Building {
  id              String            @id @default(dbgenerated("(gen_random_uuid())::text"))
  communityId     String            @map("community_id")
  name            String
  description     String?
  address         String?
  floorCount      Int?              @map("floor_count")
  unitCount       Int?              @map("unit_count")
  latitude        Float?
  longitude       Float?
  createdAt       DateTime?         @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime?         @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  
  community       Community         @relation(fields: [communityId], references: [id], onDelete: Cascade, onUpdate: NoAction)
  households      Household[]
  activities      BuildingActivity[]
  
  @@map("buildings")
}
```

### 3. CommunityMember (社区成员)

```prisma
model CommunityMember {
  id          String    @id @default(dbgenerated("(gen_random_uuid())::text"))
  userId      String    @map("user_id")
  communityId String    @map("community_id")
  role        String?   @default("MEMBER") // ADMIN, MANAGER, MEMBER, VIEWER
  joinedAt    DateTime? @default(now()) @map("joined_at") @db.Timestamptz(6)
  
  community   Community @relation(fields: [communityId], references: [id], onDelete: Cascade, onUpdate: NoAction)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade, onUpdate: NoAction)
  
  @@unique([userId, communityId])
  @@map("community_members")
}
```

### 4. WorkingGroup (工作组)

```prisma
model WorkingGroup {
  id          String                @id @default(dbgenerated("(gen_random_uuid())::text"))
  communityId String                @map("community_id")
  name        String
  description String?
  type        String                // BUILDING_MANAGER, SECURITY, MAINTENANCE, ADMINISTRATION, etc.
  createdAt   DateTime?             @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime?             @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  
  community   Community              @relation(fields: [communityId], references: [id], onDelete: Cascade, onUpdate: NoAction)
  members     WorkingGroupMember[]
  permissions WorkingGroupPermission[]
  
  @@map("working_groups")
}
```

### 5. WorkingGroupMember (工作组成员)

```prisma
model WorkingGroupMember {
  id             String       @id @default(dbgenerated("(gen_random_uuid())::text"))
  workingGroupId String       @map("working_group_id")
  userId         String       @map("user_id")
  role           String?      @default("MEMBER") // LEADER, MEMBER
  assignedAt     DateTime?    @default(now()) @map("assigned_at") @db.Timestamptz(6)
  
  workingGroup   WorkingGroup @relation(fields: [workingGroupId], references: [id], onDelete: Cascade, onUpdate: NoAction)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade, onUpdate: NoAction)
  
  @@unique([workingGroupId, userId])
  @@map("working_group_members")
}
```

### 6. WorkingGroupPermission (工作组权限)

```prisma
model WorkingGroupPermission {
  id             String       @id @default(dbgenerated("(gen_random_uuid())::text"))
  workingGroupId String       @map("working_group_id")
  permission     String       // VIEW, EDIT, ADD, REMOVE, ADD_MEMBER, REVOKE_MEMBER, MANAGE_BUILDING, etc.
  scope          String?      // ALL_BUILDINGS, SPECIFIC_BUILDING, SPECIFIC_HOUSEHOLD
  scopeId        String?      @map("scope_id") // Building ID or Household ID if scope is specific
  createdAt      DateTime?    @default(now()) @map("created_at") @db.Timestamptz(6)
  
  workingGroup   WorkingGroup @relation(fields: [workingGroupId], references: [id], onDelete: Cascade, onUpdate: NoAction)
  
  @@unique([workingGroupId, permission, scope, scopeId])
  @@map("working_group_permissions")
}
```

### 7. 更新 Household 模型

```prisma
model Household {
  // ... existing fields ...
  buildingId     String?           @map("building_id")
  building        Building?         @relation(fields: [buildingId], references: [id], onDelete: SetNull, onUpdate: NoAction)
  // ... rest of fields ...
}
```

### 8. 更新 User 模型

```prisma
model User {
  // ... existing fields ...
  communityMemberships CommunityMember[]
  workingGroupMembers  WorkingGroupMember[]
  // ... rest of fields ...
}
```

---

## 🔐 权限系统设计

### Community 角色

```typescript
export type CommunityRole = 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER'

export interface CommunityPermissions {
  // Community management
  canManageCommunity: boolean
  canManageBuildings: boolean
  canManageMembers: boolean
  canManageWorkingGroups: boolean
  
  // Building management
  canViewBuildings: boolean
  canCreateBuildings: boolean
  canEditBuildings: boolean
  canDeleteBuildings: boolean
  
  // Member management
  canViewMembers: boolean
  canAddMembers: boolean
  canRemoveMembers: boolean
  canManageRoles: boolean
  
  // Working group management
  canViewWorkingGroups: boolean
  canCreateWorkingGroups: boolean
  canEditWorkingGroups: boolean
  canDeleteWorkingGroups: boolean
  canAssignWorkingGroupMembers: boolean
}
```

### Working Group 权限类型

```typescript
export type WorkingGroupPermissionType = 
  | 'VIEW'
  | 'EDIT'
  | 'ADD'
  | 'REMOVE'
  | 'ADD_MEMBER'
  | 'REVOKE_MEMBER'
  | 'MANAGE_BUILDING'
  | 'MANAGE_HOUSEHOLD'
  | 'VIEW_REPORTS'
  | 'MANAGE_SECURITY'

export type WorkingGroupScope = 
  | 'ALL_BUILDINGS'
  | 'SPECIFIC_BUILDING'
  | 'SPECIFIC_HOUSEHOLD'
  | 'ALL_HOUSEHOLDS'
```

---

## 📁 API 路由结构

```
/api/community/
  ├── route.ts                    # GET (list), POST (create)
  ├── [id]/
  │   ├── route.ts                # GET, PATCH, DELETE
  │   ├── members/
  │   │   ├── route.ts            # GET, POST
  │   │   └── [memberId]/
  │   │       └── route.ts        # PUT, DELETE
  │   ├── buildings/
  │   │   ├── route.ts            # GET, POST
  │   │   └── [buildingId]/
  │   │       ├── route.ts        # GET, PATCH, DELETE
  │   │       └── households/
  │   │           └── route.ts    # GET (list households in building)
  │   └── working-groups/
  │       ├── route.ts            # GET, POST
  │       └── [groupId]/
  │           ├── route.ts        # GET, PATCH, DELETE
  │           ├── members/
  │           │   ├── route.ts    # GET, POST
  │           │   └── [memberId]/
  │           │       └── route.ts # DELETE
  │           └── permissions/
  │               ├── route.ts    # GET, POST
  │               └── [permissionId]/
  │                   └── route.ts # DELETE
```

---

## 🔄 迁移策略

### 阶段 1: Schema 扩展（向后兼容）

1. 添加新表（Community, Building, CommunityMember, WorkingGroup, etc.）
2. 在 Household 中添加可选的 `buildingId` 字段
3. 现有数据不受影响（buildingId 可以为 null）

### 阶段 2: 数据迁移

1. 创建默认 Community（如果需要）
2. 创建默认 Building（如果需要）
3. 将现有 Household 关联到 Building（可选）

### 阶段 3: API 实现

1. 实现 Community CRUD API
2. 实现 Building CRUD API
3. 实现 Working Group API
4. 实现权限检查逻辑

### 阶段 4: UI 实现

1. Community 管理界面
2. Building 管理界面
3. Working Group 管理界面
4. 权限配置界面

---

## 🎯 实现优先级

### 高优先级
1. ✅ Database schema 设计
2. ✅ Migration script
3. ✅ Community CRUD API
4. ✅ Building CRUD API
5. ✅ 基础权限系统

### 中优先级
1. Working Group CRUD API
2. Working Group 权限管理
3. Community/Building 成员管理
4. 权限检查中间件

### 低优先级
1. UI 组件
2. 高级权限配置
3. 审计日志
4. 通知系统

---

## 📝 注意事项

1. **向后兼容**: 现有 Household 可以独立存在（buildingId 为 null）
2. **权限继承**: Building 权限可以继承自 Community，Household 权限可以继承自 Building
3. **数据完整性**: 删除 Community 时级联删除 Building 和关联数据
4. **性能考虑**: 添加适当的索引，优化查询性能
5. **安全性**: 所有 API 都需要权限检查

---

## 🔗 相关文件

- `prisma/schema.prisma` - 数据库 schema
- `lib/permissions.ts` - 权限系统
- `app/api/community/` - Community API 路由
- `app/api/building/` - Building API 路由

