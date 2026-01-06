import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/workflows/[id]/steps/[stepId]/complete
 * Complete a workflow step
 */
export async function POST(
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

    const body = await request.json()
    const { notes } = body

    const step = await prisma.workflowStep.findUnique({
      where: { id: stepId },
      include: {
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    if (!step || step.workflowId !== workflowId) {
      return NextResponse.json({ error: 'Workflow step not found' }, { status: 404 })
    }

    if (step.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Step is not in progress' },
        { status: 400 }
      )
    }

    // Check if all tasks are completed
    const incompleteTasks = step.tasks.filter(
      task => task.status !== 'COMPLETED' && task.status !== 'CANCELLED'
    )

    if (incompleteTasks.length > 0) {
      return NextResponse.json(
        { error: 'Cannot complete step. Some tasks are not completed.' },
        { status: 400 }
      )
    }

    // Calculate duration
    const durationMs = step.startedAt
      ? new Date().getTime() - step.startedAt.getTime()
      : 0

    const updateData: any = {
      status: 'COMPLETED',
      completedAt: new Date(),
      durationMinutes: Math.floor(durationMs / 60000),
    }

    if (notes !== undefined) {
      updateData.notes = notes
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
      },
    })

    return NextResponse.json({ step: updatedStep })
  } catch (error) {
    console.error('[Complete Step] Error:', error)
    return NextResponse.json(
      { error: 'Failed to complete workflow step' },
      { status: 500 }
    )
  }
}

