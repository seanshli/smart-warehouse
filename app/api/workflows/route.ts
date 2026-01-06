import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/workflows
 * List workflows (filtered by community/building for non-super admins)
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const communityId = searchParams.get('communityId')
    const buildingId = searchParams.get('buildingId')
    const status = searchParams.get('status')
    const workflowTypeId = searchParams.get('workflowTypeId')

    let whereClause: any = {}

    // If not super admin, filter by community/building membership
    if (!currentUser?.isAdmin) {
      // Get user's communities and buildings
      const [communityMemberships, buildingMemberships] = await Promise.all([
        prisma.communityMember.findMany({
          where: {
            userId: currentUserId,
            role: { in: ['ADMIN', 'MANAGER', 'MEMBER'] },
          },
          select: { communityId: true },
        }),
        prisma.buildingMember.findMany({
          where: {
            userId: currentUserId,
            role: { in: ['ADMIN', 'MANAGER', 'MEMBER'] },
          },
          select: { buildingId: true },
        }),
      ])

      const userCommunityIds = communityMemberships.map(c => c.communityId)
      const userBuildingIds = buildingMemberships.map(b => b.buildingId)

      // Also get workflows where user is creator, assigned, or in working group
      whereClause = {
        OR: [
          { createdById: currentUserId },
          { assignedToId: currentUserId },
          { communityId: { in: userCommunityIds } },
          { buildingId: { in: userBuildingIds } },
          {
            steps: {
              some: {
                workingGroup: {
                  members: {
                    some: {
                      userId: currentUserId,
                    },
                  },
                },
              },
            },
          },
        ],
      }
    }

    // Apply filters
    if (communityId) {
      whereClause.communityId = communityId
    }
    if (buildingId) {
      whereClause.buildingId = buildingId
    }
    if (status) {
      whereClause.status = status
    }
    if (workflowTypeId) {
      whereClause.workflowTypeId = workflowTypeId
    }

    const workflows = await prisma.workflow.findMany({
      where: whereClause,
      include: {
        workflowType: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        community: {
          select: {
            id: true,
            name: true,
          },
        },
        building: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            steps: true,
            tasks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ workflows })
  } catch (error) {
    console.error('[Workflows] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/workflows
 * Create a new workflow
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = (session.user as any).id
    const body = await request.json()
    const {
      workflowTypeId,
      templateId,
      name,
      description,
      priority,
      relatedId,
      relatedType,
      communityId,
      buildingId,
      assignedToId,
      steps,
    } = body

    if (!workflowTypeId || !name) {
      return NextResponse.json(
        { error: 'Workflow type ID and name are required' },
        { status: 400 }
      )
    }

    // Check permissions for community/building
    if (communityId || buildingId) {
      const currentUser = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { isAdmin: true },
      })

      if (!currentUser?.isAdmin) {
        if (communityId) {
          const membership = await prisma.communityMember.findUnique({
            where: {
              userId_communityId: {
                userId: currentUserId,
                communityId,
              },
            },
            select: { role: true },
          })

          if (!membership || !['ADMIN', 'MANAGER'].includes(membership.role || '')) {
            return NextResponse.json(
              { error: 'Insufficient permissions for this community' },
              { status: 403 }
            )
          }
        }

        if (buildingId) {
          const membership = await prisma.buildingMember.findUnique({
            where: {
              userId_buildingId: {
                userId: currentUserId,
                buildingId,
              },
            },
            select: { role: true },
          })

          if (!membership || !['ADMIN', 'MANAGER'].includes(membership.role || '')) {
            return NextResponse.json(
              { error: 'Insufficient permissions for this building' },
              { status: 403 }
            )
          }
        }
      }
    }

    // If templateId provided, create from template
    let templateSteps: any[] = []
    if (templateId) {
      templateSteps = await prisma.workflowTemplateStep.findMany({
        where: { templateId },
        orderBy: { stepOrder: 'asc' },
      })
    }

    // Create workflow with steps
    const workflow = await prisma.workflow.create({
      data: {
        workflowTypeId,
        templateId: templateId || null,
        name,
        description,
        priority: priority || 'NORMAL',
        relatedId,
        relatedType,
        communityId,
        buildingId,
        createdById: currentUserId,
        assignedToId,
        steps: {
          create: steps
            ? steps.map((step: any, index: number) => ({
                templateStepId: step.templateStepId || templateSteps[index]?.id || null,
                stepOrder: index + 1,
                name: step.name || templateSteps[index]?.name || `Step ${index + 1}`,
                description: step.description || templateSteps[index]?.description,
                taskDescription: step.taskDescription || templateSteps[index]?.taskDescription,
                estimatedMinutes: step.estimatedMinutes || templateSteps[index]?.estimatedMinutes,
                workingGroupId: step.workingGroupId || templateSteps[index]?.workingGroupId,
                status: 'PENDING',
              }))
            : templateSteps.map((templateStep, index) => ({
                templateStepId: templateStep.id,
                stepOrder: index + 1,
                name: templateStep.name,
                description: templateStep.description,
                taskDescription: templateStep.taskDescription,
                estimatedMinutes: templateStep.estimatedMinutes,
                workingGroupId: templateStep.workingGroupId,
                status: 'PENDING',
              })),
        },
      },
      include: {
        workflowType: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        steps: {
          orderBy: { stepOrder: 'asc' },
          include: {
            workingGroup: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ workflow }, { status: 201 })
  } catch (error) {
    console.error('[Workflows] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create workflow', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

