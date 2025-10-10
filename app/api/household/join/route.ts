import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { invitationCode, role = 'USER' } = body

    if (!invitationCode) {
      return NextResponse.json({ error: 'Invitation code is required' }, { status: 400 })
    }

    // Validate role
    const validRoles = ['OWNER', 'USER', 'VISITOR']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Find household by invitation code
    const household = await prisma.household.findUnique({
      where: { invitationCode },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!household) {
      return NextResponse.json({ error: 'Invalid invitation code' }, { status: 404 })
    }

    // Check if user is already a member of this household
    const existingMembership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: userId,
          householdId: household.id,
        },
      },
    })

    if (existingMembership) {
      return NextResponse.json({ error: 'You are already a member of this household' }, { status: 400 })
    }

    // Check if user is already a member of any household
    const userMembership = await prisma.householdMember.findFirst({
      where: { userId },
    })

    if (userMembership) {
      return NextResponse.json({ 
        error: 'You are already a member of another household. Please leave your current household first.' 
      }, { status: 400 })
    }

    // Add user to household
    const newMembership = await prisma.householdMember.create({
      data: {
        userId: userId,
        householdId: household.id,
        role: role,
      },
      include: {
        household: true,
        user: true,
      },
    })

    return NextResponse.json({
      message: 'Successfully joined household',
      household: {
        id: household.id,
        name: household.name,
        description: household.description,
      },
      membership: {
        id: newMembership.id,
        role: newMembership.role,
      },
    })
  } catch (error) {
    console.error('Error joining household:', error)
    return NextResponse.json(
      { error: 'Failed to join household' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Allow unauthenticated access for invitation code validation
    const session = await getServerSession(authOptions)
    const userId = session?.user ? (session.user as any)?.id : null
    const { searchParams } = new URL(request.url)
    const invitationCode = searchParams.get('code')

    if (!invitationCode) {
      return NextResponse.json({ error: 'Invitation code is required' }, { status: 400 })
    }

    // Find household by invitation code (without member details for privacy)
    const household = await prisma.household.findUnique({
      where: { invitationCode },
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: { members: true },
        },
      },
    })

    if (!household) {
      return NextResponse.json({ error: 'Invalid invitation code' }, { status: 404 })
    }

    // Only check membership if user is authenticated
    if (userId) {
      // Check if user is already a member
      const existingMembership = await prisma.householdMember.findUnique({
        where: {
          userId_householdId: {
            userId: userId,
            householdId: household.id,
          },
        },
      })

      if (existingMembership) {
        return NextResponse.json({ error: 'You are already a member of this household' }, { status: 400 })
      }

      // Check if user is already a member of any household
      const userMembership = await prisma.householdMember.findFirst({
        where: { userId },
      })

      if (userMembership) {
        return NextResponse.json({ 
          error: 'You are already a member of another household' 
        }, { status: 400 })
      }
    }

    return NextResponse.json({
      household: {
        id: household.id,
        name: household.name,
        description: household.description,
        membersCount: household._count.members,
      },
      canJoin: true,
    })
  } catch (error) {
    console.error('Error validating invitation code:', error)
    return NextResponse.json(
      { error: 'Failed to validate invitation code' },
      { status: 500 }
    )
  }
}
