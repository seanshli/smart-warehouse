import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/workflows/[id]
 * Get a workflow with all steps and tasks
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams

    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: {
        workflowType: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        community: {
          select: {
            id: true,
            name: true,
          },
        },
        building: {
          select: {
            id: true,
            name: true,
          },
        },
        steps: {
          orderBy: { stepOrder: 'asc' },
          include: {
            workingGroup: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
            tasks: {
              include: {
                assignedTo: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                _count: {
                  select: {
                    logs: true,
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    return NextResponse.json({ workflow })
  } catch (error) {
    console.error('[Workflow] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/workflows/[id]
 * Update a workflow
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = (session.user as any).id
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams

    // Check if workflow exists and user has permission
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      select: {
        createdById: true,
        communityId: true,
        buildingId: true,
      },
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { isAdmin: true },
    })

    if (!currentUser?.isAdmin && workflow.createdById !== currentUserId) {
      // Check community/building admin
      let hasPermission = false

      if (workflow.communityId) {
        const membership = await prisma.communityMember.findUnique({
          where: {
            userId_communityId: {
              userId: currentUserId,
              communityId: workflow.communityId,
            },
          },
          select: { role: true },
        })
        if (membership && ['ADMIN', 'MANAGER'].includes(membership.role || '')) {
          hasPermission = true
        }
      }

      if (!hasPermission && workflow.buildingId) {
        const membership = await prisma.buildingMember.findUnique({
          where: {
            userId_buildingId: {
              userId: currentUserId,
              buildingId: workflow.buildingId,
            },
          },
          select: { role: true },
        })
        if (membership && ['ADMIN', 'MANAGER'].includes(membership.role || '')) {
          hasPermission = true
        }
      }

      if (!hasPermission) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { name, description, status, priority, assignedToId } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId

    // Update started/completed times based on status
    if (status === 'IN_PROGRESS' && !workflow.startedAt) {
      updateData.startedAt = new Date()
    }
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date()
    }

    const updatedWorkflow = await prisma.workflow.update({
      where: { id },
      data: updateData,
      include: {
        workflowType: true,
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
    })

    return NextResponse.json({ workflow: updatedWorkflow })
  } catch (error) {
    console.error('[Workflow] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/workflows/[id]
 * Cancel/delete a workflow
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = (session.user as any).id
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams

    // Check permissions (same as PUT)
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      select: {
        createdById: true,
        communityId: true,
        buildingId: true,
        status: true,
      },
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { isAdmin: true },
    })

    if (!currentUser?.isAdmin && workflow.createdById !== currentUserId) {
      let hasPermission = false

      if (workflow.communityId) {
        const membership = await prisma.communityMember.findUnique({
          where: {
            userId_communityId: {
              userId: currentUserId,
              communityId: workflow.communityId,
            },
          },
          select: { role: true },
        })
        if (membership && ['ADMIN', 'MANAGER'].includes(membership.role || '')) {
          hasPermission = true
        }
      }

      if (!hasPermission && workflow.buildingId) {
        const membership = await prisma.buildingMember.findUnique({
          where: {
            userId_buildingId: {
              userId: currentUserId,
              buildingId: workflow.buildingId,
            },
          },
          select: { role: true },
        })
        if (membership && ['ADMIN', 'MANAGER'].includes(membership.role || '')) {
          hasPermission = true
        }
      }

      if (!hasPermission) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
    }

    // Update status to CANCELLED instead of deleting
    await prisma.workflow.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })

    return NextResponse.json({ message: 'Workflow cancelled successfully' })
  } catch (error) {
    console.error('[Workflow] Error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel workflow' },
      { status: 500 }
    )
  }
}

