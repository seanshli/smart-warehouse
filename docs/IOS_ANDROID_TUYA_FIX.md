# iOS/Android Tuya 和 WiFi 问题修复指南
## iOS/Android Tuya and WiFi Issues Fix Guide

**最后更新**: 2025-11-21

---

## 🔍 问题诊断

### 问题 1: "Tuya SDK not initialized"

**错误原因**:
- Vercel 环境变量未设置或配置错误
- API 端点 `/api/mqtt/tuya/sdk-config` 返回错误

**修复步骤**:

1. **检查 Vercel 环境变量**:
   - 登录 Vercel Dashboard
   - 进入项目 → Settings → Environment Variables
   - 确认以下变量存在：
     - `TUYA_IOS_SDK_APP_KEY` (iOS)
     - `TUYA_IOS_SDK_APP_SECRET` (iOS)
     - `TUYA_ANDROID_SDK_APP_KEY` (Android)
     - `TUYA_ANDROID_SDK_APP_SECRET` (Android)
     - `TUYA_ANDROID_SDK_SHA256` (Android，可选)

2. **测试 API 端点**:
   ```bash
   # iOS
   curl https://your-domain.com/api/mqtt/tuya/sdk-config?platform=ios
   
   # Android
   curl https://your-domain.com/api/mqtt/tuya/sdk-config?platform=android
   ```
   
   应该返回:
   ```json
   {
     "appKey": "...",
     "appSecret": "..."
   }
   ```

3. **重新部署**:
   - 如果环境变量已设置，重新部署应用
   - Vercel 会自动使用新的环境变量

---

### 问题 2: iOS WiFi 扫描不可用

**根本原因**:
- iOS 14+ 不允许应用扫描 WiFi 网络（Apple 安全限制）
- 只能获取当前连接的 WiFi SSID

**当前实现**:
- `WiFiPlugin.swift` 只能返回当前连接的 WiFi
- 无法扫描周围的 WiFi 网络

**解决方案**:

1. **手动输入**（推荐）:
   - 用户手动输入 SSID 和密码
   - 应用记住密码供下次使用

2. **已保存网络**:
   - 从 Keychain/UserDefaults 加载已保存的 WiFi
   - 显示已保存的网络列表

3. **改进 UI 提示**:
   - 明确告知用户 iOS 无法扫描 WiFi
   - 提供清晰的手动输入选项

---

## 🔧 已实施的修复

### 修复 1: 改进错误提示

**文件**: `lib/provisioning/native-client.ts`

**改进**:
- 更详细的错误信息
- 明确指出缺少的环境变量
- 提供诊断信息

**错误信息示例**:
```
Tuya SDK not initialized. Please check environment variables in Vercel: 
TUYA_IOS_SDK_APP_KEY and TUYA_IOS_SDK_APP_SECRET
```

---

## 📋 检查清单

### Tuya SDK 初始化

- [ ] Vercel 环境变量已设置
  - [ ] `TUYA_IOS_SDK_APP_KEY`
  - [ ] `TUYA_IOS_SDK_APP_SECRET`
  - [ ] `TUYA_ANDROID_SDK_APP_KEY` (Android)
  - [ ] `TUYA_ANDROID_SDK_APP_SECRET` (Android)
- [ ] API 端点返回正确数据
- [ ] 应用已重新部署
- [ ] 测试配网功能

### WiFi 扫描

- [ ] 了解 iOS 限制
- [ ] UI 提供手动输入
- [ ] UI 显示已保存网络
- [ ] 显示清晰的提示信息

---

## 🚀 立即行动

### 步骤 1: 检查环境变量

1. 打开 Vercel Dashboard
2. 进入项目设置 → Environment Variables
3. 确认所有 Tuya SDK 变量已设置

### 步骤 2: 重新部署

```bash
# 触发重新部署
git commit --allow-empty -m "Trigger redeploy for Tuya SDK"
git push
```

### 步骤 3: 测试

1. 打开 iOS 应用
2. 尝试 Tuya 配网
3. 检查错误信息是否更清晰
4. 如果仍有错误，检查 Vercel 日志

---

## 📝 iOS WiFi 扫描限制说明

**重要**: iOS 14+ 不允许应用扫描 WiFi 网络。这是 Apple 的安全限制。

**可用功能**:
- ✅ 获取当前连接的 WiFi SSID
- ✅ 保存 WiFi 密码到 Keychain
- ✅ 从 Keychain 读取已保存的密码
- ✅ 显示已保存的网络列表

**不可用功能**:
- ❌ 扫描周围的 WiFi 网络
- ❌ 获取其他网络的信号强度
- ❌ 获取其他网络的安全类型

**建议**:
- 提供手动输入 SSID 和密码的选项
- 记住用户输入的 WiFi 密码
- 显示已保存的网络供选择
- 在 UI 中明确说明 iOS 限制

---

## 🔗 相关文件

- `lib/provisioning/native-client.ts` - Tuya SDK 初始化（已修复）
- `app/api/mqtt/tuya/sdk-config/route.ts` - SDK 凭证 API
- `components/mqtt/ProvisioningModal.tsx` - 配网 UI
- `ios/App/App/Plugins/WiFiPlugin.swift` - iOS WiFi 插件
- `lib/wifi-scanner.ts` - WiFi 扫描工具

---

**修复后，请重新部署并测试！** ✅

