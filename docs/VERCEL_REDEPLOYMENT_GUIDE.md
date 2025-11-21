# Vercel 重新部署指南
## Vercel Redeployment Guide

**最后更新**: 2025-11-21

---

## ❓ 问题：需要重新部署 Vercel 吗？

**答案：是的，需要重新部署 Vercel 才能在 iOS/Android 上测试。**

---

## 🔍 原因分析 / Why?

### iOS/Android 应用架构

```
iOS/Android App (Capacitor)
    ↓
连接到 Vercel (https://smart-warehouse-five.vercel.app)
    ↓
调用 API 端点 (/api/mqtt/tuya/home, /api/provisioning, etc.)
    ↓
访问 Supabase 数据库
```

**关键点**:
- iOS/Android 应用通过 **WebView** 连接到 Vercel 部署
- 所有 API 调用都发送到 Vercel 上的 API 端点
- 前端代码虽然会构建到本地，但 API 调用仍然去 Vercel

---

## 📋 需要部署的更改 / Changes That Need Deployment

### ✅ 必须部署的更改

1. **新的 API 端点**
   - `/api/mqtt/tuya/home` - Tuya Home 管理 API
   - 这个端点需要部署到 Vercel 才能被 iOS/Android 调用

2. **更新的 API 端点**
   - `/api/provisioning` - 可能已更新
   - `/api/tuya/sdk-config` - SDK 凭证 API

3. **前端代码更改**
   - `components/mqtt/ProvisioningModal.tsx` - 更新了配网逻辑
   - 虽然会构建到本地，但 API 调用需要 Vercel 上的端点

4. **环境变量**（如果需要）
   - 检查是否有新的环境变量需要添加到 Vercel

### ❌ 不需要部署的更改

1. **数据库 Schema**
   - `tuya_home_id` 字段在 Supabase，不需要 Vercel 部署

2. **iOS/Android 原生代码**
   - `TuyaProvisioningPlugin.swift` - 在本地项目
   - `TuyaProvisioningPlugin.java` - 在本地项目

---

## 🚀 部署步骤 / Deployment Steps

### 方法 1: 自动部署（推荐）⭐

如果 Vercel 已连接到 Git 仓库：

1. **提交并推送更改**
   ```bash
   git add .
   git commit -m "feat: add Tuya Home to Household mapping"
   git push origin main
   ```

2. **Vercel 自动部署**
   - Vercel 会自动检测到推送
   - 自动构建和部署
   - 通常需要 2-5 分钟

3. **验证部署**
   - 检查 Vercel Dashboard
   - 等待部署完成
   - 测试 API 端点

### 方法 2: 手动部署

如果使用 Vercel CLI：

```bash
# 1. 安装 Vercel CLI（如果还没有）
npm i -g vercel

# 2. 登录
vercel login

# 3. 部署
vercel --prod
```

---

## ✅ 部署后验证 / Post-Deployment Verification

### 1. 检查 API 端点

```bash
# 测试新的 Tuya Home API
curl https://smart-warehouse-five.vercel.app/api/mqtt/tuya/home?householdId=test

# 应该返回 JSON 响应（可能需要认证）
```

### 2. 检查 Vercel Dashboard

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目：`smart-warehouse`
3. 检查最新部署状态
4. 查看部署日志

### 3. 检查环境变量

确保以下环境变量在 Vercel 中已设置：

```env
# 数据库
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="https://smart-warehouse-five.vercel.app"
NEXTAUTH_SECRET="..."

# Tuya API
TUYA_ACCESS_ID="..."
TUYA_ACCESS_SECRET="..."
TUYA_REGION="us"

# Tuya SDK (用于 API 端点)
TUYA_IOS_SDK_APP_KEY="..."
TUYA_IOS_SDK_APP_SECRET="..."
TUYA_ANDROID_SDK_APP_KEY="..."
TUYA_ANDROID_SDK_APP_SECRET="..."
TUYA_ANDROID_SDK_SHA256="..."
```

---

## 📱 iOS/Android 测试流程 / Testing Flow

### 正确的测试顺序

1. **✅ 先部署 Vercel**
   ```bash
   git push origin main
   # 等待 Vercel 部署完成（2-5 分钟）
   ```

2. **✅ 验证 API 端点**
   ```bash
   # 测试 API 是否可用
   curl https://smart-warehouse-five.vercel.app/api/mqtt/tuya/home
   ```

3. **✅ 构建 iOS/Android**
   ```bash
   # 构建 Web 代码
   npm run build:production
   
   # 同步到 iOS
   npx cap sync ios
   
   # 同步到 Android
   npx cap sync android
   ```

4. **✅ 测试应用**
   - 在 Xcode 中运行 iOS 应用
   - 在 Android Studio 中运行 Android 应用
   - 测试配网功能

---

## ⚠️ 常见问题 / Common Issues

### 问题 1: API 端点返回 404

**原因**: Vercel 未部署或部署失败

**解决**:
1. 检查 Vercel Dashboard 部署状态
2. 查看部署日志
3. 重新部署

### 问题 2: API 端点返回 401 Unauthorized

**原因**: 环境变量未设置或错误

**解决**:
1. 检查 Vercel Dashboard → Settings → Environment Variables
2. 确保所有必要的环境变量已设置
3. 重新部署

### 问题 3: 数据库错误

**原因**: 数据库字段未添加

**解决**:
1. 确保已在 Supabase 运行 SQL 脚本
2. 验证 `tuya_home_id` 字段已添加
3. 运行 `npx prisma generate` 更新 Prisma Client

---

## 📝 检查清单 / Checklist

在测试 iOS/Android 之前：

- [ ] Vercel 已重新部署
- [ ] 新的 API 端点可用 (`/api/mqtt/tuya/home`)
- [ ] 环境变量已设置
- [ ] 数据库字段已添加 (`tuya_home_id`)
- [ ] Web 代码已构建 (`npm run build:production`)
- [ ] iOS/Android 已同步 (`npx cap sync ios/android`)

---

## 🎯 总结 / Summary

**是的，需要重新部署 Vercel**，因为：

1. ✅ 新的 API 端点需要部署
2. ✅ iOS/Android 应用连接到 Vercel
3. ✅ API 调用需要 Vercel 上的端点

**部署顺序**:
1. 部署 Vercel（通过 Git push 或 Vercel CLI）
2. 验证 API 端点
3. 构建和同步 iOS/Android
4. 测试应用

---

## 📚 相关文档 / Related Documents

- `docs/PLATFORM_UPDATE_GUIDE.md` - 平台更新指南
- `docs/TUYA_NATIVE_INTEGRATION_STATUS.md` - Tuya 集成状态
- `capacitor.config.ts` - Capacitor 配置

