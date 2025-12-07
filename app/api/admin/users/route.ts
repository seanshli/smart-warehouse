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

    let users
    try {
      users = await prisma.user.findMany({
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
              memberClass: true,
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
    } catch (prismaError: any) {
      console.error('Prisma error fetching users:', prismaError)
      // If nested relations fail, try simpler query
      try {
        users = await prisma.user.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            email: true,
            language: true,
            isAdmin: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        })
        // Fetch relations separately
        const userIds = users.map(u => u.id)
        
        const [householdMemberships, communityMemberships, buildingMemberships, workingGroupMembers] = await Promise.all([
          prisma.householdMember.findMany({
            where: { userId: { in: userIds } },
            include: {
              household: {
                include: {
                  building: {
                    include: {
                      community: {
                        select: { id: true, name: true }
                      }
                    }
                  }
                }
              }
            }
          }).catch(() => []),
          prisma.communityMember.findMany({
            where: { userId: { in: userIds } },
            include: {
              community: {
                select: { id: true, name: true }
              }
            }
          }).catch(() => []),
          prisma.buildingMember.findMany({
            where: { userId: { in: userIds } },
            include: {
              building: {
                select: {
                  id: true,
                  name: true,
                  communityId: true,
                  community: {
                    select: { id: true, name: true }
                  }
                }
              }
            }
          }).catch((err) => {
            console.error('[Get Users] Error fetching building memberships:', err)
            return []
          }),
          prisma.workingGroupMember.findMany({
            where: { userId: { in: userIds } },
            include: {
              workingGroup: {
                select: { id: true, name: true, type: true, communityId: true }
              }
            }
          }).catch(() => [])
        ])

        // Group memberships by userId
        const householdMap = new Map<string, any[]>()
        const communityMap = new Map<string, any[]>()
        const buildingMap = new Map<string, any[]>()
        const workingGroupMap = new Map<string, any[]>()

        householdMemberships.forEach(m => {
          if (!householdMap.has(m.userId)) householdMap.set(m.userId, [])
          householdMap.get(m.userId)!.push(m)
        })
        communityMemberships.forEach(m => {
          if (!communityMap.has(m.userId)) communityMap.set(m.userId, [])
          communityMap.get(m.userId)!.push(m)
        })
        buildingMemberships.forEach(m => {
          if (!buildingMap.has(m.userId)) buildingMap.set(m.userId, [])
          buildingMap.get(m.userId)!.push(m)
        })
        workingGroupMembers.forEach(m => {
          if (!workingGroupMap.has(m.userId)) workingGroupMap.set(m.userId, [])
          workingGroupMap.get(m.userId)!.push(m)
        })

        // Attach memberships to users
        users = users.map(user => ({
          ...user,
          householdMemberships: householdMap.get(user.id) || [],
          communityMemberships: communityMap.get(user.id) || [],
          buildingMemberships: buildingMap.get(user.id) || [],
          workingGroupMembers: workingGroupMap.get(user.id) || [],
        }))
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError)
        throw prismaError // Throw original error
      }
    }

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
      households: (user.householdMemberships || []).filter((m: any) => m.household).map((membership: any) => ({
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
      communities: (user.communityMemberships || []).filter((m: any) => m.community).map((membership: any) => ({
        membershipId: membership.id, // Include membership ID for updates
        id: membership.community.id,
        name: membership.community.name,
        role: membership.role,
        joinedAt: membership.joinedAt.toISOString()
      })),
      buildings: (user.buildingMemberships || []).filter((m: any) => m.building).map((membership: any) => ({
        membershipId: membership.id, // Include membership ID for updates
        id: membership.building.id,
        name: membership.building.name,
        role: membership.role,
        memberClass: membership.memberClass || 'household',
        communityId: membership.building.communityId,
        community: membership.building.community,
        joinedAt: membership.joinedAt.toISOString()
      })),
      workingGroups: (user.workingGroupMembers || []).filter((m: any) => m.workingGroup).map((membership: any) => ({
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

    const userId = (session.user as any).id
    const body = await request.json()
    const { name, email, phone, contact, password, isAdmin, communityMembership, buildingMembership } = body

    console.log('[Create User] Request body:', {
      name,
      email,
      hasPassword: !!password,
      isAdmin,
      communityMembership,
      buildingMembership
    })

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
    }

    // Check permissions for creating memberships
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true }
    })

    const isSuperAdmin = currentUser?.isAdmin || false

    // Validate membership permissions
    if (communityMembership) {
      // Validate communityMembership structure
      if (!communityMembership.communityId) {
        return NextResponse.json({ error: 'Community ID is required for community membership' }, { status: 400 })
      }
      if (!communityMembership.role || !['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'].includes(communityMembership.role)) {
        return NextResponse.json({ error: 'Invalid role. Must be ADMIN, MANAGER, MEMBER, or VIEWER' }, { status: 400 })
      }
      
      // Verify community exists
      const communityExists = await prisma.community.findUnique({
        where: { id: communityMembership.communityId },
        select: { id: true }
      })
      if (!communityExists) {
        return NextResponse.json({ error: 'Community not found' }, { status: 404 })
      }

      // Permission check: Super admins can always add members
      // For non-super admins, check if they're a community admin
      if (!isSuperAdmin) {
        // Check if current user is a community admin of the target community
        const currentUserMembership = await prisma.communityMember.findUnique({
          where: {
            userId_communityId: {
              userId,
              communityId: communityMembership.communityId,
            },
          },
        })
        
        // Allow if user is community ADMIN or MANAGER (managers can add members)
        const canAddMembers = currentUserMembership && 
          (currentUserMembership.role === 'ADMIN' || currentUserMembership.role === 'MANAGER')
        
        if (!canAddMembers) {
          console.log('[Create User] Permission check failed:', {
            userId,
            communityId: communityMembership.communityId,
            currentUserMembership: currentUserMembership?.role || 'none',
            isSuperAdmin
          })
          // Don't fail here - allow user creation but skip community membership
          // This allows super admins to create users even if they're not community members
          console.warn('[Create User] Skipping community membership due to insufficient permissions')
          delete body.communityMembership
        }
      }
      
      // Only super admin can create community ADMIN
      if (communityMembership && communityMembership.role === 'ADMIN' && !isSuperAdmin) {
        console.warn('[Create User] Non-super admin trying to create ADMIN, downgrading to MANAGER')
        communityMembership.role = 'MANAGER'
      }
    }

    if (buildingMembership) {
      if (!isSuperAdmin) {
        // Check if user is community admin or building admin
        const building = await prisma.building.findUnique({
          where: { id: buildingMembership.buildingId },
          select: { communityId: true },
        })
        if (building) {
          const communityMember = await prisma.communityMember.findUnique({
            where: {
              userId_communityId: {
                userId,
                communityId: building.communityId,
              },
            },
          })
          const buildingMember = await prisma.buildingMember.findUnique({
            where: {
              userId_buildingId: {
                userId,
                buildingId: buildingMembership.buildingId,
              },
            },
          })
          if ((!communityMember || communityMember.role !== 'ADMIN') && 
              (!buildingMember || buildingMember.role !== 'ADMIN')) {
            return NextResponse.json({ error: 'Insufficient permissions to create building members' }, { status: 403 })
          }
        }
      }
      // Only super admin and community admin can create building ADMIN
      if (buildingMembership.role === 'ADMIN' && !isSuperAdmin) {
        const building = await prisma.building.findUnique({
          where: { id: buildingMembership.buildingId },
          select: { communityId: true },
        })
        if (building) {
          const communityMember = await prisma.communityMember.findUnique({
            where: {
              userId_communityId: {
                userId,
                communityId: building.communityId,
              },
            },
          })
          if (!communityMember || communityMember.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Only super admin or community admin can create building admins' }, { status: 403 })
          }
        }
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    let user
    try {
      user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone?.trim() || null,
          contact: contact?.trim() || null,
          isAdmin: isAdmin || false,
          language: 'en', // Default language
        },
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
          createdAt: true
        }
      })
      console.log('[Create User] User created successfully:', user.id)
    } catch (createError: any) {
      console.error('[Create User] Error creating user:', createError)
      if (createError.code === 'P2002') {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
      }
      return NextResponse.json({ 
        error: 'Failed to create user',
        details: createError.message 
      }, { status: 500 })
    }

    // Store password
    const { storeUserPassword } = await import('@/lib/credentials')
    storeUserPassword(email.toLowerCase().trim(), hashedPassword)

    // Create community membership if specified
    if (communityMembership) {
      try {
        console.log('[Create User] Creating community membership:', {
          userId: user.id,
          communityId: communityMembership.communityId,
          role: communityMembership.role,
          memberClass: communityMembership.memberClass || 'community'
        })
        
        // Check if membership already exists
        const existingMembership = await prisma.communityMember.findUnique({
          where: {
            userId_communityId: {
              userId: user.id,
              communityId: communityMembership.communityId,
            },
          },
        })

        if (existingMembership) {
          console.log('[Create User] User already a member, updating role')
          await prisma.communityMember.update({
            where: {
              userId_communityId: {
                userId: user.id,
                communityId: communityMembership.communityId,
              },
            },
            data: {
              role: (communityMembership.role || 'MEMBER') as 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER',
              memberClass: (communityMembership.memberClass || 'community') as 'household' | 'building' | 'community',
            },
          })
        } else {
          await prisma.communityMember.create({
            data: {
              userId: user.id,
              communityId: communityMembership.communityId,
              role: (communityMembership.role || 'MEMBER') as 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER',
              memberClass: (communityMembership.memberClass || 'community') as 'household' | 'building' | 'community',
            },
          })
        }

        // If community ADMIN, auto-add to all buildings
        if (communityMembership.role === 'ADMIN') {
          const buildings = await prisma.building.findMany({
            where: { communityId: communityMembership.communityId },
            select: { id: true },
          })
          for (const building of buildings) {
            try {
              await prisma.buildingMember.upsert({
                where: {
                  userId_buildingId: {
                    userId: user.id,
                    buildingId: building.id,
                  },
                },
                update: {
                  role: 'ADMIN',
                  memberClass: 'community',
                },
                create: {
                  userId: user.id,
                  buildingId: building.id,
                  role: 'ADMIN',
                  memberClass: 'community',
                },
              })
            } catch (buildingError: any) {
              console.error('[Create User] Error adding to building:', building.id, buildingError)
              // Continue with other buildings
            }
          }
        }
      } catch (communityError: any) {
        console.error('[Create User] Error creating community membership:', {
          error: communityError,
          message: communityError.message,
          code: communityError.code,
          meta: communityError.meta,
          userId: user.id,
          communityId: communityMembership.communityId
        })
        
        // Check if it's a duplicate key error (user already member)
        if (communityError.code === 'P2002') {
          // Try to update instead
          try {
            await prisma.communityMember.update({
              where: {
                userId_communityId: {
                  userId: user.id,
                  communityId: communityMembership.communityId,
                },
              },
              data: {
                role: (communityMembership.role || 'MEMBER') as 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER',
                memberClass: (communityMembership.memberClass || 'community') as 'household' | 'building' | 'community',
              },
            })
            console.log('[Create User] Updated existing community membership successfully')
            // Success - continue to return success response below
          } catch (updateError: any) {
            console.error('[Create User] Failed to update membership:', updateError)
            // Return success with warning - user was created
            return NextResponse.json({ 
              message: 'User created successfully',
              warning: 'Failed to update community membership - user may already be a member',
              details: updateError.message || 'User is already a member with different settings',
              errorCode: updateError.code,
              userId: user.id,
              user
            }, { status: 201 })
          }
        } else {
          // For other errors, log but don't fail the entire request
          // User was created successfully, membership is optional
          console.error('[Create User] Community membership failed, but user was created:', {
            error: communityError.message,
            code: communityError.code,
            userId: user.id
          })
          // Return success with warning
          return NextResponse.json({ 
            message: 'User created successfully',
            warning: 'Failed to add community membership',
            details: communityError.message || 'Unknown error',
            errorCode: communityError.code,
            userId: user.id,
            user
          }, { status: 201 })
        }
      }
    }

    // Create building membership if specified
    if (buildingMembership) {
      try {
        console.log('[Create User] Creating building membership:', {
          userId: user.id,
          buildingId: buildingMembership.buildingId,
          role: buildingMembership.role,
          memberClass: buildingMembership.memberClass || 'building'
        })

        await prisma.buildingMember.upsert({
          where: {
            userId_buildingId: {
              userId: user.id,
              buildingId: buildingMembership.buildingId,
            },
          },
          update: {
            role: (buildingMembership.role || 'MEMBER') as 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER',
            memberClass: (buildingMembership.memberClass || 'building') as 'household' | 'building' | 'community',
          },
          create: {
            userId: user.id,
            buildingId: buildingMembership.buildingId,
            role: (buildingMembership.role || 'MEMBER') as 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER',
            memberClass: (buildingMembership.memberClass || 'building') as 'household' | 'building' | 'community',
          },
        })
      } catch (buildingError: any) {
        console.error('[Create User] Error creating building membership:', buildingError)
        return NextResponse.json({ 
          error: 'User created but failed to add building membership',
          details: buildingError.message,
          userId: user.id
        }, { status: 500 })
      }
    }

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
