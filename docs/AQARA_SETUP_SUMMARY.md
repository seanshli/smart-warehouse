# Aqara Integration Summary

## ✅ Implementation Complete

Aqara devices can now be integrated into Smart Warehouse through Zigbee2MQTT bridge.

## 🔌 How It Works

**Aqara devices require a bridge** because they use Zigbee protocol:

```
Aqara Device (Zigbee) → Zigbee2MQTT Bridge → MQTT Broker → Smart Warehouse
```

## 📋 What's Needed

1. **Zigbee2MQTT Bridge** (required)
   - Translates Zigbee to MQTT
   - Can run on Raspberry Pi, Docker, or any Linux system
   - [Installation Guide](https://www.zigbee2mqtt.io/guide/installation/)

2. **MQTT Broker**
   - EMQX, Mosquitto, or any MQTT broker
   - Configured in Smart Warehouse `.env`:
     ```env
     MQTT_BROKER_URL=mqtt://your-broker-ip:1883
     ```

3. **Aqara Devices**
   - Paired with Zigbee2MQTT
   - Friendly names configured (e.g., `door_sensor`, `living_room_switch`)

## 🚀 Quick Start

### Step 1: Setup Zigbee2MQTT

1. Install Zigbee2MQTT (Docker example):
   ```bash
   docker run -it --rm --name zigbee2mqtt \
     -p 8080:8080 \
     -v $(pwd)/data:/app/data \
     koenkk/zigbee2mqtt
   ```

2. Configure MQTT broker connection in Zigbee2MQTT
3. Pair your Aqara devices
4. Note device friendly names

### Step 2: Add Devices in Smart Warehouse

**Option A: Auto-Discovery**
- Go to MQTT Panel
- Click "Scan Devices"
- Select vendor: "Aqara" or "All"
- Click "Add" on discovered devices

**Option B: Manual Addition**
- Go to MQTT Panel
- Click "Add Device"
- Select vendor: "Aqara"
- Enter device friendly name (e.g., `door_sensor`)
- System auto-generates topics:
  - Status: `zigbee2mqtt/door_sensor`
  - Command: `zigbee2mqtt/door_sensor/set`

## 📝 Supported Device Types

### Sensors (Read-Only)
- ✅ Door/Window Sensor (`contact`)
- ✅ Motion Sensor (`occupancy`)
- ✅ Temperature/Humidity Sensor (`temperature`, `humidity`)
- ✅ Water Leak Sensor (`water_leak`)
- ✅ Vibration Sensor (`vibration`)

### Controllers
- ✅ Smart Switch (`state`: ON/OFF)
- ✅ Wireless Switch (`click`: single/double/long)
- ✅ Cube Controller (`action`: rotate/flip/tap)

### Actuators
- ✅ Smart Plug (`state`: ON/OFF)
- ✅ Smart Bulb (`state`, `brightness`, `color`)
- ✅ Curtain Motor (`position`: 0-100)

## 🎯 Control Examples

### Switch Control
```json
// Turn ON
{"state": "ON"}

// Turn OFF
{"state": "OFF"}

// Toggle
{"state": "TOGGLE"}
```

### Dimmer Control
```json
// Set brightness (0-255)
{"brightness": 128}
```

### Color Control
```json
// Set RGB color
{"color": {"r": 255, "g": 0, "b": 0}}
```

## ✅ Features Implemented

- ✅ Aqara adapter (`lib/mqtt-adapters/aqara-adapter.ts`)
- ✅ Adapter factory registration
- ✅ UI support in MQTT Panel
- ✅ Device discovery via Zigbee2MQTT topics
- ✅ Translations (English, Chinese, Japanese)
- ✅ Support for sensors, switches, and actuators
- ✅ Battery and link quality monitoring

## 📚 Documentation

- **Integration Guide**: `docs/AQARA_INTEGRATION_GUIDE.md`
- **Zigbee2MQTT Docs**: https://www.zigbee2mqtt.io/
- **Aqara Compatibility**: https://www.zigbee2mqtt.io/supported-devices/

## 🔍 Important Notes

1. **Bridge Required**: Aqara devices cannot connect directly to MQTT - they need Zigbee2MQTT
2. **Device Names**: Use friendly names from Zigbee2MQTT (not device IDs)
3. **Read-Only Sensors**: Many Aqara devices are sensors that don't accept commands
4. **Battery Monitoring**: Most sensors report battery level in status messages

## 🆚 Comparison with Other Integrations

| Feature | Aqara | Shelly | Tuya |
|---------|-------|--------|------|
| **Protocol** | Zigbee (via bridge) | WiFi MQTT | WiFi MQTT |
| **Bridge Required** | ✅ Yes (Zigbee2MQTT) | ❌ No | ❌ No |
| **Setup Complexity** | Medium | Low | Low |
| **Device Types** | Sensors + Actuators | Switches/Relays | Various |

