# Tuya 双账户系统架构
## Tuya Dual Account System Architecture

**最后更新**: 2025-11-21

---

## 📋 概述

Smart Warehouse 使用**双账户系统**来管理 Tuya 集成：

1. **Member 级别**：每个成员有自己的 Tuya User 账户
2. **Household 级别**：每个 Household 有自己的 Tuya 账户（用于管理）

---

## 🏗️ 架构图

```
┌─────────────────────────────────────────────────────────┐
│                    Smart Warehouse                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Household "我的家" (id: abc123)                         │
│    ├─ tuyaHomeId: "tuya_home_xyz789"  ← Household级别   │
│    ├─ tuyaAccount: "household_xxx@smartwarehouse.local"  │
│    └─ tuyaPassword: "***" (加密)                        │
│                                                           │
│  Members:                                                 │
│    ├─ User A (OWNER)                                      │
│    │   ├─ tuyaAccount: "userA@example.com"               │
│    │   ├─ tuyaPassword: "***" (加密)                     │
│    │   └─ Tuya Home Role: admin                          │
│    │                                                       │
│    ├─ User B (USER)                                       │
│    │   ├─ tuyaAccount: "userB@example.com"               │
│    │   ├─ tuyaPassword: "***" (加密)                     │
│    │   └─ Tuya Home Role: member                        │
│    │                                                       │
│    └─ User C (VISITOR)                                    │
│        ├─ tuyaAccount: "userC@example.com"               │
│        ├─ tuyaPassword: "***" (加密)                     │
│        └─ Tuya Home Role: guest                         │
│                                                           │
└─────────────────────────────────────────────────────────┘
         │
         │ 所有成员通过各自的 Tuya User 账户登录
         │ 然后加入同一个 Tuya Home
         ▼
┌─────────────────────────────────────────────────────────┐
│                    Tuya Cloud                            │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Tuya Home (id: tuya_home_xyz789)                        │
│    ├─ Member 1 (admin) - userA@example.com              │
│    ├─ Member 2 (member) - userB@example.com             │
│    ├─ Member 3 (guest) - userC@example.com              │
│    ├─ Device 1                                            │
│    ├─ Device 2                                            │
│    └─ Device 3                                            │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 🔑 账户类型

### 1. Member Tuya 账户（个人账户）

**存储位置**: `users.tuyaAccount`, `users.tuyaPassword`, `users.tuyaCountryCode`

**用途**:
- ✅ 每个成员登录 Tuya SDK 使用
- ✅ 用于配网和控制设备
- ✅ 个人身份验证

**特点**:
- 每个成员独立管理
- 自动生成（如果不存在）
- 存储在数据库中（密码加密）

**示例**:
```typescript
User {
  email: "userA@example.com",
  tuyaAccount: "userA@example.com",
  tuyaPassword: "***" (加密),
  tuyaCountryCode: "886"
}
```

---

### 2. Household Tuya 账户（管理账户）

**存储位置**: `households.tuyaAccount`, `households.tuyaPassword`, `households.tuyaCountryCode`

**用途**:
- ✅ 作为 Household 的"主账户"或"管理账户"
- ✅ 用于创建和管理 Tuya Home
- ✅ 作为备用账户（如果成员账户不可用）

**特点**:
- 每个 Household 自动生成
- 格式：`household_<name>_<id>@smartwarehouse.local`
- 存储在数据库中（密码加密）

**示例**:
```typescript
Household {
  name: "我的家",
  tuyaHomeId: "tuya_home_xyz789",
  tuyaAccount: "household_我的家_abc123@smartwarehouse.local",
  tuyaPassword: "***" (加密),
  tuyaCountryCode: "886"
}
```

---

## 🔄 角色映射

### Household 角色 → Tuya Home 角色

| Household Role | Tuya Home Role | 权限说明 |
|---------------|----------------|---------|
| `OWNER` | `admin` | 完全管理权限 |
| `USER` | `member` | 标准成员权限 |
| `VISITOR` | `guest` | 访客权限（只读） |

---

## 📝 工作流程

### 1. 创建 Household

```
1. 用户创建 Household
   ↓
