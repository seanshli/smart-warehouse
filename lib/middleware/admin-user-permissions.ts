import { prisma } from '@/lib/prisma'

/**
 * Check if current user can manage a target user
 * - Super admins can manage anyone
 * - Community admins can manage users in their working groups
 * - Building admins can manage users in their building's working groups
 */
export async function canManageUser(
  currentUserId: string,
  targetUserId: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // Check if current user is super admin
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { isAdmin: true },
    })

    if (currentUser?.isAdmin) {
      return { allowed: true }
    }

    // Check if target user is in any working group that current user manages
    // Get communities where current user is admin
    const communityAdmins = await prisma.communityMember.findMany({
      where: {
        userId: currentUserId,
        role: { in: ['ADMIN', 'MANAGER'] },
      },
      select: { communityId: true },
    })

    // Get buildings where current user is admin
    const buildingAdmins = await prisma.buildingMember.findMany({
      where: {
        userId: currentUserId,
        role: { in: ['ADMIN', 'MANAGER'] },
      },
      select: { buildingId: true },
    })

    // Get working groups in user's communities
    const communityWorkingGroups = await prisma.workingGroup.findMany({
      where: {
        communityId: { in: communityAdmins.map(c => c.communityId) },
      },
      select: { id: true },
    })

    // Get working groups in user's buildings (through community)
    const buildingCommunities = await prisma.building.findMany({
      where: {
        id: { in: buildingAdmins.map(b => b.buildingId) },
      },
      select: { communityId: true },
    })

    const buildingWorkingGroups = await prisma.workingGroup.findMany({
      where: {
        communityId: { in: buildingCommunities.map(b => b.communityId) },
      },
      select: { id: true },
    })

    const allWorkingGroupIds = [
      ...communityWorkingGroups.map(wg => wg.id),
      ...buildingWorkingGroups.map(wg => wg.id),
    ]

    // Check if target user is in any of these working groups
    if (allWorkingGroupIds.length > 0) {
      const targetUserInWorkingGroup = await prisma.workingGroupMember.findFirst({
        where: {
          userId: targetUserId,
          workingGroupId: { in: allWorkingGroupIds },
        },
      })

      if (targetUserInWorkingGroup) {
        return { allowed: true }
      }
    }

    // Also check if target user is in working crews for buildings user manages
    const buildingWorkingCrews = await prisma.workingCrew.findMany({
      where: {
        buildingId: { in: buildingAdmins.map(b => b.buildingId) },
      },
      select: { id: true },
    })

    if (buildingWorkingCrews.length > 0) {
      const targetUserInCrew = await prisma.crewMember.findFirst({
        where: {
          userId: targetUserId,
          crewId: { in: buildingWorkingCrews.map(c => c.id) },
        },
      })

      if (targetUserInCrew) {
        return { allowed: true }
      }
    }

    return {
      allowed: false,
      reason: 'User is not in any working group or crew you manage',
    }
  } catch (error) {
    console.error('Error checking user management permissions:', error)
    return { allowed: false, reason: 'Error checking permissions' }
  }
}

