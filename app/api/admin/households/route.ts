import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this route
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

    console.log('[Admin] Fetching households...')
    
    const households = await prisma.household.findMany({
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true }
            }
          }
        },
        rooms: { select: { id: true, name: true } },
        categories: { select: { id: true, name: true, level: true } },
        _count: {
          select: { items: true, members: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`[Admin] Found ${households.length} households:`, households.map(h => ({ id: h.id, name: h.name })))

    const response = NextResponse.json({ households })
    
    // Add cache-busting headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
    
    return response

  } catch (error) {
    console.error('Error fetching admin households:', error)
    return NextResponse.json(
      { error: 'Failed to fetch households', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


