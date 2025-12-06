# Shelly Smart System Integration Guide

## Overview

This guide explains how to integrate Shelly smart devices into the Smart Warehouse IoT system using MQTT. Shelly devices support MQTT natively, making integration straightforward.

## ✅ What's Needed

Based on your existing MQTT infrastructure, you'll need to:

1. **Create a Shelly MQTT Adapter** - Similar to `tuya-adapter.ts` and `esp-adapter.ts`
2. **Update the Adapter Factory** - Register Shelly in the adapter system
3. **Add Shelly to UI Components** - Update `MQTTPanel.tsx` to support Shelly devices
4. **Update Database Schema** - Add 'shelly' as a vendor option (if not already supported)
5. **Add Translations** - Add Shelly-related UI strings

## 📋 Shelly MQTT Protocol

Shelly devices use different MQTT topic formats for Gen 1 and Gen 2 devices:

### Gen 1 Devices (e.g., Shelly 1, Shelly 2.5)
- **Status Topic**: `shellies/<device_name>/relay/<channel>`
- **Command Topic**: `shellies/<device_name>/relay/<channel>/command`
- **Commands**: `on`, `off`, `toggle`
- **Status Payload**: `on` or `off`

### Gen 2 Devices (e.g., Shelly Plus 1, Shelly Plus 2PM)
- **Status Topic**: `<topic_prefix>/status/switch:<id>`
- **Command Topic**: `<topic_prefix>/command/switch:<id>`
- **Commands**: `on`, `off`, `toggle`, `status_update`
- **Status Payload**: JSON format with device state

## 🔧 Implementation Steps

### Step 1: Create Shelly Adapter

Create `/lib/mqtt-adapters/shelly-adapter.ts` following the pattern of existing adapters:

```typescript
// Key features:
- Support both Gen 1 and Gen 2 topic formats
- Handle relay/switch control
- Parse status messages
- Generate command messages
```

### Step 2: Update Adapter Factory

Update `/lib/mqtt-adapters/index.ts`:
- Export ShellyAdapter
- Add 'shelly' to DeviceVendor type
- Register in AdapterFactory.getAdapter()
- Add topic detection for `shellies/` prefix

### Step 3: Update Database Schema

The `IoTDevice` model already supports vendor strings, so 'shelly' should work. Verify:
- `vendor` field accepts 'shelly'
- Connection type can be 'mqtt'

### Step 4: Update UI Components

Update `/components/mqtt/MQTTPanel.tsx`:
- Add 'shelly' to vendor dropdown
- Add Shelly provisioning button (if needed)
- Add Shelly-specific device controls
- Update vendor name display

### Step 5: Add Translations

Update `/lib/translations.ts`:
- Add `mqttVendorShelly` translations
- Add Shelly-specific UI strings

### Step 6: Device Discovery

Update `/app/api/mqtt/discover/route.ts`:
- Add Shelly device discovery logic
- Subscribe to `shellies/+/relay/+` (Gen 1)
- Subscribe to `+/status/switch:+` (Gen 2)

## 🚀 Quick Start

Once implemented, users can:

1. **Add Shelly Device Manually**:
   - Go to MQTT Panel
   - Click "Add Device"
   - Select vendor: "Shelly"
   - Enter device ID (e.g., `shelly1-1234`)
   - Enter device name
   - System auto-generates MQTT topics

2. **Auto-Discover Devices**:
   - Click "Scan Devices"
   - System discovers Shelly devices on MQTT broker
   - Click "Add" on discovered devices

3. **Control Devices**:
   - Power on/off relays/switches
   - View device status
   - Monitor real-time state updates

## 📝 Example Device Configuration

### Gen 1 Device (Shelly 1)
```
Device ID: shelly1-1234
Name: Living Room Light
Vendor: shelly
Connection Type: mqtt
Command Topic: shellies/shelly1-1234/relay/0/command
Status Topic: shellies/shelly1-1234/relay/0
```

### Gen 2 Device (Shelly Plus 1)
```
Device ID: shellyplus1-5678
Name: Kitchen Light
Vendor: shelly
Connection Type: mqtt
Command Topic: shellyplus1-5678/command/switch:0
Status Topic: shellyplus1-5678/status/switch:0
```

## 🔍 Differences from Existing Integrations

**Similarities**:
- Uses same MQTT client infrastructure
- Follows same adapter pattern
- Uses same device control API
- Same UI integration approach

**Differences**:
- Shelly has two protocol versions (Gen 1 vs Gen 2)
- Gen 1 uses simple string payloads (`on`/`off`)
- Gen 2 uses JSON payloads
- Topic structure differs between versions

## ✅ Verification Checklist

- [ ] Shelly adapter created
- [ ] Adapter factory updated
- [ ] UI components updated
- [ ] Translations added
- [ ] Device discovery working
- [ ] Control commands working
- [ ] Status updates working
- [ ] Both Gen 1 and Gen 2 devices supported

## 📚 References

- [Shelly Gen 1 MQTT Docs](https://shelly-api-docs.shelly.cloud/gen1/#mqtt-support)
- [Shelly Gen 2 MQTT Docs](https://shelly-api-docs.shelly.cloud/gen2/ComponentsAndServices/Mqtt/)

