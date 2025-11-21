# Midea MQTT Bridge 使用指南
## How to Bridge Midea App Devices to Your MQTT Broker

## 📋 问题 / Problem

Midea 设备通过 Midea App 配网后，会连接到 **Midea Cloud**，而不是直接连接到你的 MQTT Broker。因此，即使设备已配网，也无法直接在 MQTT Broker 上看到或控制。

## 🔧 解决方案 / Solution

使用 **MQTT Bridge** 服务，将 Midea Cloud API 的设备状态和控制命令桥接到你的 MQTT Broker。

### 工作原理 / How It Works

```
Midea 设备 → Midea Cloud API
                ↓
         MQTT Bridge 服务
                ↓
        你的 MQTT Broker (EMQX)
                ↓
        Smart Warehouse App
```

1. **设备状态同步**：Bridge 定期从 Midea Cloud API 获取设备状态，并发布到 MQTT Broker
2. **命令转发**：Smart Warehouse 发送的控制命令通过 Bridge 转发到 Midea Cloud API

---

## 🚀 设置步骤 / Setup Steps

### 步骤 1: 配置环境变量

确保以下环境变量已设置：

```bash
# Midea API 凭证（从 Midea IoT 开发者平台获取）
MIDEA_APP_ID="your-midea-app-id"
MIDEA_APP_KEY="your-midea-app-key"

# MQTT Broker 配置
MQTT_BROKER_URL="mqtt://your-broker:1883"
MQTT_USERNAME="your-username"  # 可选
MQTT_PASSWORD="your-password"  # 可选
```

### 步骤 2: 启动 Bridge 服务

#### 方法 A: 通过 API（推荐）

```bash
# 启动 Bridge
curl -X POST http://localhost:3000/api/mqtt/bridge/midea \
  -H "Content-Type: application/json" \
  --cookie "your-session-cookie"
```

#### 方法 B: 在代码中启动

```typescript
import { getMideaBridge } from '@/lib/mqtt-bridge/midea-bridge'

const bridge = getMideaBridge({
  appId: process.env.MIDEA_APP_ID!,
  appKey: process.env.MIDEA_APP_KEY!,
  mqttBrokerUrl: process.env.MQTT_BROKER_URL!,
  pollInterval: 5000, // 5 秒轮询一次
})

await bridge.start()
```

### 步骤 3: 验证 Bridge 状态

```bash
# 检查 Bridge 状态
curl http://localhost:3000/api/mqtt/bridge/midea \
  --cookie "your-session-cookie"
```

响应示例：
```json
{
  "success": true,
  "status": "running",
  "devices": [
    {
      "deviceId": "AC123456",
      "name": "客厅空调",
      "type": "air_conditioner",
      "online": true
    }
  ],
  "deviceCount": 1
}
```

### 步骤 4: 在 Smart Warehouse 中添加设备

1. 打开 Smart Warehouse App
2. 进入 **MQTT Devices** 标签
3. 点击 **扫描设备** 按钮
4. Bridge 会将设备状态发布到 MQTT，扫描应该能发现设备
5. 或者手动添加设备（使用从 Bridge 状态中获取的 Device ID）

---

## 📡 MQTT 主题格式 / MQTT Topic Format

Bridge 会使用标准的 Midea MQTT 主题格式：

### 状态主题（设备 → Smart Warehouse）
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
  "swing": false,
  "deviceId": "AC123456",
  "name": "客厅空调",
  "timestamp": 1234567890
}
```

### 命令主题（Smart Warehouse → 设备）
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

---

## ⚙️ 配置选项 / Configuration Options

### 轮询间隔

默认每 5 秒轮询一次设备状态。可以在启动 Bridge 时配置：

```typescript
const bridge = getMideaBridge({
  // ... 其他配置
  pollInterval: 10000, // 10 秒（更省电，但响应较慢）
})
```

### MQTT QoS

Bridge 使用 QoS 1 确保消息可靠传递。

---

## 🔍 故障排除 / Troubleshooting

### 问题 1: Bridge 无法启动

**可能原因**:
- Midea API 凭证错误
- MQTT Broker 无法连接
- 环境变量未设置

**解决方法**:
1. 检查环境变量是否正确
2. 验证 MQTT Broker 连接
3. 查看服务器日志

### 问题 2: 无法发现设备

**可能原因**:
- Bridge 未运行
- 设备未在 Midea Cloud 中
- 轮询间隔太长

**解决方法**:
1. 检查 Bridge 状态：`GET /api/mqtt/bridge/midea`
2. 确认设备在 Midea App 中可见
3. 等待几秒后再次扫描

### 问题 3: 控制命令无效

**可能原因**:
- Bridge 未订阅命令主题
- Midea API 命令格式错误
- 设备离线

**解决方法**:
1. 检查 Bridge 是否运行
2. 验证设备在线状态
3. 查看 Bridge 日志

---

## 📝 注意事项 / Important Notes

1. **API 限制**
   - Midea Cloud API 可能有请求频率限制
   - 建议轮询间隔不少于 5 秒
   - 避免过于频繁的 API 调用

2. **设备同步**
   - Bridge 需要定期轮询才能获取最新状态
   - 状态更新可能有 5-10 秒延迟
   - 控制命令会立即转发，但状态更新需要等待下次轮询

3. **网络要求**
   - Bridge 服务需要能够访问 Midea Cloud API
   - 需要能够连接到你的 MQTT Broker
   - 建议在服务器端运行 Bridge

4. **安全性**
   - Midea API 凭证应安全存储
   - 使用环境变量，不要硬编码
   - 生产环境使用 HTTPS 和安全的 MQTT 连接

---

## 🔄 替代方案 / Alternatives

如果 Bridge 方案不适合，可以考虑：

1. **使用 midea_ac_lan**
   - 通过本地网络直接控制（需要设备支持）
   - GitHub: https://github.com/mill1000/midea-ac-py

2. **使用 Home Assistant**
   - 使用 Midea 集成
   - 然后通过 Home Assistant 的 MQTT 集成转发

3. **直接使用 Midea API**
   - 在 Smart Warehouse 中直接调用 Midea Cloud API
   - 不使用 MQTT（需要修改代码架构）

---

## 📞 支持 / Support

如果遇到问题：
1. 检查本文档的故障排除部分
2. 查看服务器日志
3. 验证 Midea API 凭证
4. 检查 MQTT Broker 连接

