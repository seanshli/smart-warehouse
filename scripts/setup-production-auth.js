const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupProductionAuth() {
  try {
    console.log('🔐 Setting up production authentication...');
    
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { isAdmin: true }
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return;
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@smartwarehouse.com',
        name: 'System Administrator',
        password: hashedPassword,
        isAdmin: true,
        emailVerified: new Date(),
        household: {
          create: {
            name: 'Admin Household',
            description: 'System administration household'
          }
        }
      },
      include: {
        household: true
      }
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@smartwarehouse.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change the password after first login!');
    
    // Create a regular user for testing
    const testUserPassword = await bcrypt.hash('user123', 12);
    
    const testUser = await prisma.user.create({
      data: {
        email: 'user@smartwarehouse.com',
        name: 'Test User',
        password: testUserPassword,
        isAdmin: false,
        emailVerified: new Date(),
        household: {
          create: {
            name: 'Test Household',
            description: 'Test household for regular users'
          }
        }
      },
      include: {
        household: true
      }
    });
    
    console.log('✅ Test user created successfully!');
    console.log('📧 Email: user@smartwarehouse.com');
    console.log('🔑 Password: user123');
    
    console.log('\n🎉 Production authentication setup completed!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@smartwarehouse.com / admin123');
    console.log('User: user@smartwarehouse.com / user123');
    console.log('\n⚠️  IMPORTANT: Change these passwords after first login!');
    
  } catch (error) {
    console.error('❌ Error setting up production auth:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupProductionAuth();
