import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/workflows/[id]/tasks/[taskId]/log
 * Get all logs for a workflow task
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

    // Verify task belongs to workflow
    const task = await prisma.workflowTask.findUnique({
      where: { id: taskId },
      select: { workflowId: true },
    })

    if (!task || task.workflowId !== workflowId) {
      return NextResponse.json({ error: 'Workflow task not found' }, { status: 404 })
    }

    const logs = await prisma.workflowTaskLog.findMany({
      where: { taskId },
      include: {
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('[Task Logs] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task logs' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/workflows/[id]/tasks/[taskId]/log
 * Add a log entry to a workflow task
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

    // Verify task belongs to workflow
    const task = await prisma.workflowTask.findUnique({
      where: { id: taskId },
      select: {
        workflowId: true,
        assignedToId: true,
        stepId: true,
      },
    })

    if (!task || task.workflowId !== workflowId) {
      return NextResponse.json({ error: 'Workflow task not found' }, { status: 404 })
    }

    // Check permissions (assigned user or working group member)
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

    const body = await request.json()
    const { action, description, durationMinutes, metadata } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    const log = await prisma.workflowTaskLog.create({
      data: {
        taskId,
        action: action.toUpperCase(),
        performedById: currentUserId,
        description,
        durationMinutes,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      },
      include: {
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ log }, { status: 201 })
  } catch (error) {
    console.error('[Task Log] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create task log' },
      { status: 500 }
    )
  }
}

