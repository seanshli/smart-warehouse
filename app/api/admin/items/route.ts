import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    return NextResponse.json({ items })

  } catch (error) {
    console.error('Error fetching admin items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch items', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


