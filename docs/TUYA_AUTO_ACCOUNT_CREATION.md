# Tuya 自动账户创建
## Tuya Auto Account Creation

**最后更新**: 2025-11-21

---

## 🎯 功能概述

**目标**: 自动为每个用户生成 Tuya 账户和密码，存储在数据库中，对用户完全透明。

**用户体验**: 
- 用户无需手动输入 Tuya 账户信息
- 首次使用 MQTT/Tuya 功能时自动创建账户
- 账户信息自动保存和管理

---

## 🔧 实现方案

### 1. 自动生成账户信息

**位置**: `app/api/user/tuya-account/auto-create/route.ts`

**逻辑**:
- 使用用户的邮箱作为 Tuya 账户（如果 Tuya 支持邮箱注册）
- 生成强随机密码（16+ 位）
- 根据邮箱域名推断国家代码
- 加密密码并存储到数据库

**生成规则**:
```typescript
account: user.email (lowercase)
password: random 16+ character string
countryCode: inferred from email domain (default: '1' for US)
```

---

### 2. 自动创建流程

#### 步骤 1: 检查账户是否存在
- 用户首次使用 MQTT/Tuya 功能
- 系统检查用户是否已有 Tuya 账户

#### 步骤 2: 自动生成（如果不存在）
- 调用 `/api/user/tuya-account/auto-create`
- 生成账户和密码
- 保存到数据库（加密）

#### 步骤 3: SDK 注册（首次登录时）
- iOS/Android 插件调用 `loginOrRegister()`
- Tuya SDK 自动处理：
  - 如果账户不存在 → 创建新账户
  - 如果账户已存在 → 直接登录

---

### 3. iOS 插件集成

**更新**: `ios/App/App/Plugins/TuyaProvisioningPlugin.swift`

**`login()` 方法**:
1. 先尝试登录（账户可能已存在）
2. 如果登录失败，调用 `loginOrRegister()` 自动创建账户
3. 返回成功状态

**优势**:
- 支持自动创建和登录
- 无需用户手动注册
- 完全透明

---

### 4. 自动登录集成

**位置**: `lib/provisioning/native-client.ts`

**`ensureTuyaInitialized()` 方法**:
1. 初始化 SDK
2. 检查用户是否有 Tuya 账户
3. 如果没有，自动创建
4. 尝试自动登录

---

## 📋 工作流程

```
用户首次使用 MQTT/Tuya 功能
    ↓
系统检查是否有 Tuya 账户
    ↓
没有账户？
    ↓
自动生成账户和密码
    ↓
保存到数据库（加密）
    ↓
SDK 初始化
    ↓
调用 loginOrRegister()
    ↓
Tuya SDK 创建账户并登录
    ↓
完成！用户可以使用 Tuya 功能
```

---

## 🔒 安全性

### 密码加密
- 使用 `bcrypt` 加密（salt rounds: 12）
- 密码存储在数据库中，不会暴露给客户端

### 账户信息
- 账户名（邮箱）部分隐藏显示（前 3 位 + ****）
- 密码从不返回给客户端
- 仅在服务器端和 SDK 之间传递

---

## ⚠️ 注意事项

### Tuya SDK 限制

1. **邮箱注册支持**
   - 需要确认 Tuya SDK 是否支持邮箱注册
   - 如果不支持，可能需要使用手机号
   - 可以生成虚拟手机号或使用其他方式

2. **账户唯一性**
   - 使用用户邮箱确保唯一性
   - 如果邮箱已被使用，SDK 会返回错误
   - 需要处理账户已存在的情况

3. **密码复杂度**
   - Tuya 可能有密码要求（长度、字符类型）
   - 生成的密码需要满足这些要求

---

## 🚀 实施状态

### ✅ 已完成
- 自动生成账户 API (`/api/user/tuya-account/auto-create`)
- iOS 插件支持 `loginOrRegister()`
- 自动登录集成框架

### ⚠️ 待测试
- Tuya SDK 是否支持邮箱注册
- 自动创建账户的实际流程
- 错误处理（账户已存在等）

### 📝 待优化
- 如果邮箱注册不支持，实现手机号生成逻辑
- 添加账户创建失败的重试机制
- 添加账户状态检查（是否已激活等）

---

## 🔗 相关文件

- `app/api/user/tuya-account/auto-create/route.ts` - 自动创建 API
- `ios/App/App/Plugins/TuyaProvisioningPlugin.swift` - iOS 插件（已更新）
- `lib/provisioning/native-client.ts` - 自动登录集成（已更新）
- `lib/tuya-user-manager.ts` - 用户账户管理工具

---

## ✅ 总结

**实现方式**:
1. 服务器端自动生成账户和密码
2. 保存到数据库（加密）
3. SDK 首次使用时自动注册
4. 后续自动登录

**用户体验**:
- ✅ 完全透明，无需手动输入
- ✅ 自动管理，无需用户干预
- ✅ 安全存储，密码加密

---

**下一步**: 测试自动创建功能，确认 Tuya SDK 支持邮箱注册。

