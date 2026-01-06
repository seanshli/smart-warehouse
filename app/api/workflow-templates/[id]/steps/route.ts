import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/workflow-templates/[id]/steps
 * Get all steps for a workflow template
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
    const { id: templateId } = resolvedParams

    const steps = await prisma.workflowTemplateStep.findMany({
      where: { templateId },
      orderBy: { stepOrder: 'asc' },
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

    return NextResponse.json({ steps })
  } catch (error) {
    console.error('[Template Steps] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch template steps' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/workflow-templates/[id]/steps
 * Add a step to a workflow template
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
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { isAdmin: true },
    })

    // Check permissions
    if (!currentUser?.isAdmin) {
      const [hasCommunityAdmin, hasBuildingAdmin] = await Promise.all([
        prisma.communityMember.findFirst({
          where: {
            userId: currentUserId,
            role: { in: ['ADMIN', 'MANAGER'] },
          },
        }),
        prisma.buildingMember.findFirst({
          where: {
            userId: currentUserId,
            role: { in: ['ADMIN', 'MANAGER'] },
          },
        }),
      ])

      if (!hasCommunityAdmin && !hasBuildingAdmin) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const { id: templateId } = resolvedParams

    const body = await request.json()
    const { name, description, taskDescription, estimatedMinutes, workingGroupId, isRequired, canSkip, stepOrder } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Step name is required' },
        { status: 400 }
      )
    }

    // If stepOrder not provided, add to end
    let finalStepOrder = stepOrder
    if (!finalStepOrder) {
      const maxStep = await prisma.workflowTemplateStep.findFirst({
        where: { templateId },
        orderBy: { stepOrder: 'desc' },
        select: { stepOrder: true },
      })
      finalStepOrder = (maxStep?.stepOrder || 0) + 1
    }

    const step = await prisma.workflowTemplateStep.create({
      data: {
        templateId,
        stepOrder: finalStepOrder,
        name,
        description,
        taskDescription,
        estimatedMinutes,
        workingGroupId,
        isRequired: isRequired !== false,
        canSkip: canSkip || false,
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
    console.error('[Template Steps] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create template step' },
      { status: 500 }
    )
  }
}

