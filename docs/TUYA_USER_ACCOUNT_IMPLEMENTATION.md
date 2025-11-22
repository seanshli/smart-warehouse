# Tuya 用户账户实现
## Tuya User Account Implementation

**最后更新**: 2025-11-21

---

## 📋 需求

根据用户要求：
1. **每个成员应该有独立的 Tuya 用户账户**
2. **应用应该构建 Tuya Home 配置，与物理 Household 相同**
3. **IoT 角色应该类似于 Tuya 的角色系统**
4. **应用应该记住当前用户的 Tuya 账户，当进入 MQTT 时使用**

---

## ✅ 已实现

### 1. 数据库 Schema

**User 模型添加字段**:
```prisma
model User {
  tuyaAccount          String?  // Tuya 账户（邮箱/手机号）
  tuyaPassword         String?  // 加密的 Tuya 密码
  tuyaCountryCode      String?  // 国家代码（默认 "1"）
  tuyaAccessToken      String?  // Tuya access token（临时）
  tuyaTokenExpiresAt   DateTime? // Token 过期时间
}
```

**Household 模型**（已存在）:
```prisma
model Household {
  tuyaHomeId String? @unique // Tuya Home ID（Household 级别）
}
```

---

### 2. API 端点

#### Tuya 账户管理
- `GET /api/user/tuya-account` - 获取当前用户的 Tuya 账户信息
- `POST /api/user/tuya-account` - 设置或更新用户的 Tuya 账户
- `DELETE /api/user/tuya-account` - 删除用户的 Tuya 账户信息

#### Tuya 登录/登出
- `POST /api/mqtt/tuya/login` - 使用用户的 Tuya 账户登录
- `POST /api/mqtt/tuya/logout` - 登出 Tuya 账户
- `GET /api/mqtt/tuya/login-status` - 检查登录状态

---

### 3. 工具函数

**`lib/tuya-user-manager.ts`**:
- `getUserTuyaAccount()` - 获取用户的 Tuya 账户信息
- `verifyTuyaPassword()` - 验证 Tuya 密码
- `getUserTuyaCredentials()` - 获取登录凭证（服务器端）
- `saveTuyaAccessToken()` - 保存 access token
- `isTuyaTokenValid()` - 检查 token 是否有效

---

### 4. Native 插件

#### iOS (`TuyaProvisioningPlugin.swift`)
- `login()` - 使用 Tuya 账户登录
- `logout()` - 登出 Tuya 账户
- `isLoggedIn()` - 检查登录状态

#### Web (`lib/plugins/tuya/web.ts`)
- Web fallback 实现所有登录方法

---

### 5. 自动登录集成

**`lib/provisioning/native-client.ts`**:
- `ensureTuyaInitialized()` - 自动检查并登录用户的 Tuya 账户
- 在配网前自动使用保存的 Tuya 账户登录

---

## ⚠️ 待完成

### 1. 数据库迁移

**运行 SQL 脚本**:
```sql
-- 在 Supabase Dashboard 中运行
-- scripts/add-tuya-user-account-fields.sql
```

---

### 2. UI 组件

**需要创建**:
- Tuya 账户设置页面/模态框
- 让用户输入 Tuya 账户（邮箱/手机号）和密码
- 显示当前 Tuya 账户状态
- 允许用户更新或删除 Tuya 账户

**建议位置**:
- `app/settings/tuya-account/page.tsx` - 设置页面
- 或在 `app/settings/page.tsx` 中添加 Tuya 账户部分

---

### 3. MQTT 操作时使用 Tuya 账户

**需要更新**:
- `components/mqtt/MQTTPanel.tsx` - 在进入 MQTT 面板时自动登录
- `components/mqtt/ProvisioningModal.tsx` - 在配网前确保已登录
- `lib/provisioning/native-client.ts` - 确保配网时使用当前用户的账户

---

### 4. Tuya Home 与 Household 同步

**已实现**:
- `households.tuyaHomeId` 字段
- `/api/mqtt/tuya/home` API
- 配网时自动创建/映射 Tuya Home

**需要确保**:
- 每个 Household 对应一个 Tuya Home
- 配网时使用正确的 Household 信息
- 多个成员可以访问同一个 Tuya Home（通过各自的 Tuya 账户）

---

### 5. Tuya 角色系统映射

**当前 Household 角色**:
- `ADMIN` - 管理员
- `MANAGER` - 管理者
- `MEMBER` - 成员
- `VIEWER` - 查看者

**Tuya Home 角色**（需要映射）:
- `ADMIN` - 管理员（可以管理 Home 和所有设备）
- `MEMBER` - 成员（可以控制设备）
- `VIEWER` - 查看者（只能查看状态）

**需要实现**:
- 将 Household 角色映射到 Tuya Home 角色
- 在添加成员到 Tuya Home 时使用正确的角色

---

## 🔧 实施步骤

### 步骤 1: 数据库迁移

1. 在 Supabase Dashboard 中打开 SQL Editor
2. 运行 `scripts/add-tuya-user-account-fields.sql`
3. 验证字段已添加

---

### 步骤 2: 创建 UI 组件

1. 创建 Tuya 账户设置页面
2. 添加输入表单（账户、密码、国家代码）
3. 添加保存/删除功能
4. 显示当前账户状态

---

### 步骤 3: 集成到 MQTT 操作

1. 在 `MQTTPanel` 加载时检查 Tuya 登录状态
2. 如果未登录，提示用户设置 Tuya 账户
3. 在配网前确保已登录
4. 使用当前用户的 Tuya 账户进行所有操作

---

### 步骤 4: 测试

1. 测试用户设置 Tuya 账户
2. 测试自动登录功能
3. 测试配网功能
4. 测试多用户访问同一个 Tuya Home

---

## 📝 相关文件

- `prisma/schema.prisma` - 数据库 schema
- `scripts/add-tuya-user-account-fields.sql` - 数据库迁移脚本
- `app/api/user/tuya-account/route.ts` - Tuya 账户管理 API
- `app/api/mqtt/tuya/login/route.ts` - Tuya 登录 API
- `lib/tuya-user-manager.ts` - Tuya 用户管理器
- `ios/App/App/Plugins/TuyaProvisioningPlugin.swift` - iOS 插件
- `lib/provisioning/native-client.ts` - Native 客户端集成

---

## ✅ 总结

**已完成**:
- ✅ 数据库 schema 设计
- ✅ API 端点实现
- ✅ Native 插件登录方法
- ✅ 自动登录集成框架

**待完成**:
- ⚠️ 数据库迁移
- ⚠️ UI 组件
- ⚠️ MQTT 操作集成
- ⚠️ 角色映射

---

**下一步**: 运行数据库迁移并创建 UI 组件。

