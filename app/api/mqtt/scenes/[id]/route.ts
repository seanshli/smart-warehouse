// 场景详情、更新、删除 API
// Scene Detail, Update, Delete API

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET: 获取场景详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const sceneId = params.id

    // 获取场景
    const scene = await prisma.scene.findUnique({
      where: { id: sceneId },
      include: {
        household: {
          include: {
            members: {
              where: {
                userId: userId
              }
            }
          }
        },
        actions: {
          include: {
            device: {
              select: {
                id: true,
                name: true,
                vendor: true
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 })
    }

    if (scene.household.members.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ scene })
  } catch (error) {
    console.error('Error fetching scene:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scene' },
      { status: 500 }
    )
  }
}

// PATCH: 更新场景
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const sceneId = params.id
    const body = await request.json()
    const {
      name,
      description,
      enabled,
      actions = []
    } = body

    // 获取场景
    const scene = await prisma.scene.findUnique({
      where: { id: sceneId },
      include: {
        household: {
          include: {
            members: {
              where: {
                userId: userId
              }
            }
          }
        }
      }
    })

    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 })
    }

    if (scene.household.members.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // 验证动作中的设备
    if (Array.isArray(actions)) {
      for (const action of actions) {
        if (action.deviceId) {
          const device = await prisma.ioTDevice.findFirst({
            where: {
              id: action.deviceId,
              householdId: scene.householdId
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

    // 更新场景
    const updatedScene = await prisma.scene.update({
      where: { id: sceneId },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        enabled: enabled !== undefined ? enabled : undefined,
        actions: actions.length > 0 ? {
          deleteMany: {},
          create: actions.map((action: any, index: number) => ({
            deviceId: action.deviceId,
            action: action.action,
            value: action.value || null,
            delayMs: action.delayMs || 0,
            order: action.order !== undefined ? action.order : index
          }))
        } : undefined
      },
      include: {
        actions: {
          include: {
            device: {
              select: {
                id: true,
                name: true,
                vendor: true
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    return NextResponse.json({ scene: updatedScene })
  } catch (error: any) {
    console.error('Error updating scene:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Scene with this name already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update scene' },
      { status: 500 }
    )
  }
}

// DELETE: 删除场景
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const sceneId = params.id

    // 获取场景
    const scene = await prisma.scene.findUnique({
      where: { id: sceneId },
      include: {
        household: {
          include: {
            members: {
              where: {
                userId: userId
              }
            }
          }
        }
      }
    })

    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 })
    }

    if (scene.household.members.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // 删除场景（级联删除动作）
    await prisma.scene.delete({
      where: { id: sceneId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting scene:', error)
    return NextResponse.json(
      { error: 'Failed to delete scene' },
      { status: 500 }
    )
  }
}

