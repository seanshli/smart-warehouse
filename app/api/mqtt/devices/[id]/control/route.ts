// MQTT 設備控制 API 路由
// 發送控制命令到 MQTT 設備（Tuya、ESP、Midea）

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMQTTClient } from '@/lib/mqtt-client'
import { AdapterFactory } from '@/lib/mqtt-adapters'
import type { DeviceVendor } from '@/lib/mqtt-client'

export const dynamic = 'force-dynamic'

// POST 處理器：發送控制命令
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const body = await request.json()
    const { action, value } = body // 操作和值

    // 獲取設備並驗證權限
    const device = await prisma.mQTTDevice.findUnique({
      where: { id: params.id },
      include: {
        household: {
          select: {
            id: true,
            members: {
              where: {
                userId: userId
              }
            }
          }
        }
      }
    })

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    if (device.household.members.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // 驗證必填欄位
    if (!action) {
      return NextResponse.json(
        { error: 'Missing required field: action' },
        { status: 400 }
      )
    }

    // 獲取適配器
    const Adapter = AdapterFactory.getAdapter(device.vendor as DeviceVendor)

    // 根據供應商和操作生成命令
    let commandMessage
    switch (device.vendor) {
      case 'tuya':
        if (action === 'power_on') {
          commandMessage = Adapter.commands.powerOn(device.deviceId)
        } else if (action === 'power_off') {
          commandMessage = Adapter.commands.powerOff(device.deviceId)
        } else if (action === 'set_temperature' && value !== undefined) {
          commandMessage = Adapter.commands.setTemperature(device.deviceId, value)
        } else if (action === 'set_mode' && value) {
          commandMessage = Adapter.commands.setMode(device.deviceId, value)
        } else if (action === 'set_fan_speed' && value !== undefined) {
          commandMessage = Adapter.commands.setFanSpeed(device.deviceId, value)
        } else {
          // 通用命令
          commandMessage = Adapter.createCommandMessage(device.deviceId, {
            action,
            value
          })
        }
        break

      case 'esp':
        if (action === 'power_on' || action === 'ON') {
          commandMessage = Adapter.commands.powerOn(device.deviceId)
        } else if (action === 'power_off' || action === 'OFF') {
          commandMessage = Adapter.commands.powerOff(device.deviceId)
        } else if (action === 'set_temperature' && value !== undefined) {
          commandMessage = Adapter.commands.setTemperature(device.deviceId, value)
        } else {
          // 通用命令
          commandMessage = Adapter.createCommandMessage(device.deviceId, {
            command: action,
            value
          })
        }
        break

      case 'midea':
        if (action === 'power_on') {
          commandMessage = Adapter.commands.powerOn(device.deviceId)
        } else if (action === 'power_off') {
          commandMessage = Adapter.commands.powerOff(device.deviceId)
        } else if (action === 'set_temperature' && value !== undefined) {
          commandMessage = Adapter.commands.setTemperature(device.deviceId, value)
        } else if (action === 'set_mode' && value) {
          commandMessage = Adapter.commands.setMode(device.deviceId, value)
        } else if (action === 'set_fan_speed' && value !== undefined) {
          commandMessage = Adapter.commands.setFanSpeed(device.deviceId, value)
        } else if (action === 'set_swing' && value !== undefined) {
          commandMessage = Adapter.commands.setSwing(device.deviceId, value)
        } else {
          // 通用命令
          commandMessage = Adapter.createCommandMessage(device.deviceId, {
            cmd: action,
            data: value || {}
          })
        }
        break

      default:
        return NextResponse.json(
          { error: `Unsupported vendor: ${device.vendor}` },
          { status: 400 }
        )
    }

    // 發送 MQTT 命令
    const mqttClient = getMQTTClient()
    if (!mqttClient.isConnected()) {
      await mqttClient.connect()
    }

    await mqttClient.publish(commandMessage)

    return NextResponse.json({
      success: true,
      message: 'Command sent successfully',
      command: {
        action,
        value,
        topic: commandMessage.topic
      }
    })
  } catch (error) {
    console.error('Error sending MQTT command:', error)
    return NextResponse.json(
      { error: 'Failed to send command' },
      { status: 500 }
    )
  }
}

