import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPrismaClient } from '@/lib/prisma-factory'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  let prisma = createPrismaClient()
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    const userId = (session.user as any).id
    console.log('Testing household lookup for user:', userId)

    // Test household lookup
    const household = await prisma.household.findFirst({
      where: {
        members: {
          some: {
            userId: userId
          }
        }
      }
    })

    console.log('Household found:', household ? 'yes' : 'no')

    // Test household member lookup
    const memberships = await prisma.householdMember.findMany({
      where: {
        userId: userId
      },
      include: {
        household: true
      }
    })

    console.log('Memberships found:', memberships.length)

    return NextResponse.json({
      success: true,
      userId: userId,
      householdFound: !!household,
      householdId: household?.id,
      householdName: household?.name,
      membershipsCount: memberships.length,
      memberships: memberships.map(m => ({
        id: m.id,
        role: m.role,
        householdId: m.householdId,
        householdName: m.household.name
      }))
    })

  } catch (error) {
    console.error('Household test error:', error)
    return NextResponse.json(
      { 
        error: 'Household test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
