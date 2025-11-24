import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkCommunityPermission, isCommunityMember } from '@/lib/middleware/community-permissions'
import { WorkingGroupPermissionType, WorkingGroupScope } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/community/[id]/working-groups/[groupId]/permissions
 * Get all permissions for a working group
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const communityId = params.id
    const groupId = params.groupId

    // Check if user is a member of the community
    if (!(await isCommunityMember(userId, communityId))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Verify working group belongs to community
    const workingGroup = await prisma.workingGroup.findUnique({
      where: { id: groupId },
    })

    if (!workingGroup) {
      return NextResponse.json({ error: 'Working group not found' }, { status: 404 })
    }

    if (workingGroup.communityId !== communityId) {
      return NextResponse.json({ error: 'Working group does not belong to this community' }, { status: 400 })
    }

    const permissions = await prisma.workingGroupPermission.findMany({
      where: { workingGroupId: groupId },
      orderBy: {
        permission: 'asc',
      },
    })

    return NextResponse.json({ permissions })
  } catch (error) {
    console.error('Error fetching working group permissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch working group permissions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/community/[id]/working-groups/[groupId]/permissions
 * Add a permission to the working group
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const communityId = params.id
    const groupId = params.groupId
    const body = await request.json()
    const { permission, scope, scopeId } = body

    // Check if user is super admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    })

    // Super admins can edit working groups, otherwise check permission
    if (!user?.isAdmin) {
      if (!(await checkCommunityPermission(userId, communityId, 'canEditWorkingGroups'))) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
    }

    // Verify working group belongs to community
    const workingGroup = await prisma.workingGroup.findUnique({
      where: { id: groupId },
    })

    if (!workingGroup) {
      return NextResponse.json({ error: 'Working group not found' }, { status: 404 })
    }

    if (workingGroup.communityId !== communityId) {
      return NextResponse.json({ error: 'Working group does not belong to this community' }, { status: 400 })
    }

    // Validate permission type
    const validPermissions: WorkingGroupPermissionType[] = [
      'VIEW',
      'EDIT',
      'ADD',
      'REMOVE',
      'ADD_MEMBER',
      'REVOKE_MEMBER',
      'MANAGE_BUILDING',
      'MANAGE_HOUSEHOLD',
      'VIEW_REPORTS',
      'MANAGE_SECURITY',
    ]
    if (!validPermissions.includes(permission as WorkingGroupPermissionType)) {
      return NextResponse.json({ error: 'Invalid permission type' }, { status: 400 })
    }

    // Validate scope
    if (scope) {
      const validScopes: WorkingGroupScope[] = [
        'ALL_BUILDINGS',
        'SPECIFIC_BUILDING',
        'SPECIFIC_HOUSEHOLD',
        'ALL_HOUSEHOLDS',
      ]
      if (!validScopes.includes(scope as WorkingGroupScope)) {
        return NextResponse.json({ error: 'Invalid scope' }, { status: 400 })
      }

      // Validate scopeId for specific scopes
      if ((scope === 'SPECIFIC_BUILDING' || scope === 'SPECIFIC_HOUSEHOLD') && !scopeId) {
        return NextResponse.json({ error: 'scopeId is required for specific scopes' }, { status: 400 })
      }
    }

    // Create permission
    const newPermission = await prisma.workingGroupPermission.create({
      data: {
        workingGroupId: groupId,
        permission: permission as WorkingGroupPermissionType,
        scope: scope as WorkingGroupScope | null,
        scopeId: scopeId || null,
      },
    })

    return NextResponse.json(newPermission, { status: 201 })
  } catch (error: any) {
    console.error('Error adding working group permission:', error)
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Permission already exists for this scope' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to add working group permission' },
      { status: 500 }
    )
  }
}

