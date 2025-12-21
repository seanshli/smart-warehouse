import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPrismaClient } from '@/lib/prisma-factory'

export const dynamic = 'force-dynamic'

// GET /api/catering/export - Export catering data (admin only)
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    const communityId = searchParams.get('communityId')
    const format = searchParams.get('format') || 'json' // json or csv

    // Find service based on building or community
    let service = null
    if (buildingId) {
      service = await prisma.cateringService.findUnique({
        where: { buildingId },
        include: {
          building: {
            select: { id: true, name: true },
          },
        },
      })
    } else if (communityId) {
      service = await prisma.cateringService.findUnique({
        where: { communityId },
        include: {
          community: {
            select: { id: true, name: true },
          },
        },
      })
    }

    if (!service) {
      return NextResponse.json(
        { error: 'Catering service not found' },
        { status: 404 }
      )
    }

    // Get all categories
    const categories = await prisma.cateringCategory.findMany({
      where: { serviceId: service.id },
      orderBy: { displayOrder: 'asc' },
    })

    // Get all menu items with time slots
    const menuItems = await prisma.cateringMenuItem.findMany({
      where: { serviceId: service.id },
      include: {
        category: {
          select: { id: true, name: true },
        },
        timeSlots: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get all orders (optional, for complete export)
    // Note: Orders are linked through menu items, so we filter by menu items in this service
    const menuItemIds = menuItems.map((item) => item.id)
    const orders = menuItemIds.length > 0 ? await prisma.cateringOrder.findMany({
      where: {
        items: {
          some: {
            menuItemId: {
              in: menuItemIds,
            },
          },
        },
      },
      include: {
        items: {
          include: {
            menuItem: {
              select: { id: true, name: true, cost: true },
            },
          },
        },
      },
      orderBy: { orderedAt: 'desc' },
      take: 1000, // Limit to recent 1000 orders
    }) : []
    
    // Get household names separately since CateringOrder doesn't have direct relation
    const householdIds = Array.from(new Set(orders.map((o) => o.householdId)))
    const households = householdIds.length > 0 ? await prisma.household.findMany({
      where: { id: { in: householdIds } },
      select: { id: true, name: true },
    }) : []
    const householdMap = new Map(households.map((h) => [h.id, h.name]))

    // Prepare export data
    const exportData = {
      exportDate: new Date().toISOString(),
      service: {
        id: service.id,
        buildingId: service.buildingId,
        communityId: service.communityId,
        buildingName: (service as any).building?.name,
        communityName: (service as any).community?.name,
        isActive: service.isActive,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
      },
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        displayOrder: cat.displayOrder,
        isActive: cat.isActive,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      })),
      menuItems: menuItems.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl,
        cost: item.cost.toString(),
        quantityAvailable: item.quantityAvailable,
        isActive: item.isActive,
        availableAllDay: item.availableAllDay,
        categoryId: item.categoryId,
        categoryName: item.category?.name,
        timeSlots: item.timeSlots.map((ts) => ({
          dayOfWeek: ts.dayOfWeek,
          startTime: ts.startTime,
          endTime: ts.endTime,
        })),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      orders: orders.map((order) => ({
        id: order.id,
        householdId: order.householdId,
        householdName: householdMap.get(order.householdId) || 'N/A',
        orderNumber: order.orderNumber,
        status: order.status,
        deliveryType: order.deliveryType,
        scheduledTime: order.scheduledTime,
        totalAmount: order.totalAmount.toString(),
        notes: order.notes,
        items: (order as any).items.map((oi: any) => ({
          menuItemId: oi.menuItemId,
          menuItemName: oi.menuItem?.name,
          quantity: oi.quantity,
          unitPrice: oi.unitPrice.toString(),
          subtotal: oi.subtotal.toString(),
        })),
        orderedAt: order.orderedAt,
        confirmedAt: order.confirmedAt,
        preparedAt: order.preparedAt,
        deliveredAt: order.deliveredAt,
        cancelledAt: order.cancelledAt,
      })),
      summary: {
        totalCategories: categories.length,
        totalMenuItems: menuItems.length,
        totalOrders: orders.length,
        activeCategories: categories.filter((c) => c.isActive).length,
        activeMenuItems: menuItems.filter((i) => i.isActive).length,
      },
    }

    if (format === 'csv') {
      // Convert to CSV format
      let csv = 'Catering Data Export\n'
      csv += `Export Date: ${exportData.exportDate}\n\n`

      // Service info
      csv += '=== SERVICE ===\n'
      csv += 'ID,Type,Name,Is Active,Created At\n'
      csv += `${exportData.service.id},${exportData.service.buildingId ? 'Building' : 'Community'},${exportData.service.buildingName || exportData.service.communityName || 'N/A'},${exportData.service.isActive},${exportData.service.createdAt}\n\n`

      // Categories
      csv += '=== CATEGORIES ===\n'
      csv += 'ID,Name,Description,Display Order,Is Active,Created At\n'
      exportData.categories.forEach((cat) => {
        csv += `${cat.id},"${cat.name}","${cat.description || ''}",${cat.displayOrder},${cat.isActive},${cat.createdAt}\n`
      })
      csv += '\n'

      // Menu Items
      csv += '=== MENU ITEMS ===\n'
      csv += 'ID,Name,Description,Category,Cost,Quantity Available,Is Active,Available All Day,Image URL,Created At\n'
      exportData.menuItems.forEach((item) => {
        csv += `${item.id},"${item.name}","${item.description || ''}","${item.categoryName || 'No Category'}",${item.cost},${item.quantityAvailable},${item.isActive},${item.availableAllDay},"${item.imageUrl || ''}",${item.createdAt}\n`
      })
      csv += '\n'

      // Orders
      csv += '=== ORDERS ===\n'
      csv += 'ID,Order Number,Household,Status,Delivery Type,Scheduled Time,Total Amount,Items Count,Ordered At\n'
      exportData.orders.forEach((order) => {
        csv += `${order.id},"${order.orderNumber}","${order.householdName || 'N/A'}",${order.status},${order.deliveryType},"${order.scheduledTime || 'N/A'}",${order.totalAmount},${order.items.length},${order.orderedAt}\n`
      })

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="catering-export-${Date.now()}.csv"`,
        },
      })
    }

    // Default: JSON format
    return NextResponse.json(exportData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="catering-export-${Date.now()}.json"`,
      },
    })
  } catch (error) {
    console.error('Error exporting catering data:', error)
    return NextResponse.json(
      { error: 'Failed to export catering data' },
      { status: 500 }
    )
  }
}
