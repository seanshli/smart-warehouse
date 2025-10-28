import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Pre-defined user credentials
const userCredentials = [
  { email: 'demo@smartwarehouse.com', password: 'demo123' },
  { email: 'alice@smartwarehouse.com', password: 'alice123' },
  { email: 'bob@smartwarehouse.com', password: 'bob123' },
  { email: 'carol@smartwarehouse.com', password: 'carol123' },
  { email: 'test@example.com', password: 'test123' },
  { email: 'seanshlitw@gmail.com', password: 'smtengo888' },
  { email: 'admin@smartwarehouse.com', password: 'admin123' },
  { email: 'van.lee@smtengo.com', password: 'Smtengo1324!' },
  { email: 'max.lin@smtengo.com', password: 'Smtengo1324!' }
]

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Setting up user credentials...')
    
    const results = []
    
    for (const { email, password } of userCredentials) {
      console.log(`\n👤 Processing ${email}...`)
      
      // Find or create user
      let user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      })

      if (!user) {
        console.log(`   ⚠️  User ${email} not found, creating...`)
        
        // Create user
        user = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            name: email.split('@')[0],
            language: 'en',
            isAdmin: email === 'admin@smartwarehouse.com' || email === 'seanshlitw@gmail.com'
          }
        })
        
        console.log(`   ✅ Created user: ${user.email}`)
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
      
      results.push({
        email,
        status: 'success',
        isAdmin: user.isAdmin
      })
    }

    console.log('\n✅ User credentials setup completed successfully!')

    return NextResponse.json({
      success: true,
      message: 'User credentials setup completed successfully!',
      results,
      credentials: userCredentials.map(({ email, password }) => ({
        email,
        password
      }))
    })

  } catch (error) {
    console.error('❌ Error setting up user credentials:', error)
    return NextResponse.json(
      { 
        error: 'Failed to setup user credentials', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
