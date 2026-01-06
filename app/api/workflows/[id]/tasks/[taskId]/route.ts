import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/workflows/[id]/tasks/[taskId]
 * Get a workflow task
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> | { id: string; taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const { id: workflowId, taskId } = resolvedParams

    const task = await prisma.workflowTask.findUnique({
      where: { id: taskId },
      include: {
        step: {
          select: {
            id: true,
            name: true,
            workflowId: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        logs: {
          orderBy: { timestamp: 'desc' },
          include: {
            performedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!task || task.workflowId !== workflowId) {
      return NextResponse.json({ error: 'Workflow task not found' }, { status: 404 })
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error('[Workflow Task] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow task' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/workflows/[id]/tasks/[taskId]
 * Update a workflow task (for assigned users to update work done, notes, etc.)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> | { id: string; taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = (session.user as any).id
    const resolvedParams = params instanceof Promise ? await params : params
    const { id: workflowId, taskId } = resolvedParams

    const task = await prisma.workflowTask.findUnique({
      where: { id: taskId },
      include: {
        step: {
          include: {
            workflow: {
              select: {
                createdById: true,
                communityId: true,
                buildingId: true,
              },
            },
          },
        },
      },
    })

    if (!task || task.workflowId !== workflowId) {
      return NextResponse.json({ error: 'Workflow task not found' }, { status: 404 })
    }

    // Check permissions: assigned user, admin, or working group member
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { isAdmin: true },
    })

    let hasPermission = false

    if (task.assignedToId === currentUserId) {
      hasPermission = true
    } else if (currentUser?.isAdmin) {
      hasPermission = true
    } else if (task.step.workflow.createdById === currentUserId) {
      hasPermission = true
    } else {
      // Check community/building admin
      if (task.step.workflow.communityId) {
        const membership = await prisma.communityMember.findUnique({
          where: {
            userId_communityId: {
              userId: currentUserId,
              communityId: task.step.workflow.communityId,
            },
          },
          select: { role: true },
        })
        if (membership && ['ADMIN', 'MANAGER'].includes(membership.role || '')) {
          hasPermission = true
        }
      }

      if (!hasPermission && task.step.workflow.buildingId) {
        const membership = await prisma.buildingMember.findUnique({
          where: {
            userId_buildingId: {
              userId: currentUserId,
              buildingId: task.step.workflow.buildingId,
            },
          },
          select: { role: true },
        })
        if (membership && ['ADMIN', 'MANAGER'].includes(membership.role || '')) {
          hasPermission = true
        }
      }

      // Check working group member
      if (!hasPermission && task.step.workingGroupId) {
        const isMember = await prisma.workingGroupMember.findUnique({
          where: {
            workingGroupId_userId: {
              workingGroupId: task.step.workingGroupId,
              userId: currentUserId,
            },
          },
        })
        if (isMember) {
          hasPermission = true
        }
      }
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, status, workDone, notes, actualMinutes } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (workDone !== undefined) updateData.workDone = workDone
    if (notes !== undefined) updateData.notes = notes
    if (actualMinutes !== undefined) updateData.actualMinutes = actualMinutes

    if (status !== undefined) {
      updateData.status = status

      // Update timestamps based on status
      if (status === 'IN_PROGRESS' && !task.startedAt) {
        updateData.startedAt = new Date()
      }

      if (status === 'COMPLETED' && task.startedAt) {
        updateData.completedAt = new Date()
        const durationMs = new Date().getTime() - task.startedAt.getTime()
        updateData.actualMinutes = actualMinutes || Math.floor(durationMs / 60000)
      }
    }

    const updatedTask = await prisma.workflowTask.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        step: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ task: updatedTask })
  } catch (error) {
    console.error('[Workflow Task] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update workflow task' },
      { status: 500 }
    )
  }
}

