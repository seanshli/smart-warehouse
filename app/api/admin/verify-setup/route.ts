import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/verify-setup?email=...
 * Verify user setup (credentials, admin roles) - No authentication required for verification
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        credentials: true,
        communityMemberships: {
          where: { role: 'ADMIN' },
          include: {
            community: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        buildingMemberships: {
          where: { role: 'ADMIN' },
          include: {
            building: {
              select: {
                id: true,
                name: true,
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
        supplierMemberships: {
          where: {
            role: { in: ['ADMIN', 'MANAGER'] }
          },
          include: {
            supplier: {
              select: {
                id: true,
                name: true,
                isActive: true,
                serviceTypes: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        email: email.toLowerCase()
      }, { status: 404 })
    }

    const hasCredentials = !!user.credentials
    const communityAdmins = user.communityMemberships.map(m => ({
      id: m.community.id,
      name: m.community.name
    }))
    const buildingAdmins = user.buildingMemberships.map(m => ({
      id: m.building.id,
      name: m.building.name,
      communityId: m.building.community.id,
      communityName: m.building.community.name
    }))
    const supplierAdmins = user.supplierMemberships
      .filter(m => m.supplier.isActive)
      .map(m => ({
        id: m.supplier.id,
        name: m.supplier.name,
        role: m.role,
        serviceTypes: m.supplier.serviceTypes || []
      }))

    const hasAnyAdminRole = user.isAdmin || communityAdmins.length > 0 || buildingAdmins.length > 0 || supplierAdmins.length > 0

    const verification = {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isSuperAdmin: user.isAdmin
      },
      credentials: {
        exists: hasCredentials,
        status: hasCredentials ? '✅ Set up' : '❌ Missing',
        createdAt: user.credentials?.createdAt,
        updatedAt: user.credentials?.updatedAt
      },
      adminRoles: {
        superAdmin: user.isAdmin,
        communityAdmins: {
          count: communityAdmins.length,
          communities: communityAdmins
        },
        buildingAdmins: {
          count: buildingAdmins.length,
          buildings: buildingAdmins
        },
        supplierAdmins: {
          count: supplierAdmins.length,
          suppliers: supplierAdmins
        }
      },
      setupStatus: {
        complete: hasCredentials && hasAnyAdminRole,
        canLogin: hasCredentials,
        hasAdminAccess: hasAnyAdminRole,
        message: !hasCredentials 
          ? '❌ SETUP INCOMPLETE: User cannot log in without credentials.'
          : !hasAnyAdminRole
          ? '⚠️  WARNING: User has credentials but no admin roles.'
          : '✅ SETUP COMPLETE: User is ready to log in with admin access!'
      }
    }

    return NextResponse.json(verification)

  } catch (error) {
    console.error('Error verifying setup:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to verify setup', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
