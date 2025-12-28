import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/setup-user-credentials
 * Set up credentials for a user (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Find or create user
    let targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { credentials: true }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create or update credentials
    await prisma.userCredentials.upsert({
      where: { userId: targetUser.id },
      update: { password: hashedPassword },
      create: {
        userId: targetUser.id,
        password: hashedPassword
      }
    })

    return NextResponse.json({
      success: true,
      message: `Credentials set up for ${email}`,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        hasCredentials: true
      }
    })

  } catch (error) {
    console.error('Error setting up user credentials:', error)
    return NextResponse.json(
      { error: 'Failed to setup credentials', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/setup-user-credentials?email=...
 * Check if user has credentials
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { 
        credentials: true,
        communityMemberships: {
          where: { role: 'ADMIN' },
          select: { communityId: true, community: { select: { id: true, name: true } } }
        },
        buildingMemberships: {
          where: { role: 'ADMIN' },
          select: { buildingId: true, building: { select: { id: true, name: true } } }
        }
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        isAdmin: targetUser.isAdmin,
        hasCredentials: !!targetUser.credentials,
        communityAdmins: targetUser.communityMemberships.map(m => ({
          id: m.community.id,
          name: m.community.name
        })),
        buildingAdmins: targetUser.buildingMemberships.map(m => ({
          id: m.building.id,
          name: m.building.name
        }))
      }
    })

  } catch (error) {
    console.error('Error checking user credentials:', error)
    return NextResponse.json(
      { error: 'Failed to check credentials', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
