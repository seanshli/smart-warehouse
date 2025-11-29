import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSuperAdmin } from '@/lib/middleware/community-permissions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/announcements
 * Get announcements for the current user's household
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId')
    const source = searchParams.get('source') // Optional filter by source

    if (!householdId) {
      return NextResponse.json({ error: 'Household ID is required' }, { status: 400 })
    }

    // Verify user is a member of this household
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: userId,
          householdId: householdId
        }
      },
      include: {
        household: {
          select: {
            id: true,
            buildingId: true,
            building: {
              select: {
                id: true,
                communityId: true
              }
            }
          }
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'User is not a member of this household' }, { status: 403 })
    }

    const household = membership.household
    const buildingId = household.buildingId
    const communityId = household.building?.communityId

    // Build query for announcements
    const where: any = {
      isActive: true,
      OR: []
    }

    // System-wide announcements (from SYSTEM source with ALL_HOUSEHOLDS)
    where.OR.push({
      AND: [
        { source: 'SYSTEM' },
        { targetType: 'ALL_HOUSEHOLDS' }
      ]
    })

    // Community-level announcements
    if (communityId) {
      // Community admin's ALL_HOUSEHOLDS announcements (only for this community)
      where.OR.push({
        AND: [
          { source: 'COMMUNITY' },
          { sourceId: communityId },
          { targetType: 'ALL_HOUSEHOLDS' }
        ]
      })
      // Community-specific announcements
      where.OR.push(
        { targetType: 'COMMUNITY', targetId: communityId },
        { 
          AND: [
            { source: 'COMMUNITY' },
            { sourceId: communityId }
          ]
        }
      )
    }

    // Building-level announcements
    if (buildingId) {
      // Building admin's ALL_HOUSEHOLDS announcements (only for this building)
      where.OR.push({
        AND: [
          { source: 'BUILDING' },
          { sourceId: buildingId },
          { targetType: 'ALL_HOUSEHOLDS' }
        ]
      })
      // Building-specific announcements
      where.OR.push(
        { targetType: 'BUILDING', targetId: buildingId },
        { 
          AND: [
            { source: 'BUILDING' },
            { sourceId: buildingId }
          ]
        }
      )
    }

    // Add household-specific announcements
    where.OR.push(
      { targetType: 'SPECIFIC_HOUSEHOLD', targetId: householdId }
    )

    // Filter by source if provided
    if (source) {
      where.source = source
    }

    // Filter out expired announcements
    where.OR.push({
      expiresAt: null
    })
    where.OR.push({
      expiresAt: { gt: new Date() }
    })

    // Get announcements
    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get read status for each announcement
    const readStatuses = await prisma.announcementRead.findMany({
      where: {
        userId: userId,
        householdId: householdId,
        announcementId: {
          in: announcements.map(a => a.id)
        }
      },
      select: {
        announcementId: true
      }
    })

    const readAnnouncementIds = new Set(readStatuses.map(r => r.announcementId))

    // Format response
    const formatted = announcements.map(announcement => ({
      id: announcement.id,
      source: announcement.source,
      sourceId: announcement.sourceId,
      title: announcement.title,
      message: announcement.message,
      targetType: announcement.targetType,
      targetId: announcement.targetId,
      createdAt: announcement.createdAt,
      expiresAt: announcement.expiresAt,
      creator: announcement.creator,
      isRead: readAnnouncementIds.has(announcement.id)
    }))

    // Group by source
    const grouped = {
      SYSTEM: formatted.filter(a => a.source === 'SYSTEM'),
      COMMUNITY: formatted.filter(a => a.source === 'COMMUNITY'),
      BUILDING: formatted.filter(a => a.source === 'BUILDING')
    }

    return NextResponse.json({
      announcements: formatted,
      grouped,
      unreadCount: formatted.filter(a => !a.isRead).length
    })

  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/announcements
 * Create a new announcement (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const {
      source, // 'SYSTEM' | 'COMMUNITY' | 'BUILDING'
      sourceId, // Community ID or Building ID, null for SYSTEM
      title,
      message,
      targetType, // 'ALL_HOUSEHOLDS' | 'COMMUNITY' | 'BUILDING' | 'SPECIFIC_HOUSEHOLD'
      targetId, // Community ID, Building ID, or Household ID, null for ALL_HOUSEHOLDS
      expiresAt
    } = body

    // Validate required fields
    if (!source || !title || !message || !targetType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate source
    if (!['SYSTEM', 'COMMUNITY', 'BUILDING'].includes(source)) {
      return NextResponse.json({ error: 'Invalid source' }, { status: 400 })
    }

    // Validate targetType
    if (!['ALL_HOUSEHOLDS', 'COMMUNITY', 'BUILDING', 'SPECIFIC_HOUSEHOLD'].includes(targetType)) {
      return NextResponse.json({ error: 'Invalid target type' }, { status: 400 })
    }

    // Check permissions based on source
    // Super admins can always create announcements regardless of source
    const superAdmin = await isSuperAdmin(userId)
    let hasPermission = superAdmin

    if (source === 'SYSTEM') {
      // Only super admins can create system announcements
      // superAdmin flag already set above
      hasPermission = superAdmin
    } else if (source === 'COMMUNITY') {
      // Check if user is community admin
      if (!sourceId) {
        return NextResponse.json({ error: 'Community ID required for community announcements' }, { status: 400 })
      }
      const membership = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: userId,
            communityId: sourceId
          }
        }
      })
      if (membership && (membership.role === 'ADMIN' || membership.role === 'MANAGER')) {
        hasPermission = true
      }
    } else if (source === 'BUILDING') {
      // Check if user is building admin
      if (!sourceId) {
        return NextResponse.json({ error: 'Building ID required for building announcements' }, { status: 400 })
      }
      const membership = await prisma.buildingMember.findUnique({
        where: {
          userId_buildingId: {
            userId: userId,
            buildingId: sourceId
          }
        }
      })
      if (membership && (membership.role === 'ADMIN' || membership.role === 'MANAGER')) {
        hasPermission = true
      }
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Create announcement
    const announcement = await prisma.announcement.create({
      data: {
        source,
        sourceId: sourceId || null,
        title,
        message,
        targetType,
        targetId: targetId || null,
        createdBy: userId,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      id: announcement.id,
      source: announcement.source,
      sourceId: announcement.sourceId,
      title: announcement.title,
      message: announcement.message,
      targetType: announcement.targetType,
      targetId: announcement.targetId,
      createdAt: announcement.createdAt,
      expiresAt: announcement.expiresAt,
      creator: announcement.creator
    })

  } catch (error: any) {
    console.error('Error creating announcement:', error)
    // Surface more details to the client to help debugging (still generic enough for users)
    const message =
      (error && typeof error === 'object' && 'message' in error && (error as any).message) ||
      'Failed to create announcement'

    return NextResponse.json(
      {
        error: message,
        // Include limited structured info for debugging (safe, no secrets)
        code: (error as any)?.code || null,
      },
      { status: 500 }
    )
  }
}

