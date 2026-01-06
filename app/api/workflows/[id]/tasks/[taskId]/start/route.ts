import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/workflows/[id]/tasks/[taskId]/start
 * Start a workflow task
 */
export async function POST(
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
      select: {
        workflowId: true,
        stepId: true,
        status: true,
        startedAt: true,
        assignedToId: true,
        step: {
          select: {
            status: true,
            workingGroupId: true,
          },
        },
      },
    })

    if (!task || task.workflowId !== workflowId) {
      return NextResponse.json({ error: 'Workflow task not found' }, { status: 404 })
    }

    // Check if assigned user or working group member
    if (task.assignedToId !== currentUserId) {
      // Check if user is in the working group
      if (task.step.workingGroupId) {
        const isMember = await prisma.workingGroupMember.findUnique({
          where: {
            workingGroupId_userId: {
              workingGroupId: task.step.workingGroupId,
              userId: currentUserId,
            },
          },
        })

        if (!isMember) {
          return NextResponse.json(
            { error: 'You are not assigned to this task' },
            { status: 403 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'You are not assigned to this task' },
          { status: 403 }
        )
      }
    }

    if (task.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Task is not in PENDING status' },
        { status: 400 }
      )
    }

    // Check if step is started
    if (task.step.status === 'PENDING') {
      return NextResponse.json(
        { error: 'Workflow step must be started first' },
        { status: 400 }
      )
    }

    const updatedTask = await prisma.workflowTask.update({
      where: { id: taskId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Create log entry
    await prisma.workflowTaskLog.create({
      data: {
        taskId,
        action: 'START',
        performedById: currentUserId,
        description: 'Task started',
      },
    })

    return NextResponse.json({ task: updatedTask })
  } catch (error) {
    console.error('[Start Task] Error:', error)
    return NextResponse.json(
      { error: 'Failed to start workflow task' },
      { status: 500 }
    )
  }
}

