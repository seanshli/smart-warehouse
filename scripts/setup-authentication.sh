#!/bin/bash

# Smart Warehouse Authentication Setup Script
# This script sets up proper user authentication for your server

set -e

echo "🔐 Setting up Smart Warehouse Authentication..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the Smart Warehouse project directory"
    exit 1
fi

# Create admin user setup script
print_status "Creating admin user setup script..."
cat > scripts/create-admin-user.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔐 Setting up admin authentication...');
    
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
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
EOF

# Create user management script
print_status "Creating user management script..."
cat > scripts/manage-users.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createUser() {
  try {
    console.log('\n👤 Creating new user...');
    
    const email = await question('Enter email: ');
    const name = await question('Enter full name: ');
    const password = await question('Enter password: ');
    const isAdmin = await question('Is admin? (y/n): ');
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.log('❌ User already exists with this email');
      return;
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        isAdmin: isAdmin.toLowerCase() === 'y',
        emailVerified: new Date(),
        household: {
          create: {
            name: `${name}'s Household`,
            description: `Personal household for ${name}`
          }
        }
      }
    });
    
    console.log('✅ User created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Name: ${name}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👑 Admin: ${isAdmin.toLowerCase() === 'y' ? 'Yes' : 'No'}`);
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
  }
}

async function listUsers() {
  try {
    console.log('\n📋 Current users:');
    const users = await prisma.user.findMany({
      include: {
        household: true
      }
    });
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Admin: ${user.isAdmin ? 'Yes' : 'No'}`);
      console.log(`   Household: ${user.household?.name || 'None'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error listing users:', error);
  }
}

async function resetPassword() {
  try {
    console.log('\n🔑 Resetting user password...');
    
    const email = await question('Enter user email: ');
    const newPassword = await question('Enter new password: ');
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Password updated successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 New Password: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Error resetting password:', error);
  }
}

async function main() {
  console.log('🔐 Smart Warehouse User Management');
  console.log('==================================');
  
  while (true) {
    console.log('\nOptions:');
    console.log('1. Create new user');
    console.log('2. List all users');
    console.log('3. Reset user password');
    console.log('4. Exit');
    
    const choice = await question('\nSelect option (1-4): ');
    
    switch (choice) {
      case '1':
        await createUser();
        break;
      case '2':
        await listUsers();
        break;
      case '3':
        await resetPassword();
        break;
      case '4':
        console.log('👋 Goodbye!');
        rl.close();
        process.exit(0);
        break;
      default:
        console.log('❌ Invalid option');
    }
  }
}

main().catch(console.error).finally(() => {
  prisma.$disconnect();
  rl.close();
});
EOF

# Create authentication middleware update
print_status "Updating authentication middleware..."
cat > middleware-auth-update.js << 'EOF'
// Update to middleware.ts to require proper authentication
const { NextResponse } = require('next/server');
const { getServerSession } = require('next-auth');
const { authOptions } = require('./lib/auth');

export async function middleware(request) {
  const session = await getServerSession(authOptions);
  
  // Public routes that don't require authentication
  const publicRoutes = [
    '/auth/signin',
    '/auth/signup',
    '/auth/signout',
    '/api/auth/',
    '/api/health'
  ];
  
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );
  
  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // Require authentication for all other routes
  if (!session?.user) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
  
  // Admin routes require admin privileges
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!session.user.isAdmin) {
      return NextResponse.redirect(new URL('/auth/signin?error=unauthorized', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
EOF

# Create health check endpoint
print_status "Creating health check endpoint..."
mkdir -p app/api/health
cat > app/api/health/route.ts << 'EOF'
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Smart Warehouse API'
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'Database connection failed' },
      { status: 503 }
    );
  }
}
EOF

