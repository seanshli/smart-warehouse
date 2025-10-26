import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSeanLiCredentials() {
  try {
    console.log('Checking credentials for sean.li@smtengo.com...')
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: 'sean.li@smtengo.com' },
      include: { credentials: true }
    })

    if (!user) {
      console.log('❌ User sean.li@smtengo.com does NOT exist in database')
      console.log('\n📝 Creating user...')
      
      // Create user
      const newUser = await prisma.user.create({
        data: {
          email: 'sean.li@smtengo.com',
          name: 'Sean Li',
          isAdmin: true,
          language: 'en'
        }
      })
      console.log('✅ Created user:', newUser.id)
      
      // Hash password and create credentials
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash('Smtengo1324!', 12)
      
      await prisma.userCredentials.create({
        data: {
          userId: newUser.id,
          password: hashedPassword
        }
      })
      console.log('✅ Created credentials')
      
      return
    }

    console.log('✅ User found:')
    console.log('  - ID:', user.id)
    console.log('  - Email:', user.email)
    console.log('  - Name:', user.name)
    console.log('  - Is Admin:', user.isAdmin)
    console.log('  - Has Credentials:', !!user.credentials)

    if (!user.credentials) {
      console.log('\n❌ User has NO credentials stored!')
      console.log('\n📝 Creating credentials...')
      
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash('Smtengo1324!', 12)
      
      await prisma.userCredentials.create({
        data: {
          userId: user.id,
          password: hashedPassword
        }
      })
      console.log('✅ Created credentials')
    } else {
      console.log('\n✅ User has credentials stored!')
      console.log('  - Credentials User ID:', user.credentials.userId)
      console.log('  - Credentials match User ID:', user.credentials.userId === user.id)
      
      // Test password
      const bcrypt = require('bcryptjs')
      const isValid = await bcrypt.compare('Smtengo1324!', user.credentials.password)
      console.log('  - Password verification:', isValid ? '✅ Valid' : '❌ Invalid')
      
      if (!isValid) {
        console.log('\n📝 Updating password...')
        const newHash = await bcrypt.hash('Smtengo1324!', 12)
        await prisma.userCredentials.update({
          where: { userId: user.id },
          data: { password: newHash }
        })
        console.log('✅ Password updated')
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSeanLiCredentials()
