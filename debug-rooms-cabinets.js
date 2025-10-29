const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugRoomsCabinets() {
  try {
    console.log('🔍 Debugging rooms and cabinets...')
    
    // Get all households
    const households = await prisma.household.findMany({
      include: {
        rooms: {
          include: {
            cabinets: true
          }
        }
      }
    })
    
    console.log(`\n📊 Found ${households.length} households:`)
    
    for (const household of households) {
      console.log(`\n🏠 Household: ${household.name} (ID: ${household.id})`)
      console.log(`   Rooms: ${household.rooms.length}`)
      
      for (const room of household.rooms) {
        console.log(`   📦 Room: ${room.name} (ID: ${room.id})`)
        console.log(`      Cabinets: ${room.cabinets.length}`)
        for (const cabinet of room.cabinets) {
          console.log(`         - ${cabinet.name} (ID: ${cabinet.id})`)
        }
      }
    }
    
    // Check specifically for 黎家 household
    const liJiaHousehold = await prisma.household.findFirst({
      where: {
        name: { contains: '黎家' }
      },
      include: {
        rooms: {
          include: {
            cabinets: true
          }
        }
      }
    })
    
    if (liJiaHousehold) {
      console.log(`\n🎯 黎家 Household Details:`)
      console.log(`   ID: ${liJiaHousehold.id}`)
      console.log(`   Rooms: ${liJiaHousehold.rooms.length}`)
      
      for (const room of liJiaHousehold.rooms) {
        console.log(`   📦 Room: ${room.name} (ID: ${room.id})`)
        console.log(`      Cabinets: ${room.cabinets.length}`)
        for (const cabinet of room.cabinets) {
          console.log(`         - ${cabinet.name} (ID: ${cabinet.id})`)
        }
      }
    } else {
      console.log('\n❌ 黎家 household not found')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugRoomsCabinets()

