# Shelly Integration: Native vs Home Assistant

## ✅ **Native MQTT Support (Recommended)**

**Shelly devices can be added and controlled NATIVELY** - they don't require Home Assistant!

### How It Works:

1. **Shelly devices have built-in MQTT support**
   - Gen 1 devices: Connect directly to MQTT broker
   - Gen 2 devices: Connect directly to MQTT broker
   - No intermediate software needed

2. **Direct Connection Flow:**
   ```
   Shelly Device → MQTT Broker → Smart Warehouse App
   ```

3. **What You Need:**
   - ✅ MQTT Broker (EMQX, Mosquitto, etc.)
   - ✅ Shelly device configured with MQTT settings
   - ✅ Smart Warehouse app configured with MQTT broker URL

### Setup Steps:

#### 1. Configure MQTT Broker
```env
# In your .env file
MQTT_BROKER_URL=mqtt://your-broker-ip:1883
MQTT_USERNAME=your-username  # Optional
MQTT_PASSWORD=your-password  # Optional
```

#### 2. Configure Shelly Device
- Access Shelly device web interface (usually `http://192.168.x.x`)
- Go to **Settings → Internet & Security → MQTT**
- Enable MQTT
- Enter MQTT server address (your broker IP)
- Enter username/password if required
- Save settings

#### 3. Add Device in Smart Warehouse
- Go to **MQTT Panel**
- Click **"Scan Devices"** or **"Add Device"**
- Select vendor: **"Shelly"**
- Enter device ID (e.g., `shelly1-1234`)
- System auto-detects generation and generates topics

## 🔄 **Optional: Through Home Assistant**

You CAN use Home Assistant as an intermediary, but it's **NOT REQUIRED**.

### If Using Home Assistant:

1. **Home Assistant acts as a bridge:**
   ```
   Shelly Device → MQTT Broker → Home Assistant → Smart Warehouse
   ```

2. **In Smart Warehouse:**
   - Select vendor: **"Home Assistant"**
   - Enter Home Assistant base URL
   - Enter API access token
   - Devices are controlled via Home Assistant API

3. **Use Case:**
   - If you already have Home Assistant setup
   - If you want advanced automations
   - If you prefer Home Assistant's device management

## 📊 **Comparison**

| Feature | Native MQTT | Via Home Assistant |
|---------|-------------|-------------------|
| **Setup Complexity** | Simple | More complex |
| **Dependencies** | Just MQTT broker | HA + MQTT broker |
| **Performance** | Direct, faster | Indirect, slower |
| **Features** | Basic control | Advanced automations |
| **Recommended For** | Direct control | Existing HA users |

## 🎯 **Recommendation**

**Use Native MQTT** unless you:
- Already have Home Assistant running
- Need advanced automations
- Want to manage devices through HA interface

## 📝 **Example: Native Setup**

### Gen 1 Device (Shelly 1)
```
1. Configure Shelly device:
   - MQTT Server: 192.168.1.100:1883
   - Username: (optional)
   - Password: (optional)
   - Topic Prefix: shellies

2. Device publishes to:
   - Status: shellies/shelly1-1234/relay/0
   - Commands: shellies/shelly1-1234/relay/0/command

3. Add in Smart Warehouse:
   - Vendor: Shelly
   - Device ID: shelly1-1234
   - System auto-generates topics
```

### Gen 2 Device (Shelly Plus 1)
```
1. Configure Shelly device:
   - MQTT Server: 192.168.1.100:1883
   - Topic Prefix: shellyplus1-5678 (or custom)

2. Device publishes to:
   - Status: shellyplus1-5678/status/switch:0
   - Commands: shellyplus1-5678/command/switch:0

3. Add in Smart Warehouse:
   - Vendor: Shelly
   - Device ID: shellyplus1-5678
   - System auto-detects Gen 2 and generates topics
```

## ✅ **Summary**

**Answer: Shelly devices are NATIVELY supported** - no Home Assistant needed!

- ✅ Direct MQTT connection
- ✅ No intermediate software
- ✅ Faster and simpler
- ✅ Full control (on/off/toggle)
- ✅ Real-time status updates

Just configure your Shelly device to connect to your MQTT broker, and Smart Warehouse will discover and control it directly.

