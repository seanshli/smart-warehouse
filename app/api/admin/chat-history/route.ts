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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId')
    const receiverType = searchParams.get('receiverType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}

    if (householdId) {
      where.householdId = householdId
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
