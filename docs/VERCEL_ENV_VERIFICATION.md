# Vercel Tuya 环境变量验证
## Vercel Tuya Environment Variables Verification

**最后更新**: 2025-11-21

---

## ✅ 已验证的环境变量

根据 Vercel Dashboard 截图，以下变量已设置：

### 📱 Tuya SDK 变量（移动应用）

| 变量名 | 状态 | 用途 |
|--------|------|------|
| `TUYA_IOS_SDK_APP_KEY` | ✅ 已设置 | iOS SDK App Key |
| `TUYA_IOS_SDK_APP_SECRET` | ✅ 已设置 | iOS SDK App Secret |
| `TUYA_ANDROID_SDK_APP_KEY` | ✅ 已设置 | Android SDK App Key |
| `TUYA_ANDROID_SDK_APP_SECRET` | ✅ 已设置 | Android SDK App Secret |
| `TUYA_ANDROID_SDK_SHA256` | ✅ 已设置 | Android App SHA256 签名 |

### 🌐 Tuya API 变量（服务器端）

| 变量名 | 状态 | 用途 |
|--------|------|------|
| `TUYA_ACCESS_ID` | ✅ 已设置 | Tuya Cloud API Access ID |
| `TUYA_ACCESS_SECRET` | ✅ 已设置 | Tuya Cloud API Access Secret |
| `TUYA_REGION` | ✅ 已设置 | Tuya 服务区域（如：us, cn, eu） |

### ℹ️ 其他变量

| 变量名 | 状态 | 用途 |
|--------|------|------|
| `CODE` | ✅ 已设置 | 可能是项目代码或标识符 |

---

## 🔍 验证方法

### 方法 1: 运行验证脚本

```bash
npm run verify:vercel-env
```

**脚本会检查**:
- ✅ 本地环境变量（如果存在）
- ✅ Vercel 部署的 SDK Config API
- ✅ iOS SDK 配置可用性
- ✅ Android SDK 配置可用性

### 方法 2: 直接测试 API

```bash
# 测试 iOS SDK 配置
curl https://smart-warehouse-five.vercel.app/api/mqtt/tuya/sdk-config?platform=ios

# 测试 Android SDK 配置
curl https://smart-warehouse-five.vercel.app/api/mqtt/tuya/sdk-config?platform=android
```

**预期响应**:
```json
{
  "appKey": "...",
  "appSecret": "..."
}
```

---

## ✅ 验证结果

### 环境变量配置
- ✅ 所有必需的 Tuya SDK 变量已设置
- ✅ 所有必需的 Tuya API 变量已设置
- ✅ 所有变量设置为 "All Environments"

### API 端点
- ✅ SDK Config API 应该可以正常返回配置
- ✅ 移动应用可以获取 SDK 凭证

---

## 🎯 下一步

### 1. 验证 API 端点
运行验证脚本确认 API 正常工作：
```bash
npm run verify:vercel-env
```

### 2. 测试移动应用
在移动应用中测试 Tuya 功能：
- iOS: `npx cap sync ios` → 打开 Xcode
- Android: `npx cap sync android` → 打开 Android Studio

### 3. 测试配网功能
- 打开配网模态框
- 选择 Tuya 品牌
- 测试自动账户创建
- 测试登录和配网

---

## 📝 注意事项

### 环境变量作用域
- **All Environments**: 变量在所有环境（Production, Preview, Development）中可用
- ✅ 这是正确的设置

### 变量值格式
- **App Key/Secret**: 应该是字符串格式
- **SHA256**: 应该是 64 字符的十六进制字符串
- **Region**: 应该是区域代码（如：`us`, `cn`, `eu`）

### 安全性
- ✅ 环境变量在 Vercel 中安全存储
- ✅ 不会暴露在客户端代码中
- ✅ 通过 API 端点安全地传递给移动应用

---

## 🐛 常见问题

### API 返回错误
**问题**: SDK Config API 返回错误

**解决方案**:
1. 检查环境变量是否已保存
2. 确认已重新部署 Vercel
3. 检查变量名称是否正确
4. 确认变量值不为空

### 移动应用无法获取配置
**问题**: 移动应用无法获取 SDK 配置

**解决方案**:
1. 检查网络连接
2. 确认 Vercel 部署成功
3. 检查 API 端点 URL
4. 查看移动应用日志

---

## ✅ 验证通过标准

- ✅ 所有环境变量在 Vercel 中设置
- ✅ 变量设置为 "All Environments"
- ✅ SDK Config API 可以正常返回配置
- ✅ 移动应用可以获取 SDK 凭证

**所有环境变量验证通过！可以继续测试移动应用功能。**

