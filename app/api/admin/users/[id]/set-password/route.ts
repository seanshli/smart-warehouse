import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/users/[id]/set-password
 * Set password for a user (super admin only)
 * Allows super admin to manually set any password for any user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super admin
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true }
    })

    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 })
    }

    const { id: userId } = params
    const { password } = await request.json()

    if (!password || password.length < 6) {
      return NextResponse.json({ 
        error: 'Password is required and must be at least 6 characters' 
      }, { status: 400 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Hash password with bcrypt (12 rounds)
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create or update credentials
    await prisma.userCredentials.upsert({
      where: { userId: user.id },
      update: { 
        password: hashedPassword,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        password: hashedPassword
      }
    })

    console.log(`[Admin] Password set for user: ${user.email} by ${session.user.email}`)

    return NextResponse.json({ 
      success: true,
      message: 'Password set successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      note: 'Password has been set. User can now log in with this password.'
    })
  } catch (error) {
    console.error('Error setting password:', error)
    return NextResponse.json(
      { 
        error: 'Failed to set password',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
