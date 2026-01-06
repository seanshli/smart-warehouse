import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/workflow-types
 * List all workflow types
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workflowTypes = await prisma.workflowType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            workflows: true,
            templates: true,
          },
        },
      },
    })

    return NextResponse.json({ workflowTypes })
  } catch (error) {
    console.error('[Workflow Types] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow types' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/workflow-types
 * Create a new workflow type (super admin only)
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { name, description, category } = body

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      )
    }

    const workflowType = await prisma.workflowType.create({
      data: {
        name,
        description,
        category: category.toUpperCase(),
        isActive: true,
      },
    })

    return NextResponse.json({ workflowType }, { status: 201 })
  } catch (error) {
    console.error('[Workflow Types] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create workflow type' },
      { status: 500 }
    )
  }
}

