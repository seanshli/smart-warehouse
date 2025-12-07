import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/fix-building-admins
 * Fix existing building admins who don't have community memberships
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { isAdmin: true }
    })

    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Find all building admins
    const buildingAdmins = await prisma.buildingMember.findMany({
      where: {
        role: 'ADMIN',
      },
      include: {
        building: {
          select: {
            id: true,
            name: true,
            communityId: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    const results = []
    let fixed = 0
    let skipped = 0
    let errors = 0

    for (const buildingAdmin of buildingAdmins) {
      if (!buildingAdmin.building?.communityId) {
        skipped++
        results.push({
          userId: buildingAdmin.user.id,
          userEmail: buildingAdmin.user.email,
          buildingId: buildingAdmin.building?.id,
          buildingName: buildingAdmin.building?.name,
          status: 'skipped',
          reason: 'Building has no community',
        })
        continue
      }

      // Check if user already has community membership
      const existingCommunityMembership = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: buildingAdmin.user.id,
            communityId: buildingAdmin.building.communityId,
          },
        },
      })

      if (existingCommunityMembership) {
        // Update memberClass if needed
        if (existingCommunityMembership.memberClass !== 'building') {
          await prisma.communityMember.update({
            where: {
              userId_communityId: {
                userId: buildingAdmin.user.id,
                communityId: buildingAdmin.building.communityId,
              },
            },
            data: {
              memberClass: 'building',
            },
          })
          fixed++
          results.push({
            userId: buildingAdmin.user.id,
            userEmail: buildingAdmin.user.email,
            buildingId: buildingAdmin.building.id,
            buildingName: buildingAdmin.building.name,
            communityId: buildingAdmin.building.communityId,
            status: 'updated',
            action: 'Updated memberClass to building',
          })
        } else {
          skipped++
          results.push({
            userId: buildingAdmin.user.id,
            userEmail: buildingAdmin.user.email,
            buildingId: buildingAdmin.building.id,
            buildingName: buildingAdmin.building.name,
            communityId: buildingAdmin.building.communityId,
            status: 'skipped',
            reason: 'Already has correct community membership',
          })
        }
      } else {
        // Create community membership
        try {
          await prisma.communityMember.create({
            data: {
              userId: buildingAdmin.user.id,
              communityId: buildingAdmin.building.communityId,
              role: 'MEMBER',
              memberClass: 'building',
            },
          })
          fixed++
          results.push({
            userId: buildingAdmin.user.id,
            userEmail: buildingAdmin.user.email,
            buildingId: buildingAdmin.building.id,
            buildingName: buildingAdmin.building.name,
            communityId: buildingAdmin.building.communityId,
            status: 'created',
            action: 'Created community membership',
          })
        } catch (error: any) {
          errors++
          results.push({
            userId: buildingAdmin.user.id,
            userEmail: buildingAdmin.user.email,
            buildingId: buildingAdmin.building.id,
            buildingName: buildingAdmin.building.name,
            communityId: buildingAdmin.building.communityId,
            status: 'error',
            error: error.message || 'Unknown error',
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixed} building admins, skipped ${skipped}, errors: ${errors}`,
      summary: {
        total: buildingAdmins.length,
        fixed,
        skipped,
        errors,
      },
      results,
    })
  } catch (error) {
    console.error('[Fix Building Admins] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fix building admins', details: errorMessage },
      { status: 500 }
    )
  }
}

