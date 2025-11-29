import { prisma } from '@/lib/prisma'

const DEFAULT_PACKAGE_LOCKERS = 10

interface FrontDoorSyncOptions {
  packageLockerCount?: number
}

function getHouseholdLabel(
  household: {
    apartmentNo: string | null
    floorNumber: number | null
    unit: string | null
    name: string | null
  },
  index: number
) {
  if (household.apartmentNo?.trim()) {
    return household.apartmentNo.trim()
  }

  if (household.floorNumber) {
    const suffix = household.unit?.trim() || String.fromCharCode(65 + (index % 26))
    return `${household.floorNumber}${suffix}`
  }

  if (household.name?.trim()) {
    return household.name.trim()
  }

  return `HH-${String(index + 1).padStart(2, '0')}`
}

export async function ensureFrontDoorFloor(buildingId: string) {
  const existing = await prisma.floor.findFirst({
    where: { buildingId, floorNumber: 1 },
  })

  if (existing) {
    return existing
  }

  return prisma.floor.create({
    data: {
      buildingId,
      floorNumber: 1,
      name: 'Front Door / 大門',
      description: 'Front door common area with mailboxes, package lockers, and door bells',
      isResidential: false,
    },
  })
}

async function ensurePackageLockerCount(buildingId: string, desiredCount: number) {
  const sanitizedCount = Math.max(0, desiredCount)

  const existing = await prisma.packageLocker.findMany({
    where: { buildingId },
    orderBy: { lockerNumber: 'asc' },
  })

  if (existing.length === sanitizedCount) {
    return existing
  }

  if (existing.length < sanitizedCount) {
    const toCreate = []
    for (let lockerNumber = existing.length + 1; lockerNumber <= sanitizedCount; lockerNumber++) {
      toCreate.push(
        prisma.packageLocker.create({
          data: {
            buildingId,
            lockerNumber,
            location: 'Front Door - Package Room',
            isOccupied: false,
          },
        })
      )
    }
    await prisma.$transaction(toCreate)
  } else {
    const lockerIdsToRemove = existing
      .slice(sanitizedCount)
      .map((locker) => locker.id)

    await prisma.packageLocker.deleteMany({
      where: {
        id: {
          in: lockerIdsToRemove,
        },
      },
    })
  }

  return prisma.packageLocker.findMany({
    where: { buildingId },
    orderBy: { lockerNumber: 'asc' },
  })
}

export async function syncFrontDoorFeatures(buildingId: string, options: FrontDoorSyncOptions = {}) {
  const building = await prisma.building.findUnique({
    where: { id: buildingId },
    include: {
      floors: true,
      households: {
        select: {
          id: true,
          name: true,
          apartmentNo: true,
          floorNumber: true,
          unit: true,
        },
        orderBy: [
          { floorNumber: 'asc' },
          { unit: 'asc' },
          { name: 'asc' },
        ],
      },
      mailboxes: true,
      doorBells: true,
      packageLockers: true,
    },
  })

  if (!building) {
    throw new Error('Building not found')
  }

  const frontDoorFloor = await ensureFrontDoorFloor(buildingId)
  const households = building.households
  const desiredLockerCount = options.packageLockerCount ?? (building.packageLockers.length || DEFAULT_PACKAGE_LOCKERS)

  const mailboxNumbers: string[] = []

  await prisma.$transaction(
    households.map((household, index) => {
      const mailboxNumber = getHouseholdLabel(household, index)
      mailboxNumbers.push(mailboxNumber)

      return prisma.mailbox.upsert({
        where: {
          buildingId_mailboxNumber: {
            buildingId,
            mailboxNumber,
          },
        },
        update: {
          householdId: household.id,
          floorId: frontDoorFloor.id,
          hasMail: false,
          location: 'Front Door - Mailbox Section',
        },
        create: {
          buildingId,
          floorId: frontDoorFloor.id,
          householdId: household.id,
          mailboxNumber,
          location: 'Front Door - Mailbox Section',
          hasMail: false,
        },
      })
    })
  )

  if (mailboxNumbers.length > 0) {
    await prisma.mailbox.deleteMany({
      where: {
        buildingId,
        mailboxNumber: {
          notIn: mailboxNumbers,
        },
      },
    })
  }

  const doorBellNumbers: string[] = []

  await prisma.$transaction(
    households.map((household, index) => {
      const doorBellNumber = getHouseholdLabel(household, index)
      doorBellNumbers.push(doorBellNumber)

      return prisma.doorBell.upsert({
        where: {
          buildingId_doorBellNumber: {
            buildingId,
            doorBellNumber,
          },
        },
        update: {
          householdId: household.id,
          isEnabled: true,
          location: 'Front Door',
        },
        create: {
          buildingId,
          householdId: household.id,
          doorBellNumber,
          location: 'Front Door',
          isEnabled: true,
        },
      })
    })
  )

  if (doorBellNumbers.length > 0) {
    await prisma.doorBell.deleteMany({
      where: {
        buildingId,
        doorBellNumber: {
          notIn: doorBellNumbers,
        },
      },
    })
  }

  const lockers = await ensurePackageLockerCount(buildingId, desiredLockerCount)

  return {
    households: households.length,
    mailboxes: mailboxNumbers.length,
    doorBells: doorBellNumbers.length,
    packageLockers: lockers.length,
    frontDoorFloorId: frontDoorFloor.id,
  }
}

export async function getFrontDoorSummary(buildingId: string) {
  const building = await prisma.building.findUnique({
    where: { id: buildingId },
    include: {
      households: {
        select: {
          id: true,
          name: true,
          apartmentNo: true,
          floorNumber: true,
          unit: true,
        },
        orderBy: [
          { floorNumber: 'asc' },
          { unit: 'asc' },
        ],
      },
      mailboxes: {
        include: {
          household: {
            select: {
              id: true,
              name: true,
              apartmentNo: true,
            },
          },
        },
        orderBy: { mailboxNumber: 'asc' },
      },
      doorBells: {
        include: {
          household: {
            select: {
              id: true,
              name: true,
              apartmentNo: true,
            },
          },
        },
        orderBy: { doorBellNumber: 'asc' },
      },
      packageLockers: {
        include: {
          packages: {
            where: { status: 'pending' },
            select: {
              id: true,
              packageNumber: true,
              householdId: true,
              status: true,
            },
          },
        },
        orderBy: { lockerNumber: 'asc' },
      },
    },
  })

  if (!building) {
    throw new Error('Building not found')
  }

  return {
    building: {
      id: building.id,
      name: building.name,
    },
    households: building.households,
    mailboxes: building.mailboxes,
    doorBells: building.doorBells,
    packageLockers: building.packageLockers,
  }
}


