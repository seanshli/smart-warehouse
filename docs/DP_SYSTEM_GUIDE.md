# IoT Device Data Points (DP) System Guide

## Overview

The DP (Data Points) system provides a unified way to manage device capabilities across different IoT vendors. Each vendor has different ways of representing device properties, and the DP system normalizes them.

## How DPs Work by Vendor

### 1. Tuya - Numeric DPs
Tuya uses numeric DP IDs (1, 2, 3, etc.) that vary by device category:

```json
// Air Conditioner Example
{
  "dps": {
    "1": true,      // Power (DP 1)
    "2": 24,        // Target Temperature (DP 2)
    "3": 26,        // Current Temperature (DP 3)
    "4": "cold",    // Mode (DP 4)
    "5": "auto"     // Fan Speed (DP 5)
  }
}
```

**Auto-Discovery**: Tuya Cloud API provides device specification via `/v1.0/devices/{device_id}/specification`

### 2. Midea - String-based Properties
Midea uses human-readable property names:

```json
{
  "power": true,
  "mode": "cool",
  "target_temperature": 24,
  "indoor_temperature": 26,
  "fan_speed": "medium"
}
```

**Auto-Discovery**: Via Midea Cloud API or device polling

### 3. Philips Hue - REST API Properties
Philips uses REST API with specific property names:

```json
{
  "on": true,
  "bri": 254,        // Brightness (1-254)
  "ct": 350,         // Color temperature (153-500 mirek)
  "hue": 10000,      // Hue (0-65535)
  "sat": 200         // Saturation (0-254)
}
```

**Auto-Discovery**: Via Hue Bridge `/api/{username}/lights`

### 4. ESP - Flexible Custom DPs
ESP devices can announce their own DPs via MQTT:

```json
// Device Announcement
{
  "deviceId": "esp32_abc123",
  "model": "Temperature Sensor",
  "dps": [
    { "dpId": "temperature", "type": "number", "readOnly": true },
    { "dpId": "humidity", "type": "number", "readOnly": true },
    { "dpId": "relay1", "type": "boolean" }
  ]
}
```

**Auto-Discovery**: Via MQTT topic `esp/{device_id}/announce`

### 5. Shelly - Channel-based
Shelly devices use channel-based properties:

```json
// Gen2 Format
{
  "id": 0,
  "source": "switch",
  "output": true,
  "apower": 150.5,    // Active power
  "voltage": 220.1,
  "current": 0.68
}
```

**Auto-Discovery**: Via MQTT topic `shellies/announce` or `shelly/{device_id}/info`

### 6. Aqara/Zigbee - Zigbee Clusters
Aqara uses Zigbee cluster-based properties via Zigbee2MQTT:

```json
{
  "temperature": 25.5,
  "humidity": 60,
  "pressure": 1013,
  "battery": 95,
  "linkquality": 150
}
```

**Auto-Discovery**: Via Zigbee2MQTT `zigbee2mqtt/bridge/devices`

### 7. KNX - Data Point Types (DPTs)
KNX uses standardized DPTs:

```
DPT 1.001 - Boolean (On/Off)
DPT 5.001 - 8-bit unsigned (0-100%)
DPT 9.001 - 2-byte float (temperature)
DPT 20.102 - HVAC mode
```

**Auto-Discovery**: Via KNX2MQTT gateway configuration

## DP System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     DP Manager (Singleton)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │ Predefined DPs   │    │ Dynamic DPs      │                   │
│  │ (dp-definitions) │    │ (from devices)   │                   │
│  └────────┬─────────┘    └────────┬─────────┘                   │
│           │                       │                              │
│           └───────────┬───────────┘                              │
│                       ▼                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Device Capabilities Cache                    │   │
│  │  deviceId -> { vendor, category, dps[], source }         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                       │                                          │
│                       ▼                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Normalized Device State                      │   │
│  │  deviceId -> { properties: { power, temperature, ... } } │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## DP Sources (Priority Order)

1. **Cloud API** - Fetched from vendor cloud (Tuya, Midea, Panasonic)
2. **Device Announcement** - Device sends capabilities via MQTT
3. **Predefined** - Static definitions in `dp-definitions.ts`
4. **Manual** - User-configured via API

## Using the DP System

### 1. Get Predefined DPs

```typescript
import { VENDOR_DPS, TUYA_DPS } from '@/lib/iot-dp'

// Get Tuya Air Conditioner DPs
const acDPs = TUYA_DPS['kt']
console.log(acDPs.dps)
// [
//   { dpId: 1, name: 'Power', property: 'power', type: 'boolean' },
//   { dpId: 2, name: 'Target Temperature', property: 'temperature', ... },
//   ...
// ]
```

### 2. Register Device Capabilities

