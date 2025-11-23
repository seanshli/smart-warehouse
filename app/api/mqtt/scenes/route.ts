// 场景管理 API
// Scene Management API

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET: 获取所有场景
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId')

    // 获取用户的家庭
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

    // 获取场景列表
    const scenes = await prisma.scene.findMany({
      where: {
        householdId: household.id
      },
      include: {
        actions: {
          include: {
            scene: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ scenes })
  } catch (error) {
    console.error('Error fetching scenes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scenes' },
      { status: 500 }
    )
  }
}

// POST: 创建新场景
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const {
      name,
      description,
      householdId,
      enabled = true,
      actions = [],
      icon,
      color
    } = body

    // 验证必填字段
    if (!name || !householdId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, householdId' },
        { status: 400 }
      )
    }

    // 验证用户有权限访问此家庭
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

    // 验证动作中的设备
    if (Array.isArray(actions)) {
      for (const action of actions) {
        if (action.deviceId) {
          const device = await prisma.ioTDevice.findFirst({
            where: {
              id: action.deviceId,
              householdId: householdId
            }
          })

          if (!device) {
            return NextResponse.json(
              { error: `Device not found: ${action.deviceId}` },
              { status: 404 }
            )
          }
        }
      }
    }

    // 创建场景
    const scene = await prisma.scene.create({
      data: {
        name,
        description,
        householdId,
        enabled,
        icon: icon || null,
        color: color || null,
        actions: {
          create: actions.map((action: any, index: number) => ({
            deviceId: action.deviceId,
            action: action.action,
            value: action.value || null,
            delayMs: action.delayMs || 0,
            order: action.order !== undefined ? action.order : index
          }))
        }
      },
      include: {
        actions: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    return NextResponse.json({ scene })
  } catch (error: any) {
    console.error('Error creating scene:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Scene with this name already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create scene' },
      { status: 500 }
    )
  }
}

