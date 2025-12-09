import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function linkHomeAssistantToUnit3A() {
  const householdName = '3A' // Or apartmentNo: "3A"
  const haBaseUrl = 'https://demoha.smtengo.com'
  const haAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI2NTlhZmI3NDM0MjI0NjZlYjUxNzk0NWFlNDQzZGM5MiIsImlhdCI6MTc2NTI1MzAyMywiZXhwIjoyMDgwNjEzMDIzfQ.FmmTfynLVfAcVrIan0bwfbIpCKITfPYnIZgYdykb0bs'

  try {
    // Find the household
    const household = await prisma.household.findFirst({
      where: {
        OR: [
          { name: { contains: '3A', mode: 'insensitive' } },
          { apartmentNo: '3A' }
        ]
      },
      select: { id: true, name: true, apartmentNo: true }
    })

    if (!household) {
      console.error(`Household "${householdName}" (or apartmentNo "3A") not found.`)
      console.log('Available households:')
      const allHouseholds = await prisma.household.findMany({
        select: { id: true, name: true, apartmentNo: true },
        take: 20
      })
      allHouseholds.forEach(h => console.log(`  - ${h.name} (${h.apartmentNo || 'no apt'}) - ${h.id}`))
      return
    }

    console.log(`Found household: ${household.name} (${household.apartmentNo || 'N/A'}) (ID: ${household.id})`)

    // Extract server IP from baseUrl
    let serverIp: string | null = null
    try {
      const url = new URL(haBaseUrl)
      serverIp = url.hostname
    } catch (error) {
      // If baseUrl is just an IP address
      if (/^\d+\.\d+\.\d+\.\d+/.test(haBaseUrl)) {
        serverIp = haBaseUrl.replace(/^https?:\/\//, '').split(':')[0]
      }
    }

    // Create or update HA config
    const haConfig = await prisma.homeAssistantConfig.upsert({
      where: { householdId: household.id },
      update: {
        baseUrl: haBaseUrl.trim(),
        username: null,
        accessToken: haAccessToken.trim(),
        serverIp: serverIp || null,
        updatedAt: new Date(),
      },
      create: {
        householdId: household.id,
        baseUrl: haBaseUrl.trim(),
        username: null,
        accessToken: haAccessToken.trim(),
        serverIp: serverIp || null,
      },
    })

    console.log('Home Assistant linked successfully!')
    console.log(`Config ID: ${haConfig.id}`)
    console.log(`Base URL: ${haConfig.baseUrl}`)
    console.log(`Server IP: ${haConfig.serverIp || 'N/A'}`)
  } catch (error: any) {
    console.error('Failed to link Home Assistant:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

linkHomeAssistantToUnit3A()
