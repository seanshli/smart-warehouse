import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPermissions, UserRole } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Get user's household memberships with roles
    const memberships = await prisma.householdMember.findMany({
      where: {
        userId: userId
      },
      include: {
        household: {
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    // Get primary household (first one or most recent)
    const primaryMembership = memberships[0]
    
    if (!primaryMembership) {
      return NextResponse.json({
        memberships: [],
        primaryHousehold: null,
        role: null,
        permissions: null
      })
    }

    const role = primaryMembership.role as UserRole
    const permissions = getPermissions(role)

    return NextResponse.json({
      memberships: memberships.map(m => ({
        id: m.id,
        role: m.role,
        joinedAt: m.joinedAt,
        household: m.household,
        user: m.user
      })),
      primaryHousehold: {
        id: primaryMembership.household.id,
        name: primaryMembership.household.name,
        description: primaryMembership.household.description,
        createdAt: primaryMembership.household.createdAt
      },
      role: role,
      permissions: permissions
    })

  } catch (error) {
    console.error('Error fetching user household:', error)
    return NextResponse.json(
      { error: 'Failed to fetch household information' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { householdId, role = 'USER' } = body

    // Validate role
    const validRoles = ['OWNER', 'USER', 'VISITOR']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if user is already a member
    const existingMembership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: userId,
          householdId: householdId
        }
      }
    })

    if (existingMembership) {
      return NextResponse.json({ error: 'User is already a member of this household' }, { status: 400 })
    }

    // Create membership
    const membership = await prisma.householdMember.create({
      data: {
        userId: userId,
        householdId: householdId,
        role: role
      },
      include: {
        household: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    })

    return NextResponse.json({
      id: membership.id,
      role: membership.role,
      joinedAt: membership.joinedAt,
      household: membership.household
    })

  } catch (error) {
    console.error('Error joining household:', error)
    return NextResponse.json(
      { error: 'Failed to join household' },
      { status: 500 }
    )
  }
}
