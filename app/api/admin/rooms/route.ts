import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
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

    // Get all rooms with item counts, aggregated by name
    const rooms = await prisma.room.findMany({
      include: {
        _count: {
          select: {
            items: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Aggregate rooms by name (case-insensitive)
    const aggregatedRooms = rooms.reduce((acc, room) => {
      const normalizedName = room.name.toLowerCase().trim()
      const existingRoom = acc.find(r => r.name.toLowerCase().trim() === normalizedName)
      
      if (existingRoom) {
        existingRoom._count.items += room._count.items
      } else {
        acc.push({
          id: room.id,
          name: room.name, // Keep original casing for display
          _count: {
            items: room._count.items
          }
        })
      }
      
      return acc
    }, [] as any[])

    return NextResponse.json({ rooms: aggregatedRooms })
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    )
  }
}
