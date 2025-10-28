#!/usr/bin/env node

/**
 * Create Smtengo Users Script
 * This script creates van.lee@smtengo.com and max.lin@smtengo.com users
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// Smtengo user credentials
const smtengoUsers = [
  { 
    email: 'van.lee@smtengo.com', 
    name: 'Van Lee',
    password: 'Smtengo1324!',
    isAdmin: true 
  },
  { 
    email: 'max.lin@smtengo.com', 
    name: 'Max Lin',
    password: 'Smtengo1324!',
    isAdmin: true 
  }
]

async function createSmtengoUsers() {
  try {
    console.log('🔐 Creating Smtengo users...\n')
    
    for (const userData of smtengoUsers) {
      console.log(`👤 Processing ${userData.email}...`)
      
      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { email: userData.email },
        include: { credentials: true }
      })
      
      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: userData.email,
            name: userData.name,
            isAdmin: userData.isAdmin,
            language: 'en',
            emailVerified: new Date()
          }
        })
        console.log(`  ✅ User created: ${user.id}`)
      } else {
        console.log(`  ℹ️  User already exists: ${user.id}`)
        
        // Update admin status if needed
        if (user.isAdmin !== userData.isAdmin) {
          await prisma.user.update({
            where: { id: user.id },
            data: { isAdmin: userData.isAdmin }
          })
          console.log(`  ✅ Updated admin status to: ${userData.isAdmin}`)
        }
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12)
      
      // Create or update credentials
      if (user.credentials) {
        await prisma.userCredentials.update({
          where: { userId: user.id },
          data: { password: hashedPassword }
        })
        console.log(`  ✅ Credentials updated`)
      } else {
        await prisma.userCredentials.create({
          data: {
            userId: user.id,
            password: hashedPassword
          }
        })
        console.log(`  ✅ Credentials created`)
      }
      
      // Create default household if user doesn't have one
      const householdMember = await prisma.householdMember.findFirst({
        where: { userId: user.id }
      })
      
      if (!householdMember) {
        const household = await prisma.household.create({
          data: {
            name: `${userData.name}'s Household`,
            description: 'Default household',
            members: {
              create: {
                userId: user.id,
                role: 'OWNER'
              }
            }
          }
        })
        console.log(`  ✅ Created household: ${household.id}`)
      }
      
      console.log(`  📧 Email: ${userData.email}`)
      console.log(`  🔑 Password: ${userData.password}`)
      console.log(`  👑 Admin: ${userData.isAdmin}`)
      console.log()
    }
    
    console.log('🎉 Smtengo users setup completed!\n')
    console.log('📋 Summary:')
    console.log('  - van.lee@smtengo.com (Admin)')
    console.log('  - max.lin@smtengo.com (Admin)')
    console.log('  - Password for both: Smtengo1324!')
    
  } catch (error) {
    console.error('❌ Error creating Smtengo users:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
createSmtengoUsers()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })

