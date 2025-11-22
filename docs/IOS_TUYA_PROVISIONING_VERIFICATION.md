# iOS Tuya WiFi 配网验证指南
## iOS Tuya WiFi Provisioning Verification Guide

**最后更新**: 2025-11-21

---

## 🔍 问题诊断 / Problem Diagnosis

从错误消息看：
```
配網失敗: Tuya SDK not initialized. Please check environment variables.
```

这表明 Tuya SDK 未正确初始化。

---

## ✅ 验证步骤 / Verification Steps

### 步骤 1: 检查环境变量

#### 在 Vercel 中检查

1. **登录 Vercel Dashboard**
   - https://vercel.com/dashboard
   - 选择项目: `smart-warehouse`

2. **检查环境变量**
   - 进入: **Settings → Environment Variables**
   - 确认以下变量已设置：
     ```
     TUYA_IOS_SDK_APP_KEY=xxx
     TUYA_IOS_SDK_APP_SECRET=xxx
     ```

3. **如果缺失，添加环境变量**
   - 点击 "Add New"
   - 添加 `TUYA_IOS_SDK_APP_KEY`
   - 添加 `TUYA_IOS_SDK_APP_SECRET`
   - 选择环境: **Production, Preview, Development**
   - 点击 "Save"

4. **重新部署**
   - 环境变量更改后需要重新部署
   - 或等待下次自动部署

#### 在本地检查

```bash
# 检查 .env.local
grep "TUYA_IOS_SDK" .env.local

# 应该看到：
# TUYA_IOS_SDK_APP_KEY=xxx
# TUYA_IOS_SDK_APP_SECRET=xxx
```

---

### 步骤 2: 验证 API 端点

#### 测试 SDK 配置 API

```bash
# 测试 API 端点是否可用
curl https://smart-warehouse-five.vercel.app/api/mqtt/tuya/sdk-config

# 应该返回 JSON:
# {
#   "appKey": "xxx",
#   "appSecret": "xxx"
# }
```

**如果返回错误**:
- 检查环境变量是否已设置
- 检查 Vercel 是否已重新部署
- **注意**: 如果返回 404，API 路由可能还未部署，需要先提交代码并等待 Vercel 部署

---

### 步骤 3: 检查 iOS 插件初始化

#### 查看初始化流程

1. **打开 Xcode**
   ```bash
   npx cap open ios
   ```

2. **检查插件代码**
   - 打开: `ios/App/App/Plugins/TuyaProvisioningPlugin.swift`
   - 查看 `initialize()` 方法
   - 确认它接收 `appKey` 和 `appSecret`

3. **检查日志**
   - 在 Xcode 中运行应用
   - 打开 Console (⌘⇧Y)
   - 查看是否有初始化错误

---

### 步骤 4: 验证配网流程

#### 在 iOS 应用中测试

1. **打开应用**
   - 在 Xcode 中运行到设备或模拟器
   - 登录应用

2. **打开配网界面**
   - 导航到 MQTT/IoT 页面
   - 点击 "Tuya 配網" 按钮

3. **检查初始化**
   - 应用应该自动调用 `ensureTuyaInitialized()`
   - 这会从 API 获取 SDK 凭证
   - 然后调用 iOS 插件的 `initialize()` 方法

4. **查看控制台日志**
   - 在 Xcode Console 中查看日志
   - 应该看到:
     ```
     ✅ Tuya SDK initialized successfully
     ```
   - 如果有错误，查看错误消息

---

## 🐛 故障排除 / Troubleshooting

### 问题 1: "Tuya SDK not initialized"

**可能原因**:
1. 环境变量未设置
2. API 端点返回错误
3. iOS 插件初始化失败

**解决步骤**:

1. **检查环境变量**
   ```bash
   # 在 Vercel Dashboard 中检查
   # Settings → Environment Variables
   ```

2. **测试 API 端点**
   ```bash
   curl https://smart-warehouse-five.vercel.app/api/mqtt/tuya/sdk-config
   ```

3. **检查 iOS 日志**
   - 在 Xcode Console 中查看
   - 查找初始化错误

4. **手动初始化（测试）**
   - 在 Xcode 中设置断点
   - 检查 `initialize()` 方法是否被调用
   - 检查参数是否正确传递

---

### 问题 2: API 端点返回 401 或错误

**可能原因**:
- 环境变量未正确设置
- Vercel 未重新部署

**解决**:
1. 检查 Vercel 环境变量
2. 重新部署 Vercel
3. 等待部署完成（2-5 分钟）
4. 再次测试

---

### 问题 3: iOS 插件未调用

**可能原因**:
- 插件未正确注册
- Capacitor 同步问题

**解决**:
```bash
# 重新同步 iOS
npx cap sync ios

# 在 Xcode 中
# Product → Clean Build Folder (⇧⌘K)
# Product → Build (⌘B)
```

---

## 🧪 测试步骤 / Testing Steps

