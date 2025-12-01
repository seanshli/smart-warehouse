/**
 * Script to initialize working groups for all communities and buildings
 * Creates:
 * 1. Management Team
 * 2. Maintenance Team  
 * 3. Front Door Team
 * 
 * For each building, creates default accounts:
 * - doorbell@[building-id].internal (password: engo888)
 * - frontdesk@[building-id].internal (password: engo888)
 */

import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'
import bcrypt from 'bcryptjs'

// Load environment variables
const envLocalPath = resolve(process.cwd(), '.env.local')
const envPath = resolve(process.cwd(), '.env')

if (existsSync(envLocalPath)) {
  config({ path: envLocalPath, override: true })
} else if (existsSync(envPath)) {
  config({ path: envPath, override: true })
}

// Initialize Prisma client
const prisma = new PrismaClient({
  log: ['error', 'warn'],
})

// Helper functions for user creation
async function createUserWithCredentials(credentials: { email: string; password: string; name?: string }) {
  const { email, password, name } = credentials

  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (existingUser) {
    throw new Error('User already exists')
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name: name || email.split('@')[0],
      language: 'en',
    },
  })

  // Store credentials
  await prisma.userCredentials.upsert({
    where: { userId: user.id },
    update: { password: hashedPassword },
    create: {
      userId: user.id,
      password: hashedPassword,
    },
  })

  return user
}

async function storeUserPassword(email: string, hashedPassword: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (!user) {
    throw new Error('User not found')
  }

  await prisma.userCredentials.upsert({
    where: { userId: user.id },
    update: { password: hashedPassword },
    create: {
      userId: user.id,
      password: hashedPassword,
    },
  })
}

const WORKING_GROUP_TYPES = [
  { name: 'Management Team', type: 'MANAGEMENT', description: 'Building and community management team' },
  { name: 'Maintenance Team', type: 'MAINTENANCE', description: 'Maintenance and repair team' },
  { name: 'Front Door Team', type: 'FRONT_DOOR', description: 'Front door and security team' },
]

async function findOrCreateAdminUser() {
  // Find first admin user
  const admin = await prisma.user.findFirst({
    where: { isAdmin: true },
    orderBy: { createdAt: 'asc' },
  })

  if (!admin) {
    console.error('No admin user found. Please create an admin user first.')
    throw new Error('No admin user found')
  }

  return admin
}

async function createWorkingGroupForCommunity(communityId: string, adminId: string) {
  const results = []

  for (const groupType of WORKING_GROUP_TYPES) {
    // Check if working group already exists
    const existing = await prisma.workingGroup.findFirst({
      where: {
        communityId,
        type: groupType.type,
      },
    })

    if (existing) {
      console.log(`  Working group "${groupType.name}" already exists for community`)
      results.push(existing)
      continue
    }

    // Create working group
    const workingGroup = await prisma.workingGroup.create({
      data: {
        communityId,
        name: groupType.name,
        description: groupType.description,
        type: groupType.type,
      },
    })

    // Add admin as LEADER
    await prisma.workingGroupMember.create({
      data: {
        workingGroupId: workingGroup.id,
        userId: adminId,
        role: 'LEADER',
      },
    })

    // Add permissions for admin to manage the group
    const permissions = [
      'ADD_MEMBER',
      'REVOKE_MEMBER',
      'VIEW',
      'EDIT',
    ]

    for (const permission of permissions) {
      await prisma.workingGroupPermission.create({
        data: {
          workingGroupId: workingGroup.id,
          permission,
          scope: 'ALL_BUILDINGS',
        },
      })
    }

    console.log(`  Created working group "${groupType.name}" for community`)
    results.push(workingGroup)
  }

  return results
}

