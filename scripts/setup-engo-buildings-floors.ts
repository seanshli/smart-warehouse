/**
 * Setup Floors and Units for enGo Smart Home Buildings
 * 为智管家社区的所有建筑设置楼层和单元
 * 
 * Creates:
 * - 3 floors for each building
 * - 5 units per floor (A, B, C, D, E)
 * - Households and mailboxes for each unit
 */

import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function setupBuildingFloorsAndUnits(buildingId: string, buildingName: string) {
  try {
    console.log(`\n🏢 Setting up floors and units for: ${buildingName} (${buildingId})`)

    // Check if building exists
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      include: {
        floors: true,
        households: true,
      },
    })

    if (!building) {
      console.error(`❌ Building not found: ${buildingId}`)
      return { success: false, error: 'Building not found' }
    }

    // Create 3 floors (1, 2, 3)
    // Floor 1: Front door area (no residential units)
    // Floor 2: Facilities (Gym, Meeting Rooms) - no residential units
    // Floor 3: Residential units only
    const floors = []
    for (let floorNum = 1; floorNum <= 3; floorNum++) {
      const isResidential = floorNum === 3
      let floorName = `Floor ${floorNum}`
      let description = ''
      
      if (floorNum === 1) {
        floorName = 'Front Door / 大門'
        description = 'Front door area with door bells, mailboxes, and package room'
      } else if (floorNum === 2) {
        floorName = 'Facilities / 設施'
        description = 'Facilities floor with Gym, Meeting Room #1, and Meeting Room #2'
      } else {
        description = `Residential floor ${floorNum} with 5 units (A, B, C, D, E)`
      }
      
      const floor = await prisma.floor.upsert({
        where: {
          buildingId_floorNumber: {
            buildingId,
            floorNumber: floorNum,
          },
        },
        update: {
          name: floorName,
          isResidential,
          description,
        },
        create: {
          buildingId,
          floorNumber: floorNum,
          name: floorName,
          description,
          isResidential,
        },
      })

      floors.push(floor)
      console.log(`   ✅ Created/Updated floor ${floorNum}: ${floorName}`)
    }

    // Create households, mailboxes, door bells, and package lockers for Floor 3 only (5 units)
    const units = ['A', 'B', 'C', 'D', 'E']
    const createdHouseholds = []
    const createdMailboxes = []
    const createdDoorBells = []
    const createdPackageLockers = []

    // Only create residential units on Floor 3
    const floorNum = 3
    const floor = floors.find(f => f.floorNumber === floorNum)
    if (floor) {
      for (const unit of units) {
        const unitNumber = `${floorNum}${unit}` // e.g., "3A", "3B", "3C"
        
        // Check if household already exists for this floor/unit
        const existingHousehold = building.households.find(
          h => h.floorNumber === floorNum && h.unit === unit
        )

        let household
        if (existingHousehold) {
          // Update existing household
          household = await prisma.household.update({
            where: { id: existingHousehold.id },
            data: {
              floorId: floor.id,
              floorNumber: floorNum,
              unit,
              name: existingHousehold.name || `Unit ${unitNumber}`,
              apartmentNo: unitNumber,
            },
          })
        } else {
          // Create new household
          household = await prisma.household.create({
            data: {
              buildingId,
              floorId: floor.id,
              floorNumber: floorNum,
              unit,
              name: `Unit ${unitNumber}`,
              apartmentNo: unitNumber,
              description: `Residential unit ${unitNumber} on floor ${floorNum}`,
            },
          })
        }

        createdHouseholds.push(household)

        // Get Floor 1 for front door features
        const frontDoorFloor = floors.find(f => f.floorNumber === 1)
        if (frontDoorFloor) {
          // Create mailbox at front door (moved from common area)
          const mailbox = await prisma.mailbox.upsert({
            where: {
              buildingId_mailboxNumber: {
                buildingId,
                mailboxNumber: unitNumber,
              },
            },
            update: {
              householdId: household.id,
              floorId: frontDoorFloor.id, // Front door floor
              location: 'Front Door - Mailbox Section',
            },
            create: {
              buildingId,
              floorId: frontDoorFloor.id, // Front door floor
              householdId: household.id,
              mailboxNumber: unitNumber,
              location: 'Front Door - Mailbox Section',
              hasMail: false,
            },
          })

          createdMailboxes.push(mailbox)

          // Create door bell at front door
          const doorBell = await prisma.doorBell.upsert({
            where: {
              buildingId_doorBellNumber: {
                buildingId,
                doorBellNumber: unitNumber,
              },
            },
            update: {
              householdId: household.id,
              location: 'Front Door',
              isEnabled: true,
            },
            create: {
              buildingId,
              householdId: household.id,
              doorBellNumber: unitNumber,
              location: 'Front Door',
              isEnabled: true,
            },
          })

          createdDoorBells.push(doorBell)
        }
      }
    } else {
      console.log(`   ⚠️  Floor ${floorNum} not found, skipping household creation`)
    }

    // Create 10 package lockers in package room (Floor 1)
    const frontDoorFloor = floors.find(f => f.floorNumber === 1)
    if (frontDoorFloor) {
      for (let lockerNum = 1; lockerNum <= 10; lockerNum++) {
        const locker = await prisma.packageLocker.upsert({
          where: {
            buildingId_lockerNumber: {
              buildingId,
              lockerNumber: lockerNum,
            },
          },
          update: {
            location: 'Front Door - Package Room',
            isOccupied: false,
          },
          create: {
            buildingId,
            lockerNumber: lockerNum,
            location: 'Front Door - Package Room',
            isOccupied: false,
          },
        })
        createdPackageLockers.push(locker)
      }
      console.log(`   ✅ Created/Updated 10 package lockers`)
    }

    // Create facilities on Floor 2: Gym, Meeting Room #1, Meeting Room #2
    const facilitiesFloor = floors.find(f => f.floorNumber === 2)
    if (facilitiesFloor) {
      const facilities = [
        { name: 'Gym', nameZh: '健身房', type: 'gym', capacity: 20 },
        { name: 'Meeting Room #1', nameZh: '會議室 #1', type: 'meeting_room', capacity: 10 },
        { name: 'Meeting Room #2', nameZh: '會議室 #2', type: 'meeting_room', capacity: 10 },
      ]

      for (const facilityData of facilities) {
        const facility = await prisma.facility.upsert({
          where: {
            buildingId_name: {
              buildingId,
              name: facilityData.name,
            },
          },
          update: {
            floorId: facilitiesFloor.id,
            floorNumber: 2,
            description: `${facilityData.nameZh} - ${facilityData.name}`,
            type: facilityData.type,
            capacity: facilityData.capacity,
            isActive: true,
          },
          create: {
            buildingId,
            floorId: facilitiesFloor.id,
            floorNumber: 2,
            name: facilityData.name,
            description: `${facilityData.nameZh} - ${facilityData.name}`,
            type: facilityData.type,
            capacity: facilityData.capacity,
            isActive: true,
          },
        })

        // Create default operating hours for each facility (Monday-Sunday, 9:00-22:00)
        for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
          await prisma.facilityOperatingHours.upsert({
            where: {
              facilityId_dayOfWeek: {
                facilityId: facility.id,
                dayOfWeek,
              },
            },
            update: {
              openTime: '09:00',
              closeTime: '22:00',
              isClosed: false,
            },
            create: {
              facilityId: facility.id,
              dayOfWeek,
              openTime: '09:00',
              closeTime: '22:00',
              isClosed: false,
            },
          })
        }
        console.log(`   ✅ Created/Updated facility: ${facilityData.name}`)
      }
    }

    // Update building floorCount and unitCount
    await prisma.building.update({
      where: { id: buildingId },
      data: {
        floorCount: 3,
        unitCount: 5, // Only Floor 3 has residential units (5 units)
      },
    })

    console.log(`   ✅ Completed:`)
    console.log(`      - ${floors.length} floors`)
    console.log(`      - ${createdHouseholds.length} households (Floor 3 only)`)
    console.log(`      - ${createdMailboxes.length} mailboxes (Front Door)`)
    console.log(`      - ${createdDoorBells.length} door bells (Front Door)`)
    console.log(`      - ${createdPackageLockers.length} package lockers (Package Room)`)
    console.log(`      - 3 facilities (Floor 2: Gym, Meeting Room #1, Meeting Room #2)`)

    return {
      success: true,
      data: {
        floors: floors.length,
        households: createdHouseholds.length,
        mailboxes: createdMailboxes.length,
        doorBells: createdDoorBells.length,
        packageLockers: createdPackageLockers.length,
      },
    }
  } catch (error) {
    console.error(`   ❌ Error setting up building ${buildingName}:`, error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

async function main() {
  try {
    console.log('🚀 Starting enGo Smart Home buildings floors and units setup...\n')

    // Find enGo Smart Home community
    const community = await prisma.community.findFirst({
      where: {
        OR: [
          { name: 'enGo Smart Home' },
          { name: { contains: 'enGo' } },
          { name: { contains: '智管家' } },
        ],
      },
      include: {
        buildings: {
          orderBy: { name: 'asc' },
        },
      },
    })

    if (!community) {
      console.error('❌ enGo Smart Home community not found')
      process.exit(1)
    }

    console.log(`✅ Found community: ${community.name}`)
    console.log(`   Buildings: ${community.buildings.length}\n`)

    if (community.buildings.length === 0) {
      console.error('❌ No buildings found in enGo Smart Home community')
      process.exit(1)
    }

    // Setup floors and units for each building
    const results = []
    for (const building of community.buildings) {
      const result = await setupBuildingFloorsAndUnits(building.id, building.name)
      results.push({
        building: building.name,
        ...result,
      })
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 SETUP SUMMARY')
    console.log('='.repeat(60))
    console.log(`\n🏘️  Community: ${community.name}`)
    console.log(`   ID: ${community.id}`)
    
    console.log(`\n🏢 Buildings Setup:`)
    results.forEach((result, index) => {
      const building = community.buildings[index]
      console.log(`\n   ${index + 1}. ${building.name}`)
      console.log(`      Building ID: ${building.id}`)
      if (result.success) {
        console.log(`      ✅ Success`)
        console.log(`         Floors: ${result.data?.floors || 0}`)
        console.log(`         Households: ${result.data?.households || 0} (Floor 3 only)`)
        console.log(`         Mailboxes: ${result.data?.mailboxes || 0} (Front Door)`)
        console.log(`         Door Bells: ${result.data?.doorBells || 0} (Front Door)`)
        console.log(`         Package Lockers: ${result.data?.packageLockers || 0} (Package Room)`)
        console.log(`         Facilities: 3 (Floor 2: Gym, Meeting Room #1, Meeting Room #2)`)
      } else {
        console.log(`      ❌ Failed: ${result.error}`)
      }
    })

    const totalFloors = results.reduce((sum, r) => sum + (r.data?.floors || 0), 0)
    const totalHouseholds = results.reduce((sum, r) => sum + (r.data?.households || 0), 0)
    const totalMailboxes = results.reduce((sum, r) => sum + (r.data?.mailboxes || 0), 0)
    const totalDoorBells = results.reduce((sum, r) => sum + (r.data?.doorBells || 0), 0)
    const totalPackageLockers = results.reduce((sum, r) => sum + (r.data?.packageLockers || 0), 0)

    console.log(`\n📊 Totals:`)
    console.log(`   Total Floors: ${totalFloors}`)
    console.log(`   Total Households: ${totalHouseholds} (Floor 3 only)`)
    console.log(`   Total Mailboxes: ${totalMailboxes} (Front Door)`)
    console.log(`   Total Door Bells: ${totalDoorBells} (Front Door)`)
    console.log(`   Total Package Lockers: ${totalPackageLockers} (Package Room)`)
    console.log(`   Total Facilities: ${3 * community.buildings.length} (3 per building)`)

    console.log('\n' + '='.repeat(60))
    console.log('✅ enGo Smart Home buildings floors and units setup completed!')
    console.log('='.repeat(60) + '\n')

  } catch (error) {
    console.error('❌ Error setting up enGo buildings:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

