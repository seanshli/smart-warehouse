// 統一 IoT 設備 API 路由
// 管理所有 IoT 設備（MQTT 和 RESTful API）的 CRUD 操作

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMQTTClient } from '@/lib/mqtt-client'
import { UnifiedAdapterFactory } from '@/lib/iot-adapters'
import type { ExtendedDeviceVendor } from '@/lib/iot-adapters'
import type { ConnectionType } from '@/lib/iot-adapters/base-adapter'

export const dynamic = 'force-dynamic'

// GET 處理器：獲取所有 IoT 設備
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId')
    const vendor = searchParams.get('vendor') as ExtendedDeviceVendor | null
    const connectionType = searchParams.get('connectionType') as ConnectionType | null

    // 獲取用戶的家庭
    let household
    if (householdId) {
      household = await prisma.household.findFirst({
        where: {
          id: householdId,
          members: {
            some: {
              userId: userId
            }
          }
        }
      })
    } else {
      household = await prisma.household.findFirst({
        where: {
          members: {
            some: {
              userId: userId
            }
          }
        }
      })
    }

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    // 構建查詢條件
    const where: any = {
      householdId: household.id
    }

    if (vendor) {
      where.vendor = vendor
    }

    if (connectionType) {
      where.connectionType = connectionType
    }

    // 獲取設備列表
    const devices = await prisma.ioTDevice.findMany({
      where,
      include: {
        room: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(devices)
  } catch (error) {
    console.error('Error fetching IoT devices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch IoT devices' },
      { status: 500 }
    )
  }
}

// POST 處理器：創建新的 IoT 設備
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const body = await request.json()
    const {
      deviceId,
      name,
      vendor, // 供應商（tuya, esp, midea, philips, panasonic）
      connectionType, // 連接類型（mqtt, restful）
      householdId,
      roomId,
      baseUrl, // RESTful API 基礎 URL
      apiKey, // API 金鑰
      accessToken, // 訪問令牌
      metadata
    } = body

    // 驗證必填欄位
    if (!deviceId || !name || !vendor || !householdId) {
      return NextResponse.json(
        { error: 'Missing required fields: deviceId, name, vendor, householdId' },
        { status: 400 }
      )
    }

    // 驗證供應商
    const validVendors = ['tuya', 'esp', 'midea', 'philips', 'panasonic']
    if (!validVendors.includes(vendor)) {
      return NextResponse.json(
        { error: `Invalid vendor. Must be one of: ${validVendors.join(', ')}` },
        { status: 400 }
      )
    }

    // 自動檢測連接類型（如果未提供）
    const detectedConnectionType = connectionType || UnifiedAdapterFactory.getConnectionType(vendor as ExtendedDeviceVendor)

    // 驗證 RESTful 設備的必要配置
    if (detectedConnectionType === 'restful') {
      if (!baseUrl) {
        return NextResponse.json(
          { error: 'RESTful devices require baseUrl' },
          { status: 400 }
        )
      }
    }

    // 驗證用戶有權限存取此家庭
    const household = await prisma.household.findFirst({
      where: {
        id: householdId,
        members: {
          some: {
            userId: userId
          }
        }
      }
    })

    if (!household) {
      return NextResponse.json({ error: 'Household not found or access denied' }, { status: 403 })
    }

    // 驗證房間（如果提供）
    if (roomId) {
      const room = await prisma.room.findFirst({
        where: {
          id: roomId,
          householdId: householdId
        }
      })

      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 })
      }
    }

    // 使用適配器創建設備
    const adapter = UnifiedAdapterFactory.getAdapter(vendor as ExtendedDeviceVendor)
    const device = adapter.createDevice(deviceId, name, {
      baseUrl,
      apiKey,
      accessToken,
      ...metadata
    })

    // 創建設備記錄
    const iotDevice = await prisma.ioTDevice.create({
      data: {
        deviceId,
        name,
        vendor,
        connectionType: detectedConnectionType,
        topic: device.topic || null,
        commandTopic: device.metadata?.commandTopic || device.metadata?.setTopic || null,
        statusTopic: device.metadata?.statusTopic || null,
        baseUrl: baseUrl || null,
        apiKey: apiKey || null,
        accessToken: accessToken || null,
        householdId,
        roomId: roomId || null,
        status: 'offline',
        metadata: metadata || {},
      },
      include: {
        room: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // 如果是 MQTT 設備，連接到 MQTT Broker 並訂閱
    if (detectedConnectionType === 'mqtt') {
      try {
        const mqttClient = getMQTTClient()
        if (!mqttClient.isConnected()) {
          await mqttClient.connect()
        }

        // 訂閱設備狀態主題
        const topicToSubscribe = iotDevice.statusTopic || iotDevice.topic
        if (topicToSubscribe) {
          await mqttClient.subscribe(topicToSubscribe, 1)

          // 註冊訊息處理器
          mqttClient.onMessage(topicToSubscribe, async (message) => {
            const state = adapter.parseState(message)
            
            if (state) {
              await prisma.ioTDevice.update({
                where: { id: iotDevice.id },
                data: {
                  state: state as any,
                  status: 'online',
                  lastSeen: new Date()
                }
              })
            }
          })
        }
      } catch (mqttError) {
        console.error('MQTT connection error:', mqttError)
      }
    }

    return NextResponse.json(iotDevice)
  } catch (error: any) {
    console.error('Error creating IoT device:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Device already exists in this household' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create IoT device' },
      { status: 500 }
    )
  }
}

