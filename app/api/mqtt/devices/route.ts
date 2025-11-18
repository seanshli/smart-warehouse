// MQTT 設備 API 路由
// 管理 MQTT IoT 設備（Tuya、ESP、Midea）的 CRUD 操作

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMQTTClient } from '@/lib/mqtt-client'
import { AdapterFactory } from '@/lib/mqtt-adapters'
import type { DeviceVendor } from '@/lib/mqtt-client'

export const dynamic = 'force-dynamic'

// GET 處理器：獲取所有 MQTT 設備
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId') // 家庭 ID
    const vendor = searchParams.get('vendor') as DeviceVendor | null // 供應商篩選

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
      where.vendor = vendor // 按供應商篩選
    }

    // 獲取設備列表
    const devices = await prisma.mQTTDevice.findMany({
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
        name: 'asc' // 按名稱排序
      }
    })

    return NextResponse.json(devices)
  } catch (error) {
    console.error('Error fetching MQTT devices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch MQTT devices' },
      { status: 500 }
    )
  }
}

// POST 處理器：創建新的 MQTT 設備
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const body = await request.json()
    const {
      deviceId, // MQTT 設備 ID
      name, // 設備名稱
      vendor, // 供應商（tuya, esp, midea）
      householdId, // 家庭 ID
      roomId, // 房間 ID（可選）
      metadata // 額外元資料（可選）
    } = body

    // 驗證必填欄位
    if (!deviceId || !name || !vendor || !householdId) {
      return NextResponse.json(
        { error: 'Missing required fields: deviceId, name, vendor, householdId' },
        { status: 400 }
      )
    }

    // 驗證供應商
    if (!['tuya', 'esp', 'midea'].includes(vendor)) {
      return NextResponse.json(
        { error: 'Invalid vendor. Must be tuya, esp, or midea' },
        { status: 400 }
      )
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

    // 使用適配器生成主題
    const Adapter = AdapterFactory.getAdapter(vendor as DeviceVendor)
    const device = Adapter.createDevice(deviceId, name, metadata)

    // 創建設備記錄
    const mqttDevice = await prisma.mQTTDevice.create({
      data: {
        deviceId, // MQTT 設備 ID
        name, // 設備名稱
        vendor, // 供應商
        topic: device.topic, // MQTT 主題
        commandTopic: device.metadata?.commandTopic || device.metadata?.setTopic, // 命令主題
        statusTopic: device.metadata?.statusTopic || device.metadata?.statusTopic, // 狀態主題
        householdId, // 家庭 ID
        roomId: roomId || null, // 房間 ID
        status: 'offline', // 初始狀態：離線
        metadata: metadata || {}, // 元資料
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

    // 連接到 MQTT Broker 並訂閱設備主題
    try {
      const mqttClient = getMQTTClient()
      if (!mqttClient.isConnected()) {
        await mqttClient.connect()
      }

      // 訂閱設備狀態主題
      await mqttClient.subscribe(mqttDevice.statusTopic || mqttDevice.topic, 1)

      // 註冊訊息處理器
      mqttClient.onMessage(mqttDevice.statusTopic || mqttDevice.topic, async (message) => {
        // 解析狀態訊息
        const state = Adapter.parseStateMessage(message)
        
        if (state) {
          // 更新設備狀態
          await prisma.mQTTDevice.update({
            where: { id: mqttDevice.id },
            data: {
              state: state as any,
              status: 'online',
              lastSeen: new Date()
            }
          })
        }
      })
    } catch (mqttError) {
      console.error('MQTT connection error:', mqttError)
      // 不阻止設備創建，僅記錄錯誤
    }

    return NextResponse.json(mqttDevice)
  } catch (error: any) {
    console.error('Error creating MQTT device:', error)
    
    // 處理唯一約束錯誤
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Device already exists in this household' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create MQTT device' },
      { status: 500 }
    )
  }
}

