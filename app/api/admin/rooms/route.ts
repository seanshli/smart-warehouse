import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getNormalizedRoomKey, getRoomDisplayName } from '@/lib/room-translations'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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

    // Get language from Accept-Language header
    const acceptLanguage = request.headers.get('Accept-Language') || 'en'
    const language = acceptLanguage.split(',')[0].split('-')[0] === 'zh' ? acceptLanguage : acceptLanguage.split(',')[0]

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

    // Aggregate rooms by normalized key (cross-language)
    const aggregatedRooms = rooms.reduce((acc, room) => {
      const normalizedKey = getNormalizedRoomKey(room.name)
      const existingRoom = acc.find(r => r.normalizedKey === normalizedKey)
      
      if (existingRoom) {
        existingRoom._count.items += room._count.items
      } else {
        acc.push({
          id: room.id,
          name: getRoomDisplayName(normalizedKey, language), // Use translated name
          normalizedKey: normalizedKey,
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
