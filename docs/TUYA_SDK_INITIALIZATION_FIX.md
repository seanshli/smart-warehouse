# Tuya SDK 初始化问题修复指南

## 🔍 问题诊断

### 错误信息
```
配網失敗: Tuya SDK not initialized. Please check environment variables in Vercel: TUYA_IOS_SDK_APP_KEY and TUYA_IOS_SDK_APP_SECRET
```

### 问题分析
1. **SDK 初始化失败**：`ensureTuyaInitialized()` 返回 `false`
2. **环境变量缺失**：Vercel 可能未设置 Tuya SDK 环境变量
3. **API 端点错误**：`/api/mqtt/tuya/sdk-config` 可能返回错误

## ✅ 原生 SDK UI 验证

### iOS 实现
- ✅ **使用原生 SDK UI**：`ThingSmartActivator.sharedInstance().startConfigWiFi()`
- ✅ **自动显示配网 UI**：SDK 会自动显示原生配网界面
- ✅ **BizBundle 集成**：使用 `ThingSmartActivatorBizBundle`

### Android 实现
- ✅ **使用 BizBundle UI**：`ThingActivatorManager.getInstance().startActivator()`
- ✅ **自动显示配网 UI**：BizBundle 会自动启动配网 Activity
- ✅ **BizBundle 依赖**：`thingsmart-bizbundle-device_activator` 已配置

## 🔧 修复步骤

### 1. 检查 Vercel 环境变量

在 Vercel Dashboard 中设置以下环境变量：

**iOS:**
```
TUYA_IOS_SDK_APP_KEY=your-ios-app-key
TUYA_IOS_SDK_APP_SECRET=your-ios-app-secret
```

**Android:**
```
TUYA_ANDROID_SDK_APP_KEY=your-android-app-key
TUYA_ANDROID_SDK_APP_SECRET=your-android-app-secret
TUYA_ANDROID_SDK_SHA256=your-android-sha256 (可选)
```

### 2. 验证 API 端点

访问以下 URL 验证配置是否正确：
- iOS: `https://smart-warehouse-five.vercel.app/api/mqtt/tuya/sdk-config?platform=ios`
- Android: `https://smart-warehouse-five.vercel.app/api/mqtt/tuya/sdk-config?platform=android`

应该返回：
```json
{
  "appKey": "...",
  "appSecret": "...",
  "sha256": "..." // Android only
}
```

### 3. 检查初始化流程

初始化流程：
1. `canUseNativeTuyaProvisioning()` - 检查是否为原生平台
2. 从 `/api/mqtt/tuya/sdk-config` 获取配置
3. 调用 `TuyaProvisioning.initialize()` 初始化 SDK
4. 自动创建/登录 Tuya 账户
5. 返回初始化状态

### 4. 调试日志

已添加详细的控制台日志：
- `🔍 Fetching Tuya SDK config...`
- `📦 Tuya SDK config received`
- `🚀 Initializing Tuya SDK...`
- `✅ Tuya SDK initialized successfully`
- `❌` 错误信息

## 📱 原生 UI 确认

### iOS
- **方法**：`ThingSmartActivator.sharedInstance().startConfigWiFi()`
- **UI**：SDK 自动显示原生配网界面
- **流程**：用户跟随 SDK 原生 UI 完成配网

### Android
- **方法**：`ThingActivatorManager.getInstance().startActivator()`
- **UI**：BizBundle 自动启动配网 Activity
- **流程**：用户跟随 BizBundle UI 完成配网

## 🚀 测试步骤

1. **设置环境变量**：在 Vercel Dashboard 中设置所有必需的环境变量
2. **重新部署**：触发 Vercel 重新部署以加载新环境变量
3. **测试 API**：访问 `/api/mqtt/tuya/sdk-config?platform=ios` 验证配置
4. **测试初始化**：在移动应用中尝试配网，查看控制台日志
5. **验证 UI**：确认显示的是 SDK 原生 UI，而不是 Web UI

## ⚠️ 注意事项

1. **环境变量区分**：
   - iOS 使用 `TUYA_IOS_SDK_APP_KEY/SECRET`
   - Android 使用 `TUYA_ANDROID_SDK_APP_KEY/SECRET`
   - 这些与云 API 凭证不同

2. **API 端点**：
   - 必须在 Vercel 上可访问
   - 需要正确的 CORS 配置
   - 需要用户认证（credentials: 'include'）

3. **原生平台检测**：
   - `canUseNativeTuyaProvisioning()` 必须返回 `true`
   - 仅在 iOS/Android 原生平台上工作
   - Web 平台会回退到 Web API

## 🔗 MQTT 链接

✅ **已实现**：
- 配网成功后自动调用 `autoAddDevice`
- 自动设置 `connectionType: 'mqtt'`
- 设备自动连接到 MQTT Broker

## 📝 下一步

1. 在 Vercel Dashboard 中设置环境变量
2. 重新部署应用
3. 测试配网流程
4. 验证原生 UI 显示
5. 检查控制台日志以诊断问题

