const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createSeanshliMacUser() {
  try {
    console.log('Creating seanshli@mac.com admin user...')
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'seanshli@mac.com' }
    })
    
    if (existingUser) {
      console.log('User already exists, updating to admin...')
      
      // Update user to admin
      const updatedUser = await prisma.user.update({
        where: { email: 'seanshli@mac.com' },
        data: {
          isAdmin: true,
          adminRole: 'SUPERUSER'
        }
      })
      
      console.log('Successfully updated seanshli@mac.com to admin:', updatedUser)
      return
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('Smtengo1324!', 12)
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: 'seanshli@mac.com',
        name: 'Sean Li (Mac)',
        isAdmin: true,
        adminRole: 'SUPERUSER',
        language: 'en'
      }
    })
    
    // Create user credentials
    await prisma.userCredentials.create({
      data: {
        userId: user.id,
        password: hashedPassword
      }
    })
    
    console.log('Successfully created seanshli@mac.com admin user:', user)
    
  } catch (error) {
    console.error('Error creating user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSeanshliMacUser()
