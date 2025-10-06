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

    // Get user's household membership
    const userMembership = await prisma.householdMember.findFirst({
      where: { userId },
      include: { household: true },
    })

    if (!userMembership) {
      return NextResponse.json({ error: 'User is not a member of any household' }, { status: 404 })
    }

    const userRole = userMembership.role as UserRole
    const permissions = getPermissions(userRole)

    // Only OWNERs can view invitation codes
    if (!permissions.canManageHousehold) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    return NextResponse.json({
      invitationCode: userMembership.household.invitationCode,
      householdName: userMembership.household.name,
    })
  } catch (error) {
    console.error('Error fetching invitation code:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitation code' },
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

    // Get user's household membership
    const userMembership = await prisma.householdMember.findFirst({
      where: { userId },
      include: { household: true },
    })

    if (!userMembership) {
      return NextResponse.json({ error: 'User is not a member of any household' }, { status: 404 })
    }

    const userRole = userMembership.role as UserRole
    const permissions = getPermissions(userRole)

    // Only OWNERs can regenerate invitation codes
    if (!permissions.canManageHousehold) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Generate new invitation code
    const newInvitationCode = `INV-${Math.random().toString(36).substr(2, 8).toUpperCase()}`

    // Update the household with new invitation code
    const updatedHousehold = await prisma.household.update({
      where: { id: userMembership.householdId },
      data: { invitationCode: newInvitationCode },
    })

    return NextResponse.json({
      invitationCode: updatedHousehold.invitationCode,
      householdName: updatedHousehold.name,
      message: 'Invitation code regenerated successfully',
    })
  } catch (error) {
    console.error('Error regenerating invitation code:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate invitation code' },
      { status: 500 }
    )
  }
}
