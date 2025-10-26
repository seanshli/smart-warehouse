import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUserCredentials() {
  try {
    console.log('Checking user credentials in database...')
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: 'seanshlicn@gmail.com' },
      include: { credentials: true }
    })

    if (!user) {
      console.log('❌ User seanshlicn@gmail.com does NOT exist in database')
      console.log('\n📝 To create the user, run the SQL script: scripts/create-ios-user.sql')
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
      console.log('\n📝 To add credentials, run the SQL script: scripts/create-ios-user.sql')
    } else {
      console.log('\n✅ User has credentials stored!')
      console.log('  - Credentials User ID:', user.credentials.userId)
      console.log('  - Credentials match User ID:', user.credentials.userId === user.id)
    }

    // List all users for reference
    console.log('\n📋 All users in database:')
    const allUsers = await prisma.user.findMany({
      include: { credentials: true }
    })

    allUsers.forEach(u => {
      console.log(`  - ${u.email} (${u.name}) [Admin: ${u.isAdmin}] [Has Credentials: ${!!u.credentials}]`)
    })

  } catch (error) {
    console.error('❌ Error checking user credentials:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserCredentials()
