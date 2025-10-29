const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugRoomsAndCabinets() {
  try {
    console.log('🔍 Debugging rooms and cabinets...')
    
    // Find the 黎家 household
    const household = await prisma.household.findFirst({
      where: {
        name: {
          contains: '黎家'
        }
      },
      include: {
        rooms: {
          include: {
            cabinets: true
          }
        }
      }
    })
    
    if (!household) {
      console.log('❌ No 黎家 household found')
      return
    }
    
    console.log('🏠 Found household:', household.name, '(ID:', household.id, ')')
    console.log('📊 Total rooms:', household.rooms.length)
    
    household.rooms.forEach(room => {
      console.log(`\n🚪 Room: ${room.name} (ID: ${room.id})`)
      console.log(`   📦 Cabinets (${room.cabinets.length}):`)
      room.cabinets.forEach(cabinet => {
        console.log(`      - ${cabinet.name} (ID: ${cabinet.id})`)
      })
    })
    
    // Check specifically for kitchen
    const kitchen = household.rooms.find(r => r.name.includes('kitchen') || r.name.includes('廚房'))
    if (kitchen) {
      console.log('\n🍳 Kitchen details:')
      console.log('   Name:', kitchen.name)
      console.log('   ID:', kitchen.id)
      console.log('   Cabinets:', kitchen.cabinets.map(c => c.name))
    } else {
      console.log('\n❌ No kitchen found')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugRoomsAndCabinets()