import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/announcements/reads
 * Get announcement read status for a user and household
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

    if (!householdId) {
      return NextResponse.json({ error: 'householdId is required' }, { status: 400 })
    }

    const reads = await prisma.announcementRead.findMany({
      where: {
        userId,
        householdId,
      },
      select: {
        announcementId: true,
        userId: true,
        householdId: true,
        readAt: true,
      },
    })

    return NextResponse.json({ reads })
  } catch (error) {
    console.error('Error fetching announcement reads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch announcement reads' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/announcements/reads
 * Mark an announcement as read
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { announcementId, householdId } = body

    if (!announcementId || !householdId) {
      return NextResponse.json(
        { error: 'announcementId and householdId are required' },
        { status: 400 }
      )
    }

    // Check if already read
    const existingRead = await prisma.announcementRead.findUnique({
      where: {
        announcementId_userId_householdId: {
          announcementId,
          userId,
          householdId,
        },
      },
    })

    if (existingRead) {
      return NextResponse.json({ message: 'Already marked as read', read: existingRead })
    }

    // Create read record
    const read = await prisma.announcementRead.create({
      data: {
        announcementId,
        userId,
        householdId,
        readAt: new Date(),
      },
    })

    return NextResponse.json({ message: 'Marked as read', read })
  } catch (error) {
    console.error('Error marking announcement as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark announcement as read' },
      { status: 500 }
    )
  }
}

