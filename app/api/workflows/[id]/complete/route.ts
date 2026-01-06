import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/workflows/[id]/complete
 * Complete a workflow
 */
export async function POST(
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
        steps: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Check if all steps are completed
    const incompleteSteps = workflow.steps.filter(
      step => step.status !== 'COMPLETED' && step.status !== 'SKIPPED'
    )

    if (incompleteSteps.length > 0) {
      return NextResponse.json(
        { error: 'Cannot complete workflow. Some steps are not completed.' },
        { status: 400 }
      )
    }

    const updatedWorkflow = await prisma.workflow.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        workflowType: true,
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
    })

    return NextResponse.json({ workflow: updatedWorkflow })
  } catch (error) {
    console.error('[Complete Workflow] Error:', error)
    return NextResponse.json(
      { error: 'Failed to complete workflow' },
      { status: 500 }
    )
  }
}

