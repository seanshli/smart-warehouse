#!/usr/bin/env node

/**
 * Fix User Credentials Script
 * Creates or updates user credentials for specific users
 */

const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8')
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      let value = match[2].trim()
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      process.env[key] = value
    }
  })
}

const prisma = new PrismaClient()

// Users to fix
const usersToFix = [
  { email: 'sean.li@smtengo.com', password: 'Smtengo1324!' },
  { email: 'demo@smartwarehouse.com', password: 'demo123' }
]

async function fixUserCredentials() {
  console.log('🔐 Fixing user credentials...\n')

  for (const userData of usersToFix) {
    try {
      // Check if user exists
      let user = await prisma.user.findUnique({
        where: { email: userData.email.toLowerCase() }
      })

      if (!user) {
        // Create user if doesn't exist
        console.log(`📝 Creating user: ${userData.email}`)
        user = await prisma.user.create({
          data: {
            email: userData.email.toLowerCase(),
            name: userData.email.split('@')[0],
            isAdmin: userData.email === 'sean.li@smtengo.com'
          }
        })
        console.log(`✅ User created: ${user.email} (ID: ${user.id})`)
      } else {
        console.log(`✅ User exists: ${user.email} (ID: ${user.id})`)
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12)
      console.log(`🔑 Password hashed for: ${userData.email}`)

      // Create or update credentials
      await prisma.userCredentials.upsert({
        where: { userId: user.id },
        update: { password: hashedPassword },
        create: {
          userId: user.id,
          password: hashedPassword
        }
      })

      console.log(`✅ Credentials set for: ${userData.email}`)

      // Ensure user has a household
      const existingMembership = await prisma.householdMember.findFirst({
        where: { userId: user.id }
      })

      if (!existingMembership) {
        // Create household for user
        const household = await prisma.household.create({
          data: {
            name: `${user.name || user.email.split('@')[0]}'s Household`,
            description: `Personal household for ${user.email}`,
            members: {
              create: {
                userId: user.id,
                role: 'OWNER'
              }
            }
          }
        })
        console.log(`✅ Household created for: ${userData.email}`)
      } else {
        console.log(`✅ Household membership exists for: ${userData.email}`)
      }

      console.log('')
    } catch (error) {
      console.error(`❌ Error fixing credentials for ${userData.email}:`, error.message)
      console.log('')
    }
  }

  console.log('✅ Credentials fix completed!')
  console.log('\n📋 Test login with:')
  console.log('  1. sean.li@smtengo.com / Smtengo1324!')
  console.log('  2. demo@smartwarehouse.com / demo123')
}

fixUserCredentials()
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

