import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPrismaClient } from '@/lib/prisma-factory'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  let prisma = createPrismaClient()
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = (session.user as any).id

    // Get user's household
    const household = await prisma.household.findFirst({
      where: {
        members: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        rooms: {
          include: {
            cabinets: {
              include: {
                items: true
              }
            },
            items: true
          }
        }
      }
    })

    if (!household) {
      return NextResponse.json({ error: 'No household found' }, { status: 404 })
    }

    console.log(`🧹 Starting cleanup for household: ${household.name}`)
    console.log(`📋 Found ${household.rooms.length} rooms`)

    // Group rooms by their cross-language equivalents
    const roomGroups = new Map<string, any[]>()
    
    for (const room of household.rooms) {
      // Create a normalized key for cross-language matching
      let normalizedKey = room.name.toLowerCase()
      
      // Map Chinese names to English equivalents for grouping
      const chineseToEnglish: Record<string, string> = {
        '車庫': 'garage',
        '廚房': 'kitchen', 
        '客廳': 'living room',
        '主臥室': 'master bedroom',
        '兒童房': 'kids room',
        '小孩房': 'kids room'
      }
      
      // If it's a Chinese name, normalize to English equivalent
      if (chineseToEnglish[room.name]) {
        normalizedKey = chineseToEnglish[room.name]
      }
      
      if (!roomGroups.has(normalizedKey)) {
        roomGroups.set(normalizedKey, [])
      }
      roomGroups.get(normalizedKey)!.push(room)
    }
    
    const cleanupResults: any[] = []
    
    // Find and clean up duplicates
    for (const [normalizedKey, rooms] of Array.from(roomGroups.entries())) {
      if (rooms.length > 1) {
        console.log(`🔄 Found ${rooms.length} duplicate rooms for "${normalizedKey}":`)
        rooms.forEach((room: any) => console.log(`  - "${room.name}" (ID: ${room.id}, Created: ${room.createdAt})`))
        
        // Sort by creation date - keep the oldest one
        rooms.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        const keepRoom = rooms[0]
        const deleteRooms = rooms.slice(1)
        
        console.log(`  ✅ Keeping: "${keepRoom.name}" (oldest)`)
        
        const deletedRooms = []
        
        for (const roomToDelete of deleteRooms) {
          console.log(`  🗑️  Deleting: "${roomToDelete.name}"`)
          
          // Count items and cabinets to be deleted
          const itemCount = roomToDelete.items.length
          const cabinetCount = roomToDelete.cabinets.length
          let totalCabinetItems = 0
          
          for (const cabinet of roomToDelete.cabinets) {
            totalCabinetItems += cabinet.items.length
          }
          
          // Delete associated items first
          await prisma.item.deleteMany({
            where: { roomId: roomToDelete.id }
          })
          
          // Delete associated cabinets and their items
          for (const cabinet of roomToDelete.cabinets) {
            // Delete cabinet items
            await prisma.item.deleteMany({
              where: { cabinetId: cabinet.id }
            })
            
            // Delete cabinet
            await prisma.cabinet.delete({
              where: { id: cabinet.id }
            })
          }
          
          // Delete the room
          await prisma.room.delete({
            where: { id: roomToDelete.id }
          })
          
          deletedRooms.push({
            name: roomToDelete.name,
            id: roomToDelete.id,
            itemsDeleted: itemCount,
            cabinetsDeleted: cabinetCount,
            cabinetItemsDeleted: totalCabinetItems
          })
        }
        
        cleanupResults.push({
          normalizedKey,
          kept: keepRoom.name,
          deleted: deletedRooms
        })
      }
    }
    
    // Get final room counts
    const finalHousehold = await prisma.household.findFirst({
      where: { id: household.id },
      include: {
        rooms: true
      }
    })
    
    const finalRoomCounts = finalHousehold?.rooms.reduce((acc, room) => {
      acc[room.name] = (acc[room.name] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}
    
    console.log('✅ Cleanup completed successfully!')
    
    return NextResponse.json({
      success: true,
      message: 'Duplicate rooms cleaned up successfully',
      cleanupResults,
      beforeCount: household.rooms.length,
      afterCount: finalHousehold?.rooms.length || 0,
      finalRoomCounts,
      householdId: household.id
    })
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup duplicates', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(request: NextRequest) {
  let prisma = createPrismaClient()
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = (session.user as any).id

    // Get user's household
    const household = await prisma.household.findFirst({
      where: {
        members: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        rooms: true
      }
    })

    if (!household) {
      return NextResponse.json({ error: 'No household found' }, { status: 404 })
    }

    // Group rooms by their cross-language equivalents
    const roomGroups = new Map<string, any[]>()
    
    for (const room of household.rooms) {
      // Create a normalized key for cross-language matching
      let normalizedKey = room.name.toLowerCase()
      
      // Map Chinese names to English equivalents for grouping
      const chineseToEnglish: Record<string, string> = {
        '車庫': 'garage',
        '廚房': 'kitchen', 
        '客廳': 'living room',
        '主臥室': 'master bedroom',
        '兒童房': 'kids room',
        '小孩房': 'kids room'
      }
      
      // If it's a Chinese name, normalize to English equivalent
      if (chineseToEnglish[room.name]) {
        normalizedKey = chineseToEnglish[room.name]
      }
      
      if (!roomGroups.has(normalizedKey)) {
        roomGroups.set(normalizedKey, [])
      }
      roomGroups.get(normalizedKey)!.push(room)
    }
    
    // Find duplicates
    const duplicates: any[] = []
    for (const [normalizedKey, rooms] of Array.from(roomGroups.entries())) {
      if (rooms.length > 1) {
        rooms.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        duplicates.push({
          normalizedKey,
          rooms: rooms.map((room: any) => ({
            id: room.id,
            name: room.name,
            createdAt: room.createdAt,
            willKeep: room === rooms[0]
          }))
        })
      }
    }
    
    return NextResponse.json({
      householdId: household.id,
      totalRooms: household.rooms.length,
      duplicates,
      roomCounts: household.rooms.reduce((acc, room) => {
        acc[room.name] = (acc[room.name] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    })
    
  } catch (error) {
    console.error('❌ Error checking duplicates:', error)
    return NextResponse.json(
      { error: 'Failed to check duplicates' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}