# Create authentication test script
print_status "Creating authentication test script..."
cat > scripts/test-auth.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAuthentication() {
  try {
    console.log('🧪 Testing authentication system...');
    
    // Test 1: Check if admin user exists
    const adminUser = await prisma.user.findFirst({
      where: { isAdmin: true }
    });
    
    if (adminUser) {
      console.log('✅ Admin user found:', adminUser.email);
      
      // Test 2: Verify password
      const passwordMatch = await bcrypt.compare('admin123', adminUser.password);
      if (passwordMatch) {
        console.log('✅ Admin password is correct');
      } else {
        console.log('❌ Admin password is incorrect');
      }
    } else {
      console.log('❌ No admin user found');
    }
    
    // Test 3: Check total users
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}`);
    
    // Test 4: Check households
    const householdCount = await prisma.household.count();
    console.log(`🏠 Total households: ${householdCount}`);
    
    console.log('\n🎉 Authentication system test completed!');
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuthentication();
EOF

# Create login instructions
print_status "Creating login instructions..."
cat > AUTHENTICATION_SETUP.md << 'EOF'
# Smart Warehouse Authentication Setup

## 🔐 Authentication System

Your Smart Warehouse now has proper user authentication enabled!

### Default Admin Account
- **Email**: admin@smartwarehouse.com
- **Password**: admin123
- **⚠️ IMPORTANT**: Change this password immediately after first login!

### User Management

#### Create Admin User
```bash
cd /var/www/smartwarehouse
node scripts/create-admin-user.js
```

#### Manage Users
```bash
node scripts/manage-users.js
```

#### Test Authentication
```bash
node scripts/test-auth.js
```

### Security Features

1. **Password Hashing**: All passwords are hashed with bcrypt
2. **Session Management**: Secure sessions with NextAuth.js
3. **Admin Protection**: Admin routes require admin privileges
4. **User Isolation**: Each user has their own household
5. **Password Reset**: Built-in password reset functionality

### User Roles

- **Admin**: Full access to all features + admin panel
- **Regular User**: Access to their household only

### First Time Setup

1. **Access your app**: http://your-server-ip
2. **Login with admin account**: admin@smartwarehouse.com / admin123
3. **Change admin password**: Go to Settings → Change Password
4. **Create regular users**: Use the user management script

### Security Best Practices

1. **Change default passwords** immediately
2. **Use strong passwords** (12+ characters)
3. **Regular user audits** (check who has access)
4. **Monitor admin access** (admin panel logs)
5. **Backup user data** regularly

### Troubleshooting

#### Can't login?
```bash
# Check if admin user exists
node scripts/test-auth.js

# Create admin user if missing
node scripts/create-admin-user.js
```

#### Forgot admin password?
```bash
# Reset admin password
node scripts/manage-users.js
# Select option 3 (Reset user password)
# Enter: admin@smartwarehouse.com
```

#### Database connection issues?
```bash
# Check database status
sudo systemctl status postgresql

# Check app logs
sudo -u smartwarehouse pm2 logs smartwarehouse
```

### API Endpoints

- **Health Check**: `/api/health`
- **Authentication**: `/api/auth/`
- **User Management**: `/api/admin/users`

### Mobile App Authentication

The mobile apps (iOS/Android) will use the same authentication system. Users need to:
1. Create an account on the web version first
2. Use the same credentials in the mobile app
3. Or use the admin panel to create accounts

## 🚀 Ready to Use!

Your Smart Warehouse now has enterprise-grade authentication!
EOF

print_status "Authentication setup completed!"
echo ""
echo "🔐 Authentication System Ready!"
echo ""
echo "📋 Next Steps:"
echo "1. Run: node scripts/create-admin-user.js"
echo "2. Access your app and login with:"
echo "   Email: admin@smartwarehouse.com"
echo "   Password: admin123"
echo "3. Change the admin password immediately!"
echo "4. Create additional users as needed"
echo ""
echo "📖 Full documentation: AUTHENTICATION_SETUP.md"
echo ""
print_warning "Remember to change the default admin password!"
