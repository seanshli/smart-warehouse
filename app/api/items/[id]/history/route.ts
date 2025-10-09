import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const itemId = params.id

    // Verify user has access to this item
    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        household: {
          members: {
            some: {
              userId: userId
            }
          }
        }
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Get activities for this item
    const activities = await prisma.itemHistory.findMany({
      where: {
        itemId: itemId
      },
      include: {
        performer: true,
        oldRoom: true,
        newRoom: true,
        oldCabinet: true,
        newCabinet: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Error fetching item history:', error)
    return NextResponse.json({ error: 'Failed to fetch item history' }, { status: 500 })
  }
}