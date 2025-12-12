# MQTT Per-Household Connections Guide

## Overview

Smart Warehouse now supports **per-household MQTT connections** to EMQX broker. Each household gets its own dedicated MQTT client connection with a unique client ID, providing better isolation and monitoring.

## Architecture

### Connection Model

1. **Global Connection**: Single shared connection for system-wide operations
   - Client ID: `smart-warehouse-production` (or from `MQTT_CLIENT_ID` env var)
   - Used for: General system operations, device discovery

2. **Household-Specific Connections**: Dedicated connection per household
   - Client ID: `smart-warehouse-household-{householdId}-{timestamp}`
   - Used for: Home Assistant sync, household-specific device control
   - Automatically created when needed

### Benefits

- ✅ **Isolation**: Each household's MQTT traffic is isolated
- ✅ **Monitoring**: Track connections per household in admin dashboard
- ✅ **Scalability**: Better resource management per household
- ✅ **Debugging**: Easier to identify issues per household
- ✅ **Statistics**: Per-household message counts and connection status

## Implementation

### Using Household-Specific Connections

```typescript
import { getHouseholdMQTTClient } from '@/lib/mqtt-client'

// Get household-specific client
const mqttClient = getHouseholdMQTTClient(householdId)

// Connect if needed
if (!mqttClient.isConnected()) {
  await mqttClient.connect()
}

// Use as normal
await mqttClient.publish({
  topic: `homeassistant/${householdId}/device/status`,
  payload: JSON.stringify({ status: 'online' })
})
```

### Automatic Usage

The following features automatically use household-specific connections:

1. **Home Assistant Sync** (`lib/mqtt/homeassistant-sync.ts`)
   - Each household's HA entities sync through its own connection
   - State changes published via household-specific client

2. **Device Control** (when household context is available)
   - IoT device commands use household-specific connection

### Connection Tracking

All connections are tracked with statistics:

```typescript
import { getMQTTConnectionStats, getHouseholdMQTTStats } from '@/lib/mqtt-client'

// Get all connection stats
const allStats = getMQTTConnectionStats()

// Get specific household stats
const householdStats = getHouseholdMQTTStats(householdId)
```

## Admin Dashboard

### MQTT Statistics

The admin settings page (`/admin/settings`) now displays:

1. **MQTT Broker Status**
   - Broker URL (EMQX)
   - Global connection status
   - Connection health indicator

2. **Connection Summary**
   - Total connections
   - Active connections
   - Households connected
   - Active households

### API Endpoints

#### Get MQTT Statistics

```bash
GET /api/admin/mqtt/stats
```

**Response:**
```json
{
  "broker": {
    "url": "mqtts://xxx.emqx.cloud:8883",
    "type": "EMQX",
    "globalConnected": true
  },
  "summary": {
    "totalConnections": 5,
    "activeConnections": 4,
    "totalHouseholds": 3,
    "activeHouseholds": 2,
    "totalMessagesPublished": 1234,
    "totalMessagesReceived": 567,
    "totalSubscriptions": 12
  },
  "connections": [...],
  "households": [
    {
      "householdId": "abc123",
      "householdName": "Smith Family",
      "clientId": "smart-warehouse-household-abc123",
      "connected": true,
      "connectedAt": "2024-01-01T00:00:00Z",
      "messagesPublished": 100,
      "messagesReceived": 50,
      "deviceCount": 5
    }
  ]
}
```

## Configuration

### Environment Variables

```bash
# MQTT Broker URL (EMQX)
MQTT_BROKER_URL="mqtts://xxx.emqx.cloud:8883"

# Authentication (if required)
MQTT_USERNAME="your-username"
MQTT_PASSWORD="your-password"

# Base Client ID (household clients append household ID)
MQTT_CLIENT_ID="smart-warehouse-production"

# Connection settings
MQTT_KEEPALIVE="60"
MQTT_RECONNECT_PERIOD="1000"
MQTT_CONNECT_TIMEOUT="30000"
```

### EMQX Configuration

For EMQX broker, ensure:

1. **Client ID Format**: Allow dynamic client IDs
2. **ACL Rules**: Configure per-household topic access if needed
3. **Connection Limits**: Set appropriate limits per client

Example EMQX ACL rule (optional):
```
# Allow household-specific topics
user: smart-warehouse-household-*
topic: homeassistant/%c/#
```

## Monitoring

### Connection Health

Check connection status:

```bash
# Check all connections
curl http://localhost:3000/api/admin/mqtt/stats

# Check specific household
curl http://localhost:3000/api/admin/mqtt/stats?householdId=abc123
```

### Logs

Watch for these log messages:

- `MQTT: Creating household-specific client for {householdId}` - New household connection
- `MQTT: Connected successfully` - Connection established
- `MQTT: Cleaned up connection for household {householdId}` - Connection removed

## Cleanup

### Automatic Cleanup

Household connections are automatically cleaned up when:

1. Household is deleted
2. Connection errors occur (with retry logic)
3. Server restart (connections re-established on demand)

### Manual Cleanup

```typescript
import { cleanupHouseholdMQTT } from '@/lib/mqtt-client'

// Disconnect and remove household connection
await cleanupHouseholdMQTT(householdId)
```

## Best Practices

1. **Use Household Clients**: Always use `getHouseholdMQTTClient()` when household context is available
2. **Monitor Connections**: Regularly check admin dashboard for connection health
3. **Handle Errors**: Implement retry logic for connection failures
4. **Clean Up**: Ensure connections are cleaned up when households are deleted
5. **Resource Limits**: Monitor connection counts to avoid exceeding EMQX limits

## Troubleshooting

### Issue: Too Many Connections

**Symptoms**: EMQX rejects new connections

**Solution**:
- Review connection cleanup logic
- Check for orphaned connections
- Increase EMQX connection limits if needed

### Issue: Household Connection Not Created

**Symptoms**: Household operations fail with MQTT errors

**Solution**:
- Check `getHouseholdMQTTClient()` is being called
- Verify household ID is valid
- Check EMQX broker is accessible

### Issue: Connection Stats Not Updating

**Symptoms**: Admin dashboard shows stale connection data

**Solution**:
- Refresh admin page
- Check `/api/admin/mqtt/stats` endpoint
- Verify connection tracking is enabled

## Related Documentation

- [MQTT Broker Activation Guide](./MQTT_BROKER_ACTIVATION_GUIDE.md)
- [EMQX Setup Guide](./EMQX_SETUP_GUIDE.md)
- [Home Assistant Integration](./HOME_ASSISTANT_TOKEN_GUIDE.md)
