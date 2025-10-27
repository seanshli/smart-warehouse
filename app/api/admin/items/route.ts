import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCategoryDisplayName, getNormalizedCategoryKey } from '@/lib/category-translations'
import { getRoomDisplayName, getNormalizedRoomKey } from '@/lib/room-translations'

// Force dynamic rendering for this route
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

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || undefined

    // Get language from Accept-Language header
    const acceptLanguage = request.headers.get('Accept-Language') || 'en'
    const language = acceptLanguage.split(',')[0].split('-')[0] === 'zh' ? acceptLanguage : acceptLanguage.split(',')[0]

    const items = await prisma.item.findMany({
      where: q ? { OR: [ { name: { contains: q } }, { name: { contains: q.toLowerCase() } }, { name: { contains: q.toUpperCase() } } ] } : undefined,
      select: {
        id: true,
        name: true,
        quantity: true,
        minQuantity: true,
        description: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
        household: { select: { id: true, name: true } },
        room: { select: { id: true, name: true } },
        cabinet: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, level: true } },
      },
      orderBy: { createdAt: 'desc' }
    })

    // Translate room and category names
    const translatedItems = items.map(item => ({
      ...item,
      room: item.room ? {
        ...item.room,
        name: getRoomDisplayName(getNormalizedRoomKey(item.room.name), language)
      } : null,
      category: item.category ? {
        ...item.category,
        name: getCategoryDisplayName(getNormalizedCategoryKey(item.category.name), language)
      } : null
    }))

    const response = NextResponse.json({ items: translatedItems })
    
    // Add cache-busting headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
    
    return response

  } catch (error) {
    console.error('Error fetching admin items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch items', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


