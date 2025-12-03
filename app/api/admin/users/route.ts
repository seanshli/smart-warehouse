import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// GET /api/admin/users - Fetch all users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is admin
    if (!session?.user || !(session.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const communityId = searchParams.get('communityId')
    const buildingId = searchParams.get('buildingId')

    // Check if user is super admin
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true, adminRole: true }
    })

    const isSuperAdmin = currentUser?.isAdmin && currentUser?.adminRole === 'SUPERUSER'

    // Build query conditions
    let whereClause: any = {}

    // Filter by community or building (applies to both super admin and regular admin)
    if (communityId) {
      // Get users who are members of this community or have households in buildings of this community
      const communityMemberIds = await prisma.communityMember.findMany({
        where: { communityId },
        select: { userId: true }
      }).then(members => members.map(m => m.userId))

      const buildingIds = await prisma.building.findMany({
        where: { communityId },
        select: { id: true }
      }).then(buildings => buildings.map(b => b.id))

      const householdIds = await prisma.household.findMany({
        where: { buildingId: { in: buildingIds } },
        select: { id: true }
      }).then(households => households.map(h => h.id))

      const householdMemberIds = await prisma.householdMember.findMany({
        where: { householdId: { in: householdIds } },
        select: { userId: true }
      }).then(members => members.map(m => m.userId))

      const allUserIds = Array.from(new Set([...communityMemberIds, ...householdMemberIds]))
      if (allUserIds.length > 0) {
        whereClause.id = { in: allUserIds }
      } else {
        // No users found, return empty result
        whereClause.id = { in: [] }
      }
    } else if (buildingId) {
      // Get users who are members of this building or have households in this building
      const buildingMemberIds = await prisma.buildingMember.findMany({
        where: { buildingId },
        select: { userId: true }
      }).then(members => members.map(m => m.userId))

      const householdIds = await prisma.household.findMany({
        where: { buildingId },
        select: { id: true }
      }).then(households => households.map(h => h.id))

      const householdMemberIds = await prisma.householdMember.findMany({
        where: { householdId: { in: householdIds } },
        select: { userId: true }
      }).then(members => members.map(m => m.userId))

      const allUserIds = Array.from(new Set([...buildingMemberIds, ...householdMemberIds]))
      if (allUserIds.length > 0) {
        whereClause.id = { in: allUserIds }
      } else {
        // No users found, return empty result
        whereClause.id = { in: [] }
      }
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        language: true,
        isAdmin: true,
        createdAt: true,
        householdMemberships: {
          select: {
            id: true,
            role: true,
            joinedAt: true,
            household: {
              select: {
                id: true,
                name: true,
                buildingId: true,
                building: {
                  select: {
                    id: true,
                    name: true,
                    communityId: true,
                    community: {
                      select: {
                        id: true,
                        name: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        communityMemberships: {
          select: {
            id: true,
            role: true,
            joinedAt: true,
            community: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        buildingMemberships: {
          select: {
            id: true,
            role: true,
            joinedAt: true,
            building: {
              select: {
                id: true,
                name: true,
                communityId: true
              }
            }
          }
        },
        workingGroupMembers: {
          select: {
            id: true,
            role: true,
            assignedAt: true,
            workingGroup: {
              select: {
                id: true,
                name: true,
                type: true,
                communityId: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to match the expected format
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: null,
      contact: null,
      language: user.language,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      households: user.householdMemberships.map((membership: any) => ({
        id: membership.household.id,
        name: membership.household.name,
        role: membership.role,
        joinedAt: membership.joinedAt.toISOString(),
        building: membership.household.building ? {
          id: membership.household.building.id,
          name: membership.household.building.name,
          community: membership.household.building.community
        } : null
      })),
      communities: user.communityMemberships.map((membership: any) => ({
        id: membership.community.id,
        name: membership.community.name,
        role: membership.role,
        joinedAt: membership.joinedAt.toISOString()
      })),
      buildings: user.buildingMemberships.map((membership: any) => ({
        id: membership.building.id,
        name: membership.building.name,
        role: membership.role,
        joinedAt: membership.joinedAt.toISOString()
      })),
      workingGroups: user.workingGroupMembers.map((membership: any) => ({
        id: membership.workingGroup.id,
        name: membership.workingGroup.name,
        type: membership.workingGroup.type,
        role: membership.role,
        assignedAt: membership.assignedAt?.toISOString()
      }))
    }))

    return NextResponse.json({ users: transformedUsers })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is admin
    if (!session?.user || !(session.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone, contact, password, isAdmin } = body

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        isAdmin: isAdmin || false,
        language: 'en' // Default language
        // phone, contact, password will be available after running add-user-fields.sql
      },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true
      }
    })

    console.log(`[Admin] Created new user: ${user.email} (Admin: ${user.isAdmin})`)

    return NextResponse.json({ 
      message: 'User created successfully',
      user 
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
