import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/workflows/[id]/steps
 * Get all steps for a workflow
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
    const { id: workflowId } = resolvedParams

    const steps = await prisma.workflowStep.findMany({
      where: { workflowId },
      orderBy: { stepOrder: 'asc' },
      include: {
        workingGroup: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
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
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    })

    return NextResponse.json({ steps })
  } catch (error) {
    console.error('[Workflow Steps] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow steps' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/workflows/[id]/steps
 * Add a step to a workflow
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

    const currentUserId = (session.user as any).id
    const resolvedParams = params instanceof Promise ? await params : params
    const { id: workflowId } = resolvedParams

    // Check permissions
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: {
        createdById: true,
        communityId: true,
        buildingId: true,
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

    const body = await request.json()
    const { name, description, taskDescription, estimatedMinutes, workingGroupId, assignedToId, stepOrder } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Step name is required' },
        { status: 400 }
      )
    }

    // If stepOrder not provided, add to end
    let finalStepOrder = stepOrder
    if (!finalStepOrder) {
      const maxStep = await prisma.workflowStep.findFirst({
        where: { workflowId },
        orderBy: { stepOrder: 'desc' },
        select: { stepOrder: true },
      })
      finalStepOrder = (maxStep?.stepOrder || 0) + 1
    }

    const step = await prisma.workflowStep.create({
      data: {
        workflowId,
        stepOrder: finalStepOrder,
        name,
        description,
        taskDescription,
        estimatedMinutes,
        workingGroupId,
        assignedToId: assignedToId || null,
        status: 'PENDING',
      },
      include: {
        workingGroup: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    })

    return NextResponse.json({ step }, { status: 201 })
  } catch (error) {
    console.error('[Workflow Steps] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create workflow step' },
      { status: 500 }
    )
  }
}

