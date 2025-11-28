import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/announcements/[id]/read
 * Mark an announcement as read for the current user in a household context
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const announcementId = params.id
    const body = await request.json()
    const { householdId } = body

    if (!householdId) {
      return NextResponse.json({ error: 'Household ID is required' }, { status: 400 })
    }

    // Verify announcement exists
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId }
    })

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    // Verify user is a member of this household
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: userId,
          householdId: householdId
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'User is not a member of this household' }, { status: 403 })
    }

    // Mark as read (upsert to handle duplicate requests)
    const read = await prisma.announcementRead.upsert({
      where: {
        announcementId_userId_householdId: {
          announcementId: announcementId,
          userId: userId,
          householdId: householdId
        }
      },
      update: {
        readAt: new Date()
      },
      create: {
        announcementId: announcementId,
        userId: userId,
        householdId: householdId,
        readAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      readAt: read.readAt
    })

  } catch (error) {
    console.error('Error marking announcement as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark announcement as read' },
      { status: 500 }
    )
  }
}

