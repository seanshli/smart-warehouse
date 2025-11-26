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

    // Create 3 floors (1, 2, 3) - all residential
    const floors = []
    for (let floorNum = 1; floorNum <= 3; floorNum++) {
      const floor = await prisma.floor.upsert({
        where: {
          buildingId_floorNumber: {
            buildingId,
            floorNumber: floorNum,
          },
        },
        update: {
          name: `Floor ${floorNum}`,
          isResidential: true,
          description: `Residential floor ${floorNum} with 5 units (A, B, C, D, E)`,
        },
        create: {
          buildingId,
          floorNumber: floorNum,
          name: `Floor ${floorNum}`,
          description: `Residential floor ${floorNum} with 5 units (A, B, C, D, E)`,
          isResidential: true,
        },
      })

      floors.push(floor)
      console.log(`   ✅ Created/Updated floor ${floorNum}`)
    }

    // Create households and mailboxes for all floors (1-3), each with 5 units
    const units = ['A', 'B', 'C', 'D', 'E']
    const createdHouseholds = []
    const createdMailboxes = []

    for (let floorNum = 1; floorNum <= 3; floorNum++) {
      const floor = floors.find(f => f.floorNumber === floorNum)
      if (!floor) continue

      for (const unit of units) {
        const unitNumber = `${floorNum}${unit}` // e.g., "1A", "2B", "3C"
        
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

        // Create mailbox in common area linked to this household
        const mailbox = await prisma.mailbox.upsert({
          where: {
            buildingId_mailboxNumber: {
              buildingId,
              mailboxNumber: unitNumber,
            },
          },
          update: {
            householdId: household.id,
            floorId: floor.id,
            location: 'Common Area - Mailbox Section',
          },
          create: {
            buildingId,
            floorId: floor.id,
            householdId: household.id,
            mailboxNumber: unitNumber,
            location: 'Common Area - Mailbox Section',
            hasMail: false,
          },
        })

        createdMailboxes.push(mailbox)
      }
    }

    // Update building floorCount and unitCount
    await prisma.building.update({
      where: { id: buildingId },
      data: {
        floorCount: 3,
        unitCount: 3 * 5, // 3 floors * 5 units each = 15 units
      },
    })

    console.log(`   ✅ Completed: ${floors.length} floors, ${createdHouseholds.length} households, ${createdMailboxes.length} mailboxes`)

    return {
      success: true,
      data: {
        floors: floors.length,
        households: createdHouseholds.length,
        mailboxes: createdMailboxes.length,
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
        console.log(`         Households: ${result.data?.households || 0}`)
        console.log(`         Mailboxes: ${result.data?.mailboxes || 0}`)
      } else {
        console.log(`      ❌ Failed: ${result.error}`)
      }
    })

    const totalFloors = results.reduce((sum, r) => sum + (r.data?.floors || 0), 0)
    const totalHouseholds = results.reduce((sum, r) => sum + (r.data?.households || 0), 0)
    const totalMailboxes = results.reduce((sum, r) => sum + (r.data?.mailboxes || 0), 0)

    console.log(`\n📊 Totals:`)
    console.log(`   Total Floors: ${totalFloors}`)
    console.log(`   Total Households: ${totalHouseholds}`)
    console.log(`   Total Mailboxes: ${totalMailboxes}`)

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

