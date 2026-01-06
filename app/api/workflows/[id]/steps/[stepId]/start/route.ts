import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/workflows/[id]/steps/[stepId]/start
 * Start a workflow step
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

    const step = await prisma.workflowStep.findUnique({
      where: { id: stepId },
      include: {
        workflow: {
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

    if (step.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Step is not in PENDING status' },
        { status: 400 }
      )
    }

    // Check if previous steps are completed
    const previousSteps = await prisma.workflowStep.findMany({
      where: {
        workflowId,
        stepOrder: { lt: step.stepOrder },
      },
      select: { status: true },
    })

    // Check if any previous steps are incomplete (all steps are required by default)
    const incompleteSteps = previousSteps.filter(
      s => s.status !== 'COMPLETED' && s.status !== 'SKIPPED'
    )

    if (incompleteSteps.length > 0) {
      return NextResponse.json(
        { error: 'Previous steps must be completed first' },
        { status: 400 }
      )
    }

    // Calculate wait time from previous step completion
    const previousStep = await prisma.workflowStep.findFirst({
      where: {
        workflowId,
        stepOrder: { lt: step.stepOrder },
      },
      orderBy: { stepOrder: 'desc' },
      select: { completedAt: true },
    })

    const updateData: any = {
      status: 'IN_PROGRESS',
      startedAt: new Date(),
    }

    if (previousStep?.completedAt) {
      const waitTimeMs = new Date().getTime() - previousStep.completedAt.getTime()
      updateData.waitTimeMinutes = Math.floor(waitTimeMs / 60000)
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
    console.error('[Start Step] Error:', error)
    return NextResponse.json(
      { error: 'Failed to start workflow step' },
      { status: 500 }
    )
  }
}

