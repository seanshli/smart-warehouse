import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// POST /api/admin/users/[id]/reset-password - Reset user password
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is admin
    if (!session?.user || !(session.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const { id: userId } = params

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate a temporary password (user will need to change it on next login)
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    // Update user credentials
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

    console.log(`[Admin] Reset password for user: ${user.email}`)

    // In a real application, you would send this password securely to the user
    // For now, we'll return it in the response (admin should communicate it securely)
    return NextResponse.json({ 
      success: true,
      message: 'Password reset successfully',
      tempPassword: tempPassword, // In production, this should be sent via email/SMS
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      note: 'Please communicate this temporary password to the user securely.'
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
