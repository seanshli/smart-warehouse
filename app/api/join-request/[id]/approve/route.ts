// Approve Join Request API
// 批准加入请求 API

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cascadeAutoJoin } from '@/lib/hierarchy-join-manager'

export const dynamic = 'force-dynamic'

/**
 * POST /api/join-request/[id]/approve
 * 批准加入请求
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reviewerId = (session.user as any).id
    const requestId = params.id

    // 获取请求
    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: requestId },
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

    if (!joinRequest) {
      return NextResponse.json({ error: 'Join request not found' }, { status: 404 })
    }

    if (joinRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Join request is not pending' },
        { status: 400 }
      )
    }

    // 验证用户是否有权限批准该请求
    let hasPermission = false

    if (joinRequest.type === 'community') {
      const membership = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: reviewerId,
            communityId: joinRequest.targetId,
          },
        },
      })
      hasPermission =
        membership?.role === 'ADMIN' || membership?.role === 'MANAGER'
    } else if (joinRequest.type === 'building') {
      const membership = await prisma.buildingMember.findUnique({
        where: {
          userId_buildingId: {
            userId: reviewerId,
            buildingId: joinRequest.targetId,
          },
        },
      })
      hasPermission =
        membership?.role === 'ADMIN' || membership?.role === 'MANAGER'
    } else if (joinRequest.type === 'household') {
      const membership = await prisma.householdMember.findUnique({
        where: {
          userId_householdId: {
            userId: reviewerId,
            householdId: joinRequest.targetId,
          },
        },
      })
      hasPermission = membership?.role === 'OWNER'
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to approve this request' },
        { status: 403 }
      )
    }

    // 批准请求并添加用户
    const body = await request.json().catch(() => ({}))
    const role = body.role || (joinRequest.type === 'household' ? 'USER' : 'MEMBER')

    // 根据类型添加用户
    if (joinRequest.type === 'household') {
      // Note: Users can be members of multiple households
      // Only check if they're already a member of THIS specific household
      const existingMembership = await prisma.householdMember.findUnique({
        where: {
          userId_householdId: {
            userId: joinRequest.userId,
            householdId: joinRequest.targetId,
          },
        },
      })

      if (existingMembership) {
        // Update request status to rejected
        await prisma.joinRequest.update({
          where: { id: requestId },
          data: {
            status: 'rejected',
            reviewedAt: new Date(),
            reviewedBy: reviewerId,
          },
        })

        return NextResponse.json(
          {
            error: 'User is already a member of this household. Request rejected.',
          },
          { status: 400 }
        )
      }

      // 添加用户到 Household
      await prisma.householdMember.create({
        data: {
          userId: joinRequest.userId,
          householdId: joinRequest.targetId,
          role: role,
        },
      })

      // 级联自动加入 Building 和 Community
      await cascadeAutoJoin(joinRequest.userId, joinRequest.targetId)
    } else if (joinRequest.type === 'building') {
      await prisma.buildingMember.create({
        data: {
          userId: joinRequest.userId,
          buildingId: joinRequest.targetId,
          role: role,
          isAutoJoined: false,
        },
      })

      // 自动加入 Community（如果 Building 属于某个 Community）
      const building = await prisma.building.findUnique({
        where: { id: joinRequest.targetId },
        select: { communityId: true },
      })

      if (building?.communityId) {
        // 这里可以调用 autoJoinCommunity，但为了简化，我们直接创建
        const existing = await prisma.communityMember.findUnique({
          where: {
            userId_communityId: {
              userId: joinRequest.userId,
              communityId: building.communityId,
            },
          },
        })

        if (!existing) {
          await prisma.communityMember.create({
            data: {
              userId: joinRequest.userId,
              communityId: building.communityId,
              role: 'MEMBER',
              isAutoJoined: true,
            },
          })
        }
      }
    } else if (joinRequest.type === 'community') {
      await prisma.communityMember.create({
        data: {
          userId: joinRequest.userId,
          communityId: joinRequest.targetId,
          role: role,
          isAutoJoined: false,
        },
      })
    }

    // 更新请求状态
    await prisma.joinRequest.update({
      where: { id: requestId },
      data: {
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Join request approved successfully',
    })
  } catch (error: any) {
    console.error('Error approving join request:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to approve join request' },
      { status: 500 }
    )
  }
}

