import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/workflows/[id]/steps/[stepId]/tasks
 * Get all tasks for a workflow step
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

    // Verify step belongs to workflow
    const step = await prisma.workflowStep.findUnique({
      where: { id: stepId },
      select: { workflowId: true },
    })

    if (!step || step.workflowId !== workflowId) {
      return NextResponse.json({ error: 'Workflow step not found' }, { status: 404 })
    }

    const tasks = await prisma.workflowTask.findMany({
      where: { stepId },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        logs: {
          orderBy: { timestamp: 'desc' },
          take: 10, // Latest 10 logs
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
        _count: {
          select: {
            logs: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('[Workflow Tasks] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow tasks' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/workflows/[id]/steps/[stepId]/tasks
 * Create a task for a workflow step
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

    const currentUserId = (session.user as any).id
    const resolvedParams = params instanceof Promise ? await params : params
    const { id: workflowId, stepId } = resolvedParams

    // Verify step belongs to workflow and check permissions
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
    const { name, description, assignedToId, estimatedMinutes } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Task name is required' },
        { status: 400 }
      )
    }

    const task = await prisma.workflowTask.create({
      data: {
        workflowId,
        stepId,
        name,
        description,
        assignedToId,
        estimatedMinutes,
        status: 'PENDING',
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

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('[Workflow Tasks] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create workflow task' },
      { status: 500 }
    )
  }
}

