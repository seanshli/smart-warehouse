#!/usr/bin/env node

/**
 * Script to create the first admin user
 * Usage: node scripts/create-admin-user.js <email> <password> [name]
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createAdminUser() {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.error('Usage: node scripts/create-admin-user.js <email> <password> [name]')
    process.exit(1)
  }

  const [email, password, name] = args

  try {
    console.log('Creating admin user...')
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      // Update existing user to admin
      const updatedUser = await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: { isAdmin: true }
      })

      console.log('✅ Existing user updated to admin:')
      console.log(`   Email: ${updatedUser.email}`)
      console.log(`   Name: ${updatedUser.name || 'Not set'}`)
      console.log(`   Admin: ${updatedUser.isAdmin}`)
      console.log(`   ID: ${updatedUser.id}`)
    } else {
      // Create new admin user
      const newUser = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: name || null,
          isAdmin: true,
        }
      })

      console.log('✅ New admin user created:')
      console.log(`   Email: ${newUser.email}`)
      console.log(`   Name: ${newUser.name || 'Not set'}`)
      console.log(`   Admin: ${newUser.isAdmin}`)
      console.log(`   ID: ${newUser.id}`)
    }

    console.log('\n🔐 Admin credentials:')
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
    console.log('\n📝 Note: Make sure to add these credentials to your environment variables')
    console.log('   for the credential verification system to work properly.')

  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
