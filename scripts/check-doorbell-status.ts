import { prisma } from '../lib/prisma'

async function checkDoorbellStatus() {
  try {
    console.log('🔍 Checking doorbell status...\n')

    // Find Twin-Oak S1 building
    const building = await prisma.building.findFirst({
      where: {
        name: {
          contains: 'Twin-Oak',
          mode: 'insensitive',
        },
      },
      include: {
        doorBells: {
          include: {
            household: {
              include: {
                members: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!building) {
      console.log('❌ Building "Twin-Oak" not found')
      return
    }

    console.log(`✅ Found building: ${building.name} (ID: ${building.id})\n`)

    // Check doorbell 3A specifically
    const doorbell3A = building.doorBells.find(db => db.doorBellNumber === '3A')

    if (!doorbell3A) {
      console.log('❌ Doorbell "3A" not found in this building')
      console.log(`\nAvailable doorbells: ${building.doorBells.map(db => db.doorBellNumber).join(', ')}`)
      return
    }

    console.log(`📞 Doorbell 3A Status:`)
    console.log(`   ID: ${doorbell3A.id}`)
    console.log(`   Enabled: ${doorbell3A.isEnabled ? '✅ Yes' : '❌ No'}`)
    console.log(`   Last Rung: ${doorbell3A.lastRungAt || 'Never'}`)
    console.log(`   Household: ${doorbell3A.household ? '✅ Linked' : '❌ Not linked'}`)

    if (doorbell3A.household) {
      console.log(`\n🏠 Household Details:`)
      console.log(`   ID: ${doorbell3A.household.id}`)
      console.log(`   Name: ${doorbell3A.household.name || 'N/A'}`)
      console.log(`   Apartment: ${doorbell3A.household.apartmentNo || 'N/A'}`)
      console.log(`   Members: ${doorbell3A.household.members.length}`)

      if (doorbell3A.household.members.length === 0) {
        console.log(`\n⚠️  WARNING: Household has no members!`)
        console.log(`   This will cause doorbell ring to fail.`)
      } else {
        console.log(`\n👥 Household Members:`)
        doorbell3A.household.members.forEach((member, index) => {
          console.log(`   ${index + 1}. ${member.user.name || member.user.email} (${member.role})`)
        })
      }
    } else {
      console.log(`\n⚠️  WARNING: Doorbell is not linked to a household!`)
      console.log(`   This will cause doorbell ring to fail.`)
    }

    // Check for active call sessions
    const activeSessions = await prisma.doorBellCallSession.findMany({
      where: {
        doorBellId: doorbell3A.id,
        status: {
          in: ['ringing', 'connected'],
        },
      },
    })

    if (activeSessions.length > 0) {
      console.log(`\n📞 Active Call Sessions: ${activeSessions.length}`)
      activeSessions.forEach(session => {
        console.log(`   - ${session.status} (Started: ${session.startedAt})`)
      })
    }

    console.log(`\n✅ Diagnostic complete!`)

  } catch (error) {
    console.error('❌ Error checking doorbell status:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDoorbellStatus()

