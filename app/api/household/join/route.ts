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
        household: {
          select: {
            id: true,
            name: true,
            description: true,
            tuyaHomeId: true,
            tuyaAccount: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            tuyaAccount: true,
          },
        },
      },
    })

    // 如果 Household 有 Tuya Home，并且用户有 Tuya 账户，尝试添加到 Tuya Home
    // If Household has Tuya Home and user has Tuya account, try to add to Tuya Home
    if (newMembership.household.tuyaHomeId && newMembership.user.tuyaAccount) {
      // 注意：实际添加到 Tuya Home 需要在客户端（iOS/Android）使用 Tuya SDK 进行
      // Note: Actual addition to Tuya Home needs to be done on client (iOS/Android) using Tuya SDK
      console.log('User joined household. Should be added to Tuya Home:', {
        householdId: newMembership.household.id,
        tuyaHomeId: newMembership.household.tuyaHomeId,
        userId: newMembership.user.id,
        tuyaAccount: newMembership.user.tuyaAccount,
      })
    }

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
      // 提示客户端需要添加到 Tuya Home
      // Hint to client that Tuya Home addition is needed
      needsTuyaHomeAddition: newMembership.household.tuyaHomeId && !!newMembership.user.tuyaAccount,
      tuyaHomeId: newMembership.household.tuyaHomeId,
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
