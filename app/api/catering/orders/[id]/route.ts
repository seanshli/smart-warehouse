import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPrismaClient } from '@/lib/prisma-factory'

// GET /api/catering/orders/[id] - Get single order details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = createPrismaClient()
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const order = await prisma.cateringOrder.findUnique({
      where: { id: resolvedParams.id },
      include: {
        household: {
          select: { 
            id: true, 
            name: true, 
            buildingId: true,
            building: { 
              select: { 
                id: true,
                name: true,
                communityId: true,
                community: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              } 
            } 
          },
        },
        orderedBy: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            menuItem: {
              select: { id: true, name: true, imageUrl: true, description: true },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check permissions
    if (!user.isAdmin) {
      // Verify user is member of household
      const membership = await prisma.householdMember.findUnique({
        where: {
          userId_householdId: {
            userId: user.id,
            householdId: order.householdId,
          },
        },
      })

      if (!membership) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else {
      // For admins, check if they have access to this building/community
      // Get household's building info
      const householdWithBuilding = await prisma.household.findUnique({
        where: { id: order.householdId },
        select: {
          buildingId: true,
          building: {
            select: {
              id: true,
              communityId: true,
            },
          },
        },
      })

      if (householdWithBuilding?.buildingId) {
        // Check if user is building admin
        const buildingMember = await prisma.buildingMember.findUnique({
          where: {
            userId_buildingId: {
              userId: user.id,
              buildingId: householdWithBuilding.buildingId,
            },
          },
          select: { role: true },
        })

        const isBuildingAdmin = !!(buildingMember && (buildingMember.role === 'ADMIN' || buildingMember.role === 'MANAGER'))

        // Check if user is community admin
        let isCommunityAdmin = false
        if (householdWithBuilding.building?.communityId) {
          const communityMember = await prisma.communityMember.findUnique({
            where: {
              userId_communityId: {
                userId: user.id,
                communityId: householdWithBuilding.building.communityId,
              },
            },
            select: { role: true },
          })
          isCommunityAdmin = !!(communityMember && (communityMember.role === 'ADMIN' || communityMember.role === 'MANAGER'))
        }

        // Super admin can access all, but building/community admins can only access their own
        if (!user.isAdmin && !isBuildingAdmin && !isCommunityAdmin) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

// PUT /api/catering/orders/[id]/status - Update order status (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = createPrismaClient()
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { status } = body

    const validStatuses = ['submitted', 'accepted', 'preparing', 'ready', 'delivered', 'closed', 'cancelled', 'pending', 'confirmed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const updateData: any = { status }
    const now = new Date()

    // Set appropriate timestamp based on status
    switch (status) {
      case 'accepted':
      case 'confirmed':
        if (!updateData.confirmedAt) {
          updateData.confirmedAt = now
        }
        break
      case 'preparing':
        if (!updateData.preparedAt) {
          updateData.preparedAt = now
        }
        break
      case 'delivered':
        if (!updateData.deliveredAt) {
          updateData.deliveredAt = now
        }
        break
      case 'cancelled':
        updateData.cancelledAt = now
        // Restore quantities
        const order = await prisma.cateringOrder.findUnique({
          where: { id: resolvedParams.id },
          include: { items: true },
        })
        if (order) {
          for (const item of order.items) {
            await prisma.cateringMenuItem.update({
              where: { id: item.menuItemId },
              data: {
                quantityAvailable: {
                  increment: item.quantity,
                },
              },
            })
          }
        }
        break
    }

    const updatedOrder = await prisma.cateringOrder.update({
      where: { id: resolvedParams.id },
      data: updateData,
      include: {
        items: {
          include: {
            menuItem: {
              select: { id: true, name: true, imageUrl: true },
            },
          },
        },
      },
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    )
  }
}
