import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/context
 * Get the current user's admin context (super admin, community admin, building admin)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Check if user is super admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        isAdmin: true,
        email: true,
        name: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const context: {
      isSuperAdmin: boolean
      communityAdmins: Array<{ id: string; name: string }>
      buildingAdmins: Array<{ id: string; name: string; communityId: string; communityName: string }>
    } = {
      isSuperAdmin: user.isAdmin || false,
      communityAdmins: [],
      buildingAdmins: [],
    }

    // Get community admin roles
    try {
      const communityMemberships = await prisma.communityMember.findMany({
        where: {
          userId,
          role: { in: ['ADMIN', 'MANAGER'] },
        },
        include: {
          community: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      context.communityAdmins = communityMemberships
        .filter(m => m.role === 'ADMIN' && m.community)
        .map(m => ({
          id: m.community.id,
          name: m.community.name,
        }))
    } catch (error) {
      console.error('Error fetching community memberships:', error)
      context.communityAdmins = []
    }

    // Get building admin roles
    try {
      const buildingMemberships = await prisma.buildingMember.findMany({
        where: {
          userId,
          role: { in: ['ADMIN', 'MANAGER'] },
        },
        include: {
          building: {
            select: {
              id: true,
              name: true,
              communityId: true,
              community: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      })

      context.buildingAdmins = buildingMemberships
        .filter(m => m.role === 'ADMIN' && m.building && m.building.community)
        .map(m => ({
          id: m.building!.id,
          name: m.building!.name,
          communityId: m.building!.community!.id,
          communityName: m.building!.community!.name,
        }))
    } catch (error) {
      console.error('Error fetching building memberships:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error details:', {
        errorMessage,
        error: error instanceof Error ? error.stack : String(error)
      })
      // Continue with empty array if query fails
      context.buildingAdmins = []
    }

    return NextResponse.json(context)
  } catch (error) {
    console.error('Error fetching admin context:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin context' },
      { status: 500 }
    )
  }
}

