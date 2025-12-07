/**
 * Messaging permissions utilities
 * Check if user can send messages/calls to households
 */

import { prisma } from '@/lib/prisma'
import { isSuperAdmin } from '@/lib/middleware/community-permissions'

/**
 * Check if user is a frontdesk/admin who can message households
 * - Super admins
 * - Building admins/managers
 * - Community admins/managers
 * - Working group members (frontdesk group)
 */
export async function canMessageHousehold(
  userId: string,
  householdId: string
): Promise<boolean> {
  try {
    // Super admins can always message
    if (await isSuperAdmin(userId)) {
      return true
    }

    // Get household and its building
    const household = await prisma.household.findUnique({
      where: { id: householdId },
      select: {
        id: true,
        buildingId: true,
        building: {
          select: {
            id: true,
            communityId: true,
          },
        },
      },
    })

    if (!household || !household.buildingId) {
      return false
    }

    const buildingId = household.buildingId
    const communityId = household.building?.communityId

    // Check if user is building admin/manager
    const buildingMember = await prisma.buildingMember.findUnique({
      where: {
        userId_buildingId: {
          userId,
          buildingId,
        },
      },
      select: {
        role: true,
      },
    })

    if (buildingMember && (buildingMember.role === 'ADMIN' || buildingMember.role === 'MANAGER')) {
      return true
    }

    // Check if user is community admin/manager
    if (communityId) {
      const communityMember = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId,
            communityId,
          },
        },
        select: {
          role: true,
        },
      })

      if (communityMember && (communityMember.role === 'ADMIN' || communityMember.role === 'MANAGER')) {
        return true
      }
    }

    // Check if user is in frontdesk working group
    if (communityId) {
      const frontdeskGroup = await prisma.workingGroup.findFirst({
        where: {
          communityId,
          name: {
            contains: 'frontdesk',
            mode: 'insensitive',
          },
        },
        include: {
          members: {
            where: { userId },
          },
        },
      })

      if (frontdeskGroup && frontdeskGroup.members.length > 0) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error('Error checking messaging permission:', error)
    return false
  }
}

/**
 * Get or create a conversation between frontdesk/admin and household
 */
export async function getOrCreateConversation(
  userId: string,
  householdId: string,
  buildingId: string | null,
  type: string = 'general',
  relatedId: string | null = null
): Promise<string> {
  try {
    // Check permission first
    if (!(await canMessageHousehold(userId, householdId))) {
      throw new Error('Insufficient permissions to create conversation')
    }

    // Try to find existing active conversation
    const existing = await prisma.conversation.findFirst({
      where: {
        householdId,
        createdBy: userId,
        type,
        status: 'active',
        ...(relatedId ? { relatedId } : {}),
      },
      select: {
        id: true,
      },
    })

    if (existing) {
      return existing.id
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        householdId,
        buildingId,
        createdBy: userId,
        type,
        relatedId,
        status: 'active',
      },
      select: {
        id: true,
      },
    })

    return conversation.id
  } catch (error) {
    console.error('Error getting or creating conversation:', error)
    throw error
  }
}

