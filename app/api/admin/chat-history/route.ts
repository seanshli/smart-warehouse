import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/chat-history
 * Get chat history for admin viewing
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user is admin or building admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        buildingMemberships: {
          select: {
            buildingId: true,
            role: true,
            memberClass: true,
          },
        },
      },
    })

    if (!user?.isAdmin && (!user?.buildingMemberships || user.buildingMemberships.length === 0)) {
      return NextResponse.json({ error: 'Admin or building admin privileges required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId')
    const buildingId = searchParams.get('buildingId')
    const receiverType = searchParams.get('receiverType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}

    // If user is building admin (not super admin), filter by their buildings
    if (!user.isAdmin && user.buildingMemberships.length > 0) {
      const userBuildingIds = user.buildingMemberships.map(bm => bm.buildingId)
      
      // Building admins can only see conversations from their buildings
      // Filter by household's buildingId
      where.household = {
        buildingId: { in: userBuildingIds },
      }
    }

    if (householdId) {
      where.householdId = householdId
    }

    if (buildingId) {
      // Filter by building through household
      // If user is building admin, ensure they can only access their own buildings
      if (!user.isAdmin && user.buildingMemberships.length > 0) {
        const userBuildingIds = user.buildingMemberships.map(bm => bm.buildingId)
        if (!userBuildingIds.includes(buildingId)) {
          return NextResponse.json({ error: 'Access denied to this building' }, { status: 403 })
        }
      }
      where.household = {
        ...where.household,
        buildingId: buildingId,
      }
    }

    if (receiverType) {
      where.receiverType = receiverType
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    const [chatHistory, total] = await Promise.all([
      prisma.chatHistory.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          household: {
            select: {
              id: true,
              name: true,
              apartmentNo: true,
              buildingId: true, // Include buildingId for filtering
            },
          },
          conversation: {
            select: {
              id: true,
              type: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.chatHistory.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: chatHistory,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching chat history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    )
  }
}
