import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkBuildingManagement } from '@/lib/middleware/community-permissions'
import { syncFrontDoorFeatures } from '@/lib/building/front-door'

export const dynamic = 'force-dynamic'

/**
 * POST /api/building/[id]/floors-units/setup
 * Set up floors and units for a building
 * Creates 10 floors (1-10), with floors 2-9 being residential
 * Each residential floor has 4 units: A, B, C, D
 * Creates mailboxes in common area linked to each household
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const buildingId = params.id

    // Check if user has access to manage this building
    const hasAccess = await checkBuildingManagement(userId, buildingId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if building exists
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      include: {
        floors: true,
        households: true,
      },
    })

    if (!building) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 })
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
          name:
            floorNum === 1
              ? 'Front Door / 大門'
              : isResidential
              ? `Floor ${floorNum}`
              : `Floor ${floorNum}`,
          isResidential,
        },
        create: {
          buildingId,
          floorNumber: floorNum,
          name:
            floorNum === 1
              ? 'Front Door / 大門'
              : isResidential
              ? `Floor ${floorNum}`
              : `Floor ${floorNum}`,
          description: isResidential ? `Residential floor with 4 units (A, B, C, D)` : `Non-residential floor`,
          isResidential,
        },
      })

      floors.push(floor)
    }

    // Create households for residential floors (2-9)
    const units = ['A', 'B', 'C', 'D']
    const createdHouseholds = []

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
        }

        createdHouseholds.push(household)
      }
    }

    const frontDoor = await syncFrontDoorFeatures(buildingId)

    // Update building floorCount and unitCount
    await prisma.building.update({
      where: { id: buildingId },
      data: {
        floorCount: 10,
        unitCount: 8 * 4, // 8 floors (2-9) * 4 units each = 32 units
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Floors and units set up successfully',
      data: {
        floors: floors.length,
        households: createdHouseholds.length,
        mailboxes: frontDoor.mailboxes,
        doorBells: frontDoor.doorBells,
        packageLockers: frontDoor.packageLockers,
      },
    })
  } catch (error) {
    console.error('Error setting up building floors and units:', error)
    return NextResponse.json(
      { error: 'Failed to set up floors and units' },
      { status: 500 }
    )
  }
}