### 完整测试流程

1. **准备设备**
   - 确保 iOS 设备连接到同一 WiFi 网络
   - 确保 Tuya 设备处于配网模式（快速闪烁）

2. **打开应用**
   - 在 Xcode 中运行到真实设备（不是模拟器）
   - 登录应用

3. **开始配网**
   - 导航到 MQTT/IoT 页面
   - 点击 "Tuya 配網"
   - 输入 WiFi SSID 和密码
   - 选择配网模式（推荐：自动）
   - 点击 "開始配網"

4. **观察过程**
   - 查看应用状态更新
   - 查看 Xcode Console 日志
   - 等待配网完成（通常 30-60 秒）

5. **验证结果**
   - 如果成功：设备会出现在设备列表中
   - 如果失败：查看错误消息

---

## 📝 验证检查清单 / Verification Checklist

### 环境配置
- [ ] Vercel 环境变量已设置 (`TUYA_IOS_SDK_APP_KEY`, `TUYA_IOS_SDK_APP_SECRET`)
- [ ] Vercel 已重新部署
- [ ] API 端点 `/api/mqtt/tuya/sdk-config` 返回正确数据

### iOS 配置
- [ ] iOS 插件已正确注册
- [ ] CocoaPods 已安装（164 个 pods）
- [ ] Tuya SDK 已集成
- [ ] Info.plist 权限已添加

### 测试环境
- [ ] 在真实 iOS 设备上测试（不是模拟器）
- [ ] 设备连接到 WiFi
- [ ] Tuya 设备处于配网模式
- [ ] Xcode Console 已打开

---

## 🔍 调试技巧 / Debugging Tips

### 1. 查看 Xcode Console 日志

在 Xcode 中：
1. 运行应用
2. 打开 Console (⌘⇧Y)
3. 过滤: `Tuya` 或 `Provisioning`
4. 查看所有相关日志

### 2. 添加断点

在 `TuyaProvisioningPlugin.swift` 中：
- `initialize()` 方法开始处
- `startProvisioning()` 方法开始处
- 检查参数是否正确传递

### 3. 检查网络请求

在 Xcode 中：
1. 打开 Network Inspector
2. 查看对 `/api/mqtt/tuya/sdk-config` 的请求
3. 检查响应是否正确

### 4. 测试 API 端点

```bash
# 测试 SDK 配置 API
curl https://smart-warehouse-five.vercel.app/api/mqtt/tuya/sdk-config

# 应该返回：
# {"appKey":"xxx","appSecret":"xxx"}
```

---

## 📋 常见错误和解决方案 / Common Errors

### 错误 1: "Tuya SDK not initialized"

**原因**: SDK 初始化失败

**解决**:
1. 检查环境变量
2. 检查 API 端点
3. 查看 Xcode Console 错误

### 错误 2: "No Tuya home available"

**原因**: 没有 Tuya Home

**解决**:
- 插件会自动创建 Home（使用 Household 名称）
- 如果失败，检查 Home 创建逻辑

### 错误 3: "Provisioning timeout"

**原因**: 配网超时

**解决**:
1. 确保设备处于配网模式
2. 确保 WiFi 密码正确
3. 确保设备在同一 WiFi 网络范围内

---

## 🎯 成功标志 / Success Indicators

配网成功时，你应该看到：

1. **应用显示**:
   - "配網成功！" 消息
   - 设备出现在设备列表中

2. **Xcode Console**:
   ```
   ✅ Tuya SDK initialized successfully
   ✅ Provisioning started
   ✅ Device discovered: [deviceId]
   ✅ Provisioning completed successfully
   ```

3. **设备信息**:
   - 设备 ID
   - 设备名称
   - Tuya Home ID
   - Household 对应关系已更新

---

## 📚 相关文档 / Related Documents

- `docs/TUYA_IOS_INTEGRATION_STATUS.md` - iOS 集成状态
- `docs/TUYA_SDK_SETUP.md` - SDK 设置指南
- `ios/App/App/Plugins/TuyaProvisioningPlugin.swift` - iOS 插件实现
- `lib/provisioning/native-client.ts` - 原生客户端工具

---

## ✅ 快速验证命令 / Quick Verification Commands

```bash
# 1. 检查环境变量（本地）
grep "TUYA_IOS_SDK" .env.local

# 2. 测试 API 端点
curl https://smart-warehouse-five.vercel.app/api/mqtt/tuya/sdk-config

# 3. 重新同步 iOS
npx cap sync ios

# 4. 打开 Xcode
npx cap open ios
```

---

## 🎯 下一步 / Next Steps

1. **检查环境变量** - 确保 Vercel 中已设置
2. **测试 API 端点** - 验证返回正确数据
3. **在真实设备上测试** - 不是模拟器
4. **查看 Xcode Console** - 查看详细日志
5. **测试配网流程** - 使用真实的 Tuya 设备

