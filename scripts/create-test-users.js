const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUsers() {
  console.log('👥 Creating multiple test users...');

  try {
    // Test users to create
    const testUsers = [
      {
        email: 'alice@smartwarehouse.com',
        name: 'Alice Johnson',
        password: 'alice123'
      },
      {
        email: 'bob@smartwarehouse.com',
        name: 'Bob Smith',
        password: 'bob123'
      },
      {
        email: 'carol@smartwarehouse.com',
        name: 'Carol Davis',
        password: 'carol123'
      }
    ];

    const createdUsers = [];

    for (const userData of testUsers) {
      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
        }
      });

      console.log(`✅ Created user: ${user.name} (${user.email})`);
      createdUsers.push({ ...user, password: userData.password });

      // Create personal household for each user
      const household = await prisma.household.create({
        data: {
          name: `${userData.name}'s Household`,
          description: `${userData.name}'s personal inventory`,
          members: {
            create: {
              userId: user.id,
              role: 'OWNER'
            }
          }
        }
      });

      console.log(`✅ Created household: ${household.name}`);

      // Create default rooms for each household
      const rooms = [
        { name: 'Kitchen', description: 'Kitchen area' },
        { name: 'Living Room', description: 'Main living area' },
        { name: 'Bedroom', description: 'Bedroom' }
      ];

      for (const roomData of rooms) {
        await prisma.room.create({
          data: {
            ...roomData,
            householdId: household.id
          }
        });
      }

      // Create default categories
      const categories = [
        { name: 'Electronics', description: 'Electronic devices', level: 1 },
        { name: 'Kitchen', description: 'Kitchen items', level: 1 },
        { name: 'Tools', description: 'Tools and equipment', level: 1 }
      ];

      for (const categoryData of categories) {
        await prisma.category.create({
          data: {
            ...categoryData,
            householdId: household.id
          }
        });
      }

      console.log(`✅ Created default rooms and categories for ${userData.name}`);
    }

    // Create a shared household for Alice and Bob
    const sharedHousehold = await prisma.household.create({
      data: {
        name: 'Shared Family Household',
        description: 'Shared household for Alice and Bob',
        members: {
          createMany: {
            data: [
              { userId: createdUsers[0].id, role: 'OWNER' }, // Alice
              { userId: createdUsers[1].id, role: 'USER' }   // Bob
            ]
          }
        }
      }
    });

    console.log(`✅ Created shared household: ${sharedHousehold.name}`);

    // Create shared rooms and categories
    const sharedRooms = [
      { name: 'Garage', description: 'Shared garage space' },
      { name: 'Storage Room', description: 'Shared storage area' }
    ];

    for (const roomData of sharedRooms) {
      await prisma.room.create({
        data: {
          ...roomData,
          householdId: sharedHousehold.id
        }
      });
    }

    const sharedCategories = [
      { name: 'Shared Items', description: 'Items shared between family members', level: 1 },
      { name: 'Household Tools', description: 'Tools for the whole household', level: 1 }
    ];

    for (const categoryData of sharedCategories) {
      await prisma.category.create({
        data: {
          ...categoryData,
          householdId: sharedHousehold.id
        }
      });
    }

    console.log('\n🎉 Multi-user setup complete!');
    console.log('\n📋 Test User Credentials:');
    createdUsers.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log(`Name: ${user.name}`);
      console.log('---');
    });

    console.log('\n🏠 Households Created:');
    console.log('- Alice\'s Household (Alice as OWNER)');
    console.log('- Bob\'s Household (Bob as OWNER)');
    console.log('- Carol\'s Household (Carol as OWNER)');
    console.log('- Shared Family Household (Alice as OWNER, Bob as USER)');

    console.log('\n💡 Testing Scenarios:');
    console.log('1. Test individual households - each user sees only their items');
    console.log('2. Test shared household - Alice can manage, Bob can use');
    console.log('3. Test role permissions - different capabilities per role');
    console.log('4. Test member management - invite/remove members');

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('ℹ️  Some test users already exist');
    } else {
      console.error('❌ Error creating test users:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
