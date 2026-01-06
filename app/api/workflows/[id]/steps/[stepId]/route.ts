import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/workflows/[id]/steps/[stepId]
 * Get a workflow step
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> | { id: string; stepId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const { id: workflowId, stepId } = resolvedParams

    const step = await prisma.workflowStep.findUnique({
      where: { id: stepId },
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
          },
        },
      },
    })

    if (!step || step.workflowId !== workflowId) {
      return NextResponse.json({ error: 'Workflow step not found' }, { status: 404 })
    }

    return NextResponse.json({ step })
  } catch (error) {
    console.error('[Workflow Step] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow step' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/workflows/[id]/steps/[stepId]
 * Update a workflow step
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> | { id: string; stepId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = (session.user as any).id
    const resolvedParams = params instanceof Promise ? await params : params
    const { id: workflowId, stepId } = resolvedParams

    // Check permissions (same logic as workflow update)
    const step = await prisma.workflowStep.findUnique({
      where: { id: stepId },
      include: {
        workflow: {
          select: {
            createdById: true,
            communityId: true,
            buildingId: true,
          },
        },
      },
    })

    if (!step || step.workflowId !== workflowId) {
      return NextResponse.json({ error: 'Workflow step not found' }, { status: 404 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { isAdmin: true },
    })

    if (!currentUser?.isAdmin && step.workflow.createdById !== currentUserId) {
      let hasPermission = false

      if (step.workflow.communityId) {
        const membership = await prisma.communityMember.findUnique({
          where: {
            userId_communityId: {
              userId: currentUserId,
              communityId: step.workflow.communityId,
            },
          },
          select: { role: true },
        })
        if (membership && ['ADMIN', 'MANAGER'].includes(membership.role || '')) {
          hasPermission = true
        }
      }

      if (!hasPermission && step.workflow.buildingId) {
        const membership = await prisma.buildingMember.findUnique({
          where: {
            userId_buildingId: {
              userId: currentUserId,
              buildingId: step.workflow.buildingId,
            },
          },
          select: { role: true },
        })
        if (membership && ['ADMIN', 'MANAGER'].includes(membership.role || '')) {
          hasPermission = true
        }
      }

      // Also check if user is in the working group assigned to this step
      if (!hasPermission && step.workingGroupId) {
        const isMember = await prisma.workingGroupMember.findUnique({
          where: {
            workingGroupId_userId: {
              workingGroupId: step.workingGroupId,
              userId: currentUserId,
            },
          },
        })
        if (isMember) {
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
    const { name, description, taskDescription, status, notes } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (taskDescription !== undefined) updateData.taskDescription = taskDescription
    if (notes !== undefined) updateData.notes = notes
    if (status !== undefined) {
      updateData.status = status

      // Update timestamps based on status
      if (status === 'IN_PROGRESS' && !step.startedAt) {
        // Calculate wait time from previous step completion
        const previousStep = await prisma.workflowStep.findFirst({
          where: {
            workflowId,
            stepOrder: { lt: step.stepOrder },
          },
          orderBy: { stepOrder: 'desc' },
          select: { completedAt: true },
        })

        updateData.startedAt = new Date()
        if (previousStep?.completedAt) {
          const waitTimeMs = new Date().getTime() - previousStep.completedAt.getTime()
          updateData.waitTimeMinutes = Math.floor(waitTimeMs / 60000)
        }
      }

      if (status === 'COMPLETED' && step.startedAt) {
        updateData.completedAt = new Date()
        const durationMs = new Date().getTime() - step.startedAt.getTime()
        updateData.durationMinutes = Math.floor(durationMs / 60000)
      }
    }

    const updatedStep = await prisma.workflowStep.update({
      where: { id: stepId },
      data: updateData,
      include: {
        workingGroup: {
          select: {
            id: true,
            name: true,
          },
        },
        tasks: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    return NextResponse.json({ step: updatedStep })
  } catch (error) {
    console.error('[Workflow Step] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update workflow step' },
      { status: 500 }
    )
  }
}

