import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkCommunityPermission } from '@/lib/middleware/community-permissions'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/community/[id]/working-groups/[groupId]/members/[memberId]
 * Remove member from working group
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; groupId: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const communityId = params.id
    const groupId = params.groupId
    const memberId = params.memberId

    // Check permission
    if (!(await checkCommunityPermission(userId, communityId, 'canAssignWorkingGroupMembers'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get the member to delete
    const memberToDelete = await prisma.workingGroupMember.findUnique({
      where: { id: memberId },
      include: {
        workingGroup: true,
      },
    })

    if (!memberToDelete) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (memberToDelete.workingGroupId !== groupId) {
      return NextResponse.json({ error: 'Member does not belong to this working group' }, { status: 400 })
    }

    if (memberToDelete.workingGroup.communityId !== communityId) {
      return NextResponse.json({ error: 'Working group does not belong to this community' }, { status: 400 })
    }

    // Delete membership
    await prisma.workingGroupMember.delete({
      where: { id: memberId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing working group member:', error)
    return NextResponse.json(
      { error: 'Failed to remove working group member' },
      { status: 500 }
    )
  }
}

