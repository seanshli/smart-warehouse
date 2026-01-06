import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/workflows/[id]/tasks/[taskId]/complete
 * Complete a workflow task
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

    const body = await request.json()
    const { workDone, notes } = body

    const task = await prisma.workflowTask.findUnique({
      where: { id: taskId },
      select: {
        workflowId: true,
        status: true,
        startedAt: true,
        assignedToId: true,
        stepId: true,
      },
    })

    if (!task || task.workflowId !== workflowId) {
      return NextResponse.json({ error: 'Workflow task not found' }, { status: 404 })
    }

    // Check permissions (same as start)
    if (task.assignedToId !== currentUserId) {
      const step = await prisma.workflowStep.findUnique({
        where: { id: task.stepId },
        select: { workingGroupId: true },
      })

      if (step?.workingGroupId) {
        const isMember = await prisma.workingGroupMember.findUnique({
          where: {
            workingGroupId_userId: {
              workingGroupId: step.workingGroupId,
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

    if (task.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Task is not in progress' },
        { status: 400 }
      )
    }

    // Calculate duration
    const durationMs = task.startedAt
      ? new Date().getTime() - task.startedAt.getTime()
      : 0

    const updateData: any = {
      status: 'COMPLETED',
      completedAt: new Date(),
      actualMinutes: Math.floor(durationMs / 60000),
    }

    if (workDone !== undefined) updateData.workDone = workDone
    if (notes !== undefined) updateData.notes = notes

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
      },
    })

    // Create log entry
    await prisma.workflowTaskLog.create({
      data: {
        taskId,
        action: 'COMPLETE',
        performedById: currentUserId,
        description: workDone || 'Task completed',
        durationMinutes: Math.floor(durationMs / 60000),
      },
    })

    return NextResponse.json({ task: updatedTask })
  } catch (error) {
    console.error('[Complete Task] Error:', error)
    return NextResponse.json(
      { error: 'Failed to complete workflow task' },
      { status: 500 }
    )
  }
}

