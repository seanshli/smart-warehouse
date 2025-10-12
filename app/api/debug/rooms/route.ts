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

    // Get all rooms
    const rooms = await prisma.room.findMany({
      where: {
        householdId: household.id
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Check for duplicates
    const nameCounts = rooms.reduce((acc, room) => {
      acc[room.name] = (acc[room.name] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const duplicates = Object.entries(nameCounts)
      .filter(([name, count]) => count > 1)
      .map(([name, count]) => ({ name, count }))

    return NextResponse.json({
      totalRooms: rooms.length,
      rooms: rooms,
      duplicates: duplicates,
      debug: {
        householdId: household.id,
        userId: userId,
        nameCounts: nameCounts
      }
    })
  } catch (error) {
    console.error('Error in debug rooms:', error)
    return NextResponse.json(
      { error: 'Failed to debug rooms', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
