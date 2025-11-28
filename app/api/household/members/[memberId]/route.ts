import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPermissions, canManageRole, UserRole } from '@/lib/permissions'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

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
        household: {
          include: {
            building: {
              select: {
                id: true,
                name: true
              }
            }
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

    if (!memberToUpdate) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Check if user has permission to modify roles
    // 1. Check if user is a household member with OWNER role
    // 2. OR check if user is a building admin for the building containing this household
    let hasPermission = false
    let userRole: UserRole | null = null
    let isBuildingAdmin = false

    // Check household membership
    const userMembership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: userId,
          householdId: memberToUpdate.householdId
        }
      }
    })

    if (userMembership) {
      userRole = userMembership.role as UserRole
      const permissions = getPermissions(userRole)
      if (permissions.canManageMembers) {
        hasPermission = true
      }
    }

    // Check if user is a building admin
    if (memberToUpdate.household.buildingId) {
      const buildingMembership = await prisma.buildingMember.findUnique({
        where: {
          userId_buildingId: {
            userId: userId,
            buildingId: memberToUpdate.household.buildingId
          }
        }
      })

      console.log('[Role Update] Building admin check:', {
        userId,
        householdId: memberToUpdate.householdId,
        buildingId: memberToUpdate.household.buildingId,
        buildingMembership: buildingMembership ? {
          id: buildingMembership.id,
          role: buildingMembership.role,
          userId: buildingMembership.userId,
          buildingId: buildingMembership.buildingId
        } : null,
        isAdmin: buildingMembership?.role === 'ADMIN',
        isManager: buildingMembership?.role === 'MANAGER',
        willBeAdmin: buildingMembership && (buildingMembership.role === 'ADMIN' || buildingMembership.role === 'MANAGER')
      })

      if (buildingMembership && (buildingMembership.role === 'ADMIN' || buildingMembership.role === 'MANAGER')) {
        isBuildingAdmin = true
        hasPermission = true
        console.log('[Role Update] ✅ Building admin verified - ALL role changes allowed:', {
          userId,
          buildingId: memberToUpdate.household.buildingId,
          buildingRole: buildingMembership.role,
          isBuildingAdmin,
          currentRole: memberToUpdate.role,
          newRole: role,
          canAssignOwner: true
        })
      } else {
        console.log('[Role Update] ❌ Not a building admin:', {
          userId,
          buildingId: memberToUpdate.household.buildingId,
          buildingMembership: buildingMembership ? { 
            role: buildingMembership.role,
            expectedRoles: ['ADMIN', 'MANAGER']
          } : 'No membership found'
        })
      }
    } else {
      console.log('[Role Update] ⚠️ Household has no buildingId - cannot check building admin:', {
        householdId: memberToUpdate.householdId,
        buildingId: memberToUpdate.household.buildingId,
        householdName: memberToUpdate.household.name
      })
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions. Only household OWNER or building ADMIN can modify roles.' }, { status: 403 })
    }

    // If user is building admin, allow ALL role changes including assigning OWNER
    if (isBuildingAdmin) {
      console.log('[Role Update] Building admin detected, allowing role change:', {
        currentRole: memberToUpdate.role,
        newRole: role,
        memberId: memberId,
        householdId: memberToUpdate.householdId,
        isBuildingAdmin: true
      })
      // Building admin can assign ANY role including OWNER - no restrictions
      // Building admin has full control over household member roles
    } else if (userRole) {
      // If user is household member (not building admin), check role management rules
      // Check if user can manage this role
      if (!canManageRole(userRole, role as UserRole)) {
        return NextResponse.json({ error: 'Cannot assign this role' }, { status: 403 })
      }

      // Check if trying to change OWNER role (only OWNER can change OWNER)
      if (memberToUpdate.role === 'OWNER' && userRole !== 'OWNER') {
        return NextResponse.json({ error: 'Only OWNER can modify OWNER role' }, { status: 403 })
      }
    }

    // Prevent removing the last OWNER (unless building admin)
    if (memberToUpdate.role === 'OWNER' && role !== 'OWNER' && !isBuildingAdmin) {
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

    // Check if user has permission to remove members
    // 1. Check if user is a household member with OWNER role
    // 2. OR check if user is a building admin for the building containing this household
    let hasPermission = false
    let userRole: UserRole | null = null

    // Check household membership
    const userMembership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: userId,
          householdId: memberToDelete.householdId
        }
      }
    })

    if (userMembership) {
      userRole = userMembership.role as UserRole
      const permissions = getPermissions(userRole)
      if (permissions.canManageMembers) {
        hasPermission = true
      }
    }

    // If not a household owner, check if user is a building admin
    if (!hasPermission && memberToDelete.household.buildingId) {
      const buildingMembership = await prisma.buildingMember.findUnique({
        where: {
          userId_buildingId: {
            userId: userId,
            buildingId: memberToDelete.household.buildingId
          }
        }
      })

      if (buildingMembership && (buildingMembership.role === 'ADMIN' || buildingMembership.role === 'MANAGER')) {
        hasPermission = true
      }
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions. Only household OWNER or building ADMIN can remove members.' }, { status: 403 })
    }

    // Prevent removing OWNER (only household OWNER can do this, not building admin)
    if (memberToDelete.role === 'OWNER' && userRole !== 'OWNER') {
      return NextResponse.json({ error: 'Cannot remove OWNER role. Only household OWNER can do this.' }, { status: 400 })
    }

    // Prevent self-removal unless it's the user's own membership or they're OWNER/building admin
    if (memberToDelete.userId !== userId && userRole !== 'OWNER' && !hasPermission) {
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