async function createWorkingGroupForBuilding(buildingId: string, communityId: string, adminId: string) {
  const results = []

  for (const groupType of WORKING_GROUP_TYPES) {
    // Check if working group already exists for this building (scoped via permissions)
    const existingGroups = await prisma.workingGroup.findMany({
      where: {
        communityId,
        type: groupType.type,
      },
      include: {
        permissions: {
          where: {
            scope: 'SPECIFIC_BUILDING',
            scopeId: buildingId,
          },
        },
      },
    })

    // Check if there's already a building-specific group
    const buildingSpecificGroup = existingGroups.find(g => g.permissions.length > 0)

    if (buildingSpecificGroup) {
      console.log(`  Working group "${groupType.name}" already exists for building`)
      results.push(buildingSpecificGroup)
      continue
    }

    // Create working group at community level but scope it to this building
    const workingGroup = await prisma.workingGroup.create({
      data: {
        communityId,
        name: `${groupType.name} - Building`,
        description: `${groupType.description} (Building-specific)`,
        type: groupType.type,
      },
    })

    // Add admin as LEADER
    await prisma.workingGroupMember.create({
      data: {
        workingGroupId: workingGroup.id,
        userId: adminId,
        role: 'LEADER',
      },
    })

    // Add permissions scoped to this specific building
    const permissions = [
      'ADD_MEMBER',
      'REVOKE_MEMBER',
      'VIEW',
      'EDIT',
      'MANAGE_BUILDING',
    ]

    for (const permission of permissions) {
      await prisma.workingGroupPermission.create({
        data: {
          workingGroupId: workingGroup.id,
          permission,
          scope: 'SPECIFIC_BUILDING',
          scopeId: buildingId,
        },
      })
    }

    console.log(`  Created working group "${groupType.name}" for building`)
    results.push(workingGroup)
  }

  return results
}

async function createDefaultAccountsForBuilding(buildingId: string, buildingName: string) {
  const accounts = [
    {
      email: `doorbell@${buildingId}.internal`,
      password: 'engo888',
      name: `Doorbell - ${buildingName}`,
    },
    {
      email: `frontdesk@${buildingId}.internal`,
      password: 'engo888',
      name: `Front Desk - ${buildingName}`,
    },
  ]

  const results = []

  for (const account of accounts) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: account.email.toLowerCase() },
    })

    if (existingUser) {
      console.log(`  Account "${account.email}" already exists`)
      results.push(existingUser)
      continue
    }

    // Create user
    const user = await createUserWithCredentials({
      email: account.email,
      password: account.password,
      name: account.name,
    })

    // Store password
    const hashedPassword = await bcrypt.hash(account.password, 12)
    await storeUserPassword(account.email, hashedPassword)

    console.log(`  Created account "${account.email}"`)
    results.push(user)
  }

  return results
}

async function addAccountsToFrontDoorTeam(buildingId: string, communityId: string, accounts: any[]) {
  // Find the front door team working group for this building
  const frontDoorGroups = await prisma.workingGroup.findMany({
    where: {
      communityId,
      type: 'FRONT_DOOR',
    },
    include: {
      permissions: {
        where: {
          scope: 'SPECIFIC_BUILDING',
          scopeId: buildingId,
        },
      },
    },
  })

  const frontDoorGroup = frontDoorGroups.find(g => g.permissions.length > 0)

  if (!frontDoorGroup) {
    console.log(`  No front door team found for building ${buildingId}`)
    return
  }

  for (const account of accounts) {
    // Check if already a member
    const existing = await prisma.workingGroupMember.findUnique({
      where: {
        workingGroupId_userId: {
          workingGroupId: frontDoorGroup.id,
          userId: account.id,
        },
      },
    })

    if (existing) {
      console.log(`  Account "${account.email}" already in front door team`)
      continue
    }

    // Add to front door team
    await prisma.workingGroupMember.create({
      data: {
        workingGroupId: frontDoorGroup.id,
        userId: account.id,
        role: 'MEMBER',
      },
    })

    console.log(`  Added account "${account.email}" to front door team`)
  }
}

async function main() {
  console.log('Starting working groups initialization...\n')

  try {
    // Find admin user
    const admin = await findOrCreateAdminUser()
    console.log(`Using admin user: ${admin.email} (${admin.id})\n`)

    // Process all communities
    const communities = await prisma.community.findMany({
      include: {
        buildings: true,
      },
    })

    console.log(`Found ${communities.length} communities\n`)

    for (const community of communities) {
      console.log(`Processing community: ${community.name} (${community.id})`)
      
      // Create working groups for community
      await createWorkingGroupForCommunity(community.id, admin.id)

      // Process buildings in this community
      for (const building of community.buildings) {
        console.log(`  Processing building: ${building.name} (${building.id})`)
        
        // Create working groups for building
        await createWorkingGroupForBuilding(building.id, community.id, admin.id)

        // Create default accounts for building
        const accounts = await createDefaultAccountsForBuilding(building.id, building.name)

        // Add accounts to front door team
        await addAccountsToFrontDoorTeam(building.id, community.id, accounts)
      }

      console.log('')
    }

    console.log('Working groups initialization completed successfully!')
  } catch (error) {
    console.error('Error initializing working groups:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
main()
  .then(() => {
    console.log('Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })

export { main as initializeWorkingGroups }

