import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CacheInvalidation } from '@/lib/cache'
import { broadcastToHousehold } from '@/lib/realtime'
import { checkAndCreateNotifications } from '@/lib/notifications'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Temporary: Use demo user if no session for testing
    let userId = (session?.user as any)?.id
    if (!userId) {
      console.log('No session found, using demo user for testing')
      // Get demo user ID
      const demoUser = await prisma.user.findUnique({
        where: { email: 'demo@smartwarehouse.com' }
      })
      if (demoUser) {
        userId = demoUser.id
      } else {
        return NextResponse.json({ error: 'Unauthorized - no demo user found' }, { status: 401 })
      }
    }
    const body = await request.json()
    const {
      name,
      description,
      quantity,
      minQuantity,
      category,
      subcategory,
      level3,
      room,
      cabinet,
      barcode,
      qrCode,
      imageUrl,
      language,
      // Taiwan invoice fields
      buyDate,
      buyCost,
      buyLocation,
      invoiceNumber,
      sellerName
    } = body
    
    console.log('=== ITEM CREATION REQUEST ===')
    console.log('User ID:', userId)
    console.log('Request body:', body)

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 })
    }

    if (!room) {
      return NextResponse.json({ error: 'Room is required' }, { status: 400 })
    }
    
    // Note: Cabinet is optional - if not provided, we'll create a default one or use existing

    // Get user's household (for now, we'll create a default one or get the first one)
    let household = await prisma.household.findFirst({
      where: {
        members: {
          some: {
            userId: userId
          }
        }
      }
    })

    if (!household) {
      // Create a default household for the user
      household = await prisma.household.create({
        data: {
          name: `${(session?.user as any)?.name || (session?.user as any)?.email || 'User'}'s Household`,
          members: {
            create: {
              userId: userId,
              role: 'ADMIN'
            }
          }
        }
      })
    }

    // Find or create room
    let roomRecord = null
    if (room) {
      // Try to find by ID first (if it's a UUID or CUID), then by name
      const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(room) || /^[a-z0-9]{25}$/i.test(room)
      console.log('Room lookup:', { room, isId, isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(room), isCUID: /^[a-z0-9]{25}$/i.test(room) })
      
      if (isId) {
        roomRecord = await prisma.room.findFirst({
          where: {
            id: room,
            householdId: household.id
          }
        })
      } else {
        roomRecord = await prisma.room.findFirst({
          where: {
            name: room,
            householdId: household.id
          }
        })

        if (!roomRecord) {
          roomRecord = await prisma.room.create({
            data: {
              name: room,
              householdId: household.id
            }
          })
        }
      }
    }

    // Find or create cabinet
    let cabinetRecord = null
    if (cabinet && roomRecord) {
      // Try to find by ID first (if it's a UUID or CUID), then by name
      const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cabinet) || /^[a-z0-9]{25}$/i.test(cabinet)
      console.log('Cabinet lookup:', { cabinet, isId, isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cabinet), isCUID: /^[a-z0-9]{25}$/i.test(cabinet) })
      
      if (isId) {
        cabinetRecord = await prisma.cabinet.findFirst({
          where: {
            id: cabinet,
            roomId: roomRecord.id
          }
        })
      } else {
        cabinetRecord = await prisma.cabinet.findFirst({
          where: {
            name: cabinet,
            roomId: roomRecord.id
          }
        })

        if (!cabinetRecord) {
          cabinetRecord = await prisma.cabinet.create({
            data: {
              name: cabinet,
              roomId: roomRecord.id
            }
          })
        }
      }
    } else if (roomRecord) {
      // If no cabinet specified but room exists, check if room has any cabinets
      const existingCabinets = await prisma.cabinet.findMany({
        where: {
          roomId: roomRecord.id
        }
      })
      
      console.log(`Room "${roomRecord.name}" has ${existingCabinets.length} cabinets`)
      
      if (existingCabinets.length === 0) {
        // Room has no cabinets, create a default one
        console.log(`Creating default cabinet for room "${roomRecord.name}"`)
        cabinetRecord = await prisma.cabinet.create({
          data: {
            name: 'Default Cabinet',
            description: 'Automatically created default cabinet',
            roomId: roomRecord.id
          }
        })
        console.log('Created default cabinet:', { id: cabinetRecord.id, name: cabinetRecord.name })
      } else {
        // Room has cabinets, use the first one as default
        cabinetRecord = existingCabinets[0]
        console.log('Using existing cabinet as default:', { id: cabinetRecord.id, name: cabinetRecord.name })
      }
    }

    // Find or create category
    let categoryRecord = null
    if (category) {
      // First, try to find the category by name (any level)
      categoryRecord = await prisma.category.findFirst({
        where: {
          name: category,
          householdId: household.id
        }
      })

      if (!categoryRecord) {
        // If not found, create as level 1 category
        categoryRecord = await prisma.category.create({
          data: {
            name: category,
            level: 1,
            householdId: household.id
          }
        })
      }

      // Handle subcategory if provided
      if (subcategory && categoryRecord) {
        let subcategoryRecord = await prisma.category.findFirst({
          where: {
            name: subcategory,
            householdId: household.id,
            level: 2,
            parentId: categoryRecord.id
          }
        })

        if (!subcategoryRecord) {
          subcategoryRecord = await prisma.category.create({
            data: {
              name: subcategory,
              level: 2,
              parentId: categoryRecord.id,
              householdId: household.id
            }
          })
        }
        categoryRecord = subcategoryRecord

        // Handle level 3 if provided
        if (level3 && subcategoryRecord) {
          let level3Record = await prisma.category.findFirst({
            where: {
              name: level3,
              householdId: household.id,
              level: 3,
              parentId: subcategoryRecord.id
            }
          })

          if (!level3Record) {
            level3Record = await prisma.category.create({
              data: {
                name: level3,
                level: 3,
                parentId: subcategoryRecord.id,
                householdId: household.id
              }
            })
          }
          categoryRecord = level3Record
        }
      }
    }

    // Create the item
    console.log('Creating item with data:', {
      name,
      description,
      quantity,
      minQuantity,
      categoryId: categoryRecord?.id,
      roomId: roomRecord?.id,
      cabinetId: cabinetRecord?.id,
      householdId: household.id,
      addedById: userId
    })
    
    console.log('Original room/cabinet values from request:', { room, cabinet })
    console.log('Household info:', { id: household.id, name: household.name })
    console.log('Found room record:', roomRecord ? { id: roomRecord.id, name: roomRecord.name, householdId: roomRecord.householdId } : null)
    console.log('Found cabinet record:', cabinetRecord ? { id: cabinetRecord.id, name: cabinetRecord.name, roomId: cabinetRecord.roomId } : null)
    
    // Check if an item with the same name already exists in the same location
    // This is the primary matching logic - same name + same location = same item
    console.log('Searching for existing item with criteria:', {
      name: name.trim(),
      roomId: roomRecord?.id || null,
      cabinetId: cabinetRecord?.id || null,
      householdId: household.id
    })
    
    const existingItem = await prisma.item.findFirst({
      where: {
        name: name.trim(),
        roomId: roomRecord?.id || null,
        cabinetId: cabinetRecord?.id || null,
        householdId: household.id
      }
    })
    
    // Also check for items with the same barcode (for user information)
    let itemsWithSameBarcode: any[] = []
    if (barcode && barcode.trim()) {
      itemsWithSameBarcode = await prisma.item.findMany({
        where: {
          barcode: barcode.trim(),
          householdId: household.id
        },
        include: {
          room: { select: { name: true } },
          cabinet: { select: { name: true } }
        }
      })
      console.log(`Found ${itemsWithSameBarcode.length} items with barcode ${barcode}:`, 
        itemsWithSameBarcode.map((item: any) => ({
          id: item.id,
          name: item.name,
          location: `${item.room?.name || 'No Room'} > ${item.cabinet?.name || 'No Cabinet'}`
        }))
      )
    }
    
    console.log('Existing item search result:', existingItem ? {
      id: existingItem.id,
      name: existingItem.name,
      quantity: existingItem.quantity,
      roomId: existingItem.roomId,
      cabinetId: existingItem.cabinetId
    } : 'No existing item found')
    
    let item
    if (existingItem) {
      // Update existing item by incrementing quantity
      console.log('Found existing item, incrementing quantity:', {
        existingItem: { id: existingItem.id, name: existingItem.name, currentQuantity: existingItem.quantity },
        newQuantity: existingItem.quantity + quantity
      })
      
      item = await prisma.item.update({
        where: { id: existingItem.id },
        data: { 
          quantity: existingItem.quantity + quantity,
          updatedAt: new Date()
        }
      })
      
      // Log item quantity update
      await prisma.itemHistory.create({
        data: {
          itemId: item.id,
          action: 'quantity_updated',
          description: `Quantity increased from ${existingItem.quantity} to ${item.quantity}`,
          performedBy: userId
        }
      })
    } else {
      // Create new item
      console.log('Creating new item')
      item = await prisma.item.create({
        data: {
          name,
          description,
          quantity,
          minQuantity,
          barcode: barcode || null,
          qrCode: qrCode || null,
          imageUrl,
          language: language || null,
          // Taiwan invoice fields
          buyDate: buyDate ? new Date(buyDate) : null,
          buyCost: buyCost || null,
          buyLocation: buyLocation || null,
          invoiceNumber: invoiceNumber || null,
          sellerName: sellerName || null,
          categoryId: categoryRecord?.id,
          roomId: roomRecord?.id,
          cabinetId: cabinetRecord?.id,
          householdId: household.id,
          addedById: userId
        }
      })
      
      // Log item creation
      await prisma.itemHistory.create({
        data: {
          itemId: item.id,
          action: 'created',
          description: `Item "${name}" created with quantity ${quantity}`,
          performedBy: userId,
          newRoomId: roomRecord?.id,
          newCabinetId: cabinetRecord?.id
        }
      })
    }

    // Create notifications for the new item
    try {
      await checkAndCreateNotifications(item, userId, 'created')
    } catch (error) {
      console.error('Failed to create notifications:', error)
    }

    console.log('✅ Item created successfully:', {
      id: item.id,
      name: item.name,
      roomId: item.roomId,
      cabinetId: item.cabinetId
    })
    
    // Return item with additional information about same barcode items
    const response = {
      ...item,
      itemsWithSameBarcode: itemsWithSameBarcode.length > 0 ? itemsWithSameBarcode.map((item: any) => ({
        id: item.id,
        name: item.name,
        location: `${item.room?.name || 'No Room'} > ${item.cabinet?.name || 'No Cabinet'}`,
        quantity: item.quantity
      })) : []
    }
    
    // Clear cache after successful item creation/update
    CacheInvalidation.clearItemCache(household.id)
    console.log('Items API: Cleared cache for household:', household.id)
    
    // Broadcast real-time update to all devices in the household
    try {
      broadcastToHousehold(household.id, {
        type: 'item_created',
        item: {
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          category: categoryRecord?.name,
          room: roomRecord?.name,
          cabinet: cabinetRecord?.name
        },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to broadcast real-time update:', error)
    }
    
    return NextResponse.json(response)
  } catch (error: any) {
    console.error('❌ Error creating item:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack
    })
    
    // Return more detailed error information
    const errorMessage = error?.message || 'Unknown error'
    const errorCode = error?.code || 'UNKNOWN'
    
    return NextResponse.json(
      { 
        error: `Failed to create item: ${errorMessage}`,
        code: errorCode,
        details: error?.meta || {}
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const room = searchParams.get('room')
    const categoryId = searchParams.get('categoryId')
    const roomId = searchParams.get('roomId')
    const subcategory = searchParams.get('subcategory')
    const level3 = searchParams.get('level3')

    // Get user's household
    const household = await prisma.household.findFirst({
      where: {
        members: {
          some: {
            userId: userId
          }
        }
      }
    })

    if (!household) {
      return NextResponse.json([])
    }

    // Build where clause
    const where: any = {
      householdId: household.id
    }

    // Handle search term (creates OR conditions for text search)
    const searchConditions = []
    if (search) {
      searchConditions.push(
        { name: { contains: search } },
        { description: { contains: search } },
        { barcode: { contains: search } },
        { qrCode: { contains: search } },
        // Search in category names
        { category: { name: { contains: search } } },
        // Search in parent category names
        { category: { parent: { name: { contains: search } } } },
        // Search in grandparent category names (level 3)
        { category: { parent: { parent: { name: { contains: search } } } } },
        // Search in room names
        { room: { name: { contains: search } } },
        // Search in cabinet names
        { cabinet: { name: { contains: search } } }
      )
    }

    // Handle subcategory search
    if (subcategory) {
      searchConditions.push({
        category: {
          OR: [
            { name: { contains: subcategory } },
            { parent: { name: { contains: subcategory } } },
            { parent: { parent: { name: { contains: subcategory } } } }
          ]
        }
      })
    }

    // Handle level3 search
    if (level3) {
      searchConditions.push({
        category: {
          OR: [
            { name: { contains: level3 } },
            { parent: { name: { contains: level3 } } },
            { parent: { parent: { name: { contains: level3 } } } }
          ]
        }
      })
    }

    // If we have search conditions, add them as OR
    if (searchConditions.length > 0) {
      where.OR = searchConditions
    }

    // Filter by category (name-based) - include subcategories and level3
    if (category) {
      where.category = {
        OR: [
          { name: category }, // Direct match
          { parent: { name: category } }, // Match subcategories of this parent
          { parent: { parent: { name: category } } } // Match level3 categories of this grandparent
        ]
      }
    }

    // Filter by category ID (exact match)
    if (categoryId) {
      where.categoryId = categoryId
    }

    // Filter by room (name-based) - exact match
    if (room) {
      where.room = {
        name: room // Use exact match instead of contains
      }
    }

    // Filter by room ID (exact match)
    if (roomId) {
      where.roomId = roomId
    }

    // Debug logging for troubleshooting
    console.log('🔍 Search API:', {
      search: search || 'none',
      category: category || 'none',
      room: room || 'none',
      subcategory: subcategory || 'none'
    })

    const items = await prisma.item.findMany({
      where,
      include: {
        category: {
          include: {
            parent: {
              include: {
                parent: true
              }
            }
          }
        },
        room: true,
        cabinet: true,
        addedBy: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    )
  }
}





