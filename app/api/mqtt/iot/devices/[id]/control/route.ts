// 統一 IoT 設備控制 API 路由
// 發送控制命令到 IoT 設備（支援 MQTT 和 RESTful API）

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMQTTClient } from '@/lib/mqtt-client'
import { UnifiedAdapterFactory } from '@/lib/iot-adapters'
import type { ExtendedDeviceVendor } from '@/lib/iot-adapters'

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
    const { action, value } = body

    // 獲取設備並驗證權限
    const device = await prisma.ioTDevice.findUnique({
      where: { id: params.id },
      include: {
        household: {
          select: {
            id: true,
            tuyaHomeId: true,
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

    // 如果是 Tuya 設備，驗證 Member 的 Tuya token 和 Home 訪問權限
    if (device.vendor === 'tuya') {
      const { verifyMemberAccessToTuyaHome } = await import('@/lib/tuya-token-manager')
      const access = await verifyMemberAccessToTuyaHome(userId, device.household.id)
      
      if (!access.canAccess) {
        return NextResponse.json(
          { 
            error: access.error || 'Cannot access Tuya Home',
            needsTokenRefresh: !access.memberTokenValid,
          },
          { status: 403 }
        )
      }

      // 如果 token 無效，提示需要刷新
      if (!access.memberTokenValid) {
        return NextResponse.json(
          {
            error: 'Tuya token is invalid or expired. Please refresh your Tuya login.',
            needsTokenRefresh: true,
            tuyaHomeId: access.tuyaHomeId,
          },
          { status: 401 }
        )
      }
    }

    if (!action) {
      return NextResponse.json(
        { error: 'Missing required field: action' },
        { status: 400 }
      )
    }

    // 獲取適配器
    const adapter = UnifiedAdapterFactory.getAdapter(device.vendor as ExtendedDeviceVendor)

    // 根據連接類型處理命令
    if (device.connectionType === 'mqtt') {
      // MQTT 設備：通過 MQTT 發送命令
      const mqttClient = getMQTTClient()
      if (!mqttClient.isConnected()) {
        await mqttClient.connect()
      }

      // 使用適配器生成命令（需要從 mqtt-adapters 導入）
      const { AdapterFactory } = await import('@/lib/mqtt-adapters')
      const mqttAdapter = AdapterFactory.getAdapter(device.vendor as any)
      
      let commandMessage
      if (action === 'power_on') {
        commandMessage = mqttAdapter.commands.powerOn(device.deviceId)
      } else if (action === 'power_off') {
        commandMessage = mqttAdapter.commands.powerOff(device.deviceId)
      } else if (action === 'set_temperature' && value !== undefined) {
        commandMessage = mqttAdapter.commands.setTemperature(device.deviceId, value)
      } else {
        // 通用命令：根據不同的適配器類型構建正確的命令格式
        if (device.vendor === 'esp') {
          // ESP 適配器需要 command 字段
          commandMessage = mqttAdapter.createCommandMessage(device.deviceId, {
            command: action,
            value
          } as any)
        } else {
          // Tuya 和 Midea 適配器使用 action 字段
          commandMessage = mqttAdapter.createCommandMessage(device.deviceId, {
            action,
            value
          } as any)
        }
      }

      await mqttClient.publish(commandMessage)

      return NextResponse.json({
        success: true,
        message: 'Command sent successfully via MQTT',
        command: {
          action,
          value,
          topic: commandMessage.topic
        }
      })
    } else if (device.connectionType === 'restful') {
      // RESTful 設備：通過 HTTP API 發送命令
      if (!adapter.sendCommand) {
        return NextResponse.json(
          { error: 'RESTful command not supported for this adapter' },
          { status: 400 }
        )
      }

      const command = adapter.createCommand(action, value)
      const config = {
        baseUrl: device.baseUrl || '',
        apiKey: device.apiKey || '',
        accessToken: device.accessToken || '',
        ...(device.metadata as any || {})
      }

      const success = await adapter.sendCommand(device.deviceId, command, config)

      if (success) {
        // 更新設備狀態（可選：重新獲取狀態）
        try {
          if (adapter.getDeviceState) {
            const newState = await adapter.getDeviceState(device.deviceId, config)
            if (newState) {
              await prisma.ioTDevice.update({
                where: { id: device.id },
                data: {
                  state: newState as any,
                  status: 'online',
                  lastSeen: new Date()
                }
              })
            }
          }
        } catch (error) {
          console.error('Failed to update device state after command:', error)
          // 不阻止命令成功返回
        }

        return NextResponse.json({
          success: true,
          message: 'Command sent successfully via RESTful API',
          command: {
            action,
            value
          }
        })
      } else {
        return NextResponse.json(
          { error: 'Failed to send command' },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { error: `Unsupported connection type: ${device.connectionType}` },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error sending IoT command:', error)
    return NextResponse.json(
      { error: 'Failed to send command' },
      { status: 500 }
    )
  }
}

