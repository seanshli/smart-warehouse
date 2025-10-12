import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPrismaClient } from '@/lib/prisma-factory'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  let prisma = createPrismaClient()
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')

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

    // Get all rooms first
    const allRooms = await prisma.room.findMany({
      where: {
        householdId: household.id
      },
      include: {
        cabinets: {
          include: {
            _count: {
              select: { items: true }
            }
          }
        },
        _count: {
          select: { items: true }
        }
      }
    })

    let roomDetail = null
    
    if (roomId) {
      // Get specific room detail
      roomDetail = await prisma.room.findFirst({
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
    }

    return NextResponse.json({
      userId: userId,
      householdId: household.id,
      allRooms: allRooms,
      roomDetail: roomDetail,
      debug: {
        roomIdRequested: roomId,
        totalRooms: allRooms.length,
        roomFound: !!roomDetail
      }
    })
  } catch (error) {
    console.error('Error in room-click debug:', error)
    return NextResponse.json(
      { error: 'Failed to debug room click', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
