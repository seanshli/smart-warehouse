/**
 * Community and Building permission checking utilities
 */

import { prisma } from '@/lib/prisma'
import { 
  getCommunityPermissions, 
  CommunityRole, 
  CommunityPermissions,
  canManageCommunityRole,
  getAssignableCommunityRoles,
} from '@/lib/permissions'

// Re-export for convenience
export { canManageCommunityRole, getAssignableCommunityRoles }

/**
 * Check if user has a specific permission in a community
 */
export async function checkCommunityPermission(
  userId: string,
  communityId: string,
  permission: keyof CommunityPermissions
): Promise<boolean> {
  try {
    const membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
    })

    if (!membership) return false

    const role = (membership.role || 'MEMBER') as CommunityRole
    const permissions = getCommunityPermissions(role)
    return permissions[permission]
  } catch (error) {
    console.error('Error checking community permission:', error)
    return false
  }
}

/**
 * Get user's role in a community
 */
export async function getUserCommunityRole(
  userId: string,
  communityId: string
): Promise<CommunityRole | null> {
  try {
    const membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
    })

    if (!membership) return null

    return (membership.role || 'MEMBER') as CommunityRole
  } catch (error) {
    console.error('Error getting user community role:', error)
    return null
  }
}

/**
 * Get user's permissions in a community
 */
export async function getUserCommunityPermissions(
  userId: string,
  communityId: string
): Promise<CommunityPermissions | null> {
  try {
    const role = await getUserCommunityRole(userId, communityId)
    if (!role) return null

    return getCommunityPermissions(role)
  } catch (error) {
    console.error('Error getting user community permissions:', error)
    return null
  }
}

/**
 * Check if user is a member of a community
 */
export async function isCommunityMember(
  userId: string,
  communityId: string
): Promise<boolean> {
  try {
    const membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
    })

    return !!membership
  } catch (error) {
    console.error('Error checking community membership:', error)
    return false
  }
}

/**
 * Check if user has permission to access a building
 */
export async function checkBuildingAccess(
  userId: string,
  buildingId: string
): Promise<boolean> {
  try {
    // Get building with community
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      include: { community: true },
    })

    if (!building) return false

    // Check if user is a member of the community
    return await isCommunityMember(userId, building.communityId)
  } catch (error) {
    console.error('Error checking building access:', error)
    return false
  }
}

/**
 * Check if user has permission to manage a building
 */
export async function checkBuildingManagement(
  userId: string,
  buildingId: string
): Promise<boolean> {
  try {
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      include: { community: true },
    })

    if (!building) return false

    return await checkCommunityPermission(userId, building.communityId, 'canManageBuildings')
  } catch (error) {
    console.error('Error checking building management:', error)
    return false
  }
}

