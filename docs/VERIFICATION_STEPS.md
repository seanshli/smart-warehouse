# 验证步骤指南
## Verification Steps Guide

**最后更新**: 2025-11-21

---

## 🚀 快速开始

### 步骤 1: 运行验证脚本

#### 1.1 Tuya Token 验证
```bash
npm run verify:tuya-token
```

**验证内容**:
- ✅ 数据库结构（token 字段）
- ✅ Token 管理函数
- ✅ Token 有效性检查
- ✅ API 端点测试
- ✅ 环境变量检查
- ✅ SDK 配置验证

#### 1.2 WiFi 和 Tuya 连接验证
```bash
npm run verify:wifi-tuya
```

**验证内容**:
- ✅ WiFi 插件可用性
- ✅ 权限状态
- ✅ 密码保存/获取功能
- ✅ Tuya SDK 配置
- ✅ 数据库结构
- ✅ API 端点可用性

---

### 步骤 2: 检查环境变量

#### 2.1 本地环境变量（`.env.local`）
确保以下变量已设置：
```env
TUYA_IOS_SDK_APP_KEY=your-ios-app-key
TUYA_IOS_SDK_APP_SECRET=your-ios-app-secret
TUYA_ANDROID_SDK_APP_KEY=your-android-app-key
TUYA_ANDROID_SDK_APP_SECRET=your-android-app-secret
TUYA_ANDROID_SDK_SHA256=your-android-sha256
```

#### 2.2 Vercel 环境变量
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目: Smart Warehouse
3. 进入 Settings → Environment Variables
4. 确保所有 Tuya SDK 变量已设置

**必需变量**:
- `TUYA_IOS_SDK_APP_KEY`
- `TUYA_IOS_SDK_APP_SECRET`
- `TUYA_ANDROID_SDK_APP_KEY`
- `TUYA_ANDROID_SDK_APP_SECRET`
- `TUYA_ANDROID_SDK_SHA256`

---

### 步骤 3: 检查数据库

#### 3.1 检查 Tuya 账户字段
在 Supabase Dashboard 中运行：
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name LIKE 'tuya%';
```

**应该看到**:
- `tuya_account` (text)
- `tuya_password` (text)
- `tuya_country_code` (text)
- `tuya_access_token` (text)
- `tuya_token_expires_at` (timestamp)

#### 3.2 如果字段不存在
运行迁移脚本：
```sql
-- 在 Supabase SQL Editor 中运行
-- 文件: scripts/add-tuya-user-account-fields.sql
```

---

### 步骤 4: 在移动应用中测试

#### 4.1 iOS 测试
```bash
# 1. 同步 iOS 项目
npx cap sync ios

# 2. 打开 Xcode
open ios/App/App.xcworkspace

# 3. 构建并运行
# 在 Xcode 中: Product → Run (Cmd+R)
```

**测试步骤**:
1. 打开应用
2. 进入 MQTT 面板
3. 点击"配网设备"
4. 选择 Tuya 品牌
5. 测试以下功能：
   - ✅ 自动获取当前 WiFi SSID
   - ✅ WiFi 扫描功能
   - ✅ 手动输入 SSID
   - ✅ 密码保存和自动填充
   - ✅ Tuya 账户自动创建
   - ✅ Tuya 自动登录
   - ✅ 配网功能

#### 4.2 Android 测试
```bash
# 1. 同步 Android 项目
npx cap sync android

# 2. 打开 Android Studio
# Android Studio → Open → android/

# 3. 构建并运行
# 在 Android Studio 中: Run → Run 'app'
```

**测试步骤**: 同 iOS

---

### 步骤 5: 验证 API 端点

#### 5.1 测试 SDK 配置 API
```bash
# iOS 配置
curl https://smart-warehouse-five.vercel.app/api/mqtt/tuya/sdk-config?platform=ios