```typescript
import { dpManager } from '@/lib/iot-dp'

// From predefined definitions
dpManager.registerFromPredefined('device123', 'tuya', 'kt')

// From device announcement
dpManager.registerFromAnnouncement('device456', 'esp', {
  category: 'sensor',
  model: 'ESP32 Sensor',
  dps: [
    { dpId: 'temp', name: 'Temperature', type: 'number' },
    { dpId: 'humidity', name: 'Humidity', type: 'number' },
  ]
})

// From Cloud API
await dpManager.registerFromCloudAPI('device789', 'tuya', apiResponse)
```

### 3. Normalize Device State

```typescript
import { dpManager } from '@/lib/iot-dp'

// Raw Tuya state
const rawState = { "1": true, "2": 24, "3": 26, "4": "cold" }

// Normalize to standard properties
const normalized = dpManager.normalizeState('device123', 'tuya', rawState)
console.log(normalized.properties)
// { power: true, temperature: 24, current_temp: 26, mode: 'cold' }
```

### 4. Create Control Command

```typescript
import { dpManager } from '@/lib/iot-dp'

// Create vendor-specific command from normalized property
const command = dpManager.createCommand('device123', 'temperature', 25)
// For Tuya: { dps: { "2": 25 } }
// For Midea: { target_temperature: 25 }
```

## API Endpoints

### Get DP Definitions
```http
GET /api/mqtt/dp-definitions
GET /api/mqtt/dp-definitions?vendor=tuya
GET /api/mqtt/dp-definitions?vendor=tuya&category=kt
```

### Get Device Capabilities
```http
GET /api/mqtt/devices/{deviceId}/capabilities
```

### Register Device Capabilities
```http
POST /api/mqtt/devices/{deviceId}/capabilities
Content-Type: application/json

{
  "vendor": "esp",
  "category": "sensor",
  "model": "ESP32 Sensor",
  "dps": [
    { "dpId": "temp", "name": "Temperature", "type": "number" }
  ]
}
```

## Normalized Property Types

| Property | Type | Description |
|----------|------|-------------|
| `power` | boolean | On/Off state |
| `mode` | enum | Device mode (cool, heat, auto, etc.) |
| `temperature` | number | Target temperature |
| `current_temp` | number | Current temperature |
| `humidity` | number | Humidity percentage |
| `fan_speed` | enum/number | Fan speed level |
| `swing` | boolean/enum | Swing mode |
| `brightness` | number | 0-100 brightness |
| `color_temp` | number | Color temperature in Kelvin |
| `color` | object | HSV or RGB color |
| `position` | number | 0-100 curtain/blind position |
| `battery` | number | 0-100 battery percentage |
| `motion` | boolean | Motion detected |
| `door` | boolean | Door/window open |
| `energy` | number | Energy consumption (kWh) |
| `power_consumption` | number | Current power (W) |
| `voltage` | number | Voltage (V) |
| `current` | number | Current (A) |
| `lock` | boolean | Lock state |
| `custom` | any | Custom property |

## Device Categories

### Tuya Categories
- `kt` - Air Conditioner
- `cz` - Switch/Plug
- `dj` - Light
- `cl` - Curtain
- `wsdcg` - Temperature & Humidity Sensor
- `pir` - Motion Sensor
- `mcs` - Door/Window Sensor
- `ms` - Smart Lock

### Midea Categories
- `ac` - Air Conditioner
- `dehumidifier` - Dehumidifier

### Philips Categories
- `light` - Light
- `sensor_motion` - Motion Sensor

### ESP Categories
- `generic` - Generic ESP Device
- `relay` - ESP Relay
- `sensor` - ESP Sensor

### Shelly Categories
- `relay` - Shelly Relay
- `dimmer` - Shelly Dimmer
- `rgbw` - Shelly RGBW

### Aqara Categories
- `sensor_ht` - Temperature & Humidity Sensor
- `sensor_motion` - Motion Sensor
- `sensor_magnet` - Door/Window Sensor
- `sensor_wleak` - Water Leak Sensor
- `plug` - Smart Plug

### KNX Categories
- `switch` - Switch Actuator
- `dimmer` - Dimmer
- `blinds` - Blinds/Shutter
- `hvac` - HVAC Controller
- `sensor_temp` - Temperature Sensor

## Best Practices

1. **Auto-Discovery First**: Let devices announce their capabilities when possible
2. **Fall Back to Predefined**: Use predefined DPs when device doesn't announce
3. **Cache Capabilities**: Capabilities are cached per device for performance
4. **Normalize for UI**: Always use normalized properties for UI rendering
5. **Vendor-Specific for Control**: Use dpManager.createCommand() to create vendor-specific payloads

## Adding New Device Types

To add support for a new device type:

1. Add DP definitions to `lib/iot-dp/dp-definitions.ts`
2. Update the vendor's DPs object (e.g., `TUYA_DPS`)
3. If needed, add new normalized property types
4. Test with actual device or simulated data
