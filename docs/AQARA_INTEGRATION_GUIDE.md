# Aqara Smart System Integration Guide

## Overview

Aqara devices use Zigbee protocol and require a bridge (like Zigbee2MQTT or Aqara Hub) to connect to MQTT. This guide explains how to integrate Aqara devices into Smart Warehouse.

## 🔌 Integration Methods

### Method 1: Zigbee2MQTT (Recommended)

**Most Common Setup:**
```
Aqara Device (Zigbee) → Zigbee2MQTT Bridge → MQTT Broker → Smart Warehouse
```

**Topic Format:**
- **Status Topic**: `zigbee2mqtt/<device_friendly_name>`
- **Command Topic**: `zigbee2mqtt/<device_friendly_name>/set`

**Example:**
- Device: Door Sensor
- Friendly Name: `door_sensor`
- Status: `zigbee2mqtt/door_sensor`
- Command: `zigbee2mqtt/door_sensor/set`

### Method 2: Aqara Hub with MQTT

**If your Aqara Hub supports MQTT:**
```
Aqara Device (Zigbee) → Aqara Hub → MQTT Broker → Smart Warehouse
```

**Topic Format:** (varies by hub model)
- Check your Aqara Hub documentation for MQTT topic format

### Method 3: Through Home Assistant

**If you use Home Assistant:**
```
Aqara Device → Zigbee2MQTT → Home Assistant → Smart Warehouse (via RESTful API)
```

- Use existing Home Assistant integration
- Select vendor: "Home Assistant"

## 📋 Aqara Device Types

### Sensors
- **Door/Window Sensor**: `contact` (true/false)
- **Motion Sensor**: `occupancy` (true/false)
- **Temperature/Humidity Sensor**: `temperature`, `humidity`
- **Water Leak Sensor**: `water_leak` (true/false)
- **Vibration Sensor**: `vibration` (true/false)

### Switches/Controllers
- **Smart Switch**: `state` (ON/OFF)
- **Wireless Switch**: `click` (single/double/long)
- **Cube Controller**: `action` (rotate/flip/tap)

### Actuators
- **Smart Plug**: `state` (ON/OFF)
- **Smart Bulb**: `state`, `brightness`, `color`
- **Curtain Motor**: `position` (0-100)

## 🔧 Implementation Steps

### Step 1: Setup Zigbee2MQTT (if not already done)

1. **Install Zigbee2MQTT**
   - Docker: `docker run -it --rm --name zigbee2mqtt -p 8080:8080 -v $(pwd)/data:/app/data koenkk/zigbee2mqtt`
   - Or follow [Zigbee2MQTT Installation Guide](https://www.zigbee2mqtt.io/guide/installation/)

2. **Configure Zigbee2MQTT**
   - Connect Zigbee coordinator
   - Configure MQTT broker connection
   - Pair Aqara devices

3. **Verify Device Topics**
   - Check MQTT broker for `zigbee2mqtt/<device_name>` topics
   - Verify device publishes status messages

### Step 2: Add Aqara Adapter

Create `/lib/mqtt-adapters/aqara-adapter.ts` following the pattern of existing adapters.

### Step 3: Configure Smart Warehouse

```env
MQTT_BROKER_URL=mqtt://your-broker-ip:1883
MQTT_USERNAME=your-username  # Optional
MQTT_PASSWORD=your-password  # Optional
```

### Step 4: Add Devices

1. **Manual Addition:**
   - Go to MQTT Panel
   - Click "Add Device"
   - Select vendor: "Aqara"
   - Enter device friendly name (e.g., `door_sensor`)
   - System auto-generates topics

2. **Auto-Discovery:**
   - Click "Scan Devices"
   - System discovers Aqara devices via Zigbee2MQTT
   - Click "Add" on discovered devices

## 📝 Example Device Configurations

### Door/Window Sensor
```
Device ID: door_sensor
Name: Front Door Sensor
Vendor: aqara
Connection Type: mqtt
Status Topic: zigbee2mqtt/door_sensor
Command Topic: zigbee2mqtt/door_sensor/set
```

**Status Payload:**
```json
{
  "contact": true,
  "battery": 100,
  "voltage": 3000,
  "linkquality": 255
}
```

### Smart Switch
```
Device ID: living_room_switch
Name: Living Room Switch
Vendor: aqara
Connection Type: mqtt
Status Topic: zigbee2mqtt/living_room_switch
Command Topic: zigbee2mqtt/living_room_switch/set
```

**Command Payload:**
```json
{
  "state": "ON"
}
```

### Temperature Sensor
```
Device ID: bedroom_temp
Name: Bedroom Temperature
Vendor: aqara
Connection Type: mqtt
Status Topic: zigbee2mqtt/bedroom_temp
Command Topic: (read-only sensor)
```

**Status Payload:**
```json
{
  "temperature": 22.5,
  "humidity": 45,
  "battery": 85,
  "voltage": 2900,
  "linkquality": 200
}
```

## 🎯 Control Commands

### Switch/Plug Control
```json
// Turn ON
{"state": "ON"}

// Turn OFF
{"state": "OFF"}

// Toggle
{"state": "TOGGLE"}
```

### Dimmer/Bulb Control
```json
// Set brightness (0-255)
{"brightness": 128}

// Set color (RGB)
{"color": {"r": 255, "g": 0, "b": 0}}

// Set color temperature
{"color_temp": 370}
```

### Curtain Control
```json
// Set position (0-100)
{"position": 50}

// Open
{"position": 100}

// Close
{"position": 0}
```

## ✅ Verification Checklist

- [ ] Zigbee2MQTT installed and running
- [ ] Aqara devices paired with Zigbee2MQTT
- [ ] MQTT broker configured
- [ ] Smart Warehouse MQTT broker URL configured
- [ ] Aqara adapter created
- [ ] Device discovery working
- [ ] Status updates working
- [ ] Control commands working

## 📚 References

- [Zigbee2MQTT Documentation](https://www.zigbee2mqtt.io/)
- [Aqara Device Compatibility](https://www.zigbee2mqtt.io/supported-devices/)
- [Aqara Studio Guide](https://opendoc.aqara.com/en/docs/Studio/Aqara%20Studio%20Guide.html)

## 🔍 Differences from Other Integrations

**Similarities:**
- Uses same MQTT client infrastructure
- Follows same adapter pattern
- Uses same device control API

**Differences:**
- Requires Zigbee2MQTT bridge (not direct MQTT)
- Topic format: `zigbee2mqtt/<device_name>`
- Payload format varies by device type
- Many devices are read-only sensors

## 💡 Tips

1. **Device Naming**: Use descriptive friendly names in Zigbee2MQTT
2. **Battery Monitoring**: Most Aqara sensors report battery level
3. **Link Quality**: Monitor `linkquality` for connection issues
4. **Read-Only Devices**: Sensors don't accept commands
5. **Multiple Endpoints**: Some devices have multiple sensors (e.g., temperature + humidity)