# Android 配置
curl https://smart-warehouse-five.vercel.app/api/mqtt/tuya/sdk-config?platform=android
```

**预期响应**:
```json
{
  "appKey": "...",
  "appSecret": "..."
}
```

#### 5.2 测试账户 API（需要登录）
```bash
# 获取账户信息
curl -X GET https://smart-warehouse-five.vercel.app/api/user/tuya-account \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"

# 自动创建账户
curl -X POST https://smart-warehouse-five.vercel.app/api/user/tuya-account/auto-create \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

---

## 📋 完整验证清单

### 数据库
- [ ] Tuya 账户字段已添加
- [ ] 字段类型正确
- [ ] 可以存储和读取数据

### 环境变量
- [ ] iOS SDK 凭证已设置
- [ ] Android SDK 凭证已设置
- [ ] Vercel 环境变量已同步

### API 端点
- [ ] SDK 配置 API 可用
- [ ] 账户管理 API 可用
- [ ] 登录 API 可用
- [ ] 登录状态 API 可用

### 移动应用
- [ ] iOS 应用可以构建
- [ ] Android 应用可以构建
- [ ] WiFi 扫描功能正常
- [ ] SSID 输入功能正常
- [ ] 密码保存功能正常
- [ ] Tuya 账户自动创建正常
- [ ] Tuya 登录功能正常
- [ ] 配网功能正常

---

## 🐛 常见问题

### 验证脚本失败
**问题**: `npm run verify:tuya-token` 失败

**解决方案**:
1. 检查数据库连接
2. 确保 `.env.local` 文件存在
3. 检查环境变量是否设置
4. 查看错误日志

### API 端点返回 401
**问题**: API 端点返回未授权错误

**解决方案**:
1. 确保已登录
2. 检查会话 cookie
3. 检查 NextAuth 配置

### 移动应用无法获取 WiFi
**问题**: 无法获取当前 WiFi SSID

**解决方案**:
1. 检查位置权限是否已授予
2. 检查 Info.plist 中的权限描述
3. 在设备设置中手动授予权限
4. 重启应用

---

## 📝 测试报告

完成验证后，记录测试结果：

```
测试日期: [日期]
测试平台: [iOS/Android/Web]
测试人员: [姓名]

验证脚本:
- [ ] npm run verify:tuya-token: [通过/失败]
- [ ] npm run verify:wifi-tuya: [通过/失败]

环境变量:
- [ ] iOS SDK 凭证: [已设置/未设置]
- [ ] Android SDK 凭证: [已设置/未设置]

数据库:
- [ ] Tuya 字段: [存在/不存在]

移动应用测试:
- [ ] WiFi 扫描: [通过/失败]
- [ ] SSID 输入: [通过/失败]
- [ ] 密码保存: [通过/失败]
- [ ] Tuya 账户创建: [通过/失败]
- [ ] Tuya 登录: [通过/失败]
- [ ] 配网功能: [通过/失败]

问题记录:
[记录任何发现的问题]

备注:
[其他备注]
```

---

## 🎯 快速命令参考

```bash
# 验证 Tuya Token
npm run verify:tuya-token

# 验证 WiFi 和 Tuya 连接
npm run verify:wifi-tuya

# 同步 iOS
npx cap sync ios

# 同步 Android
npx cap sync android

# 打开 iOS 项目
open ios/App/App.xcworkspace

# 打开 Android 项目
# Android Studio → Open → android/
```

---

## 📖 相关文档

- `docs/TUYA_TOKEN_VERIFICATION.md` - Tuya Token 详细验证指南
- `docs/VERIFY_WIFI_TUYA_CONNECTION.md` - WiFi 和 Tuya 连接验证指南
- `docs/IOS_NATIVE_PLUGIN_DEBUG.md` - iOS 原生插件调试指南

---

## ✅ 完成标准

所有验证通过后，应该：
- ✅ 验证脚本无错误
- ✅ 环境变量已设置
- ✅ 数据库字段存在
- ✅ API 端点可用
- ✅ 移动应用功能正常

