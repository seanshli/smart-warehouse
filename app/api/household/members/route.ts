import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPermissions, canManageRole, getAssignableRoles, UserRole } from '@/lib/permissions'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId')

    if (!householdId) {
      return NextResponse.json({ error: 'Household ID is required' }, { status: 400 })
    }

    // Get user's role in this household
    const userMembership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: userId,
          householdId: householdId
        }
      }
    })

    if (!userMembership) {
      return NextResponse.json({ error: 'User is not a member of this household' }, { status: 403 })
    }

    const userRole = userMembership.role as UserRole
    const permissions = getPermissions(userRole)

    if (!permissions.canManageMembers) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get all household members
    const members = await prisma.householdMember.findMany({
      where: {
        householdId: householdId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        joinedAt: 'asc'
      }
    })

    return NextResponse.json({
      members: members.map(member => ({
        id: member.id,
        role: member.role,
        joinedAt: member.joinedAt,
        user: member.user,
        canManage: canManageRole(userRole, member.role as UserRole)
      })),
      assignableRoles: getAssignableRoles(userRole)
    })

  } catch (error) {
    console.error('Error fetching household members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch household members' },
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
    const { householdId, targetUserId, targetUserEmail, role } = body

    // Validate role
    const validRoles = ['OWNER', 'USER', 'VISITOR']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Get user's role in this household
    const userMembership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: userId,
          householdId: householdId
        }
      }
    })

    if (!userMembership) {
      return NextResponse.json({ error: 'User is not a member of this household' }, { status: 403 })
    }

    const userRole = userMembership.role as UserRole
    const permissions = getPermissions(userRole)

    if (!permissions.canManageMembers) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if target role can be assigned
    if (!canManageRole(userRole, role as UserRole)) {
      return NextResponse.json({ error: 'Cannot assign this role' }, { status: 403 })
    }

    // Find target user by ID or email
    let targetUser = null
    if (targetUserId) {
      targetUser = await prisma.user.findUnique({
        where: { id: targetUserId }
      })
    } else if (targetUserEmail) {
      targetUser = await prisma.user.findUnique({
        where: { email: targetUserEmail }
      })
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    console.log('Target user found:', targetUser.id, targetUser.email)
    console.log('Household ID:', householdId)

    // Check if user is already a member
    const existingMembership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: targetUser.id,
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
        userId: targetUser.id,
        householdId: householdId,
        role: role
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            tuyaAccount: true
          }
        },
        household: {
          select: {
            id: true,
            tuyaHomeId: true,
            tuyaAccount: true
          }
        }
      }
    })

    // 如果 Household 有 Tuya Home，并且用户有 Tuya 账户，尝试添加到 Tuya Home
    // If Household has Tuya Home and user has Tuya account, try to add to Tuya Home
    if (membership.household.tuyaHomeId && membership.user.tuyaAccount) {
      // 注意：实际添加到 Tuya Home 需要在客户端（iOS/Android）使用 Tuya SDK 进行
      // Note: Actual addition to Tuya Home needs to be done on client (iOS/Android) using Tuya SDK
      // 这里记录日志，包括角色信息，客户端应该监听成员添加事件并调用 Tuya SDK
      // This logs including role info, client should listen to member addition events and call Tuya SDK
      const tuyaRole = membership.role === 'OWNER' ? 'admin' : 
                      membership.role === 'VISITOR' ? 'guest' : 'member'
      console.log('User added to household. Should be added to Tuya Home:', {
        householdId: membership.household.id,
        tuyaHomeId: membership.household.tuyaHomeId,
        userId: membership.user.id,
        tuyaAccount: membership.user.tuyaAccount,
        householdRole: membership.role,
        tuyaRole: tuyaRole,
      })
    }

    return NextResponse.json({
      id: membership.id,
      role: membership.role,
      joinedAt: membership.joinedAt,
      user: membership.user,
      // 提示客户端需要添加到 Tuya Home
      // Hint to client that Tuya Home addition is needed
      needsTuyaHomeAddition: membership.household.tuyaHomeId && !!membership.user.tuyaAccount,
      tuyaHomeId: membership.household.tuyaHomeId,
    })

  } catch (error) {
    console.error('Error adding household member:', error)
    return NextResponse.json(
      { error: 'Failed to add household member' },
      { status: 500 }
    )
  }
}
