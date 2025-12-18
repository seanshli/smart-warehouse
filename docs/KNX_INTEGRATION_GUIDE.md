# KNX Building Automation Integration Guide
## KNX System Support via EMQX MQTT Broker

**Date**: 2025-12-17  
**Status**: ✅ **Fully Implemented**

---

## 📊 Overview

KNX is a standardized building automation protocol widely used in Europe and other regions. This implementation provides full KNX support through a KNX2MQTT gateway, enabling seamless integration with the EMQX MQTT broker.

---

## 🏗️ Architecture

### KNX Integration Flow:
```
KNX Devices → KNX Bus → KNX2MQTT Gateway → EMQX MQTT Broker → Smart Warehouse App
```

### Components:
1. **KNX Devices**: Building automation devices (switches, sensors, actuators, etc.)
2. **KNX Bus**: Physical/Ethernet KNX network
3. **KNX2MQTT Gateway**: Protocol converter (hardware or software)
4. **EMQX MQTT Broker**: Central MQTT broker
5. **KNX Bridge Service**: Manages KNX devices via MQTT
6. **KNX Adapter**: Handles KNX-specific MQTT topic formats

---

## 🔧 MQTT Topic Format

### Standard Format:
```
knx/{group_address}              # Device status
knx/{group_address}/set          # Control commands
knx/bridge/status                # Bridge status
knx/bridge/devices               # Device list
```

### Group Address Format:
KNX uses group addresses in the format: `{area}/{line}/{device}`

**Examples:**
- `knx/1/2/3` - Area 1, Line 2, Device 3
- `knx/2/5/10` - Area 2, Line 5, Device 10
- `knx/0/0/1` - Area 0, Line 0, Device 1

**Alternative Format** (dots instead of slashes):
- `knx/1.2.3` - Same as `knx/1/2/3`

---

## 📋 Data Point Types (DPT)

KNX uses standardized Data Point Types (DPTs) to define data formats:

### Common DPTs:
- **DPT 1.001**: Boolean (ON/OFF)
- **DPT 5.001**: 0-100% (dimming, position)
- **DPT 9.001**: Temperature (16-bit float)
- **DPT 9.007**: Humidity (16-bit float)
- **DPT 18.001**: Scene control
- **DPT 10.001**: Time

### Message Format:
```json
{
  "value": true,           // Actual value
  "dpt": "1.001",          // Data Point Type
  "source": "1.2.3"        // Source address (optional)
}
```

---

## 🚀 Usage

### Starting KNX Bridge:

```typescript
import { getKNXBridge } from '@/lib/mqtt-bridge/knx-bridge'

const bridge = getKNXBridge({
  mqttBrokerUrl: process.env.MQTT_BROKER_URL!,
  mqttUsername: process.env.MQTT_USERNAME,
  mqttPassword: process.env.MQTT_PASSWORD,
  knxPrefix: 'knx', // Default
  pollInterval: 10000, // 10 seconds
})

await bridge.start()
```

### Sending Commands:

```typescript
import { KNXAdapter } from '@/lib/mqtt-adapters/knx-adapter'

// Turn on a switch (group address 1/2/3)
await bridge.sendCommand('1/2/3', {
  action: 'power_on',
  dpt: '1.001'
})

// Set brightness (group address 2/5/10)
await bridge.sendCommand('2/5/10', {
  action: 'set_brightness',
  value: 75, // 0-100%
  dpt: '5.001'
})

// Set temperature (group address 1/1/5)
await bridge.sendCommand('1/1/5', {
  action: 'set_temperature',
  value: 22.5,
  dpt: '9.001'
})
```

### Using Adapter Directly:

```typescript
import { KNXAdapter } from '@/lib/mqtt-adapters/knx-adapter'
import { getMQTTClient } from '@/lib/mqtt-client'

const mqttClient = getMQTTClient()
await mqttClient.connect()

// Create command message
const command = KNXAdapter.commands.setBrightness('1/2/3', 80, '5.001')

// Publish command
await mqttClient.publish(command)
```

---

## 🔍 Device Discovery

The KNX bridge automatically discovers devices by:
1. Requesting device list from KNX2MQTT bridge
2. Monitoring status updates from KNX group addresses
3. Parsing device information from bridge status messages

### Discovered Device Format:
```typescript
{
  groupAddress: '1/2/3',
  name: 'Living Room Light',
  type: 'switch',
  dpt: '1.001',
  online: true
}
```

---

## 📡 KNX2MQTT Gateway Setup

### Hardware Gateways:
- **Eelectron IPSBA01KNX**: KNX power supply with integrated IP interface and MQTT support
- **Wachendorff HD67947-B2**: KNX to MQTT gateway
- Other KNX IP interfaces with MQTT support

### Software Gateways:
- **knx2mqtt** (open-source): Software bridge for KNX to MQTT conversion
- **Home Assistant KNX Integration**: Can act as a bridge

### Configuration:
1. Connect KNX2MQTT gateway to KNX bus
2. Configure gateway to connect to EMQX broker
3. Set MQTT topic prefix (default: `knx`)
4. Map KNX group addresses to MQTT topics
5. Enable device discovery

---

## ✅ Features

### KNX Adapter:
- ✅ Group address parsing and normalization
- ✅ DPT (Data Point Type) support
- ✅ Standard KNX commands (power, brightness, temperature, etc.)
- ✅ Custom command support
- ✅ JSON payload format

### KNX Bridge:
- ✅ Automatic device discovery
- ✅ Status monitoring
- ✅ Command forwarding
- ✅ Device management
- ✅ Online/offline tracking

---

## 🎯 Supported Operations

### Switch Control:
- Power ON/OFF
- Toggle
- Scene control

### Dimming:
- Set brightness (0-100%)
- Step up/down

### Climate Control:
- Set temperature
- Read temperature
- Set humidity
- Read humidity

### Shutter/Blind Control:
- Set position (0-100%)
- Open/Close
- Stop

### Time/Date:
- Read time
- Set time

---

## 🔐 Security

### MQTT Security:
- ✅ Username/password authentication
- ✅ TLS/SSL support (`mqtts://`)
- ✅ QoS 1 for reliable delivery

### KNX Security:
- ✅ KNX Secure (if supported by gateway)
- ✅ Network isolation
- ✅ Access control via group addresses

---

## 📚 Related Documentation

- [MQTT Bridges Implementation Summary](./MQTT_BRIDGES_IMPLEMENTATION_SUMMARY.md)
- [EMQX MQTT Compatibility Report](./EMQX_MQTT_COMPATIBILITY_REPORT.md)
- [MQTT Setup Guide](../MQTT_SETUP_GUIDE.md)
- [EMQX Setup Guide](./EMQX_SETUP_GUIDE.md)

---

## 🔗 External Resources

- **KNX Association**: https://www.knx.org/
- **KNX2MQTT (GitHub)**: https://github.com/gbeine/knx2mqtt
- **KNX Data Point Types**: https://www.knx.org/wAssets/docs/downloads/Certification/Interworking-Datapoint-types/03_07_02-Datapoint-Types-v02.01.01-AS.pdf

---

**Implementation Complete**: KNX building automation system fully integrated with EMQX MQTT broker. ✅
