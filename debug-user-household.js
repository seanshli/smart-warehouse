const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugUserHousehold() {
  try {
    console.log('🔍 Debugging user household assignment...')
    
    // Find user by email
    const user = await prisma.user.findFirst({
      where: { email: 'seanli@mac.com' },
      include: {
        householdMemberships: {
          include: {
            household: true
          }
        }
      }
    })
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin
    })
    
    console.log('🏠 Household memberships:', user.householdMemberships.length)
    
    if (user.householdMemberships.length === 0) {
      console.log('❌ User has no household memberships!')
      
      // Check if there are any households
      const households = await prisma.household.findMany({
        include: {
          members: {
            include: {
              user: true
            }
          }
        }
      })
      
      console.log('📊 Total households in database:', households.length)
      
      if (households.length > 0) {
        console.log('🏠 Available households:')
        households.forEach((h, i) => {
          console.log(`  ${i + 1}. ${h.name} (${h.members.length} members)`)
          h.members.forEach(member => {
            console.log(`     - ${member.user.email} (${member.role})`)
          })
        })
      } else {
        console.log('❌ No households exist in database')
      }
      
      // Create a household for the user
      console.log('🔧 Creating household for user...')
      const newHousehold = await prisma.household.create({
        data: {
          name: 'Sean Household',
          description: 'Default household for Sean',
          members: {
            create: {
              userId: user.id,
              role: 'ADMIN'
            }
          }
        }
      })
      
      console.log('✅ Created household:', newHousehold)
      
    } else {
      console.log('✅ User has household memberships:')
      user.householdMemberships.forEach((membership, i) => {
        console.log(`  ${i + 1}. ${membership.household.name} (${membership.role})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugUserHousehold()
