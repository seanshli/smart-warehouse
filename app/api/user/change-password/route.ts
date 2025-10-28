import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ 
        error: 'Current password and new password are required' 
      }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ 
        error: 'New password must be at least 6 characters long' 
      }, { status: 400 })
    }

    // Get user with credentials
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { credentials: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.credentials) {
      return NextResponse.json({ 
        error: 'No credentials found for this user' 
      }, { status: 404 })
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.credentials.password)
    
    if (!isValidPassword) {
      return NextResponse.json({ 
        error: 'Current password is incorrect' 
      }, { status: 401 })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update password
    await prisma.userCredentials.update({
      where: { userId: user.id },
      data: { password: hashedPassword }
    })

    console.log(`✅ Password changed for user: ${user.email}`)

    return NextResponse.json({ 
      success: true, 
      message: 'Password changed successfully' 
    })

  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json(
      { error: 'Failed to change password', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

