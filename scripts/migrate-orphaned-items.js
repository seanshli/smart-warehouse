const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateOrphanedItems() {
  console.log('🔧 Starting migration of orphaned items...')
  
  try {
    // Get a system user ID (first user in the system)
    const systemUser = await prisma.user.findFirst()
    if (!systemUser) {
      console.error('❌ No users found in the system. Cannot perform migration.')
      return
    }
    
    console.log(`Using system user: ${systemUser.name || systemUser.email} (${systemUser.id})`)
    
    // Find all items that have a room but no cabinet
    // Find all items that have a room but no cabinet
    const orphanedItems = await prisma.item.findMany({
      where: {
        roomId: {
          not: null
        },
        cabinetId: null
      },
      include: {
        room: true
      }
    })
    
    console.log(`Found ${orphanedItems.length} orphaned items`)
    
    if (orphanedItems.length === 0) {
      console.log('✅ No orphaned items found!')
      return
    }
    
    // Group items by room
    const itemsByRoom = {}
    orphanedItems.forEach(item => {
      const roomId = item.roomId
      if (!itemsByRoom[roomId]) {
        itemsByRoom[roomId] = {
          room: item.room,
          items: []
        }
      }
      itemsByRoom[roomId].items.push(item)
    })
    
    console.log(`Items grouped by ${Object.keys(itemsByRoom).length} rooms`)
    
    // Process each room
    for (const [roomId, roomData] of Object.entries(itemsByRoom)) {
      const room = roomData.room
      const items = roomData.items
      
      console.log(`\n🏠 Processing room: ${room.name} (${items.length} items)`)
      
      // Check if room has any cabinets
      const existingCabinets = await prisma.cabinet.findMany({
        where: {
          roomId: roomId
        }
      })
      
      let targetCabinet = null
      
      if (existingCabinets.length === 0) {
        // Create default cabinet
        console.log(`  📦 Creating default cabinet for room: ${room.name}`)
        targetCabinet = await prisma.cabinet.create({
          data: {
            name: 'Default Cabinet',
            description: 'Automatically created default cabinet for orphaned items',
            roomId: roomId
          }
        })
        console.log(`  ✅ Created cabinet: ${targetCabinet.name} (${targetCabinet.id})`)
      } else {
        // Use first existing cabinet
        targetCabinet = existingCabinets[0]
        console.log(`  📦 Using existing cabinet: ${targetCabinet.name} (${targetCabinet.id})`)
      }
      
      // Move all orphaned items to the target cabinet
      for (const item of items) {
        console.log(`  🔄 Moving item: ${item.name}`)
        
        await prisma.item.update({
          where: {
            id: item.id
          },
          data: {
            cabinetId: targetCabinet.id
          }
        })
        
        // Log the move in history
        await prisma.itemHistory.create({
          data: {
            itemId: item.id,
            action: 'moved',
            description: `Item "${item.name}" was moved to ${targetCabinet.name} (migration)`,
            newRoomId: roomId,
            newCabinetId: targetCabinet.id,
            performedBy: systemUser.id
          }
        })
        
        console.log(`    ✅ Moved to cabinet: ${targetCabinet.name}`)
      }
    }
    
    console.log('\n🎉 Migration completed successfully!')
    console.log(`📊 Summary:`)
    console.log(`  - Processed ${orphanedItems.length} orphaned items`)
    console.log(`  - Updated ${Object.keys(itemsByRoom).length} rooms`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
migrateOrphanedItems()
