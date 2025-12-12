/**
 * Home Assistant to MQTT Synchronization Service
 * Automatically syncs Home Assistant entities to MQTT for cross-platform control
 */

import { getMQTTClient, type MQTTClient } from '../mqtt-client'
import { getHomeAssistantStates, type HomeAssistantState } from '../homeassistant'
import { getHomeAssistantConfig } from '../homeassistant'
import { prisma } from '../prisma'
import WebSocket from 'ws'

// Active sync sessions per household
import type { MQTTClient } from '../mqtt-client'

const activeSyncSessions = new Map<string, {
  websocket: WebSocket | null
  mqttClient: MQTTClient
  householdId: string
  reconnectTimer?: NodeJS.Timeout
}>()

/**
 * Get MQTT topic for a Home Assistant entity
 */
function getMQTTTopic(householdId: string, entityId: string): string {
  // Format: homeassistant/{householdId}/{entityId}
  const sanitizedEntityId = entityId.replace(/\./g, '/')
  return `homeassistant/${householdId}/${sanitizedEntityId}`
}

/**
 * Publish Home Assistant entity state to MQTT
 */
async function publishEntityToMQTT(
  householdId: string,
  entity: HomeAssistantState,
  mqttClient: ReturnType<typeof getMQTTClient>
): Promise<void> {
  try {
    const topic = getMQTTTopic(householdId, entity.entity_id)
    const payload = JSON.stringify({
      entity_id: entity.entity_id,
      state: entity.state,
      attributes: entity.attributes,
      last_changed: entity.last_changed,
      last_updated: entity.last_updated,
      timestamp: new Date().toISOString(),
    })

    await mqttClient.publish({
      topic,
      payload,
      qos: 1, // At least once delivery
      retain: true, // Retain messages so new subscribers get latest state
    })

    console.log(`[HA-MQTT Sync] Published ${entity.entity_id} to ${topic}`)
  } catch (error) {
    console.error(`[HA-MQTT Sync] Failed to publish ${entity.entity_id}:`, error)
  }
}

/**
 * Create or update IoTDevice record for Home Assistant entity
 */
async function createOrUpdateIoTDevice(
  householdId: string,
  entity: HomeAssistantState,
  mqttTopic: string
): Promise<void> {
  try {
    const deviceId = entity.entity_id
    const friendlyName = entity.attributes?.friendly_name || entity.entity_id
    const domain = entity.entity_id.split('.')[0] // e.g., 'light', 'switch', 'sensor'
    
    // Use upsert with unique constraint: householdId, deviceId, vendor
    await prisma.ioTDevice.upsert({
      where: {
        householdId_deviceId_vendor: {
          householdId,
          deviceId,
          vendor: 'homeassistant',
        },
      },
      update: {
        name: friendlyName,
        status: entity.state === 'unavailable' ? 'offline' : 'online',
        topic: mqttTopic,
        statusTopic: mqttTopic,
        metadata: {
          entity_id: entity.entity_id,
          domain,
          state: entity.state,
          attributes: entity.attributes,
          last_changed: entity.last_changed,
          last_updated: entity.last_updated,
        },
        lastSeen: new Date(),
      },
      create: {
        deviceId,
        name: friendlyName,
        vendor: 'homeassistant',
        connectionType: 'restful',
        topic: mqttTopic,
        statusTopic: mqttTopic,
        commandTopic: null, // Home Assistant uses REST API, not MQTT commands
        baseUrl: null,
        apiKey: null,
        accessToken: null,
        householdId,
        roomId: null,
        status: entity.state === 'unavailable' ? 'offline' : 'online',
        metadata: {
          entity_id: entity.entity_id,
          domain,
          state: entity.state,
          attributes: entity.attributes,
          last_changed: entity.last_changed,
          last_updated: entity.last_updated,
        },
        lastSeen: new Date(),
      },
    })
    
    console.log(`[HA-MQTT Sync] Synced IoTDevice for ${entity.entity_id}`)
  } catch (error) {
    console.error(`[HA-MQTT Sync] Error creating/updating IoTDevice for ${entity.entity_id}:`, error)
    // Don't throw - continue with other entities
  }
}

/**
 * Sync all Home Assistant entities to MQTT
 */
export async function syncAllEntitiesToMQTT(householdId: string): Promise<void> {
  try {
    console.log(`[HA-MQTT Sync] Starting sync for household ${householdId}`)

    // Get Home Assistant config
    const { getHomeAssistantConfig } = await import('../homeassistant')
    const config = await getHomeAssistantConfig(householdId)

    if (!config || !config.baseUrl || !config.accessToken) {
      console.warn(`[HA-MQTT Sync] No Home Assistant config for household ${householdId}`)
      return
    }

    // Get household-specific MQTT client
    const { getHouseholdMQTTClient } = await import('../mqtt-client')
    const mqttClient = getHouseholdMQTTClient(householdId)

    // Ensure MQTT client is connected
    if (!mqttClient.isConnected()) {
      try {
        await mqttClient.connect()
        console.log(`[HA-MQTT Sync] MQTT client connected for household ${householdId}`)
      } catch (mqttError: any) {
        console.error(`[HA-MQTT Sync] Failed to connect to MQTT broker:`, mqttError)
        throw new Error(`MQTT broker connection failed: ${mqttError.message}. Please ensure MQTT_BROKER_URL is configured and broker is running.`)
      }
    }

    // Get all Home Assistant entities
    const entities = await getHomeAssistantStates(undefined, householdId)
    console.log(`[HA-MQTT Sync] Found ${entities.length} entities to sync`)

    // Sync each entity: publish to MQTT and create/update IoTDevice record
    for (const entity of entities) {
      const mqttTopic = getMQTTTopic(householdId, entity.entity_id)
      
      // Publish to MQTT broker
      await publishEntityToMQTT(householdId, entity, mqttClient)
      
      // Create/update IoTDevice record so it shows up in MQTT device management
      await createOrUpdateIoTDevice(householdId, entity, mqttTopic)
    }

    console.log(`[HA-MQTT Sync] Completed sync for household ${householdId}: ${entities.length} entities synced`)
  } catch (error) {
    console.error(`[HA-MQTT Sync] Error syncing entities:`, error)
    throw error
  }
}

