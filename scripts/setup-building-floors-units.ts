/**
 * Script to automatically set up floors and units for a building
 * Creates 10 floors (1-10), with floors 2-9 being residential
 * Each residential floor has 4 units: A, B, C, D
 * Creates mailboxes in common area linked to each household
 */

import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

interface SetupOptions {
  buildingId: string
  skipExisting?: boolean // Skip if floors/units already exist
}

async function setupBuildingFloorsAndUnits(options: SetupOptions) {
  const { buildingId, skipExisting = true } = options

  try {
    // Check if building exists
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      include: {
        floors: true,
        households: true,
      },
    })

    if (!building) {
      throw new Error(`Building with ID ${buildingId} not found`)
    }

    console.log(`Setting up floors and units for building: ${building.name}`)

    // Check if floors already exist
    if (skipExisting && building.floors.length > 0) {
      console.log(`Building already has ${building.floors.length} floors. Skipping...`)
      return
    }

    // Create 10 floors (1-10)
    const floors = []
    for (let floorNum = 1; floorNum <= 10; floorNum++) {
      const isResidential = floorNum >= 2 && floorNum <= 9
      
      const floor = await prisma.floor.upsert({
        where: {
          buildingId_floorNumber: {
            buildingId,
            floorNumber: floorNum,
          },
        },
        update: {
          name: floorNum === 1 ? 'Lobby' : isResidential ? `Floor ${floorNum}` : `Floor ${floorNum}`,
          isResidential,
        },
        create: {
          buildingId,
          floorNumber: floorNum,
          name: floorNum === 1 ? 'Lobby' : isResidential ? `Floor ${floorNum}` : `Floor ${floorNum}`,
          description: isResidential ? `Residential floor with 4 units (A, B, C, D)` : `Non-residential floor`,
          isResidential,
        },
      })

      floors.push(floor)
      console.log(`Created floor ${floorNum} (${isResidential ? 'Residential' : 'Non-residential'})`)
    }

    // Create households and mailboxes for residential floors (2-9)
    const units = ['A', 'B', 'C', 'D']
    const createdHouseholds = []
    const createdMailboxes = []

    for (let floorNum = 2; floorNum <= 9; floorNum++) {
      const floor = floors.find(f => f.floorNumber === floorNum)
      if (!floor) continue

      for (const unit of units) {
        const mailboxNumber = `${floorNum}${unit}` // e.g., "5A"
        
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
              name: existingHousehold.name || `Unit ${mailboxNumber}`,
              apartmentNo: mailboxNumber,
            },
          })
          console.log(`Updated existing household: ${mailboxNumber}`)
        } else {
          // Create new household
          household = await prisma.household.create({
            data: {
              buildingId,
              floorId: floor.id,
              floorNumber: floorNum,
              unit,
              name: `Unit ${mailboxNumber}`,
              apartmentNo: mailboxNumber,
              description: `Residential unit ${mailboxNumber} on floor ${floorNum}`,
            },
          })
          console.log(`Created household: ${mailboxNumber}`)
        }

        createdHouseholds.push(household)

        // Create mailbox in common area linked to this household
        const mailbox = await prisma.mailbox.upsert({
          where: {
            buildingId_mailboxNumber: {
              buildingId,
              mailboxNumber,
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
            mailboxNumber,
            location: 'Common Area - Mailbox Section',
            hasMail: false,
          },
        })

        createdMailboxes.push(mailbox)
        console.log(`Created mailbox: ${mailboxNumber}`)
      }
    }

    // Update building floorCount and unitCount
    await prisma.building.update({
      where: { id: buildingId },
      data: {
        floorCount: 10,
        unitCount: 8 * 4, // 8 floors (2-9) * 4 units each = 32 units
      },
    })

    console.log('\n✅ Setup complete!')
    console.log(`- Created/Updated ${floors.length} floors`)
    console.log(`- Created/Updated ${createdHouseholds.length} households`)
    console.log(`- Created/Updated ${createdMailboxes.length} mailboxes`)

    return {
      floors: floors.length,
      households: createdHouseholds.length,
      mailboxes: createdMailboxes.length,
    }
  } catch (error) {
    console.error('Error setting up building floors and units:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// CLI usage
if (require.main === module) {
  const buildingId = process.argv[2]

  if (!buildingId) {
    console.error('Usage: tsx scripts/setup-building-floors-units.ts <buildingId>')
    console.error('Example: tsx scripts/setup-building-floors-units.ts abc123...')
    process.exit(1)
  }

  setupBuildingFloorsAndUnits({ buildingId })
    .then(() => {
      console.log('✅ Script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Script failed:', error)
      process.exit(1)
    })
}

export { setupBuildingFloorsAndUnits }

