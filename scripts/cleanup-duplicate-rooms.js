const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDuplicateRooms() {
  console.log('🧹 Starting cleanup of duplicate rooms...');

  try {
    // Get all households
    const households = await prisma.household.findMany({
      include: {
        rooms: true
      }
    });

    for (const household of households) {
      console.log(`\n📋 Processing household: ${household.name}`);
      
      // Group rooms by their cross-language equivalents
      const roomGroups = new Map();
      
      for (const room of household.rooms) {
        // Create a normalized key for cross-language matching
        let normalizedKey = room.name.toLowerCase();
        
        // Map Chinese names to English equivalents for grouping
        const chineseToEnglish = {
          '車庫': 'garage',
          '廚房': 'kitchen', 
          '客廳': 'living room',
          '主臥室': 'master bedroom',
          '兒童房': 'kids room',
          '小孩房': 'kids room'
        };
        
        // If it's a Chinese name, normalize to English equivalent
        if (chineseToEnglish[room.name]) {
          normalizedKey = chineseToEnglish[room.name];
        }
        
        if (!roomGroups.has(normalizedKey)) {
          roomGroups.set(normalizedKey, []);
        }
        roomGroups.get(normalizedKey).push(room);
      }
      
      // Find and clean up duplicates
      for (const [normalizedKey, rooms] of roomGroups) {
        if (rooms.length > 1) {
          console.log(`\n🔄 Found ${rooms.length} duplicate rooms for "${normalizedKey}":`);
          rooms.forEach(room => console.log(`  - "${room.name}" (ID: ${room.id}, Created: ${room.createdAt})`));
          
          // Sort by creation date - keep the oldest one
          rooms.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          const keepRoom = rooms[0];
          const deleteRooms = rooms.slice(1);
          
          console.log(`  ✅ Keeping: "${keepRoom.name}" (oldest)`);
          
          for (const roomToDelete of deleteRooms) {
            console.log(`  🗑️  Deleting: "${roomToDelete.name}"`);
            
            // Delete associated items first
            await prisma.item.deleteMany({
              where: { roomId: roomToDelete.id }
            });
            
            // Delete associated cabinets and their items
            const cabinets = await prisma.cabinet.findMany({
              where: { roomId: roomToDelete.id },
              include: { items: true }
            });
            
            for (const cabinet of cabinets) {
              // Delete cabinet items
              await prisma.item.deleteMany({
                where: { cabinetId: cabinet.id }
              });
              
              // Delete cabinet
              await prisma.cabinet.delete({
                where: { id: cabinet.id }
              });
            }
            
            // Delete the room
            await prisma.room.delete({
              where: { id: roomToDelete.id }
            });
          }
        }
      }
    }
    
    console.log('\n✅ Cleanup completed successfully!');
    
    // Show final room counts
    const finalHouseholds = await prisma.household.findMany({
      include: {
        rooms: true
      }
    });
    
    console.log('\n📊 Final room counts:');
    for (const household of finalHouseholds) {
      console.log(`\n${household.name}:`);
      const roomCounts = household.rooms.reduce((acc, room) => {
        acc[room.name] = (acc[room.name] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(roomCounts).forEach(([name, count]) => {
        console.log(`  "${name}": ${count} occurrence(s)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicateRooms();
