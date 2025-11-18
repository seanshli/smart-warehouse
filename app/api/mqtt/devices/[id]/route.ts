// MQTT 設備 API 路由（單個設備）
// 獲取、更新、刪除單個 MQTT 設備

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMQTTClient } from '@/lib/mqtt-client'

export const dynamic = 'force-dynamic'

// GET 處理器：獲取單個設備
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id

    // 獲取設備
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
        },
        room: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    // 驗證用戶有權限存取此設備
    if (device.household.members.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(device)
  } catch (error) {
    console.error('Error fetching MQTT device:', error)
    return NextResponse.json(
      { error: 'Failed to fetch MQTT device' },
      { status: 500 }
    )
  }
}

// PATCH 處理器：更新設備
export async function PATCH(
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

    // 獲取設備並驗證權限
    const existingDevice = await prisma.mQTTDevice.findUnique({
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

    if (!existingDevice) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    if (existingDevice.household.members.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // 更新設備
    const updatedDevice = await prisma.mQTTDevice.update({
      where: { id: params.id },
      data: {
        name: body.name, // 設備名稱
        roomId: body.roomId !== undefined ? body.roomId : existingDevice.roomId, // 房間 ID
        metadata: body.metadata !== undefined ? body.metadata : existingDevice.metadata, // 元資料
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

    return NextResponse.json(updatedDevice)
  } catch (error) {
    console.error('Error updating MQTT device:', error)
    return NextResponse.json(
      { error: 'Failed to update MQTT device' },
      { status: 500 }
    )
  }
}

// DELETE 處理器：刪除設備
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id

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

    // 取消訂閱 MQTT 主題
    try {
      const mqttClient = getMQTTClient()
      if (mqttClient.isConnected()) {
        await mqttClient.unsubscribe(device.statusTopic || device.topic)
        mqttClient.offMessage(device.statusTopic || device.topic)
      }
    } catch (mqttError) {
      console.error('MQTT unsubscribe error:', mqttError)
      // 繼續刪除設備，即使取消訂閱失敗
    }

    // 刪除設備
    await prisma.mQTTDevice.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting MQTT device:', error)
    return NextResponse.json(
      { error: 'Failed to delete MQTT device' },
      { status: 500 }
    )
  }
}

