// 移動物品 API 路由
// 處理物品移動請求，支援完整移動和部分移動，可同時更改房間、櫃子和分類

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 強制動態渲染此路由
export const dynamic = 'force-dynamic'

// PUT 處理器：移動物品
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const itemId = params.id // 物品 ID
    const body = await request.json()
    const { roomId, cabinetId, categoryId, quantity = 1 } = body // 目標房間 ID、櫃子 ID、分類 ID、移動數量

    // 驗證用戶有權限存取此物品
    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        household: {
          members: {
            some: {
              userId: userId
            }
          }
        }
      },
      include: {
        room: true, // 包含當前房間資訊
        cabinet: true // 包含當前櫃子資訊
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // 驗證移動數量
    if (quantity < 1 || quantity > item.quantity) {
      return NextResponse.json({ 
        error: `Invalid quantity. Available: ${item.quantity}, Requested: ${quantity}` 
      }, { status: 400 })
    }

    // 獲取新位置詳情並驗證用戶權限
    const newRoom = await prisma.room.findFirst({
      where: { 
        id: roomId,
        household: {
          members: {
            some: {
              userId: userId
            }
          }
        }
      }
    })

    const newCabinet = cabinetId ? await prisma.cabinet.findFirst({
      where: { 
        id: cabinetId,
        room: {
          household: {
            members: {
              some: {
                userId: userId
              }
            }
          }
        }
      }
    }) : null

    const newCategory = categoryId ? await prisma.category.findFirst({
      where: { 
        id: categoryId,
        household: {
          members: {
            some: {
              userId: userId
            }
          }
        }
      }
    }) : null

    console.log('[move] Location validation - roomId:', roomId, 'cabinetId:', cabinetId, 'categoryId:', categoryId)
    console.log('[move] Room found:', !!newRoom, 'Cabinet found:', !!newCabinet, 'Category found:', !!newCategory)

    // 驗證新位置是否存在且用戶有權限
    if (!newRoom) {
      console.error('[move] Room not found or access denied:', roomId)
      return NextResponse.json({ error: 'Room not found or access denied' }, { status: 404 })
    }

    if (cabinetId && !newCabinet) {
      console.error('[move] Cabinet not found or access denied:', cabinetId)
      return NextResponse.json({ error: 'Cabinet not found or access denied' }, { status: 404 })
    }

    if (categoryId && !newCategory) {
      console.error('[move] Category not found or access denied:', categoryId)
      return NextResponse.json({ error: 'Category not found or access denied' }, { status: 404 })
    }

    // 處理部分移動 vs 完整移動
    if (quantity === item.quantity) {
      // 完整移動 - 更新現有物品的位置
      const updatedItem = await prisma.item.update({
        where: { id: itemId },
        data: {
          roomId: roomId, // 新房間 ID
          cabinetId: cabinetId, // 新櫃子 ID
          categoryId: categoryId || undefined, // 新分類 ID（可選）
          updatedAt: new Date() // 更新時間
        },
        include: {
          category: {
            include: {
              parent: true // 包含父分類
            }
          },
          room: true, // 包含房間資訊
          cabinet: true // 包含櫃子資訊
        }
      })

      // 為完整移動創建活動記錄
      const oldLocation = item.room?.name + (item.cabinet?.name ? ` → ${item.cabinet.name}` : '') // 舊位置
      const newLocation = newRoom.name + (newCabinet?.name ? ` → ${newCabinet.name}` : '') // 新位置
      
      let description = `Item "${updatedItem.name}" moved from ${oldLocation} to ${newLocation}`
      
      // 如果分類有變更，添加分類變更資訊
      if (categoryId && newCategory) {
        description += ` and category changed to ${newCategory.name}`
      }
      
      await prisma.itemHistory.create({
        data: {
          itemId: itemId,
          action: 'moved', // 操作類型：移動
          description: description,
          oldRoomId: item.roomId,
          newRoomId: roomId,
          oldCabinetId: item.cabinetId,
          newCabinetId: cabinetId,
          performedBy: userId
        }
      })

      // Attempt to merge with an existing item at the destination (same name/category/location)
      try {
        const existingAtDestination = await prisma.item.findFirst({
          where: {
            id: { not: updatedItem.id },
            householdId: item.householdId,
            name: item.name,
            roomId: roomId,
            cabinetId: cabinetId,
            categoryId: updatedItem.categoryId || null
          }
        })

        if (existingAtDestination) {
          const merged = await prisma.item.update({
            where: { id: existingAtDestination.id },
            data: { quantity: existingAtDestination.quantity + updatedItem.quantity }
          })
          await prisma.item.delete({ where: { id: updatedItem.id } })
          return NextResponse.json(merged)
        }
      } catch (mergeErr) {
        console.error('[move] Merge after full move failed:', mergeErr)
      }

      return NextResponse.json(updatedItem)
    } else {
      // Partial move - reduce original item quantity and create new item
      const remainingQuantity = item.quantity - quantity
      
      // Update original item with reduced quantity
      await prisma.item.update({
        where: { id: itemId },
        data: {
          quantity: remainingQuantity,
          updatedAt: new Date()
        }
      })

      // Create new item at new location
      const newItem = await prisma.item.create({
        data: {
          name: item.name,
          description: item.description,
          quantity: quantity,
          minQuantity: item.minQuantity,
          barcode: item.barcode,
          qrCode: item.qrCode,
          imageUrl: item.imageUrl,
          roomId: roomId,
          cabinetId: cabinetId,
          categoryId: categoryId || item.categoryId,
          householdId: item.householdId,
          addedById: userId
        },
        include: {
          category: {
            include: {
              parent: true
            }
          },
          room: true,
          cabinet: true
        }
      })

      // Create activity records
      const oldLocation = item.room?.name + (item.cabinet?.name ? ` → ${item.cabinet.name}` : '')
      const newLocation = newRoom.name + (newCabinet?.name ? ` → ${newCabinet.name}` : '')
      
      // Record for original item (quantity reduced)
      await prisma.itemHistory.create({
        data: {
          itemId: itemId,
          action: 'quantity_reduced',
          description: `Item "${item.name}" quantity reduced by ${quantity} (moved to new location)`,
          oldRoomId: item.roomId,
          newRoomId: item.roomId,
          oldCabinetId: item.cabinetId,
          newCabinetId: item.cabinetId,
          performedBy: userId
        }
      })

      // Record for new item (created at new location)
      await prisma.itemHistory.create({
        data: {
          itemId: newItem.id,
          action: 'moved',
          description: `Item "${newItem.name}" (${quantity} units) moved from ${oldLocation} to ${newLocation}`,
          oldRoomId: item.roomId,
          newRoomId: roomId,
          oldCabinetId: item.cabinetId,
          newCabinetId: cabinetId,
          performedBy: userId
        }
      })

      // Attempt to merge with an existing item at the destination (same name/category/location)
      try {
        const existingAtDestination = await prisma.item.findFirst({
          where: {
            id: { not: newItem.id },
            householdId: item.householdId,
            name: item.name,
            roomId: roomId,
            cabinetId: cabinetId,
            categoryId: newItem.categoryId || null
          }
        })

        if (existingAtDestination) {
          const merged = await prisma.item.update({
            where: { id: existingAtDestination.id },
            data: { quantity: existingAtDestination.quantity + newItem.quantity }
          })
          await prisma.item.delete({ where: { id: newItem.id } })
          return NextResponse.json(merged)
        }
      } catch (mergeErr) {
        console.error('[move] Merge after partial move failed:', mergeErr)
      }

      return NextResponse.json(newItem)
    }
  } catch (error) {
    console.error('Error moving item:', error)
    return NextResponse.json({ error: 'Failed to move item' }, { status: 500 })
  }
}
