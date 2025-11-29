import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSuperAdmin } from '@/lib/middleware/community-permissions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/announcements
 * Get all announcements (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Check if user is super admin
    const isAdmin = await isSuperAdmin(userId)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source') // Optional filter

    const where: any = {}
    if (source) {
      where.source = source
    }

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

    return NextResponse.json({
      announcements: announcements.map(a => ({
        id: a.id,
        source: a.source,
        sourceId: a.sourceId,
        title: a.title,
        message: a.message,
        targetType: a.targetType,
        targetId: a.targetId,
        createdAt: a.createdAt,
        expiresAt: a.expiresAt,
        isActive: a.isActive,
        creator: a.creator
      }))
    })

  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    )
  }
}


