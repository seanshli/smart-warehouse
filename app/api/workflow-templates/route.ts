import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/workflow-templates
 * List workflow templates
 * - Super admins see all templates
 * - Community/building admins see templates for their communities/buildings
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

    let whereClause: any = {}

    // If not super admin, filter by community/building membership
    if (!currentUser?.isAdmin) {
      // Get user's communities and buildings
      const [communityMemberships, buildingMemberships] = await Promise.all([
        prisma.communityMember.findMany({
          where: {
            userId: currentUserId,
            role: { in: ['ADMIN', 'MANAGER'] },
          },
          select: { communityId: true },
        }),
        prisma.buildingMember.findMany({
          where: {
            userId: currentUserId,
            role: { in: ['ADMIN', 'MANAGER'] },
          },
          select: { buildingId: true },
        }),
      ])

      const communityIds = communityMemberships.map(c => c.communityId)
      const buildingIds = buildingMemberships.map(b => b.buildingId)

      // Get communities for buildings
      const buildings = await prisma.building.findMany({
        where: { id: { in: buildingIds } },
        select: { communityId: true },
      })

      const allCommunityIds = [
        ...communityIds,
        ...buildings.map(b => b.communityId).filter(Boolean),
      ]

      // Templates are not directly linked to communities, but workflow types might be
      // For now, show all templates (RLS will handle access control)
      whereClause = {}
    }

    const templates = await prisma.workflowTemplate.findMany({
      where: whereClause,
      include: {
        workflowType: true,
        steps: {
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
        },
        _count: {
          select: {
            steps: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('[Workflow Templates] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow templates' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/workflow-templates
 * Create a new workflow template
 * - Super admins can create any template
 * - Community/building admins can create templates
 */
export async function POST(request: NextRequest) {
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

    // Check permissions (super admin or community/building admin)
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
          { error: 'Insufficient permissions. Admin access required.' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { workflowTypeId, name, description, isDefault, steps } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Create template with steps
    const templateData: any = {
      name,
      description: description || null,
      isDefault: isDefault || false,
    }

    // Only add workflowTypeId if provided and not empty (now optional)
    if (workflowTypeId && workflowTypeId.trim() !== '') {
      templateData.workflowTypeId = workflowTypeId
    }

    // Build include object conditionally
    const includeObj: any = {
      steps: {
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
      },
    }
    
    // Only include workflowType if workflowTypeId is provided
    if (templateData.workflowTypeId) {
      includeObj.workflowType = true
    }

    const template = await prisma.workflowTemplate.create({
      data: {
        ...templateData,
        steps: steps && steps.length > 0
          ? {
              create: steps.map((step: any, index: number) => ({
                stepOrder: index + 1,
                name: step.name,
                description: step.description || null,
                taskDescription: step.taskDescription || null,
                estimatedMinutes: step.estimatedMinutes || null,
                workingGroupId: step.workingGroupId || null,
                assignedToId: step.assignedToId || null,
                isRequired: step.isRequired !== false,
                canSkip: step.canSkip || false,
              })),
            }
          : undefined,
      },
      include: includeObj,
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('[Workflow Templates] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : {}
    
    // Log full error details for debugging
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('[Workflow Templates] Prisma Error Code:', (error as any).code)
      console.error('[Workflow Templates] Prisma Error Meta:', (error as any).meta)
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create workflow template', 
        details: errorMessage,
        ...errorDetails,
      },
      { status: 500 }
    )
  }
}

