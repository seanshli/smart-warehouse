// 场景激活 API
// Scene Activation API

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST: 激活场景
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
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
    }})

    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 })
    }

    if (scene.household.members.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!scene.enabled) {
      return NextResponse.json({ error: 'Scene is disabled' }, { status: 400 })
    }

    // 执行场景动作
    const results = []
    for (const action of scene.actions) {
      // 延迟执行
      if (action.delayMs && action.delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, action.delayMs))
      }

      try {
        // 调用设备控制 API
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mqtt/iot/devices/${action.deviceId}/control`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': request.headers.get('Cookie') || '',
            },
            body: JSON.stringify({
              action: action.action,
              value: action.value,
            }),
          }
        )

        if (response.ok) {
          results.push({
            deviceId: action.deviceId,
            action: action.action,
            success: true
          })
        } else {
          const error = await response.json()
          results.push({
            deviceId: action.deviceId,
            action: action.action,
            success: false,
            error: error.error
          })
        }
      } catch (error: any) {
        results.push({
          deviceId: action.deviceId,
          action: action.action,
          success: false,
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      sceneId: scene.id,
      sceneName: scene.name,
      results
    })
  } catch (error) {
    console.error('Error activating scene:', error)
    return NextResponse.json(
      { error: 'Failed to activate scene' },
      { status: 500 }
    )
  }
}

