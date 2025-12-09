// Admin API to link Home Assistant to Unit 3A
// POST /api/admin/link-ha-unit3a

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { baseUrl, accessToken } = body

    if (!baseUrl || !accessToken) {
      return NextResponse.json(
        { error: 'baseUrl and accessToken are required' },
        { status: 400 }
      )
    }

    // Find Unit 3A household
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
      return NextResponse.json(
        { error: 'Unit 3A household not found' },
        { status: 404 }
      )
    }

    // Extract server IP
    let serverIp: string | null = null
    try {
      const url = new URL(baseUrl)
      serverIp = url.hostname
    } catch (error) {
      if (/^\d+\.\d+\.\d+\.\d+/.test(baseUrl)) {
        serverIp = baseUrl.replace(/^https?:\/\//, '').split(':')[0]
      }
    }

    // Create or update HA config
    const haConfig = await prisma.homeAssistantConfig.upsert({
      where: { householdId: household.id },
      update: {
        baseUrl: baseUrl.trim(),
        username: null,
        accessToken: accessToken.trim(),
        serverIp: serverIp || null,
        updatedAt: new Date(),
      },
      create: {
        householdId: household.id,
        baseUrl: baseUrl.trim(),
        username: null,
        accessToken: accessToken.trim(),
        serverIp: serverIp || null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Home Assistant linked successfully to Unit 3A',
      household: {
        id: household.id,
        name: household.name,
        apartmentNo: household.apartmentNo,
      },
      config: {
        id: haConfig.id,
        baseUrl: haConfig.baseUrl,
        serverIp: haConfig.serverIp,
      },
    })
  } catch (error: any) {
    console.error('Failed to link Home Assistant to Unit 3A:', error)
    return NextResponse.json(
      { error: 'Failed to link Home Assistant', details: error.message },
      { status: 500 }
    )
  }
}

