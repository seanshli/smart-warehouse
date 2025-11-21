# Midea 空调使用指南
## Midea Air Conditioner Usage Guide

## 📋 简单回答 / Simple Answer

**如果你有 Midea 空调，现在可以：**

### ✅ **可以控制** / **Can Control**
- ✅ 开关电源
- ✅ 调节温度
- ✅ 切换模式（制冷/制热/除湿等）
- ✅ 调节风速
- ✅ 控制摆风

### ❌ **不能配网** / **Cannot Provision**
- ❌ 目前无法通过我们的 App 直接配网
- ❌ 需要先用 Midea 官方 App 配网

---

## 🚀 使用步骤 / Usage Steps

### 步骤 1: 配网（使用 Midea 官方 App）

1. **下载 Midea 官方 App**
   - iOS: 搜索 "Midea" 或 "美的"
   - Android: 搜索 "Midea" 或 "美的"

2. **配网空调**
   - 打开 Midea App
   - 按照提示配网空调
   - 确保空调连接到 Wi-Fi
   - 记录设备 ID（如果有）

3. **确认 MQTT 连接**
   - 确保空调已连接到你的 MQTT Broker（EMQX）
   - 检查 MQTT 主题：`midea/{device_id}/status`

### 步骤 2: 在 Smart Warehouse 中添加设备

1. **手动添加设备**
   - 打开 Smart Warehouse App
   - 进入 **MQTT Devices** 标签
   - 点击 **Add Device** 按钮

2. **填写设备信息**
   - **Device ID**: 输入从 Midea App 获取的设备 ID
   - **Name**: 输入设备名称（如 "客厅空调"）
   - **Vendor**: 选择 **Midea**
   - **Connection Type**: 选择 **MQTT**
   - **Topic**: `midea/{device_id}/status`
   - **Command Topic**: `midea/{device_id}/command`
   - **Status Topic**: `midea/{device_id}/status`

3. **保存设备**
   - 点击 **Add Device** 完成添加

### 步骤 3: 控制空调

添加成功后，你可以：

1. **查看设备状态**
   - 在设备列表中查看当前温度、模式等

2. **控制设备**
   - 点击设备进入控制页面
   - 可以控制：
     - 开关
     - 温度（16-30°C）
     - 模式（制冷/制热/除湿/送风）
     - 风速（1-5 档）
     - 摆风（开/关）

---

## 📡 MQTT 主题格式 / MQTT Topic Format

### 状态主题（设备 → 服务器）
```
midea/{device_id}/status
```

**消息格式**:
```json
{
  "power": true,
  "mode": "cool",
  "targetTemp": 25,
  "currentTemp": 26,
  "fanSpeed": 3,
  "swing": false
}
```

### 命令主题（服务器 → 设备）
```
midea/{device_id}/command
```

**命令格式**:
```json
{
  "cmd": "set_temp",
  "data": {
    "temp": 25
  },
  "timestamp": 1234567890
}
```

**支持的命令**:
- `power` - 开关
- `set_temp` - 设置温度
- `set_mode` - 设置模式
- `set_fan` - 设置风速
- `set_swing` - 设置摆风

---

## ⚠️ 注意事项 / Important Notes

1. **配网限制**
   - 目前无法通过 Smart Warehouse 直接配网
   - 必须先用 Midea 官方 App 配网
   - 配网功能正在开发中（需要 Midea SDK）

2. **MQTT 要求**
   - 空调必须连接到你的 MQTT Broker
   - 确保 MQTT Broker 正常运行
   - 检查网络连接

3. **设备 ID**
   - 设备 ID 可以从 Midea App 获取
   - 或从 MQTT Broker 日志中查看
   - 格式通常是数字或字符串

4. **温度范围**
   - 通常支持 16-30°C
   - 具体范围取决于空调型号

---

## 🔧 故障排除 / Troubleshooting

### 问题 1: 无法控制设备

**可能原因**:
- MQTT Broker 未连接
- 设备 ID 错误
- 主题格式不正确

**解决方法**:
1. 检查 MQTT Broker 状态
2. 验证设备 ID
3. 检查 MQTT 主题订阅

### 问题 2: 看不到设备状态

**可能原因**:
- 设备未发送状态消息
- MQTT 订阅失败
- 网络问题

**解决方法**:
1. 检查 MQTT Broker 日志
2. 验证设备是否在线
3. 检查网络连接

### 问题 3: 控制命令无效

**可能原因**:
- 命令格式错误
- 设备未收到命令
- 设备处于离线状态

**解决方法**:
1. 检查命令格式
2. 验证 MQTT 发布成功
3. 确认设备在线状态

---

## 📝 未来计划 / Future Plans

1. **配网功能**
   - 集成 Midea SDK
   - 支持直接配网
   - 支持蓝牙配网

2. **功能增强**
   - 定时开关
   - 场景控制
   - 能耗统计

3. **用户体验**
   - 自动发现设备
   - 简化添加流程
   - 改进控制界面

---

## 📞 支持 / Support

如果遇到问题：
1. 检查本文档的故障排除部分
2. 查看 MQTT Broker 日志
3. 联系技术支持

