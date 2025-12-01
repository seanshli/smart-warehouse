import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createUserWithCredentials, storeUserPassword } from '@/lib/credentials'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

const WORKING_GROUP_TYPES = [
  { name: 'Management Team', type: 'MANAGEMENT', description: 'Building and community management team' },
  { name: 'Maintenance Team', type: 'MAINTENANCE', description: 'Maintenance and repair team' },
  { name: 'Front Door Team', type: 'FRONT_DOOR', description: 'Front door and security team' },
]

/**
 * POST /api/admin/initialize-working-groups
 * Initialize working groups for all communities and buildings
 * Admin only
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
    }

    // Find admin user
    const admin = await prisma.user.findFirst({
      where: { isAdmin: true },
      orderBy: { createdAt: 'asc' },
    })

    if (!admin) {
      return NextResponse.json({ error: 'No admin user found' }, { status: 500 })
    }

    const results = {
      communities: [] as any[],
      buildings: [] as any[],
      accounts: [] as any[],
    }

    // Process all communities
    const communities = await prisma.community.findMany({
      include: {
        buildings: true,
      },
    })

    for (const community of communities) {
      const communityResult = {
        id: community.id,
        name: community.name,
        workingGroups: [] as any[],
      }

      // Create working groups for community
      for (const groupType of WORKING_GROUP_TYPES) {
        const existing = await prisma.workingGroup.findFirst({
          where: {
            communityId: community.id,
            type: groupType.type,
            name: groupType.name,
          },
        })

        if (existing) {
          communityResult.workingGroups.push({ id: existing.id, name: existing.name, status: 'exists' })
          continue
        }

        const workingGroup = await prisma.workingGroup.create({
          data: {
            communityId: community.id,
            name: groupType.name,
            description: groupType.description,
            type: groupType.type,
          },
        })

        // Add admin as LEADER
        await prisma.workingGroupMember.create({
          data: {
            workingGroupId: workingGroup.id,
            userId: admin.id,
            role: 'LEADER',
          },
        })

        // Add permissions
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

        communityResult.workingGroups.push({ id: workingGroup.id, name: workingGroup.name, status: 'created' })
      }

      results.communities.push(communityResult)

      // Process buildings in this community
      for (const building of community.buildings) {
        const buildingResult = {
          id: building.id,
          name: building.name,
          workingGroups: [] as any[],
          accounts: [] as any[],
        }

        // Create working groups for building
        for (const groupType of WORKING_GROUP_TYPES) {
          // Check if building-specific group exists
          const existingGroups = await prisma.workingGroup.findMany({
            where: {
              communityId: community.id,
              type: groupType.type,
            },
            include: {
              permissions: {
                where: {
                  scope: 'SPECIFIC_BUILDING',
                  scopeId: building.id,
                },
              },
            },
          })

          const buildingSpecificGroup = existingGroups.find(g => g.permissions.length > 0)

          if (buildingSpecificGroup) {
            buildingResult.workingGroups.push({ id: buildingSpecificGroup.id, name: buildingSpecificGroup.name, status: 'exists' })
            continue
          }

          const workingGroup = await prisma.workingGroup.create({
            data: {
              communityId: community.id,
              name: `${groupType.name} - ${building.name}`,
              description: `${groupType.description} (Building-specific)`,
              type: groupType.type,
            },
          })

          // Add admin as LEADER
          await prisma.workingGroupMember.create({
            data: {
              workingGroupId: workingGroup.id,
              userId: admin.id,
              role: 'LEADER',
            },
          })

          // Add permissions scoped to this building
          const permissions = ['ADD_MEMBER', 'REVOKE_MEMBER', 'VIEW', 'EDIT', 'MANAGE_BUILDING']
          for (const permission of permissions) {
            await prisma.workingGroupPermission.create({
              data: {
                workingGroupId: workingGroup.id,
                permission,
                scope: 'SPECIFIC_BUILDING',
                scopeId: building.id,
              },
            })
          }

          buildingResult.workingGroups.push({ id: workingGroup.id, name: workingGroup.name, status: 'created' })
        }

        // Create default accounts for building
        const accountConfigs = [
          {
            email: `doorbell@${building.id}.internal`,
            password: 'engo888',
            name: `Doorbell - ${building.name}`,
          },
          {
            email: `frontdesk@${building.id}.internal`,
            password: 'engo888',
            name: `Front Desk - ${building.name}`,
          },
        ]

        for (const accountConfig of accountConfigs) {
          const existingUser = await prisma.user.findUnique({
            where: { email: accountConfig.email.toLowerCase() },
          })

          if (existingUser) {
            buildingResult.accounts.push({ email: accountConfig.email, status: 'exists' })
            results.accounts.push({ email: accountConfig.email, status: 'exists' })
            continue
          }

          const user = await createUserWithCredentials({
            email: accountConfig.email,
            password: accountConfig.password,
            name: accountConfig.name,
          })

          const hashedPassword = await bcrypt.hash(accountConfig.password, 12)
          await storeUserPassword(accountConfig.email, hashedPassword)

          buildingResult.accounts.push({ email: accountConfig.email, status: 'created' })
          results.accounts.push({ email: accountConfig.email, status: 'created' })

          // Add to front door team
          const frontDoorGroups = await prisma.workingGroup.findMany({
            where: {
              communityId: community.id,
              type: 'FRONT_DOOR',
            },
            include: {
              permissions: {
                where: {
                  scope: 'SPECIFIC_BUILDING',
                  scopeId: building.id,
                },
              },
            },
          })

          const frontDoorGroup = frontDoorGroups.find(g => g.permissions.length > 0)

          if (frontDoorGroup) {
            const existingMember = await prisma.workingGroupMember.findUnique({
              where: {
                workingGroupId_userId: {
                  workingGroupId: frontDoorGroup.id,
                  userId: user.id,
                },
              },
            })

            if (!existingMember) {
              await prisma.workingGroupMember.create({
                data: {
                  workingGroupId: frontDoorGroup.id,
                  userId: user.id,
                  role: 'MEMBER',
                },
              })
            }
          }
        }

        results.buildings.push(buildingResult)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Working groups initialized successfully',
      results,
    })
  } catch (error) {
    console.error('Error initializing working groups:', error)
    return NextResponse.json(
      { error: 'Failed to initialize working groups', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


