import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkCommunityPermission } from '@/lib/middleware/community-permissions'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/community/[id]/working-groups/[groupId]/permissions/[permissionId]
 * Remove a permission from the working group
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; groupId: string; permissionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const communityId = params.id
    const groupId = params.groupId
    const permissionId = params.permissionId

    // Check permission
    if (!(await checkCommunityPermission(userId, communityId, 'canEditWorkingGroups'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get the permission to delete
    const permissionToDelete = await prisma.workingGroupPermission.findUnique({
      where: { id: permissionId },
      include: {
        workingGroup: true,
      },
    })

    if (!permissionToDelete) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 })
    }

    if (permissionToDelete.workingGroupId !== groupId) {
      return NextResponse.json({ error: 'Permission does not belong to this working group' }, { status: 400 })
    }

    if (permissionToDelete.workingGroup.communityId !== communityId) {
      return NextResponse.json({ error: 'Working group does not belong to this community' }, { status: 400 })
    }

    // Delete permission
    await prisma.workingGroupPermission.delete({
      where: { id: permissionId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing working group permission:', error)
    return NextResponse.json(
      { error: 'Failed to remove working group permission' },
      { status: 500 }
    )
  }
}

