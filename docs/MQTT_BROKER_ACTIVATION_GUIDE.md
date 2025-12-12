# MQTT Broker Activation Guide

## Overview

This guide explains how to ensure the MQTT broker is active and connected for Smart Warehouse.

## Quick Status Check

### 1. Check MQTT Broker Status

```bash
# Check if MQTT broker is connected
curl http://localhost:3000/api/mqtt/status

# Expected response when connected:
# {
#   "connected": true,
#   "brokerUrl": "mqtt://localhost:1883",
#   "clientId": "smart-warehouse-dev",
#   "timestamp": "2024-01-01T00:00:00.000Z"
# }
```

### 2. Check Overall Health (includes MQTT)

```bash
curl http://localhost:3000/api/health

# Expected response:
# {
#   "status": "healthy",
#   "database": "connected",
#   "mqtt": {
#     "connected": true,
#     "brokerUrl": "mqtt://localhost:1883"
#   },
#   "responseTime": "5ms",
#   "timestamp": "2024-01-01T00:00:00.000Z"
# }
```

## Configuration

### Environment Variables

Ensure these environment variables are set:

```bash
# Required: MQTT Broker URL
MQTT_BROKER_URL="mqtt://localhost:1883"  # Development
# or
MQTT_BROKER_URL="mqtts://broker.example.com:8883"  # Production (TLS)

# Optional: Authentication
MQTT_USERNAME="your-username"
MQTT_PASSWORD="your-password"

# Optional: Client ID
MQTT_CLIENT_ID="smart-warehouse-production"

# Optional: Connection settings
MQTT_RECONNECT_PERIOD="1000"  # milliseconds
MQTT_CONNECT_TIMEOUT="30000"  # milliseconds
```

### Local Development

For local development, you can use:

1. **EMQX** (Recommended):
   ```bash
   docker run -d --name emqx -p 1883:1883 -p 8083:8083 -p 8084:8084 -p 8883:8883 -p 18083:18083 emqx/emqx:latest
   ```

2. **Mosquitto**:
   ```bash
   docker run -it -p 1883:1883 -p 9001:9001 eclipse-mosquitto
   ```

Then set:
```bash
MQTT_BROKER_URL="mqtt://localhost:1883"
```

### Production

For production, use a managed MQTT broker service:

1. **EMQX Cloud**: https://www.emqx.com/en/cloud
2. **HiveMQ Cloud**: https://www.hivemq.com/cloud/
3. **AWS IoT Core**: https://aws.amazon.com/iot-core/

Set the broker URL in your environment:
```bash
MQTT_BROKER_URL="mqtts://your-broker.emqx.cloud:8883"
MQTT_USERNAME="your-username"
MQTT_PASSWORD="your-password"
```

## Automatic Connection

The MQTT client automatically connects when:

1. **Home Assistant sync is initialized** - When you save Home Assistant config
2. **Device control is requested** - When controlling IoT devices
3. **Device discovery is triggered** - When scanning for devices
4. **Health check is performed** - When `/api/health` is called

## Manual Connection

### Force Reconnect

If the broker is disconnected, you can force a reconnect:

```bash
# POST to reconnect endpoint
curl -X POST http://localhost:3000/api/mqtt/status

# Response:
# {
#   "success": true,
#   "connected": true,
#   "message": "Successfully reconnected to MQTT broker",
#   "brokerUrl": "mqtt://localhost:1883",
#   "timestamp": "2024-01-01T00:00:00.000Z"
# }
```

## Troubleshooting

### Issue: MQTT broker not connecting

**Symptoms:**
- `/api/mqtt/status` returns `connected: false`
- Home Assistant sync fails
- Device control doesn't work

**Solutions:**

1. **Check broker URL:**
   ```bash
   echo $MQTT_BROKER_URL
   # Should output: mqtt://localhost:1883 or mqtts://broker.example.com:8883
   ```

2. **Test broker connectivity:**
   ```bash
   # For local broker
   telnet localhost 1883
   
   # For remote broker (if using mqtt://)
   telnet broker.example.com 1883
   
   # For TLS broker (if using mqtts://)
   openssl s_client -connect broker.example.com:8883
   ```

3. **Check broker logs:**
   - If using Docker, check container logs: `docker logs emqx`
   - If using cloud service, check dashboard

4. **Verify credentials:**
   - Check `MQTT_USERNAME` and `MQTT_PASSWORD` are correct
   - Test with MQTT client tool (MQTTX, mosquitto_pub, etc.)

5. **Check firewall/network:**
   - Ensure port 1883 (or 8883 for TLS) is open
   - Check if VPN is required for remote broker

### Issue: Connection drops frequently

**Solutions:**

1. **Increase keepalive:**
   ```bash
   MQTT_KEEPALIVE="120"  # seconds
   ```

2. **Check broker configuration:**
   - Ensure broker allows persistent connections
   - Check broker's connection timeout settings

3. **Monitor connection:**
   - Check server logs for reconnection messages
   - Use `/api/mqtt/status` to monitor connection state

### Issue: Home Assistant sync fails

**Symptoms:**
- Home Assistant entities not syncing to MQTT
- Error: "MQTT broker connection failed"

**Solutions:**

1. **Ensure MQTT broker is connected:**
   ```bash
   curl http://localhost:3000/api/mqtt/status
   ```

2. **Manually trigger sync:**
   ```bash
   curl -X POST http://localhost:3000/api/mqtt/homeassistant/sync \
     -H "Content-Type: application/json" \
     -d '{"householdId": "your-household-id"}'
   ```

3. **Check server logs:**
   - Look for `[HA-MQTT Sync]` messages
   - Check for connection errors

## Monitoring

### Health Check Endpoint

The `/api/health` endpoint now includes MQTT status:

```bash
curl http://localhost:3000/api/health | jq .mqtt
```

### Status Endpoint

Use `/api/mqtt/status` for detailed MQTT information:

```bash
curl http://localhost:3000/api/mqtt/status | jq .
```

### Server Logs

Watch for these log messages:

- `MQTT: Connected successfully` - Broker connected
- `MQTT: Connection error` - Connection failed
- `MQTT: Reconnecting...` - Attempting to reconnect
- `[HA-MQTT Sync] MQTT client connected` - HA sync ready

## Best Practices

1. **Always check MQTT status** before using IoT features
2. **Use TLS (mqtts://)** in production
3. **Set up monitoring** for broker connection status
4. **Configure auto-reconnect** (already enabled by default)
5. **Use health checks** in deployment pipelines

## API Endpoints

- `GET /api/mqtt/status` - Check MQTT broker connection status
- `POST /api/mqtt/status` - Force reconnect to MQTT broker
- `GET /api/health` - Overall health check (includes MQTT)

## Related Documentation

- [EMQX Setup Guide](./EMQX_SETUP_GUIDE.md)
- [MQTT Production Setup](./MQTT_PRODUCTION_SETUP.md)
- [Home Assistant Integration](./HOME_ASSISTANT_TOKEN_GUIDE.md)
