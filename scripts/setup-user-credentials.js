#!/usr/bin/env node

/**
 * Setup User Credentials Script
 * This script populates the database with user credentials for existing users
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// Pre-defined user credentials
const userCredentials = [
  { email: 'demo@smartwarehouse.com', password: 'demo123' },
  { email: 'alice@smartwarehouse.com', password: 'alice123' },
  { email: 'bob@smartwarehouse.com', password: 'bob123' },
  { email: 'carol@smartwarehouse.com', password: 'carol123' },
  { email: 'test@example.com', password: 'test123' },
  { email: 'seanshlitw@gmail.com', password: 'smtengo888' },
  { email: 'admin@smartwarehouse.com', password: 'admin123' }
]

async function setupUserCredentials() {
  try {
    console.log('🔐 Setting up user credentials...')
    
    for (const { email, password } of userCredentials) {
      console.log(`\n👤 Processing ${email}...`)
      
      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      })

      if (!user) {
        console.log(`   ⚠️  User ${email} not found, creating...`)
        
        // Create user
        const newUser = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            name: email.split('@')[0],
            language: 'en',
            isAdmin: email === 'admin@smartwarehouse.com' || email === 'seanshlitw@gmail.com'
          }
        })
        
        console.log(`   ✅ Created user: ${newUser.email}`)
      } else {
        console.log(`   ✅ Found existing user: ${user.email}`)
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)
      
      // Create or update credentials
      await prisma.userCredentials.upsert({
        where: { userId: user.id },
        update: { password: hashedPassword },
        create: {
          userId: user.id,
          password: hashedPassword
        }
      })
      
      console.log(`   🔑 Credentials set for ${email}`)
    }

    console.log('\n✅ User credentials setup completed successfully!')
    console.log('\n📋 Available Login Credentials:')
    userCredentials.forEach(({ email, password }) => {
      console.log(`   • ${email} / ${password}`)
    })

  } catch (error) {
    console.error('❌ Error setting up user credentials:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

setupUserCredentials()
