import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@smartwarehouse.com' },
    update: {},
    create: {
      email: 'admin@smartwarehouse.com',
      name: 'System Administrator',
      password: adminPassword,
      isAdmin: true,
      emailVerified: new Date(),
    },
  })

  console.log('✅ Admin user created:', adminUser.email)

  // Create admin household
  const adminHousehold = await prisma.household.upsert({
    where: { id: 'admin-household' },
    update: {},
    create: {
      id: 'admin-household',
      name: 'Admin Household',
      description: 'System administration household'
    },
  })

  // Add admin user to household as OWNER
  await prisma.householdMember.upsert({
    where: { 
      userId_householdId: {
        userId: adminUser.id,
        householdId: adminHousehold.id
      }
    },
    update: {},
    create: {
      userId: adminUser.id,
      householdId: adminHousehold.id,
      role: 'OWNER'
    },
  })

  console.log('✅ Admin household created and user added')

  // Create regular user for testing
  const userPassword = await bcrypt.hash('user123', 12)
  const testUser = await prisma.user.upsert({
    where: { email: 'user@smartwarehouse.com' },
    update: {},
    create: {
      email: 'user@smartwarehouse.com',
      name: 'Test User',
      password: userPassword,
      isAdmin: false,
      emailVerified: new Date(),
    },
  })

  console.log('✅ Test user created:', testUser.email)

  // Create test household
  const testHousehold = await prisma.household.upsert({
    where: { id: 'test-household' },
    update: {},
    create: {
      id: 'test-household',
      name: 'Test Household',
      description: 'Test household for regular users'
    },
  })

  // Add test user to household as OWNER
  await prisma.householdMember.upsert({
    where: { 
      userId_householdId: {
        userId: testUser.id,
        householdId: testHousehold.id
      }
    },
    update: {},
    create: {
      userId: testUser.id,
      householdId: testHousehold.id,
      role: 'OWNER'
    },
  })

  console.log('✅ Test household created and user added')

  // Create test rooms
  const kitchen = await prisma.room.upsert({
    where: { id: 'test-kitchen' },
    update: {},
    create: {
      id: 'test-kitchen',
      name: '廚房',
      description: 'Kitchen',
      householdId: testHousehold.id
    },
  })

  const livingRoom = await prisma.room.upsert({
    where: { id: 'test-living' },
    update: {},
    create: {
      id: 'test-living',
      name: 'Living Room',
      description: 'Main living area',
      householdId: testHousehold.id
    },
  })

  console.log('✅ Test rooms created')

  // Create test cabinets
  const rightCabinet = await prisma.cabinet.upsert({
    where: { id: 'test-right-cabinet' },
    update: {},
    create: {
      id: 'test-right-cabinet',
      name: '右櫥櫃',
      description: 'Right Cabinet',
      roomId: kitchen.id
    },
  })

  const middleCabinet = await prisma.cabinet.upsert({
    where: { id: 'test-middle-cabinet' },
    update: {},
    create: {
      id: 'test-middle-cabinet',
      name: '中櫥櫃',
      description: 'Middle Cabinet',
      roomId: kitchen.id
    },
  })

  console.log('✅ Test cabinets created')

  // Create test categories
  const personalCare = await prisma.category.upsert({
    where: { id: 'test-personal-care' },
    update: {},
    create: {
      id: 'test-personal-care',
      name: 'Personal Care',
      level: 1,
      householdId: testHousehold.id
    },
  })

  const wetWipes = await prisma.category.upsert({
    where: { id: 'test-wet-wipes' },
    update: {},
    create: {
      id: 'test-wet-wipes',
      name: 'Wet Wipes',
      level: 2,
      parentId: personalCare.id,
      householdId: testHousehold.id
    },
  })

  const foodBeverages = await prisma.category.upsert({
    where: { id: 'test-food-beverages' },
    update: {},
    create: {
      id: 'test-food-beverages',
      name: 'Food & Beverages',
      level: 1,
      householdId: testHousehold.id
    },
  })

  const cookies = await prisma.category.upsert({
    where: { id: 'test-cookies' },
    update: {},
    create: {
      id: 'test-cookies',
      name: 'Cookies',
      level: 2,
      parentId: foodBeverages.id,
      householdId: testHousehold.id
    },
  })

  console.log('✅ Test categories created')

  // Create test items (now with same barcodes allowed!)
  const wetWipesItem = await prisma.item.upsert({
    where: { id: 'test-wet-wipes-item' },
    update: {},
    create: {
      id: 'test-wet-wipes-item',
      name: 'Taiwan Pure Water Wet Wipes',
      description: 'Taiwan-made pure water wet wipes with ultra-high filtration',
      quantity: 2,
      minQuantity: 1,
      barcode: '4710901898748', // Same barcode as your test
      categoryId: wetWipes.id,
      roomId: kitchen.id,
      cabinetId: rightCabinet.id,
      householdId: testHousehold.id,
      addedById: testUser.id
    },
  })

  const oreoItem = await prisma.item.upsert({
    where: { id: 'test-oreo-item' },
    update: {},
    create: {
      id: 'test-oreo-item',
      name: 'Mini Oreo Original Cookies',
      description: 'Bite-sized chocolate cookies with vanilla cream filling',
      quantity: 3,
      minQuantity: 1,
      barcode: '7622300761349', // Same barcode as your test
      categoryId: cookies.id,
      roomId: kitchen.id,
      cabinetId: middleCabinet.id,
      householdId: testHousehold.id,
      addedById: testUser.id
    },
  })

  console.log('✅ Test items created')

  console.log('🎉 Database seeding completed successfully!')
  console.log('📋 Test data summary:')
  console.log(`   - Admin User: ${adminUser.email}`)
  console.log(`   - Test User: ${testUser.email}`)
  console.log(`   - Admin Household: ${adminHousehold.name}`)
  console.log(`   - Test Household: ${testHousehold.name}`)
  console.log(`   - Rooms: Kitchen, Living Room`)
  console.log(`   - Cabinets: Right Cabinet, Middle Cabinet`)
  console.log(`   - Categories: Personal Care > Wet Wipes, Food & Beverages > Cookies`)
  console.log(`   - Items: Taiwan Wet Wipes (4710901898748), Mini Oreo Cookies (7622300761349)`)
  console.log('\n🔐 Login Credentials:')
  console.log('   Admin: admin@smartwarehouse.com / admin123')
  console.log('   User: user@smartwarehouse.com / user123')
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
