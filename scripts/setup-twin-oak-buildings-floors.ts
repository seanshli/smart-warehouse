import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function setupTwinOakBuildingsFloors() {
  try {
    console.log('🚀 Starting Twin-Oak buildings floors and units setup...\n')

    // Find Twin-Oak community
    const community = await prisma.community.findFirst({
      where: {
        name: {
          contains: 'Twin-Oak',
        },
      },
      include: {
        buildings: true,
      },
    })

    if (!community) {
      console.error('❌ Twin-Oak community not found')
      process.exit(1)
    }

    console.log(`✅ Found community: ${community.name}`)
    console.log(`   Buildings: ${community.buildings.length}\n`)

    // Setup each building
    for (const building of community.buildings) {
      console.log(`🏢 Setting up floors and units for: ${building.name} (${building.id})`)
      
      // Floor 1: Front Door (no households)
      const floor1 = await prisma.floor.upsert({
        where: {
          buildingId_floorNumber: {
            buildingId: building.id,
            floorNumber: 1,
          },
        },
        update: {
          name: 'Front Door / 大門',
          description: 'Front door area with doorbell, mailboxes, and package lockers',
        },
        create: {
          buildingId: building.id,
          floorNumber: 1,
          name: 'Front Door / 大門',
          description: 'Front door area with doorbell, mailboxes, and package lockers',
        },
      })
      console.log(`   ✅ Created/Updated floor 1: ${floor1.name}`)

      // Floor 2: Facilities (no households)
      const floor2 = await prisma.floor.upsert({
        where: {
          buildingId_floorNumber: {
            buildingId: building.id,
            floorNumber: 2,
          },
        },
        update: {
          name: 'Facilities / 設施',
          description: 'Building facilities: gym, meeting rooms',
        },
        create: {
          buildingId: building.id,
          floorNumber: 2,
          name: 'Facilities / 設施',
          description: 'Building facilities: gym, meeting rooms',
        },
      })
      console.log(`   ✅ Created/Updated floor 2: ${floor2.name}`)

      // Floors 3-10: Residential units (4 units per floor: A, B, C, D)
      for (let floorNum = 3; floorNum <= 10; floorNum++) {
        const floor = await prisma.floor.upsert({
          where: {
            buildingId_floorNumber: {
              buildingId: building.id,
              floorNumber: floorNum,
            },
          },
          update: {
            name: `Floor ${floorNum}`,
            description: `Residential floor ${floorNum}`,
          },
          create: {
            buildingId: building.id,
            floorNumber: floorNum,
            name: `Floor ${floorNum}`,
            description: `Residential floor ${floorNum}`,
          },
        })

        // Create 4 units per floor (A, B, C, D)
        const units = ['A', 'B', 'C', 'D']
        for (const unit of units) {
          const unitName = `${floorNum}${unit}`
          
          // Create household
          const household = await prisma.household.upsert({
            where: {
              id: `${building.id}-${unitName}`,
            },
            update: {
              name: unitName,
              description: `Household ${unitName} in ${building.name}`,
            },
            create: {
              id: `${building.id}-${unitName}`,
              name: unitName,
              description: `Household ${unitName} in ${building.name}`,
              buildingId: building.id,
              floorId: floor.id,
            },
          })

          // Create mailbox on Floor 1
          await prisma.mailbox.upsert({
            where: {
              buildingId_mailboxNumber: {
                buildingId: building.id,
                mailboxNumber: unitName,
              },
            },
            update: {
              householdId: household.id,
              floorId: floor1.id,
            },
            create: {
              buildingId: building.id,
              mailboxNumber: unitName,
              householdId: household.id,
              floorId: floor1.id,
            },
          })

          // Create doorbell on Floor 1
          await prisma.doorBell.upsert({
            where: {
              buildingId_doorBellNumber: {
                buildingId: building.id,
                doorBellNumber: unitName,
              },
            },
            update: {
              householdId: household.id,
              isEnabled: true,
            },
            create: {
              buildingId: building.id,
              doorBellNumber: unitName,
              householdId: household.id,
              isEnabled: true,
            },
          })
        }
      }

      // Create package lockers on Floor 1
      for (let i = 1; i <= 10; i++) {
        await prisma.packageLocker.upsert({
          where: {
            buildingId_lockerNumber: {
              buildingId: building.id,
              lockerNumber: i,
            },
          },
          update: {
            location: 'Front Door - Package Room',
          },
          create: {
            buildingId: building.id,
            lockerNumber: i,
            location: 'Front Door - Package Room',
            isOccupied: false,
          },
        })
      }
      console.log(`   ✅ Created/Updated 10 package lockers`)

      // Create facilities on Floor 2
      const facilities = [
        { name: 'Gym', nameZh: '健身房' },
        { name: 'Meeting Room #1', nameZh: '會議室 #1' },
        { name: 'Meeting Room #2', nameZh: '會議室 #2' },
      ]

      for (const facility of facilities) {
        const facilityRecord = await prisma.facility.upsert({
          where: {
            buildingId_name: {
              buildingId: building.id,
              name: facility.name,
            },
          },
          update: {
            floorId: floor2.id,
          },
          create: {
            buildingId: building.id,
            name: facility.name,
            description: `${facility.name} in ${building.name}`,
            floorId: floor2.id,
            isActive: true,
          },
        })

        // Create default operating hours (Monday-Friday, 6 AM - 10 PM)
        for (let day = 1; day <= 5; day++) {
          await prisma.facilityOperatingHours.upsert({
            where: {
              facilityId_dayOfWeek: {
                facilityId: facilityRecord.id,
                dayOfWeek: day,
              },
            },
            update: {
              openTime: '06:00',
              closeTime: '22:00',
            },
            create: {
              facilityId: facilityRecord.id,
              dayOfWeek: day,
              openTime: '06:00',
              closeTime: '22:00',
            },
          })
        }
        console.log(`   ✅ Created/Updated facility: ${facility.name}`)
      }

      // Count created items
      const householdCount = await prisma.household.count({
        where: { buildingId: building.id },
      })
      const mailboxCount = await prisma.mailbox.count({
        where: { buildingId: building.id },
      })
      const doorBellCount = await prisma.doorBell.count({
        where: { buildingId: building.id },
      })
      const packageLockerCount = await prisma.packageLocker.count({
        where: { buildingId: building.id },
      })
      const facilityCount = await prisma.facility.count({
        where: { buildingId: building.id },
      })

      console.log(`   ✅ Completed:`)
      console.log(`      - 10 floors`)
      console.log(`      - ${householdCount} households (Floors 3-10 only)`)
      console.log(`      - ${mailboxCount} mailboxes (Front Door)`)
      console.log(`      - ${doorBellCount} door bells (Front Door)`)
      console.log(`      - ${packageLockerCount} package lockers (Package Room)`)
      console.log(`      - ${facilityCount} facilities (Floor 2: Gym, Meeting Room #1, Meeting Room #2)`)
      console.log('')
    }

    console.log('='.repeat(60))
    console.log('📊 SETUP SUMMARY')
    console.log('='.repeat(60))
    console.log(`\n🏘️  Community: ${community.name}`)
    console.log(`   ID: ${community.id}`)
    console.log(`\n🏢 Buildings Setup:`)
    community.buildings.forEach((building, index) => {
      console.log(`\n   ${index + 1}. ${building.name}`)
      console.log(`      Building ID: ${building.id}`)
      console.log(`      ✅ Success`)
    })

    console.log('\n' + '='.repeat(60))
    console.log('✅ Setup completed successfully!')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ Setup failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run setup
setupTwinOakBuildingsFloors()
  .then(() => {
    console.log('\n🎉 All setup completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Error during setup:', error)
    process.exit(1)
  })