/**
 * Start listening to Home Assistant state changes and publish to MQTT
 */
export async function startStateChangeListener(householdId: string): Promise<void> {
  try {
    // Stop existing listener if any
    await stopStateChangeListener(householdId)

    console.log(`[HA-MQTT Sync] Starting state change listener for household ${householdId}`)

    // Get Home Assistant config
    const config = await getHomeAssistantConfig(householdId)

    if (!config || !config.baseUrl || !config.accessToken) {
      console.warn(`[HA-MQTT Sync] No Home Assistant config for household ${householdId}`)
      return
    }

    // Get household-specific MQTT client
    const { getHouseholdMQTTClient } = await import('../mqtt-client')
    const mqttClient = getHouseholdMQTTClient(householdId)

    // Ensure MQTT client is connected
    if (!mqttClient.isConnected()) {
      try {
        await mqttClient.connect()
        console.log(`[HA-MQTT Sync] MQTT client connected for state listener (household ${householdId})`)
      } catch (mqttError: any) {
        console.error(`[HA-MQTT Sync] Failed to connect to MQTT broker for state listener:`, mqttError)
        throw new Error(`MQTT broker connection failed: ${mqttError.message}. Please ensure MQTT_BROKER_URL is configured and broker is running.`)
      }
    }

    // Convert HTTP URL to WebSocket URL
    const wsUrl = config.baseUrl.replace(/^http/i, 'ws') + '/api/websocket'
    let authenticated = false
    let subscriptionId = 1

    // Create WebSocket connection to Home Assistant
    const websocket = new WebSocket(wsUrl)

    websocket.on('open', () => {
      console.log(`[HA-MQTT Sync] WebSocket connected for household ${householdId}`)
    })

    websocket.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString())

        // Handle authentication
        if (message.type === 'auth_required') {
          websocket.send(JSON.stringify({
            type: 'auth',
            access_token: config.accessToken,
          }))
        } else if (message.type === 'auth_ok') {
          authenticated = true
          console.log(`[HA-MQTT Sync] Authenticated with Home Assistant for household ${householdId}`)
          // Subscribe to state_changed events
          websocket.send(JSON.stringify({
            id: subscriptionId++,
            type: 'subscribe_events',
            event_type: 'state_changed',
          }))
        } else if (message.type === 'auth_invalid') {
          console.error(`[HA-MQTT Sync] Authentication failed for household ${householdId}`)
          websocket.close()
        } else if (message.type === 'event' && message.event?.data?.entity_id) {
          // Handle state change event
          const entityId = message.event.data.entity_id
          const newState = message.event.data.new_state

          if (newState) {
            // Publish state change to MQTT
            await publishEntityToMQTT(householdId, newState, mqttClient)
            
            // Update IoTDevice record status
            const mqttTopic = getMQTTTopic(householdId, entityId)
            await createOrUpdateIoTDevice(householdId, newState, mqttTopic)
          }
        }
      } catch (error) {
        console.error(`[HA-MQTT Sync] Error processing WebSocket message:`, error)
      }
    })

    websocket.on('error', (error) => {
      console.error(`[HA-MQTT Sync] WebSocket error for household ${householdId}:`, error)
    })

    websocket.on('close', () => {
      console.log(`[HA-MQTT Sync] WebSocket closed for household ${householdId}`)
      // Attempt to reconnect after 5 seconds if session still exists
      const session = activeSyncSessions.get(householdId)
      if (session) {
        session.reconnectTimer = setTimeout(() => {
          if (activeSyncSessions.has(householdId)) {
            startStateChangeListener(householdId).catch(console.error)
          }
        }, 5000)
      }
    })

    // Store session
    activeSyncSessions.set(householdId, {
      websocket,
      mqttClient,
      householdId,
    })
  } catch (error) {
    console.error(`[HA-MQTT Sync] Error starting state change listener:`, error)
    throw error
  }
}

/**
 * Stop listening to Home Assistant state changes
 */
export async function stopStateChangeListener(householdId: string): Promise<void> {
  const session = activeSyncSessions.get(householdId)
  if (session) {
    if (session.reconnectTimer) {
      clearTimeout(session.reconnectTimer)
    }
    if (session.websocket) {
      session.websocket.close()
    }
    activeSyncSessions.delete(householdId)
    console.log(`[HA-MQTT Sync] Stopped state change listener for household ${householdId}`)
  }
}

/**
 * Initialize sync for a household (sync all entities and start listening)
 */
export async function initializeHASync(householdId: string): Promise<void> {
  try {
    console.log(`[HA-MQTT Sync] Initializing sync for household ${householdId}`)
    
    // First, sync all existing entities
    await syncAllEntitiesToMQTT(householdId)
    
    // Then, start listening to state changes
    await startStateChangeListener(householdId)
    
    console.log(`[HA-MQTT Sync] Initialization complete for household ${householdId}`)
  } catch (error) {
    console.error(`[HA-MQTT Sync] Error initializing sync:`, error)
    throw error
  }
}

/**
 * Cleanup sync for a household
 */
export async function cleanupHASync(householdId: string): Promise<void> {
  await stopStateChangeListener(householdId)
}
