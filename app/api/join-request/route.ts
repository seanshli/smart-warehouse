// Join Request API
// 加入请求 API - 用于用户请求加入现有的 Community/Building/Household
// Join Request API - For users to request joining existing Community/Building/Household

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/join-request
 * 创建加入请求
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { type, targetId, message } = body

    // 验证输入
    if (!type || !targetId) {
      return NextResponse.json(
        { error: 'Type and target ID are required' },
        { status: 400 }
      )
    }

    if (!['community', 'building', 'household'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be community, building, or household' },
        { status: 400 }
      )
    }

    // 验证目标是否存在
    let targetExists = false
    if (type === 'community') {
      const community = await prisma.community.findUnique({
        where: { id: targetId },
      })
      targetExists = !!community
    } else if (type === 'building') {
      const building = await prisma.building.findUnique({
        where: { id: targetId },
      })
      targetExists = !!building
    } else if (type === 'household') {
      const household = await prisma.household.findUnique({
        where: { id: targetId },
      })
      targetExists = !!household
    }

    if (!targetExists) {
      return NextResponse.json(
        { error: `${type} not found` },
        { status: 404 }
      )
    }

    // 检查是否已经有待处理的请求
    const existingRequest = await prisma.joinRequest.findFirst({
      where: {
        userId,
        type,
        targetId,
        status: 'pending',
      },
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending request for this target' },
        { status: 400 }
      )
    }

    // 创建加入请求
    const joinRequest = await prisma.joinRequest.create({
      data: {
        userId,
        type,
        targetId,
        message: message || null,
        status: 'pending',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Join request created successfully',
      request: {
        id: joinRequest.id,
        type: joinRequest.type,
        targetId: joinRequest.targetId,
        status: joinRequest.status,
        message: joinRequest.message,
        requestedAt: joinRequest.requestedAt,
        user: joinRequest.user,
      },
    })
  } catch (error: any) {
    console.error('Error creating join request:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create join request' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/join-request
 * 获取加入请求列表（根据权限）
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const targetId = searchParams.get('targetId')
    const status = searchParams.get('status') || 'pending'

    // 如果提供了 type 和 targetId，获取该目标的请求列表（需要管理员权限）
    if (type && targetId) {
      // 验证用户是否有权限查看该目标的请求
      let hasPermission = false

      if (type === 'community') {
        const membership = await prisma.communityMember.findUnique({
          where: {
            userId_communityId: {
              userId,
              communityId: targetId,
            },
          },
        })
        hasPermission =
          membership?.role === 'ADMIN' || membership?.role === 'MANAGER'
      } else if (type === 'building') {
        const membership = await prisma.buildingMember.findUnique({
          where: {
            userId_buildingId: {
              userId,
              buildingId: targetId,
            },
          },
        })
        hasPermission =
          membership?.role === 'ADMIN' || membership?.role === 'MANAGER'
      } else if (type === 'household') {
        const membership = await prisma.householdMember.findUnique({
          where: {
            userId_householdId: {
              userId,
              householdId: targetId,
            },
          },
        })
        hasPermission = membership?.role === 'OWNER'
      }

      if (!hasPermission) {
        return NextResponse.json(
          { error: 'You do not have permission to view requests for this target' },
          { status: 403 }
        )
      }

      // 获取该目标的请求列表
      const requests = await prisma.joinRequest.findMany({
        where: {
          type,
          targetId,
          status: status as 'pending' | 'approved' | 'rejected',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          requestedAt: 'desc',
        },
      })

      return NextResponse.json({
        success: true,
        requests,
      })
    }

    // 否则，获取当前用户的请求列表
    const requests = await prisma.joinRequest.findMany({
      where: {
        userId,
      },
      orderBy: {
        requestedAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      requests,
    })
  } catch (error: any) {
    console.error('Error getting join requests:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get join requests' },
      { status: 500 }
    )
  }
}

