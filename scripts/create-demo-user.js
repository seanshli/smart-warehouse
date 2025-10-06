const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createDemoUser() {
  console.log('👤 Creating demo user...');

  try {
    // Create demo user
    const user = await prisma.user.create({
      data: {
        email: 'demo@smartwarehouse.com',
        name: 'Demo User',
      }
    });

    console.log('✅ Demo user created:', user.email);

    // Create demo household
    const household = await prisma.household.create({
      data: {
        name: 'Demo Household',
        description: 'A sample household for demonstration',
        members: {
          create: {
            userId: user.id,
            role: 'OWNER'
          }
        }
      }
    });

    console.log('✅ Demo household created:', household.name);

    // Create demo rooms
    const rooms = [
      { name: 'Kitchen', description: 'Main kitchen area' },
      { name: 'Living Room', description: 'Main living area' },
      { name: 'Bedroom', description: 'Master bedroom' },
      { name: 'Garage', description: 'Garage and storage' }
    ];

    for (const roomData of rooms) {
      const room = await prisma.room.create({
        data: {
          ...roomData,
          householdId: household.id
        }
      });
      console.log('✅ Created room:', room.name);
    }

    // Create demo categories
    const categories = [
      { name: 'Electronics', description: 'Electronic devices and accessories', level: 1 },
      { name: 'Kitchen', description: 'Kitchen utensils and appliances', level: 1 },
      { name: 'Tools', description: 'Hand tools and equipment', level: 1 },
      { name: 'Clothing', description: 'Clothing and accessories', level: 1 }
    ];

    for (const categoryData of categories) {
      const category = await prisma.category.create({
        data: {
          ...categoryData,
          householdId: household.id
        }
      });
      console.log('✅ Created category:', category.name);
    }

    console.log('\n🎉 Demo setup complete!');
    console.log('\n📋 Demo credentials:');
    console.log('Email: demo@smartwarehouse.com');
    console.log('Password: demo123');
    console.log('\n💡 You can now sign in with these credentials or create a new account.');

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('ℹ️  Demo user already exists');
    } else {
      console.error('❌ Error creating demo user:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUser();

