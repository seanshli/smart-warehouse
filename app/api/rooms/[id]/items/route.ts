import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPrismaClient } from '@/lib/prisma-factory'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  let prisma = createPrismaClient()
  
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roomId = params.id

    // Get user's household
    const household = await prisma.household.findFirst({
      where: {
        members: {
          some: {
            userId: (session?.user as any)?.id
          }
        }
      }
    })

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    // Get room with cabinets and items
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        householdId: household.id
      },
      include: {
        cabinets: {
          include: {
            items: {
              include: {
                category: true
              }
            },
            _count: {
              select: {
                items: true
              }
            }
          }
        },
        _count: {
          select: {
            items: true
          }
        }
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    return NextResponse.json(room)
  } catch (error) {
    console.error('Error fetching room details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch room details' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
