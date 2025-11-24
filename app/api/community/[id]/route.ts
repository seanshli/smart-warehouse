import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkCommunityPermission, isCommunityMember } from '@/lib/middleware/community-permissions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/community/[id]
 * Get community details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const communityId = params.id

    // Check if user is a member
    if (!(await isCommunityMember(userId, communityId))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const community = await prisma.community.findUnique({
      where: { id: communityId },
      include: {
        _count: {
          select: {
            buildings: true,
            members: true,
            workingGroups: true,
          },
        },
      },
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    // Return community with invitationCode
    return NextResponse.json({
      ...community,
      invitationCode: community.invitationCode || null,
    })
  } catch (error) {
    console.error('Error fetching community:', error)
    return NextResponse.json(
      { error: 'Failed to fetch community' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/community/[id]
 * Update community
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const communityId = params.id
    const body = await request.json()

    // Check if user is super admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    })

    // Super admins can manage all communities, otherwise check permission
    if (!user?.isAdmin) {
      if (!(await checkCommunityPermission(userId, communityId, 'canManageCommunity'))) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
    }

    const { name, description, address, city, district, country, latitude, longitude } = body

    const updated = await prisma.community.update({
      where: { id: communityId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(district !== undefined && { district }),
        ...(country !== undefined && { country }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating community:', error)
    return NextResponse.json(
      { error: 'Failed to update community' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/community/[id]
 * Delete community (only ADMIN)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const communityId = params.id

    // Check if user is super admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    })

    // Super admins can delete any community, otherwise check permission
    if (!user?.isAdmin) {
      if (!(await checkCommunityPermission(userId, communityId, 'canManageCommunity'))) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }

      // Check if user is ADMIN in the community
      const membership = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId,
            communityId,
          },
        },
      })

      if (membership?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Only ADMIN can delete community' }, { status: 403 })
      }
    }

    await prisma.community.delete({
      where: { id: communityId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting community:', error)
    return NextResponse.json(
      { error: 'Failed to delete community' },
      { status: 500 }
    )
  }
}

