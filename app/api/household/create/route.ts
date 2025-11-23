import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { name, description, latitude, longitude, buildingId } = await request.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Household name is required' }, { status: 400 })
    }

    // 如果提供了位置信息，检查是否有现有的 Community/Building
    // If location info is provided, check for existing Community/Building
    let existingCommunity: any = null
    let existingBuilding: any = null

    if (latitude && longitude) {
      // 检查附近是否有 Building（在 100 米范围内）
      // Check for nearby Buildings (within 100 meters)
      const nearbyBuildings = await prisma.building.findMany({
        where: {
          latitude: {
            gte: latitude - 0.001, // ~100 meters
            lte: latitude + 0.001,
          },
          longitude: {
            gte: longitude - 0.001,
            lte: longitude + 0.001,
          },
        },
        include: {
          community: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: 5,
      })

      if (nearbyBuildings.length > 0) {
        existingBuilding = nearbyBuildings[0]
        existingCommunity = existingBuilding.community
      }
    }

    // 如果提供了 buildingId，验证它是否存在
    // If buildingId is provided, verify it exists
    if (buildingId) {
      const building = await prisma.building.findUnique({
        where: { id: buildingId },
        include: {
          community: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      if (building) {
        existingBuilding = building
        existingCommunity = building.community
      }
    }

    // 如果找到现有的 Community/Building，返回提示信息
    // If existing Community/Building found, return suggestion
    if (existingBuilding || existingCommunity) {
      return NextResponse.json({
        success: false,
        suggestion: {
          hasExisting: true,
          building: existingBuilding
            ? {
                id: existingBuilding.id,
                name: existingBuilding.name,
                invitationCode: existingBuilding.invitationCode,
              }
            : null,
          community: existingCommunity
            ? {
                id: existingCommunity.id,
                name: existingCommunity.name,
                invitationCode: (existingCommunity as any).invitationCode,
              }
            : null,
          message:
            'Found existing building/community at this location. Would you like to send a join request?',
        },
      })
    }

    // Create the household with the user as the owner
    const household = await prisma.household.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        latitude: latitude || null,
        longitude: longitude || null,
        buildingId: buildingId || null,
        members: {
          create: {
            userId: userId,
            role: 'OWNER'
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        }
      }
    })

    // 创建 Household 后，自动创建 Tuya 账户
    // After creating Household, automatically create Tuya account
    const { getOrCreateHouseholdTuyaAccount } = await import('@/lib/tuya-household-manager')
    const tuyaAccountInfo = await getOrCreateHouseholdTuyaAccount(household.id)

    // 注意：Tuya Home 的创建需要在客户端（iOS/Android）使用 SDK 进行
    // 这里只是创建了账户信息，实际的 Home 创建会在首次配网时进行
    // Note: Tuya Home creation needs to be done on client (iOS/Android) using SDK
    // This only creates account info, actual Home creation will happen during first provisioning

    // Preload 4 default rooms for the new household (using translation keys)
    const defaultRooms = [
      { name: 'kitchen', description: 'Kitchen', cabinets: ['A', 'B', 'C', 'D'] },
      { name: 'master_bedroom', description: 'Master bedroom', cabinets: ['主櫥櫃'] },
      { name: 'kids_room', description: 'Kids room', cabinets: ['兒童衣櫥'] },
      { name: 'living_room', description: 'Living room', cabinets: ['客廳櫃'] }
    ]

    // Create rooms and cabinets
    for (const roomData of defaultRooms) {
      const room = await prisma.room.create({
        data: {
          name: roomData.name,
          description: roomData.description,
          householdId: household.id
        }
      })

      // Create cabinets for each room
      for (const cabinetName of roomData.cabinets) {
        await prisma.cabinet.create({
          data: {
            name: cabinetName,
            description: `${cabinetName} cabinet`,
            roomId: room.id
          }
        })
      }
    }

    // Preload categories with subcategories
    // Level 1 categories
    const level1Categories = [
      'accessory',
      'book',
      'clothes',
      'electronics',
      'kitchenware',
      'mics',
      'tools'
    ]

    const createdCategories: { [key: string]: any } = {}

    // Create Level 1 categories
    for (const categoryName of level1Categories) {
      const category = await prisma.category.create({
        data: {
          name: categoryName,
          level: 1,
          householdId: household.id
        }
      })
      createdCategories[categoryName] = category
    }

    // Create Level 2 subcategories for kitchenware
    const kitchenwareSubcategories = [
      'pots_and_pans',
      'drinkware',
      'dishes',
      'utensil'
    ]

    for (const subcategoryName of kitchenwareSubcategories) {
      await prisma.category.create({
        data: {
          name: subcategoryName,
          level: 2,
          parentId: createdCategories['kitchenware'].id,
          householdId: household.id
        }
      })
    }

    // Create Level 2 subcategories for clothes
    const clothesLevel2 = ['top', 'bottom']
    const clothesLevel2Categories: { [key: string]: any } = {}

    for (const subcategoryName of clothesLevel2) {
      const category = await prisma.category.create({
        data: {
          name: subcategoryName,
          level: 2,
          parentId: createdCategories['clothes'].id,
          householdId: household.id
        }
      })
      clothesLevel2Categories[subcategoryName] = category
    }

    // Create Level 3 subcategories under Top
    const topLevel3 = ['jacket', 't_shirt', 'shirt']
    for (const subcategoryName of topLevel3) {
      await prisma.category.create({
        data: {
          name: subcategoryName,
          level: 3,
          parentId: clothesLevel2Categories['top'].id,
          householdId: household.id
        }
      })
    }

    // Create Level 3 subcategories under Bottom
    const bottomLevel3 = ['pants', 'skirt']
    for (const subcategoryName of bottomLevel3) {
      await prisma.category.create({
        data: {
          name: subcategoryName,
          level: 3,
          parentId: clothesLevel2Categories['bottom'].id,
          householdId: household.id
        }
      })
    }

    console.log(`✅ Created ${defaultRooms.length} rooms with cabinets and categories with subcategories for household: ${household.name}`)

    // 重新获取完整的 Household 信息（包括 Tuya 账户）
    // Re-fetch complete Household info (including Tuya account)
    const householdWithTuya = await prisma.household.findUnique({
      where: { id: household.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      household: {
        id: householdWithTuya?.id || household.id,
        name: householdWithTuya?.name || household.name,
        description: householdWithTuya?.description || household.description,
        members: householdWithTuya?.members || household.members,
        tuyaAccount: (householdWithTuya as any)?.tuyaAccount || null,
      }
    })
  } catch (error) {
    console.error('Error creating household:', error)
    return NextResponse.json(
      { error: 'Failed to create household' },
      { status: 500 }
    )
  }
}
