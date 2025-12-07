// Unified Join API
// 统一加入 API - 支持 Community、Building、Household
// Unified Join API - Supports Community, Building, Household

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cascadeAutoJoin, canUserJoin } from '@/lib/hierarchy-join-manager'

export const dynamic = 'force-dynamic'

/**
 * POST /api/join
 * 通过邀请码加入 Community、Building 或 Household
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { type, invitationCode, role } = body

    // 验证输入
    if (!type || !invitationCode) {
      return NextResponse.json(
        { error: 'Type and invitation code are required' },
        { status: 400 }
      )
    }

    if (!['community', 'building', 'household'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be community, building, or household' },
        { status: 400 }
      )
    }

    // 根据类型处理加入逻辑
    if (type === 'household') {
      return await joinHousehold(userId, invitationCode, role)
    } else if (type === 'building') {
      return await joinBuilding(userId, invitationCode, role)
    } else if (type === 'community') {
      return await joinCommunity(userId, invitationCode, role)
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error: any) {
    console.error('Error in unified join API:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to join' },
      { status: 500 }
    )
  }
}

/**
 * 加入 Household
 */
async function joinHousehold(
  userId: string,
  invitationCode: string,
  role: string = 'USER'
) {
  // 验证角色
  const validRoles = ['OWNER', 'USER', 'VISITOR']
  if (role && !validRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  // 查找 Household
  const household = await prisma.household.findUnique({
    where: { invitationCode },
    include: {
      building: {
        select: {
          id: true,
          name: true,
          communityId: true,
        },
      },
    },
  })

  if (!household) {
    return NextResponse.json({ error: 'Invalid invitation code' }, { status: 404 })
  }

  // 检查是否可以加入
  const canJoin = await canUserJoin(userId, 'household', household.id)
  if (!canJoin.canJoin) {
    return NextResponse.json(
      { error: canJoin.reason || 'Cannot join household' },
      { status: 400 }
    )
  }

  // 添加用户到 Household
  const membership = await prisma.householdMember.create({
    data: {
      userId,
      householdId: household.id,
      role: role || 'USER',
    },
    include: {
      household: {
        select: {
          id: true,
          name: true,
          tuyaHomeId: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          tuyaAccount: true,
        },
      },
    },
  })

  // 级联自动加入 Building 和 Community
  const autoJoinResult = await cascadeAutoJoin(userId, household.id)

  return NextResponse.json({
    success: true,
    message: 'Successfully joined household',
    household: {
      id: household.id,
      name: household.name,
    },
    membership: {
      id: membership.id,
      role: membership.role,
    },
    autoJoined: {
      building: autoJoinResult.building.success
        ? {
            id: autoJoinResult.building.buildingId,
            membershipId: autoJoinResult.building.membershipId,
          }
        : null,
      community: autoJoinResult.community.success
        ? {
            id: autoJoinResult.community.communityId,
            membershipId: autoJoinResult.community.membershipId,
          }
        : null,
    },
    needsTuyaHomeAddition:
      membership.household.tuyaHomeId && !!membership.user.tuyaAccount,
    tuyaHomeId: membership.household.tuyaHomeId,
  })
}

/**
 * 加入 Building
 */
async function joinBuilding(
  userId: string,
  invitationCode: string,
  role: string = 'MEMBER'
) {
  // 验证角色
  const validRoles = ['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']
  if (role && !validRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  // 查找 Building
  const building = await prisma.building.findUnique({
    where: { invitationCode },
    include: {
      community: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!building) {
    return NextResponse.json({ error: 'Invalid invitation code' }, { status: 404 })
  }

  // 检查是否可以加入
  const canJoin = await canUserJoin(userId, 'building', building.id)
  if (!canJoin.canJoin) {
    return NextResponse.json(
      { error: canJoin.reason || 'Cannot join building' },
      { status: 400 }
    )
  }

  // 添加用户到 Building - try with memberClass first, fallback without it if column doesn't exist
  let membership
  try {
    membership = await prisma.buildingMember.create({
      data: {
        userId,
        buildingId: building.id,
        role: role || 'MEMBER',
        isAutoJoined: false, // 手动加入
        // Note: memberClass might not exist in database schema
    },
  })

  // 自动加入 Community（如果 Building 属于某个 Community）
  const communityResult = await cascadeAutoJoin(userId, building.id).then(
    (result) => result.community
  )

  return NextResponse.json({
    success: true,
    message: 'Successfully joined building',
    building: {
      id: building.id,
      name: building.name,
    },
    membership: {
      id: membership.id,
      role: membership.role,
      isAutoJoined: membership.isAutoJoined,
    },
    autoJoined: {
      community: communityResult.success
        ? {
            id: communityResult.communityId,
            membershipId: communityResult.membershipId,
          }
        : null,
    },
  })
}

/**
 * 加入 Community
 */
async function joinCommunity(
  userId: string,
  invitationCode: string,
  role: string = 'MEMBER'
) {
  // 验证角色
  const validRoles = ['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']
  if (role && !validRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  // 查找 Community
  const community = await prisma.community.findUnique({
    where: { invitationCode },
  })

  if (!community) {
    return NextResponse.json({ error: 'Invalid invitation code' }, { status: 404 })
  }

  // 检查是否可以加入
  const canJoin = await canUserJoin(userId, 'community', community.id)
  if (!canJoin.canJoin) {
    return NextResponse.json(
      { error: canJoin.reason || 'Cannot join community' },
      { status: 400 }
    )
  }

  // 添加用户到 Community
  const membership = await prisma.communityMember.create({
    data: {
      userId,
      communityId: community.id,
      role: role || 'MEMBER',
      isAutoJoined: false, // 手动加入
    },
  })

  return NextResponse.json({
    success: true,
    message: 'Successfully joined community',
    community: {
      id: community.id,
      name: community.name,
    },
    membership: {
      id: membership.id,
      role: membership.role,
      isAutoJoined: membership.isAutoJoined,
    },
  })
}

/**
 * GET /api/join
 * 验证邀请码
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const invitationCode = searchParams.get('code')

    if (!type || !invitationCode) {
      return NextResponse.json(
        { error: 'Type and invitation code are required' },
        { status: 400 }
      )
    }

    if (!['community', 'building', 'household'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be community, building, or household' },
        { status: 400 }
      )
    }

    // 根据类型查找
    if (type === 'household') {
      const household = await prisma.household.findUnique({
        where: { invitationCode },
        select: {
          id: true,
          name: true,
          description: true,
          _count: {
            select: { members: true },
          },
        },
      })

      if (!household) {
        return NextResponse.json({ error: 'Invalid invitation code' }, { status: 404 })
      }

      return NextResponse.json({
        type: 'household',
        household: {
          id: household.id,
          name: household.name,
          description: household.description,
          membersCount: household._count.members,
        },
        canJoin: true,
      })
    } else if (type === 'building') {
      const building = await prisma.building.findUnique({
        where: { invitationCode },
        select: {
          id: true,
          name: true,
          description: true,
          _count: {
            select: { members: true },
          },
        },
      })

      if (!building) {
        return NextResponse.json({ error: 'Invalid invitation code' }, { status: 404 })
      }

      return NextResponse.json({
        type: 'building',
        building: {
          id: building.id,
          name: building.name,
          description: building.description,
          membersCount: building._count.members,
        },
        canJoin: true,
      })
    } else if (type === 'community') {
      const community = await prisma.community.findUnique({
        where: { invitationCode },
        select: {
          id: true,
          name: true,
          description: true,
          _count: {
            select: { members: true },
          },
        },
      })

      if (!community) {
        return NextResponse.json({ error: 'Invalid invitation code' }, { status: 404 })
      }

      return NextResponse.json({
        type: 'community',
        community: {
          id: community.id,
          name: community.name,
          description: community.description,
          membersCount: community._count.members,
        },
        canJoin: true,
      })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error: any) {
    console.error('Error validating invitation code:', error)
    return NextResponse.json(
      { error: 'Failed to validate invitation code' },
      { status: 500 }
    )
  }
}

