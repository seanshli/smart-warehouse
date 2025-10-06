import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id

    // Get user's household
    const household = await prisma.household.findFirst({
      where: {
        members: {
          some: {
            userId: userId
          }
        }
      }
    })

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    // Fetch all item history for items in the user's household
    const activities = await prisma.itemHistory.findMany({
      where: {
        item: {
          householdId: household.id
        }
      },
      include: {
        performer: {
          select: {
            name: true,
            email: true
          }
        },
        item: {
          select: {
            id: true,
            name: true
          }
        },
        oldRoom: {
          select: {
            name: true
          }
        },
        newRoom: {
          select: {
            name: true
          }
        },
        oldCabinet: {
          select: {
            name: true
          }
        },
        newCabinet: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to 50 most recent activities
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}
