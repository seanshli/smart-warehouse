// Reject Join Request API
// 拒绝加入请求 API

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/join-request/[id]/reject
 * 拒绝加入请求
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

    // 验证用户是否有权限拒绝该请求
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
        { error: 'You do not have permission to reject this request' },
        { status: 403 }
      )
    }

    // 更新请求状态
    await prisma.joinRequest.update({
      where: { id: requestId },
      data: {
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Join request rejected successfully',
    })
  } catch (error: any) {
    console.error('Error rejecting join request:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reject join request' },
      { status: 500 }
    )
  }
}

