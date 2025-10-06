import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const itemId = params.id

    // Get user's household
    const household = await prisma.household.findFirst({
      where: {
        members: {
          some: {
            userId: session.user.id
          }
        }
      }
    })

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    // Verify item belongs to user's household
    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        householdId: household.id
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found or access denied' }, { status: 404 })
    }

    const history = await prisma.itemHistory.findMany({
      where: {
        itemId: itemId
      },
      include: {
        performer: {
          select: {
            name: true,
            email: true
          }
        },
        oldRoom: { select: { name: true } },
        newRoom: { select: { name: true } },
        oldCabinet: { select: { name: true } },
        newCabinet: { select: { name: true } },
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(history)
  } catch (error) {
    console.error('Error fetching item history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch item history' },
      { status: 500 }
    )
  }
}