// 物品 API 路由
// 處理物品的創建、查詢、更新、刪除等操作

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { trackActivity } from '@/lib/activity-tracker'
import { CacheInvalidation } from '@/lib/cache'
import { broadcastToHousehold } from '@/lib/realtime'
import { checkAndCreateNotifications } from '@/lib/notifications'

// 強制動態渲染此路由
export const dynamic = 'force-dynamic'

// POST 處理器：創建新物品
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // 要求正確的認證
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized - please sign in' }, { status: 401 })
    }
    
    const userId = (session.user as any)?.id
    if (!userId) {
      return NextResponse.json({ error: 'Invalid user session' }, { status: 401 })
    }
    const body = await request.json()
    const {
      name, // 物品名稱
      description, // 物品描述
      quantity, // 數量
      minQuantity, // 最小數量
      category, // 主分類 ID
      subcategory, // 子分類 ID
      level3, // 第三級分類 ID
      room, // 房間 ID
      cabinet, // 櫃子 ID
      barcode, // 條碼
      qrCode, // QR 碼
      imageUrl, // 圖片 URL
      language, // 語言
      tags, // 標籤
      householdId, // 家庭 ID
      // 台灣發票欄位
      buyDate, // 購買日期
      buyCost, // 購買成本
      buyLocation, // 購買地點
      invoiceNumber, // 發票號碼
      sellerName // 賣家名稱
    } = body
    
    console.log('=== ITEM CREATION REQUEST ===')
    console.log('User ID:', userId)
    console.log('Provided Household ID:', householdId)
    console.log('Request body:', body)

    // 驗證必填欄位
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 })
    }

    if (!room) {
      return NextResponse.json({ error: 'Room is required' }, { status: 400 })
    }
    
    // 注意：櫃子是可選的 - 如果未提供，我們將創建預設的或使用現有的

    // 獲取用戶的家庭 - 使用提供的 householdId 或查找第一個
    let household = null
    
    if (householdId) {
      // 驗證用戶是此家庭的成員
      household = await prisma.household.findFirst({
        where: {
          id: householdId,
          members: {
            some: {
              userId: userId
            }
          }
        }
      })
      
      if (!household) {
        console.error('User is not a member of household:', householdId)
        return NextResponse.json({ error: 'You are not a member of this household' }, { status: 403 })
      }
      
      console.log('Using provided household:', household.id, household.name)
    } else {
      // Fallback: Get first household
      household = await prisma.household.findFirst({
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
      
      console.log('Using fallback household:', household.id, household.name)
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
    
    // 檢查相同位置是否已存在相同名稱的物品
    // 這是主要的匹配邏輯 - 相同名稱 + 相同位置 = 同一物品
    console.log('Searching for existing item with criteria:', {
      name: name.trim(),
      roomId: roomRecord?.id || null,
      cabinetId: cabinetRecord?.id || null,
      householdId: household.id
    })
    
    const existingItem = await prisma.item.findFirst({
      where: {
        name: name.trim(), // 物品名稱（去除空格）
        roomId: roomRecord?.id || null, // 房間 ID
        cabinetId: cabinetRecord?.id || null, // 櫃子 ID
        householdId: household.id // 家庭 ID
      }
    })
    
    // 同時檢查具有相同條碼的物品（用於用戶資訊）
    let itemsWithSameBarcode: any[] = []
    if (barcode && barcode.trim()) {
      itemsWithSameBarcode = await prisma.item.findMany({
        where: {
          barcode: barcode.trim(), // 條碼
          householdId: household.id
        },
        include: {
          room: { select: { name: true } }, // 包含房間名稱
          cabinet: { select: { name: true } } // 包含櫃子名稱
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
      // 更新現有物品，增加數量
      console.log('Found existing item, incrementing quantity:', {
        existingItem: { id: existingItem.id, name: existingItem.name, currentQuantity: existingItem.quantity },
        newQuantity: existingItem.quantity + quantity
      })
      
      item = await prisma.item.update({
        where: { id: existingItem.id },
        data: { 
          quantity: existingItem.quantity + quantity, // 增加數量
          updatedAt: new Date() // 更新時間
        }
      })
      
      // 記錄物品數量更新
      await prisma.itemHistory.create({
        data: {
          itemId: item.id,
          action: 'quantity_updated', // 操作類型：數量已更新
          description: `Quantity increased from ${existingItem.quantity} to ${item.quantity}`,
          performedBy: userId // 執行者
        }
      })

      // 為數量更新創建通知
      try {
        await checkAndCreateNotifications(item, userId, 'updated', existingItem)
      } catch (error) {
        console.error('Failed to create notifications for quantity update:', error)
      }
    } else {
      // 創建新物品
      console.log('Creating new item')
      item = await prisma.item.create({
        data: {
          name, // 物品名稱
          description, // 物品描述
          quantity, // 數量
          minQuantity, // 最小數量
          barcode: barcode || null, // 條碼
          qrCode: qrCode || null, // QR 碼
          imageUrl, // 圖片 URL
          language: language || null, // 語言
          tags: tags || [], // 標籤
          // 台灣發票欄位
          buyDate: buyDate ? new Date(buyDate) : null, // 購買日期
          buyCost: buyCost || null, // 購買成本
          buyLocation: buyLocation || null, // 購買地點
          invoiceNumber: invoiceNumber || null, // 發票號碼
          sellerName: sellerName || null, // 賣家名稱
          categoryId: categoryRecord?.id, // 分類 ID
          roomId: roomRecord?.id, // 房間 ID
          cabinetId: cabinetRecord?.id, // 櫃子 ID
          householdId: household.id, // 家庭 ID
          addedById: userId // 添加者 ID
        }
      })
      
      // 記錄物品創建
      await prisma.itemHistory.create({
        data: {
          itemId: item.id,
          action: 'created', // 操作類型：創建
          description: `Item "${name}" created with quantity ${quantity}`,
          performedBy: userId, // 執行者
          newRoomId: roomRecord?.id, // 新房間 ID
          newCabinetId: cabinetRecord?.id // 新櫃子 ID
        }
      })
    }

    // 為新物品創建通知
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
    
    // 返回物品及相同條碼物品的額外資訊
    const response = {
      ...item,
      itemsWithSameBarcode: itemsWithSameBarcode.length > 0 ? itemsWithSameBarcode.map((item: any) => ({
        id: item.id,
        name: item.name,
        location: `${item.room?.name || 'No Room'} > ${item.cabinet?.name || 'No Cabinet'}`,
        quantity: item.quantity
      })) : [] // 相同條碼物品列表
    }
    
    // 成功創建/更新物品後清除快取
    CacheInvalidation.clearItemCache(household.id)
    console.log('Items API: Cleared cache for household:', household.id)
    
    // 向家庭內所有裝置廣播即時更新
    try {
      broadcastToHousehold(household.id, {
        type: 'item_created', // 事件類型：物品已創建
        item: {
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          category: categoryRecord?.name,
          room: roomRecord?.name,
          cabinet: cabinetRecord?.name
        },
        timestamp: new Date().toISOString() // 時間戳
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

// GET 處理器：獲取物品列表（支援搜尋、分類篩選、房間篩選等）
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') // 搜尋關鍵字
    const category = searchParams.get('category') // 分類名稱
    const room = searchParams.get('room') // 房間名稱
    const categoryId = searchParams.get('categoryId') // 分類 ID
    const roomId = searchParams.get('roomId') // 房間 ID
    const subcategory = searchParams.get('subcategory') // 子分類名稱
    const level3 = searchParams.get('level3') // 第三級分類名稱
    const activeHouseholdId = searchParams.get('householdId') // 家庭 ID

    // 獲取用戶的家庭 - 如果提供了 activeHouseholdId 則使用它，否則查找第一個
    let household
    if (activeHouseholdId) {
      // 驗證用戶有權限存取此家庭
      household = await prisma.household.findFirst({
        where: {
          id: activeHouseholdId,
          members: {
            some: {
              userId: userId
            }
          }
        }
      })
    } else {
      // 備援：使用第一個家庭
      household = await prisma.household.findFirst({
        where: {
          members: {
            some: {
              userId: userId
            }
          }
        }
      })
    }

    // 如果用戶沒有家庭，自動創建一個
    if (!household) {
      console.log('User has no household, creating default household...')
      
      // 獲取用戶資訊
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, language: true }
      })
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      
      // 創建預設家庭
      household = await prisma.household.create({
        data: {
          name: `${user.name || 'User'}'s Household`, // 家庭名稱
          description: 'Your personal household inventory', // 家庭描述
          members: {
            create: {
              userId: userId,
              role: 'OWNER' // 角色：擁有者
            }
          }
        }
      })
      
      console.log('Created default household:', household.id)
    }

    // 構建查詢條件
    const where: any = {
      householdId: household.id // 家庭 ID
    }

    // 處理搜尋關鍵字（創建 OR 條件進行文字搜尋）
    const searchConditions = []
    if (search) {
      searchConditions.push(
        { name: { contains: search } }, // 物品名稱包含
        { description: { contains: search } }, // 物品描述包含
        { barcode: { contains: search } }, // 條碼包含
        { qrCode: { contains: search } }, // QR 碼包含
        // 在分類名稱中搜尋
        { category: { name: { contains: search } } },
        // 在父分類名稱中搜尋
        { category: { parent: { name: { contains: search } } } },
        // 在祖父分類名稱中搜尋（第三級）
        { category: { parent: { parent: { name: { contains: search } } } } },
        // 在房間名稱中搜尋
        { room: { name: { contains: search } } },
        // 在櫃子名稱中搜尋
        { cabinet: { name: { contains: search } } },
        // 在物品歷史的語音轉文字中搜尋
        {
          history: {
            some: {
              voiceTranscript: {
                contains: search,
                mode: 'insensitive' // 不區分大小寫
              } as any
            }
          }
        }
      )
    }

    // 處理子分類搜尋
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

    // 處理第三級分類搜尋
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

    // 如果有搜尋條件，將它們添加為 OR
    if (searchConditions.length > 0) {
      where.OR = searchConditions
    }

    // 按分類篩選（基於名稱）- 包含子分類和第三級分類
    if (category) {
      where.category = {
        OR: [
          { name: category }, // 直接匹配
          { parent: { name: category } }, // 匹配此父分類的子分類
          { parent: { parent: { name: category } } } // 匹配此祖父分類的第三級分類
        ]
      }
    }

    // 按分類 ID 篩選（精確匹配）
    if (categoryId) {
      where.categoryId = categoryId
    }

    // 按房間篩選（基於名稱）- 精確匹配
    if (room) {
      where.room = {
        name: room // 使用精確匹配而非包含
      }
    }

    // 按房間 ID 篩選（精確匹配）
    if (roomId) {
      where.roomId = roomId
    }

    // 除錯日誌（用於故障排除）
    console.log('🔍 Search API:', {
      search: search || 'none',
      category: category || 'none',
      room: room || 'none',
      subcategory: subcategory || 'none'
    })

    // 查詢物品列表
    const items = await prisma.item.findMany({
      where,
      include: {
        category: {
          include: {
            parent: {
              include: {
                parent: true // 包含祖父分類
              }
            }
          }
        },
        room: true, // 包含房間資訊
        cabinet: true, // 包含櫃子資訊
        addedBy: {
          select: {
            name: true, // 添加者名稱
            email: true // 添加者電子郵件
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Group items by name (normalized) and aggregate quantities
    const groupedItems = new Map<string, any>()
    
    items.forEach(item => {
      // Normalize item name for grouping (case-insensitive, trim whitespace)
      const normalizedName = item.name.trim().toLowerCase()
      
      if (groupedItems.has(normalizedName)) {
        const existing = groupedItems.get(normalizedName)
        
        // Aggregate quantities
        existing.totalQuantity += item.quantity
        existing.itemIds.push(item.id)
        
        // Use the lowest minQuantity (most restrictive)
        if (item.minQuantity !== null) {
          existing.minQuantity = existing.minQuantity !== null
            ? Math.min(existing.minQuantity, item.minQuantity)
            : item.minQuantity
        }
        
        // Collect all locations for this item
        existing.locations.push({
          id: item.id,
          quantity: item.quantity,
          room: item.room ? { id: item.room.id, name: item.room.name } : null,
          cabinet: item.cabinet ? { id: item.cabinet.id, name: item.cabinet.name } : null
        })
        
        // Keep the most recent image/description
        if (item.imageUrl && !existing.imageUrl) {
          existing.imageUrl = item.imageUrl
        }
        if (item.description && !existing.description) {
          existing.description = item.description
        }
      } else {
        // First instance of this item name
        groupedItems.set(normalizedName, {
          id: item.id, // Use first item ID as primary
          name: item.name, // Keep original casing
          description: item.description,
          totalQuantity: item.quantity,
          minQuantity: item.minQuantity,
          imageUrl: item.imageUrl,
          category: item.category,
          itemIds: [item.id],
          locations: [{
            id: item.id,
            quantity: item.quantity,
            room: item.room ? { id: item.room.id, name: item.room.name } : null,
            cabinet: item.cabinet ? { id: item.cabinet.id, name: item.cabinet.name } : null
          }],
          addedBy: item.addedBy
        })
      }
    })
    
    // Merge duplicate location entries with same room/cabinet in each grouped item
    const result = Array.from(groupedItems.values()).map(item => {
      const mergedLocationsMap = new Map<string, any>()
      for (const loc of item.locations) {
        const key = `${loc.room?.id || 'none'}|${loc.cabinet?.id || 'none'}`
        if (mergedLocationsMap.has(key)) {
          mergedLocationsMap.get(key).quantity += loc.quantity
        } else {
          mergedLocationsMap.set(key, { ...loc })
        }
      }
      const mergedLocations = Array.from(mergedLocationsMap.values())
      return {
        ...item,
        locations: mergedLocations,
        quantity: item.totalQuantity,
        isLowStock: item.minQuantity !== null && item.totalQuantity <= item.minQuantity
      }
    })

    // Track view/filter activity (non-blocking)
    const activityMetadata: any = {
      itemCount: result.length
    }
    if (search) activityMetadata.searchQuery = search
    if (category || categoryId) activityMetadata.category = category || categoryId
    if (room || roomId) activityMetadata.room = room || roomId
    
    trackActivity({
      userId,
      householdId: household.id,
      activityType: search ? 'search' : category || room ? 'filter' : 'navigate',
      action: search ? 'search_items' : category || room ? (category ? 'filter_by_category' : 'filter_by_room') : 'navigate_to_items',
      description: search 
        ? `Searched items: "${search}"`
        : category 
          ? `Filtered by category: ${category}`
          : room
            ? `Filtered by room: ${room}`
            : 'Viewed items list',
      metadata: activityMetadata
    }).catch(err => console.error('Failed to track items view activity:', err))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    )
  }
}





