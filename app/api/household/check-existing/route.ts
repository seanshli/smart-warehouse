// Check Existing Community/Building API
// 检查现有 Community/Building API

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/household/check-existing
 * 根据位置信息检查是否有现有的 Community/Building
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const latitude = parseFloat(searchParams.get('latitude') || '0')
    const longitude = parseFloat(searchParams.get('longitude') || '0')
    const radius = parseFloat(searchParams.get('radius') || '0.001') // 默认 ~100 米

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    // 检查附近是否有 Building（在指定范围内）
    const nearbyBuildings = await prisma.building.findMany({
      where: {
        latitude: {
          gte: latitude - radius,
          lte: latitude + radius,
        },
        longitude: {
          gte: longitude - radius,
          lte: longitude + radius,
        },
      },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            description: true,
            invitationCode: true,
          },
        },
        _count: {
          select: {
            households: true,
            members: true,
          },
        },
      },
      take: 10,
    })

    // 检查附近是否有 Community（通过 Building）
    const nearbyCommunities = new Map<string, any>()
    nearbyBuildings.forEach((building) => {
      if (building.community && !nearbyCommunities.has(building.community.id)) {
        nearbyCommunities.set(building.community.id, {
          ...building.community,
          buildings: [],
        })
      }
      if (building.community) {
        const community = nearbyCommunities.get(building.community.id)
        if (community) {
          community.buildings.push({
            id: building.id,
            name: building.name,
            invitationCode: building.invitationCode,
            householdsCount: building._count.households,
            membersCount: building._count.members,
          })
        }
      }
    })

    return NextResponse.json({
      success: true,
      found: nearbyBuildings.length > 0,
      buildings: nearbyBuildings.map((building) => ({
        id: building.id,
        name: building.name,
        description: building.description,
        invitationCode: building.invitationCode,
        community: building.community
          ? {
              id: building.community.id,
              name: building.community.name,
              invitationCode: building.community.invitationCode,
            }
          : null,
        householdsCount: building._count.households,
        membersCount: building._count.members,
        distance: building.latitude && building.longitude
          ? Math.sqrt(
              Math.pow(building.latitude - latitude, 2) +
                Math.pow(building.longitude - longitude, 2)
            ) * 111000 // 转换为米
          : null,
      })),
      communities: Array.from(nearbyCommunities.values()),
    })
  } catch (error: any) {
    console.error('Error checking existing Community/Building:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check existing Community/Building' },
      { status: 500 }
    )
  }
}

