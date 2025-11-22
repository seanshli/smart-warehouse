# iOS Tuya 和 WiFi 问题诊断
## iOS Tuya and WiFi Issues Diagnosis

**最后更新**: 2025-11-21

---

## 🔍 问题分析

### 问题 1: Tuya SDK 未初始化

**错误信息**: "Tuya SDK not initialized. Please check environment variables."

**可能原因**:
1. 环境变量未在 Vercel 中设置
2. API 端点 `/api/mqtt/tuya/sdk-config` 返回错误
3. SDK 初始化在配网前未调用

**检查步骤**:

1. **检查环境变量** (Vercel Dashboard):
   - `TUYA_IOS_SDK_APP_KEY` - 必须设置
   - `TUYA_IOS_SDK_APP_SECRET` - 必须设置

2. **检查 API 端点**:
   ```bash
   curl https://your-domain.com/api/mqtt/tuya/sdk-config?platform=ios
   ```
   应该返回 JSON:
   ```json
   {
     "appKey": "...",
     "appSecret": "..."
   }
   ```

3. **检查初始化流程**:
   - 在 `ProvisioningModal.tsx` 中，配网前应该调用 `ensureTuyaInitialized()`
   - 检查控制台日志，看是否有初始化错误

---

### 问题 2: WiFi 扫描不可用

**错误信息**: "WiFi scanning is not available on Vercel..."

**iOS 限制**:
- iOS 14+ 不允许应用直接扫描 WiFi 网络
- 只能获取当前连接的 WiFi SSID
- 需要位置权限，但即使有权限也无法扫描其他网络

**当前实现**:
- `WiFiPlugin.swift` 只能返回当前连接的 WiFi
- 无法扫描周围的 WiFi 网络（iOS 安全限制）

**解决方案**:

1. **使用手动输入**（推荐）:
   - 用户手动输入 SSID 和密码
   - 应用可以记住密码

2. **使用已保存的网络**:
   - 从 Keychain/UserDefaults 加载已保存的 WiFi
   - 显示已保存的网络列表供选择

3. **改进 UI 提示**:
   - 明确告知用户 iOS 无法扫描 WiFi
   - 提供手动输入和已保存网络选项

---

## 🔧 修复方案

### 修复 1: 确保 Tuya SDK 初始化

**在 `ProvisioningModal.tsx` 中**:

```typescript
// 在开始配网前，确保 SDK 已初始化
const handleStartProvisioning = async () => {
  try {
    // 1. 先初始化 SDK
    const initialized = await ensureTuyaInitialized()
    if (!initialized) {
      toast.error('Tuya SDK 初始化失败。请检查环境变量配置。')
      return
    }
    
    // 2. 然后开始配网
    await startProvisioning(...)
  } catch (error) {
    console.error('Provisioning error:', error)
    toast.error(error.message || '配网失败')
  }
}
```

### 修复 2: 改进 WiFi 扫描 UI

**在 `ProvisioningModal.tsx` 中**:

```typescript
// 检测平台并显示相应提示
const { Capacitor } = await import('@capacitor/core')
const platform = Capacitor.getPlatform()

if (platform === 'ios') {
  // iOS 无法扫描 WiFi，显示手动输入选项
  // 隐藏"扫描 WiFi"按钮，或显示"iOS 不支持扫描"提示
}
```

---

## 📋 检查清单

### Tuya SDK 初始化

- [ ] Vercel 环境变量已设置 `TUYA_IOS_SDK_APP_KEY`
- [ ] Vercel 环境变量已设置 `TUYA_IOS_SDK_APP_SECRET`
- [ ] API 端点 `/api/mqtt/tuya/sdk-config?platform=ios` 返回正确数据
- [ ] 配网前调用了 `ensureTuyaInitialized()`
- [ ] 初始化成功后才开始配网

### WiFi 扫描

- [ ] 了解 iOS 无法扫描 WiFi 的限制
- [ ] UI 提供手动输入选项
- [ ] UI 提供已保存网络选择
- [ ] 显示清晰的提示信息

---

## 🚀 立即修复步骤

### 步骤 1: 检查环境变量

1. 打开 Vercel Dashboard
2. 进入项目设置 → Environment Variables
3. 确认以下变量存在：
   - `TUYA_IOS_SDK_APP_KEY`
   - `TUYA_IOS_SDK_APP_SECRET`

### 步骤 2: 重新部署

如果环境变量已设置，重新部署应用：

```bash
git commit --allow-empty -m "Trigger redeploy for Tuya SDK config"
git push
```

### 步骤 3: 测试 API 端点

在浏览器中访问：
```
https://your-domain.com/api/mqtt/tuya/sdk-config?platform=ios
```

应该返回 JSON 数据，而不是错误。

### 步骤 4: 检查代码

确保 `ProvisioningModal.tsx` 在配网前调用初始化：

```typescript
// 在配网开始前
const initialized = await ensureTuyaInitialized()
if (!initialized) {
  // 显示错误并停止
  return
}
```

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

---

## 🔗 相关文件

- `lib/provisioning/native-client.ts` - Tuya SDK 初始化逻辑
- `app/api/mqtt/tuya/sdk-config/route.ts` - SDK 凭证 API
- `components/mqtt/ProvisioningModal.tsx` - 配网 UI
- `ios/App/App/Plugins/WiFiPlugin.swift` - iOS WiFi 插件
- `lib/wifi-scanner.ts` - WiFi 扫描工具

---

**修复后，Tuya 配网应该可以正常工作！** ✅

