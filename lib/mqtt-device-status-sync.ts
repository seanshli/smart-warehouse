/**
 * MQTT 设备状态自动同步服务
 * 监听设备状态主题，自动更新数据库并通过 SSE 推送
 */

import { prisma } from '@/lib/prisma'
import { getMQTTClient } from '@/lib/mqtt-client'
import { UnifiedAdapterFactory } from '@/lib/iot-adapters'
import { broadcastToHousehold } from '@/lib/realtime'
import type { ExtendedDeviceVendor } from '@/lib/iot-adapters'

// 存储已订阅的设备状态主题
const subscribedDevices = new Set<string>()

/**
 * 初始化设备状态同步服务
 * 为所有 MQTT 设备订阅状态主题
 */
export async function initializeDeviceStatusSync(householdId: string): Promise<void> {
  try {
    // 获取该家庭的所有 MQTT 设备
    const devices = await prisma.ioTDevice.findMany({
      where: {
        householdId,
        connectionType: 'mqtt',
        statusTopic: {
          not: null,
        },
      },
    })

    if (devices.length === 0) {
      console.log(`[Device Status Sync] No MQTT devices found for household ${householdId}`)
      return
    }

    const mqttClient = getMQTTClient()

    // 确保 MQTT 客户端已连接
    if (!mqttClient.isConnected()) {
      await mqttClient.connect()
    }

    // 为每个设备订阅状态主题
    for (const device of devices) {
      if (!device.statusTopic || subscribedDevices.has(device.id)) {
        continue
      }

      try {
        await mqttClient.subscribe(device.statusTopic, 1)
        console.log(`[Device Status Sync] Subscribed to ${device.statusTopic} for device ${device.name}`)

        // 注册消息处理器
        mqttClient.onMessage(device.statusTopic, async (message) => {
          await handleDeviceStatusUpdate(device.id, device.vendor as ExtendedDeviceVendor, message.payload.toString(), householdId)
        })

        subscribedDevices.add(device.id)
      } catch (error) {
        console.error(`[Device Status Sync] Failed to subscribe to ${device.statusTopic}:`, error)
      }
    }

    console.log(`[Device Status Sync] Initialized for household ${householdId} with ${devices.length} devices`)
  } catch (error) {
    console.error(`[Device Status Sync] Error initializing for household ${householdId}:`, error)
  }
}

/**
 * 处理设备状态更新
 */
async function handleDeviceStatusUpdate(
  deviceId: string,
  vendor: ExtendedDeviceVendor,
  payload: string,
  householdId: string
): Promise<void> {
  try {
    // 解析设备状态
    const adapter = UnifiedAdapterFactory.getAdapter(vendor)
    const state = adapter.parseState({ topic: '', payload })

    if (!state) {
      console.warn(`[Device Status Sync] Failed to parse state for device ${deviceId}`)
      return
    }

    // 更新数据库
    const updatedDevice = await prisma.ioTDevice.update({
      where: { id: deviceId },
      data: {
        state: state as any,
        status: 'online',
        lastSeen: new Date(),
      },
    })

    console.log(`[Device Status Sync] Updated device ${deviceId} status`)

    // 通过 SSE 推送给前端
    broadcastToHousehold(householdId, {
      type: 'device_status_update',
      deviceId: updatedDevice.id,
      deviceName: updatedDevice.name,
      vendor: updatedDevice.vendor,
      state: updatedDevice.state,
      status: updatedDevice.status,
      lastSeen: updatedDevice.lastSeen,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(`[Device Status Sync] Error handling status update for device ${deviceId}:`, error)
  }
}

/**
 * 为新添加的设备订阅状态主题
 */
export async function subscribeDeviceStatus(deviceId: string, householdId: string): Promise<void> {
  try {
    if (subscribedDevices.has(deviceId)) {
      return
    }

    const device = await prisma.ioTDevice.findUnique({
      where: { id: deviceId },
    })

    if (!device || device.connectionType !== 'mqtt' || !device.statusTopic) {
      return
    }

    const mqttClient = getMQTTClient()

    if (!mqttClient.isConnected()) {
      await mqttClient.connect()
    }

    await mqttClient.subscribe(device.statusTopic, 1)
    console.log(`[Device Status Sync] Subscribed to ${device.statusTopic} for device ${device.name}`)

    mqttClient.onMessage(device.statusTopic, async (message) => {
      await handleDeviceStatusUpdate(
        device.id,
        device.vendor as ExtendedDeviceVendor,
        message.payload.toString(),
        householdId
      )
    })

    subscribedDevices.add(deviceId)
  } catch (error) {
    console.error(`[Device Status Sync] Error subscribing to device ${deviceId}:`, error)
  }
}

/**
 * 取消订阅设备状态主题
 */
export async function unsubscribeDeviceStatus(deviceId: string): Promise<void> {
  try {
    const device = await prisma.ioTDevice.findUnique({
      where: { id: deviceId },
    })

    if (!device || !device.statusTopic) {
      return
    }

    const mqttClient = getMQTTClient()
    await mqttClient.unsubscribe(device.statusTopic)
    mqttClient.offMessage(device.statusTopic)

    subscribedDevices.delete(deviceId)
    console.log(`[Device Status Sync] Unsubscribed from ${device.statusTopic} for device ${device.name}`)
  } catch (error) {
    console.error(`[Device Status Sync] Error unsubscribing from device ${deviceId}:`, error)
  }
}

