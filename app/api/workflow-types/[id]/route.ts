import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/workflow-types/[id]
 * Get a single workflow type
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

    const workflowType = await prisma.workflowType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            workflows: true,
            templates: true,
          },
        },
      },
    })

    if (!workflowType) {
      return NextResponse.json({ error: 'Workflow type not found' }, { status: 404 })
    }

    return NextResponse.json({ workflowType })
  } catch (error) {
    console.error('[Workflow Type] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow type' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/workflow-types/[id]
 * Update a workflow type (super admin only)
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

    // Check if user is super admin
    const currentUser = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { isAdmin: true },
    })

    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 })
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams

    const body = await request.json()
    const { name, description, category, isActive } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category.toUpperCase()
    if (isActive !== undefined) updateData.isActive = isActive

    const workflowType = await prisma.workflowType.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ workflowType })
  } catch (error) {
    console.error('[Workflow Type] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update workflow type' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/workflow-types/[id]
 * Delete a workflow type (super admin only)
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

    // Check if user is super admin
    const currentUser = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { isAdmin: true },
    })

    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 })
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams

    // Check if workflow type is in use
    const workflowsCount = await prisma.workflow.count({
      where: { workflowTypeId: id },
    })

    if (workflowsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete workflow type that is in use' },
        { status: 400 }
      )
    }

    await prisma.workflowType.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Workflow type deleted successfully' })
  } catch (error) {
    console.error('[Workflow Type] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete workflow type' },
      { status: 500 }
    )
  }
}

