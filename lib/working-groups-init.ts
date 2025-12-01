/**
 * Helper functions to initialize working groups for communities and buildings
 */

import { prisma } from './prisma'
import { createUserWithCredentials, storeUserPassword } from './credentials'
import bcrypt from 'bcryptjs'

const WORKING_GROUP_TYPES = [
  { name: 'Management Team', type: 'MANAGEMENT', description: 'Building and community management team' },
  { name: 'Maintenance Team', type: 'MAINTENANCE', description: 'Maintenance and repair team' },
  { name: 'Front Door Team', type: 'FRONT_DOOR', description: 'Front door and security team' },
]

/**
 * Initialize working groups for a community
 */
export async function initializeCommunityWorkingGroups(communityId: string, adminId: string) {
  const results = []

  for (const groupType of WORKING_GROUP_TYPES) {
    // Check if working group already exists
    const existing = await prisma.workingGroup.findFirst({
      where: {
        communityId,
        type: groupType.type,
        name: groupType.name,
      },
    })

    if (existing) {
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
    const permissions = ['ADD_MEMBER', 'REVOKE_MEMBER', 'VIEW', 'EDIT']
    for (const permission of permissions) {
      await prisma.workingGroupPermission.create({
        data: {
          workingGroupId: workingGroup.id,
          permission,
          scope: 'ALL_BUILDINGS',
        },
      })
    }

    results.push(workingGroup)
  }

  return results
}

/**
 * Initialize working groups for a building
 */
export async function initializeBuildingWorkingGroups(buildingId: string, communityId: string, adminId: string) {
  const results = []

  for (const groupType of WORKING_GROUP_TYPES) {
    // Check if building-specific group exists
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

    const buildingSpecificGroup = existingGroups.find(g => g.permissions.length > 0)

    if (buildingSpecificGroup) {
      results.push(buildingSpecificGroup)
      continue
    }

    // Get building name for naming
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      select: { name: true },
    })

    // Create working group at community level but scope it to this building
    const workingGroup = await prisma.workingGroup.create({
      data: {
        communityId,
        name: `${groupType.name} - ${building?.name || 'Building'}`,
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
    const permissions = ['ADD_MEMBER', 'REVOKE_MEMBER', 'VIEW', 'EDIT', 'MANAGE_BUILDING']
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

    results.push(workingGroup)
  }

  return results
}

/**
 * Create default accounts for a building
 */
export async function createBuildingDefaultAccounts(buildingId: string, buildingName: string) {
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

    results.push(user)
  }

  return results
}

/**
 * Add accounts to front door team
 */
export async function addAccountsToFrontDoorTeam(buildingId: string, communityId: string, accounts: any[]) {
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
  }
}

/**
 * Get or find admin user
 */
export async function getAdminUser() {
  const admin = await prisma.user.findFirst({
    where: { isAdmin: true },
    orderBy: { createdAt: 'asc' },
  })

  if (!admin) {
    throw new Error('No admin user found')
  }

  return admin
}

/**
 * Initialize working groups and accounts for a new building
 */
export async function initializeBuildingSetup(buildingId: string, communityId: string) {
  try {
    const admin = await getAdminUser()

    // Initialize working groups for building
    await initializeBuildingWorkingGroups(buildingId, communityId, admin.id)

    // Get building info
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      select: { name: true },
    })

    if (!building) {
      throw new Error('Building not found')
    }

    // Create default accounts
    const accounts = await createBuildingDefaultAccounts(buildingId, building.name)

    // Add accounts to front door team
    await addAccountsToFrontDoorTeam(buildingId, communityId, accounts)

    return { success: true, accounts }
  } catch (error) {
    console.error('Error initializing building setup:', error)
    throw error
  }
}

/**
 * Initialize working groups for a new community
 */
export async function initializeCommunitySetup(communityId: string) {
  try {
    const admin = await getAdminUser()

    // Initialize working groups for community
    await initializeCommunityWorkingGroups(communityId, admin.id)

    return { success: true }
  } catch (error) {
    console.error('Error initializing community setup:', error)
    throw error
  }
}


