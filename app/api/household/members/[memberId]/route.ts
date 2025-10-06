import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPermissions, canManageRole, UserRole } from '@/lib/permissions'

export async function PUT(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const memberId = params.memberId
    const body = await request.json()
    const { role } = body

    // Validate role
    const validRoles = ['OWNER', 'USER', 'VISITOR']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Get the member to update
    const memberToUpdate = await prisma.householdMember.findUnique({
      where: { id: memberId },
      include: {
        household: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    if (!memberToUpdate) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Get user's role in this household
    const userMembership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: userId,
          householdId: memberToUpdate.householdId
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

    // Check if user can manage this role
    if (!canManageRole(userRole, role as UserRole)) {
      return NextResponse.json({ error: 'Cannot assign this role' }, { status: 403 })
    }

    // Check if trying to change OWNER role (only OWNER can change OWNER)
    if (memberToUpdate.role === 'OWNER' && userRole !== 'OWNER') {
      return NextResponse.json({ error: 'Only OWNER can modify OWNER role' }, { status: 403 })
    }

    // Prevent removing the last OWNER
    if (memberToUpdate.role === 'OWNER' && role !== 'OWNER') {
      const ownerCount = await prisma.householdMember.count({
        where: {
          householdId: memberToUpdate.householdId,
          role: 'OWNER'
        }
      })

      if (ownerCount <= 1) {
        return NextResponse.json({ error: 'Cannot remove the last OWNER' }, { status: 400 })
      }
    }

    // Update the role
    const updatedMember = await prisma.householdMember.update({
      where: { id: memberId },
      data: { role: role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true
          }
        }
      }
    })

    return NextResponse.json({
      id: updatedMember.id,
      role: updatedMember.role,
      joinedAt: updatedMember.joinedAt,
      user: updatedMember.user
    })

  } catch (error) {
    console.error('Error updating member role:', error)
    return NextResponse.json(
      { error: 'Failed to update member role' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const memberId = params.memberId

    // Get the member to delete
    const memberToDelete = await prisma.householdMember.findUnique({
      where: { id: memberId },
      include: {
        household: true
      }
    })

    if (!memberToDelete) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Get user's role in this household
    const userMembership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: userId,
          householdId: memberToDelete.householdId
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

    // Prevent removing OWNER
    if (memberToDelete.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot remove OWNER role' }, { status: 400 })
    }

    // Prevent self-removal unless it's the user's own membership
    if (memberToDelete.userId !== userId && userRole !== 'OWNER') {
      return NextResponse.json({ error: 'Cannot remove other members' }, { status: 403 })
    }

    // Delete the membership
    await prisma.householdMember.delete({
      where: { id: memberId }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error removing household member:', error)
    return NextResponse.json(
      { error: 'Failed to remove household member' },
      { status: 500 }
    )
  }
}
