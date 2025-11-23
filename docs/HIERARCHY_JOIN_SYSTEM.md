# 层级加入系统架构
## Hierarchy Join System Architecture

**最后更新**: 2025-11-21

---

## 📋 概述

实现类似 Household 邀请码的机制，扩展到 Community 和 Building 级别，并支持自动成员关系和加入请求。

---

## 🏗️ 架构设计

### 层级关系

```
Community (邀请码)
  └─ Building (邀请码)
      └─ Household (邀请码)
          └─ Member
```

### 自动成员关系

1. **加入 Household** → 自动加入 Building（view + limited edit）
2. **加入 Building** → 自动加入 Community（view + limited edit）
3. **加入 Community** → 直接成为成员（根据邀请码角色）

---

## 🔑 功能需求

### 1. 邀请码系统

- ✅ Community 已有 `invitationCode`
- ✅ Building 需要添加 `invitationCode`（已添加）
- ✅ Household 已有 `invitationCode`

### 2. 统一加入 API

创建 `/api/join` 端点，支持：
- `type`: `community` | `building` | `household`
- `invitationCode`: 邀请码
- `role`: 角色（可选）

### 3. 自动成员关系

**逻辑**:
- 加入 Household 时：
  1. 检查 Household 是否属于某个 Building
  2. 如果是，自动将用户添加到 Building（`isAutoJoined: true`, `role: MEMBER`）
  3. 检查 Building 是否属于某个 Community
  4. 如果是，自动将用户添加到 Community（`isAutoJoined: true`, `role: MEMBER`）

- 加入 Building 时：
  1. 检查 Building 是否属于某个 Community
  2. 如果是，自动将用户添加到 Community（`isAutoJoined: true`, `role: MEMBER`）

### 4. 权限管理

**自动加入的成员** (`isAutoJoined: true`):
- 角色：`MEMBER` 或 `VIEWER`
- 权限：view + limited edit（不能删除、不能管理成员等）

**手动加入的成员** (`isAutoJoined: false`):
- 角色：根据邀请码或管理员分配
- 权限：根据角色决定

### 5. 创建 Household 时的检查

**流程**:
1. 用户创建新 Household
2. 系统检查：
   - 是否有现有的 Community/Building 在同一位置
   - 如果有，提示用户发送加入请求
3. 如果用户选择发送请求：
   - 创建 `JoinRequest` 记录
   - 通知 Community/Building Admin
4. Admin 可以批准或拒绝请求

---

## 📝 数据库 Schema 更改

### 已添加

1. **Building.invitationCode**: 邀请码字段
2. **BuildingMember**: Building 成员表
   - `isAutoJoined`: 是否自动加入
   - `role`: 角色（ADMIN, MANAGER, MEMBER, VIEWER）
3. **CommunityMember.isAutoJoined**: 是否自动加入

### 需要添加

1. **JoinRequest**: 加入请求表
   ```prisma
   model JoinRequest {
     id          String   @id
     userId      String
     type        String   // 'community' | 'building' | 'household'
     targetId    String   // Community/Building/Household ID
     status      String   // 'pending' | 'approved' | 'rejected'
     message     String?
     requestedAt DateTime
     reviewedAt  DateTime?
     reviewedBy  String?
   }
   ```

---

## 🔄 API 端点

### 1. 统一加入 API

```
POST /api/join
{
  "type": "community" | "building" | "household",
  "invitationCode": "xxx",
  "role": "MEMBER" (可选)
}
```

### 2. 加入请求 API

```
POST /api/join-request
{
  "type": "community" | "building",
  "targetId": "xxx",
  "message": "请求加入..."
}

GET /api/join-request?type=community&targetId=xxx
POST /api/join-request/[id]/approve
POST /api/join-request/[id]/reject
```

### 3. 检查现有 Community/Building

```
GET /api/household/check-existing?latitude=xxx&longitude=xxx
```

---

## 🎯 实现步骤

1. ✅ 更新 Schema（Building invitationCode, BuildingMember）
2. ⏳ 创建统一加入 API
3. ⏳ 实现自动成员关系逻辑
4. ⏳ 创建加入请求系统
5. ⏳ 更新 Household 创建流程
6. ⏳ 创建 SQL 迁移脚本

---

## 📚 相关文件

- `prisma/schema.prisma` - 数据库 schema
- `app/api/join/route.ts` - 统一加入 API（待创建）
- `app/api/join-request/route.ts` - 加入请求 API（待创建）
- `lib/hierarchy-join-manager.ts` - 自动成员关系逻辑（待创建）

---

