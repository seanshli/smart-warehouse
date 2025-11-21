# Midea 设备信息获取指南
## How to Get Midea Device Information for MQTT Integration

## 📋 你需要的信息 / Information You Need

添加 Midea 设备到 Smart Warehouse 需要以下信息：

### 必需信息 / Required
1. **Device ID** - 设备唯一标识符
2. **Device Name** - 设备名称（可以自定义）

### 自动生成（如果你有 Device ID）/ Auto-Generated
- **Topic**: `midea/{device_id}/status`
- **Command Topic**: `midea/{device_id}/command`
- **Status Topic**: `midea/{device_id}/status`

---

## 🔍 方法 1: 从 Midea App 获取设备 ID

### 步骤：

1. **打开 Midea App**
   - 确保空调已配网并显示在设备列表中

2. **查看设备详情**
   - 点击你的空调设备
   - 进入设备详情页面
   - 查找以下信息：
     - **设备 ID** / **Device ID**
     - **MAC 地址** / **MAC Address**
     - **序列号** / **Serial Number**

3. **常见位置**
   - 设备设置 → 设备信息
   - 设备详情 → 高级设置
   - 关于设备 / About Device

### 如果找不到设备 ID：

有些 Midea App 可能不直接显示设备 ID，可以尝试：
- 查看设备 MAC 地址（通常格式：`XX:XX:XX:XX:XX:XX`）
- 使用 MAC 地址作为 Device ID（去掉冒号或保留）
- 或者使用方法 2 从 MQTT Broker 获取

---

## 🔍 方法 2: 从 MQTT Broker 获取设备信息（推荐）

如果你的 Midea 空调已经连接到 MQTT Broker，可以从 MQTT 消息中获取设备 ID。

### 步骤：

1. **访问 EMQX Dashboard**
   - 打开浏览器访问：`http://your-mqtt-broker:18083`
   - 登录（默认：admin/public）

2. **查看 MQTT 消息**
   - 进入 **WebSocket** 或 **MQTT X** 标签
   - 订阅主题：`midea/#`（监听所有 Midea 设备）
   - 或者查看 **Messages** 标签中的历史消息

3. **查找设备消息**
   - 查找主题格式：`midea/{device_id}/status`
   - 从主题中提取设备 ID
   - 例如：主题 `midea/AC123456/status` → 设备 ID 是 `AC123456`

4. **查看消息内容**
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

### 使用 MQTT 客户端工具：

你也可以使用 MQTT 客户端工具（如 MQTT.fx, MQTT Explorer）来查看：

1. **连接 MQTT Broker**
   - Host: 你的 MQTT Broker 地址
   - Port: 1883 (或 8883 for SSL)
   - Username/Password: 你的 MQTT 凭证

2. **订阅主题**
   - 订阅：`midea/#`
   - 查看所有 Midea 设备的消息

3. **提取设备 ID**
   - 从收到的消息主题中提取设备 ID

---

## 🔍 方法 3: 从设备本身获取

某些 Midea 空调可能在设备上显示信息：

1. **查看设备标签**
   - 检查空调机身上的标签
   - 查找序列号、MAC 地址等信息

2. **使用设备显示屏**
   - 某些型号可能在显示屏上显示设备信息
   - 查看设备设置菜单

---

## 📝 在 Smart Warehouse 中添加设备

获取设备 ID 后，按以下步骤添加：

### 步骤 1: 打开添加设备表单

1. 进入 **MQTT Devices** 标签
2. 点击 **Add Device** 按钮

### 步骤 2: 填写设备信息

**必需字段**：
- **Device ID**: 输入从上述方法获取的设备 ID
  - 例如：`AC123456` 或 `midea_ac_001`
- **Name**: 输入设备名称
  - 例如：`客厅空调` 或 `Living Room AC`
- **Vendor**: 选择 **Midea**

**MQTT 配置**（通常可以留空，系统会自动生成）：
- **Topic**: `midea/{device_id}/status`
- **Command Topic**: `midea/{device_id}/command`
- **Status Topic**: `midea/{device_id}/status`

**可选字段**：
- **Room**: 选择设备所在的房间

### 步骤 3: 保存设备

点击 **Add Device** 完成添加。

---

## 🔧 验证设备连接

添加设备后，验证是否正常工作：

1. **检查设备状态**
   - 在设备列表中查看设备是否显示为 "online"
   - 如果显示 "offline"，检查 MQTT 连接

2. **测试控制**
   - 点击设备进入控制页面
   - 尝试发送控制命令（如开关、调温）
   - 观察设备是否响应

3. **查看 MQTT 消息**
   - 在 EMQX Dashboard 中查看消息
   - 确认命令消息已发送到 `midea/{device_id}/command`
   - 确认状态消息从 `midea/{device_id}/status` 接收

---

## 🐛 故障排除

### 问题 1: 找不到设备 ID

**解决方法**：
- 使用 MQTT Broker 查看消息（方法 2）
- 检查 Midea App 的设备信息页面
- 尝试使用 MAC 地址作为设备 ID

### 问题 2: 设备添加后显示离线

**可能原因**：
- MQTT Broker 未连接
- 设备 ID 不正确
- 主题格式不匹配

**解决方法**：
1. 检查 MQTT Broker 状态
2. 验证设备 ID 是否正确
3. 检查 MQTT 主题订阅
4. 查看 EMQX Dashboard 中的消息

### 问题 3: 无法控制设备

**可能原因**：
- 命令主题不正确
- 设备未收到命令
- 设备离线

**解决方法**：
1. 验证命令主题格式：`midea/{device_id}/command`
2. 检查 MQTT 发布是否成功
3. 确认设备在线状态
4. 查看 EMQX Dashboard 日志

---

## 📊 MQTT 主题格式参考

### Midea 设备标准主题格式：

```
状态主题（设备 → 服务器）:
midea/{device_id}/status

命令主题（服务器 → 设备）:
midea/{device_id}/command
```

### 示例：

如果设备 ID 是 `AC123456`：

- 状态主题：`midea/AC123456/status`
- 命令主题：`midea/AC123456/command`

---

## 💡 提示

1. **设备 ID 格式**
   - 设备 ID 可以是数字、字母或组合
   - 通常不包含特殊字符（除了下划线或连字符）
   - 大小写可能敏感，注意保持一致

2. **多个设备**
   - 每个设备需要唯一的设备 ID
   - 如果有多台 Midea 空调，分别获取每台的设备 ID

3. **保存信息**
   - 建议保存设备 ID 和名称的对应关系
   - 方便后续管理和故障排除

---

## 🚀 快速检查清单

添加设备前，确认：

- [ ] 空调已通过 Midea App 配网
- [ ] 空调已连接到 MQTT Broker
- [ ] 已获取设备 ID
- [ ] 已准备好设备名称
- [ ] MQTT Broker 正常运行
- [ ] 可以访问 EMQX Dashboard（可选，用于验证）

---

## 📞 需要帮助？

如果仍然无法获取设备信息：

1. 检查 Midea App 的设备信息页面
2. 查看 MQTT Broker 消息日志
3. 联系 Midea 技术支持获取设备 ID
4. 检查设备文档或标签