2. 自动生成 Household Tuya 账户
   ↓
3. 成员（Owner）使用自己的 Tuya User 账户登录 SDK
   ↓
4. 创建 Tuya Home（使用 Owner 的账户）
   ↓
5. 保存 tuyaHomeId 到 Household
```

### 2. 成员加入 Household

```
1. 成员加入 Household（通过邀请码）
   ↓
2. 检查成员是否有 Tuya User 账户（如果没有，自动创建）
   ↓
3. 如果 Household 已有 Tuya Home：
   - 成员使用自己的 Tuya User 账户登录 SDK
   - 调用 addMemberToHome API
   - 根据 Household 角色映射到 Tuya Home 角色
   ↓
4. 成员成功加入 Tuya Home
```

### 3. 配网设备

```
1. 成员使用自己的 Tuya User 账户登录 SDK
   ↓
2. 选择要配网的 Household（通过 tuyaHomeId）
   ↓
3. 开始配网流程
   ↓
4. 设备添加到 Tuya Home
   ↓
5. 所有成员都可以看到和控制设备（根据角色权限）
```

---

## 🔧 API 端点

### 1. 获取/创建 Household Tuya 账户

```typescript
GET /api/household/[id]/tuya-account
POST /api/household/[id]/tuya-account
```

### 2. 添加成员到 Tuya Home

```typescript
POST /api/household/[id]/tuya-home/add-member
```

**请求体**:
```json
{
  "targetUserId": "user_id",
  "role": "OWNER" | "USER" | "VISITOR"
}
```

**响应**:
```json
{
  "success": true,
  "householdId": "abc123",
  "tuyaHomeId": "tuya_home_xyz789",
  "targetUserId": "user_id",
  "targetUserTuyaAccount": "user@example.com",
  "householdRole": "USER",
  "tuyaRole": "member"
}
```

---

## 📱 客户端实现

### iOS/Android 插件

```typescript
// 添加成员到 Tuya Home
await TuyaProvisioning.addMemberToHome({
  homeId: "tuya_home_xyz789",
  userTuyaAccount: "user@example.com",
  userTuyaCountryCode: "886",
  role: "member" // "admin" | "member" | "guest"
})
```

---

## ✅ 优势

1. **灵活性**: 每个成员使用自己的账户，便于管理
2. **安全性**: 个人账户独立，密码加密存储
3. **角色管理**: 支持不同角色和权限
4. **备用方案**: Household 账户作为备用管理账户
5. **可扩展性**: 支持未来添加更多角色和权限

---

## ⚠️ 注意事项

1. **账户同步**: 确保成员加入 Household 时，Tuya 账户已创建
2. **角色一致性**: 保持 Household 角色和 Tuya Home 角色同步
3. **密码管理**: 所有密码都加密存储，不能明文传输
4. **SDK 限制**: 某些 Tuya SDK 版本可能不支持角色管理，需要验证

---

## 🔗 相关文件

- `prisma/schema.prisma` - 数据库 schema
- `lib/tuya-household-manager.ts` - Household Tuya 账户管理
- `lib/tuya-user-manager.ts` - User Tuya 账户管理
- `app/api/household/[id]/tuya-account/route.ts` - Household Tuya 账户 API
- `app/api/household/[id]/tuya-home/add-member/route.ts` - 添加成员到 Tuya Home API
- `ios/App/App/Plugins/TuyaProvisioningPlugin.swift` - iOS 插件实现

---

## 📚 总结

**双账户系统**提供了灵活且安全的 Tuya 集成方案：

- ✅ **Member 账户**: 个人身份，用于登录和操作
- ✅ **Household 账户**: 管理账户，用于创建和管理 Home
- ✅ **角色映射**: 支持不同权限级别
- ✅ **自动同步**: 成员加入时自动添加到 Tuya Home

---

