import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { canManageUser } from '@/lib/middleware/admin-user-permissions'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/users/[id]/set-password
 * Set password for a user
 * - Super admins can set password for anyone
 * - Community/building admins can set password for users in their working groups/crews
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = (session.user as any).id
    const { id: targetUserId } = params

    // Check permissions
    const permissionCheck = await canManageUser(currentUserId, targetUserId)
    if (!permissionCheck.allowed) {
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        details: permissionCheck.reason || 'You can only manage users in your working groups'
      }, { status: 403 })
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

    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { email: true }
    })
    console.log(`[Admin] Password set for user: ${user.email} by ${currentUser?.email}`)

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
