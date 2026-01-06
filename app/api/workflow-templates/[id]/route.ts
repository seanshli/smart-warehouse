import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/workflow-templates/[id]
 * Get a workflow template with all steps
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
    const { id } = resolvedParams

    const template = await prisma.workflowTemplate.findUnique({
      where: { id },
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
                communityId: true,
              },
            },
          },
        },
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Workflow template not found' }, { status: 404 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('[Workflow Template] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow template' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/workflow-templates/[id]
 * Update a workflow template
 */
export async function PUT(
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
    const { id } = resolvedParams

    const body = await request.json()
    const { name, description, isDefault, workflowTypeId } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (isDefault !== undefined) updateData.isDefault = isDefault
    if (workflowTypeId !== undefined) updateData.workflowTypeId = workflowTypeId

    const template = await prisma.workflowTemplate.update({
      where: { id },
      data: updateData,
      include: {
        workflowType: true,
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('[Workflow Template] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update workflow template' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/workflow-templates/[id]
 * Delete a workflow template
 */
export async function DELETE(
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
    const { id } = resolvedParams

    // Check if template is in use
    const workflowsCount = await prisma.workflow.count({
      where: { templateId: id },
    })

    if (workflowsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete template that is in use' },
        { status: 400 }
      )
    }

    await prisma.workflowTemplate.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Workflow template deleted successfully' })
  } catch (error) {
    console.error('[Workflow Template] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete workflow template' },
      { status: 500 }
    )
  }
}

