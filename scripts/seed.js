const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with demo data...');

  // Create a demo household
  const household = await prisma.household.create({
    data: {
      name: 'Demo Household',
      description: 'A sample household for demonstration purposes',
    },
  });

  console.log('✅ Created demo household');

  // Create demo rooms
  const kitchen = await prisma.room.create({
    data: {
      name: 'Kitchen',
      description: 'Main kitchen area',
      householdId: household.id,
    },
  });

  const livingRoom = await prisma.room.create({
    data: {
      name: 'Living Room',
      description: 'Main living area',
      householdId: household.id,
    },
  });

  const garage = await prisma.room.create({
    data: {
      name: 'Garage',
      description: 'Storage and workshop area',
      householdId: household.id,
    },
  });

  console.log('✅ Created demo rooms');

  // Create demo cabinets
  const kitchenCabinet1 = await prisma.cabinet.create({
    data: {
      name: 'Top Shelf',
      description: 'Upper kitchen cabinet',
      roomId: kitchen.id,
    },
  });

  const kitchenCabinet2 = await prisma.cabinet.create({
    data: {
      name: 'Bottom Drawer',
      description: 'Lower kitchen drawer',
      roomId: kitchen.id,
    },
  });

  const garageCabinet = await prisma.cabinet.create({
    data: {
      name: 'Tool Cabinet',
      description: 'Main tool storage',
      roomId: garage.id,
    },
  });

  console.log('✅ Created demo cabinets');

  // Create demo categories
  const electronics = await prisma.category.create({
    data: {
      name: 'Electronics',
      description: 'Electronic devices and accessories',
      level: 1,
      householdId: household.id,
    },
  });

  const kitchenItems = await prisma.category.create({
    data: {
      name: 'Kitchen',
      description: 'Kitchen utensils and appliances',
      level: 1,
      householdId: household.id,
    },
  });

  const tools = await prisma.category.create({
    data: {
      name: 'Tools',
      description: 'Hand tools and equipment',
      level: 1,
      householdId: household.id,
    },
  });

  // Create subcategories
  const smartphones = await prisma.category.create({
    data: {
      name: 'Smartphones',
      description: 'Mobile phones and accessories',
      level: 2,
      parentId: electronics.id,
      householdId: household.id,
    },
  });

  const cooking = await prisma.category.create({
    data: {
      name: 'Cooking',
      description: 'Cooking utensils and tools',
      level: 2,
      parentId: kitchenItems.id,
      householdId: household.id,
    },
  });

  console.log('✅ Created demo categories');

  console.log('🎉 Demo data seeding completed!');
  console.log('\n📋 Created:');
  console.log('- 1 Household');
  console.log('- 3 Rooms (Kitchen, Living Room, Garage)');
  console.log('- 3 Cabinets');
  console.log('- 5 Categories (3 main + 2 subcategories)');
  console.log('\n💡 You can now add items to these locations!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


