import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id

    // Get user's household memberships
    const memberships = await prisma.householdMember.findMany({
      where: {
        userId: userId
      },
      include: {
        household: true
      },
      orderBy: {
        joinedAt: 'asc'
      }
    })

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ 
        householdId: null,
        memberships: []
      })
    }

    // Return the first household as the default active household
    const activeHousehold = memberships[0].household

    return NextResponse.json({ 
      householdId: activeHousehold.id,
      memberships: memberships.map(m => ({
        id: m.id,
        role: m.role,
        joinedAt: m.joinedAt,
        household: m.household
      }))
    })
  } catch (error: any) {
    console.error('Error fetching household ID:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      name: error?.name
    })
    return NextResponse.json(
      { 
        error: 'Failed to fetch household ID',
        details: error?.message || 'Unknown error',
        code: error?.code
      },
      { status: 500 }
    )
  }
}