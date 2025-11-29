import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

const DEFAULT_COMMUNITIES = [
  'Twin-Oak / 雙橡園',
  'enGo Smart Home / 智管家',
]

async function resetHouseholds() {
  const targetCommunities =
    process.env.RESET_COMMUNITIES?.split(',')
      .map((name) => name.trim())
      .filter(Boolean) || DEFAULT_COMMUNITIES

  console.log('🏙  Resetting households for communities:')
  targetCommunities.forEach((name) => console.log(`   • ${name}`))

  const communities = await prisma.community.findMany({
    where: {
      name: {
        in: targetCommunities,
      },
    },
    include: {
      buildings: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (communities.length === 0) {
    console.warn('⚠️  No matching communities found. Nothing to reset.')
    return
  }

  for (const community of communities) {
    console.log(`\n🏘  Community: ${community.name}`)

    if (community.buildings.length === 0) {
      console.log('   (no buildings)')
      continue
    }

    for (const building of community.buildings) {
      console.log(`   🏢 Resetting building: ${building.name}`)

      await prisma.package.deleteMany({ where: { buildingId: building.id } })
      await prisma.packageLocker.deleteMany({ where: { buildingId: building.id } })
      await prisma.mailbox.deleteMany({ where: { buildingId: building.id } })
      await prisma.doorBell.deleteMany({ where: { buildingId: building.id } })
      await prisma.household.deleteMany({ where: { buildingId: building.id } })
      await prisma.floor.deleteMany({ where: { buildingId: building.id } })

      await prisma.building.update({
        where: { id: building.id },
        data: {
          floorCount: null,
          unitCount: null,
        },
      })

      console.log('      ✓ households, floors, and front-door facilities removed')
    }
  }

  console.log('\n✅ Reset completed.')
}

resetHouseholds()
  .catch((error) => {
    console.error('❌ Reset failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


