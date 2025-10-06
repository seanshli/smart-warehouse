import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@smartwarehouse.com' },
    update: {},
    create: {
      email: 'demo@smartwarehouse.com',
      name: 'Demo User',
    },
  })

  console.log('✅ Demo user created:', demoUser.email)

  // Create demo household
  const demoHousehold = await prisma.household.upsert({
    where: { id: 'demo-household' },
    update: {},
    create: {
      id: 'demo-household',
      name: "Demo User's Household",
      description: 'Demo household for testing'
    },
  })

  // Add demo user to household as OWNER
  await prisma.householdMember.upsert({
    where: { 
      userId_householdId: {
        userId: demoUser.id,
        householdId: demoHousehold.id
      }
    },
    update: {},
    create: {
      userId: demoUser.id,
      householdId: demoHousehold.id,
      role: 'OWNER'
    },
  })

  console.log('✅ Demo household created and user added')

  // Create demo rooms
  const kitchen = await prisma.room.upsert({
    where: { id: 'demo-kitchen' },
    update: {},
    create: {
      id: 'demo-kitchen',
      name: '廚房',
      description: 'Kitchen',
      householdId: demoHousehold.id
    },
  })

  const livingRoom = await prisma.room.upsert({
    where: { id: 'demo-living' },
    update: {},
    create: {
      id: 'demo-living',
      name: 'Living Room',
      description: 'Main living area',
      householdId: demoHousehold.id
    },
  })

  console.log('✅ Demo rooms created')

  // Create demo cabinets
  const rightCabinet = await prisma.cabinet.upsert({
    where: { id: 'demo-right-cabinet' },
    update: {},
    create: {
      id: 'demo-right-cabinet',
      name: '右櫥櫃',
      description: 'Right Cabinet',
      roomId: kitchen.id
    },
  })

  const middleCabinet = await prisma.cabinet.upsert({
    where: { id: 'demo-middle-cabinet' },
    update: {},
    create: {
      id: 'demo-middle-cabinet',
      name: '中櫥櫃',
      description: 'Middle Cabinet',
      roomId: kitchen.id
    },
  })

  console.log('✅ Demo cabinets created')

  // Create demo categories
  const personalCare = await prisma.category.upsert({
    where: { id: 'demo-personal-care' },
    update: {},
    create: {
      id: 'demo-personal-care',
      name: 'Personal Care',
      level: 1,
      householdId: demoHousehold.id
    },
  })

  const wetWipes = await prisma.category.upsert({
    where: { id: 'demo-wet-wipes' },
    update: {},
    create: {
      id: 'demo-wet-wipes',
      name: 'Wet Wipes',
      level: 2,
      parentId: personalCare.id,
      householdId: demoHousehold.id
    },
  })

  const foodBeverages = await prisma.category.upsert({
    where: { id: 'demo-food-beverages' },
    update: {},
    create: {
      id: 'demo-food-beverages',
      name: 'Food & Beverages',
      level: 1,
      householdId: demoHousehold.id
    },
  })

  const cookies = await prisma.category.upsert({
    where: { id: 'demo-cookies' },
    update: {},
    create: {
      id: 'demo-cookies',
      name: 'Cookies',
      level: 2,
      parentId: foodBeverages.id,
      householdId: demoHousehold.id
    },
  })

  console.log('✅ Demo categories created')

  // Create demo items (now with same barcodes allowed!)
  const wetWipesItem = await prisma.item.upsert({
    where: { id: 'demo-wet-wipes-item' },
    update: {},
    create: {
      id: 'demo-wet-wipes-item',
      name: 'Taiwan Pure Water Wet Wipes',
      description: 'Taiwan-made pure water wet wipes with ultra-high filtration',
      quantity: 2,
      minQuantity: 1,
      barcode: '4710901898748', // Same barcode as your test
      categoryId: wetWipes.id,
      roomId: kitchen.id,
      cabinetId: rightCabinet.id,
      householdId: demoHousehold.id,
      addedById: demoUser.id
    },
  })

  const oreoItem = await prisma.item.upsert({
    where: { id: 'demo-oreo-item' },
    update: {},
    create: {
      id: 'demo-oreo-item',
      name: 'Mini Oreo Original Cookies',
      description: 'Bite-sized chocolate cookies with vanilla cream filling',
      quantity: 3,
      minQuantity: 1,
      barcode: '7622300761349', // Same barcode as your test
      categoryId: cookies.id,
      roomId: kitchen.id,
      cabinetId: middleCabinet.id,
      householdId: demoHousehold.id,
      addedById: demoUser.id
    },
  })

  console.log('✅ Demo items created')

  console.log('🎉 Database seeding completed successfully!')
  console.log('📋 Demo data summary:')
  console.log(`   - User: ${demoUser.email}`)
  console.log(`   - Household: ${demoHousehold.name}`)
  console.log(`   - Rooms: Kitchen, Living Room`)
  console.log(`   - Cabinets: Right Cabinet, Middle Cabinet`)
  console.log(`   - Categories: Personal Care > Wet Wipes, Food & Beverages > Cookies`)
  console.log(`   - Items: Taiwan Wet Wipes (4710901898748), Mini Oreo Cookies (7622300761349)`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
