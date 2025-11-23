// Hierarchy Join Manager
// 管理层级加入逻辑和自动成员关系
// Manage hierarchy join logic and auto-membership

import { prisma } from './prisma'

/**
 * 自动添加用户到 Building（如果 Household 属于某个 Building）
 * Auto-add user to Building if Household belongs to a Building
 */
export async function autoJoinBuilding(
  userId: string,
  householdId: string
): Promise<{
  success: boolean
  buildingId: string | null
  membershipId: string | null
  error?: string
}> {
  try {
    // 1. 获取 Household 信息
    const household = await prisma.household.findUnique({
      where: { id: householdId },
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

    if (!household || !household.buildingId || !household.building) {
      return {
        success: false,
        buildingId: null,
        membershipId: null,
        error: 'Household does not belong to a building',
      }
    }

    // 2. 检查用户是否已经是 Building 的成员
    const existingMembership = await prisma.buildingMember.findUnique({
      where: {
        userId_buildingId: {
          userId,
          buildingId: household.buildingId,
        },
      },
    })

    if (existingMembership) {
      return {
        success: true,
        buildingId: household.buildingId,
        membershipId: existingMembership.id,
      }
    }

    // 3. 自动添加用户到 Building（作为 MEMBER，自动加入）
    const membership = await prisma.buildingMember.create({
      data: {
        userId,
        buildingId: household.buildingId,
        role: 'MEMBER',
        isAutoJoined: true,
      },
    })

    console.log(`[Auto-join] User ${userId} auto-joined Building ${household.buildingId} from Household ${householdId}`)

    return {
      success: true,
      buildingId: household.buildingId,
      membershipId: membership.id,
    }
  } catch (error: any) {
    console.error('Error auto-joining Building:', error)
    return {
      success: false,
      buildingId: null,
      membershipId: null,
      error: error.message,
    }
  }
}

/**
 * 自动添加用户到 Community（如果 Building 属于某个 Community）
 * Auto-add user to Community if Building belongs to a Community
 */
export async function autoJoinCommunity(
  userId: string,
  buildingId: string
): Promise<{
  success: boolean
  communityId: string | null
  membershipId: string | null
  error?: string
}> {
  try {
    // 1. 获取 Building 信息
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      select: {
        id: true,
        communityId: true,
        community: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!building || !building.communityId || !building.community) {
      return {
        success: false,
        communityId: null,
        membershipId: null,
        error: 'Building does not belong to a community',
      }
    }

    // 2. 检查用户是否已经是 Community 的成员
    const existingMembership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId: building.communityId,
        },
      },
    })

    if (existingMembership) {
      return {
        success: true,
        communityId: building.communityId,
        membershipId: existingMembership.id,
      }
    }

    // 3. 自动添加用户到 Community（作为 MEMBER，自动加入）
    const membership = await prisma.communityMember.create({
      data: {
        userId,
        communityId: building.communityId,
        role: 'MEMBER',
        isAutoJoined: true,
      },
    })

    console.log(`[Auto-join] User ${userId} auto-joined Community ${building.communityId} from Building ${buildingId}`)

    return {
      success: true,
      communityId: building.communityId,
      membershipId: membership.id,
    }
  } catch (error: any) {
    console.error('Error auto-joining Community:', error)
    return {
      success: false,
      communityId: null,
      membershipId: null,
      error: error.message,
    }
  }
}

/**
 * 级联自动加入：Household → Building → Community
 * Cascade auto-join: Household → Building → Community
 */
export async function cascadeAutoJoin(
  userId: string,
  householdId: string
): Promise<{
  building: {
    success: boolean
    buildingId: string | null
    membershipId: string | null
  }
  community: {
    success: boolean
    communityId: string | null
    membershipId: string | null
  }
}> {
  // 1. 自动加入 Building
  const buildingResult = await autoJoinBuilding(userId, householdId)

  // 2. 如果成功加入 Building，自动加入 Community
  let communityResult = {
    success: false,
    communityId: null as string | null,
    membershipId: null as string | null,
  }

  if (buildingResult.success && buildingResult.buildingId) {
    communityResult = await autoJoinCommunity(userId, buildingResult.buildingId)
  }

  return {
    building: buildingResult,
    community: communityResult,
  }
}

/**
 * 检查用户是否可以加入某个层级
 * Check if user can join a hierarchy level
 */
export async function canUserJoin(
  userId: string,
  type: 'community' | 'building' | 'household',
  targetId: string
): Promise<{
  canJoin: boolean
  reason?: string
  existingMembership?: any
}> {
  try {
    if (type === 'household') {
      const existing = await prisma.householdMember.findUnique({
        where: {
          userId_householdId: {
            userId,
            householdId: targetId,
          },
        },
      })

      if (existing) {
        return {
          canJoin: false,
          reason: 'User is already a member of this household',
          existingMembership: existing,
        }
      }

      // 检查用户是否已经是其他 Household 的成员
      const otherMembership = await prisma.householdMember.findFirst({
        where: {
          userId,
          householdId: { not: targetId },
        },
      })

      if (otherMembership) {
        return {
          canJoin: false,
          reason: 'User is already a member of another household',
        }
      }
    } else if (type === 'building') {
      const existing = await prisma.buildingMember.findUnique({
        where: {
          userId_buildingId: {
            userId,
            buildingId: targetId,
          },
        },
      })

      if (existing) {
        return {
          canJoin: false,
          reason: 'User is already a member of this building',
          existingMembership: existing,
        }
      }
    } else if (type === 'community') {
      const existing = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId,
            communityId: targetId,
          },
        },
      })

      if (existing) {
        return {
          canJoin: false,
          reason: 'User is already a member of this community',
          existingMembership: existing,
        }
      }
    }

    return { canJoin: true }
  } catch (error: any) {
    console.error('Error checking if user can join:', error)
    return {
      canJoin: false,
      reason: error.message,
    }
  }
}

