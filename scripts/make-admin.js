const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function makeAdmin() {
  try {
    console.log('Making seanshli@mac.com an admin...')
    
    // Update the user to be an admin
    const user = await prisma.user.update({
      where: { email: 'seanshli@mac.com' },
      data: { isAdmin: true }
    })
    
    console.log('Successfully made seanshli@mac.com an admin:', user)
    
  } catch (error) {
    console.error('Error making user admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

makeAdmin()
