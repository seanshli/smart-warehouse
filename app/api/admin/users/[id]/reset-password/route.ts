import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true }
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { newPassword } = await request.json()
    const userId = params.id

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ 
        error: 'Password must be at least 6 characters long' 
      }, { status: 400 })
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update the user's password
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: { 
        id: true, 
        email: true, 
        name: true,
        households: {
          select: {
            household: {
              select: { name: true }
            }
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: `Password reset successfully for ${updatedUser.email}`,
      user: updatedUser
    })

  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json({ 
      error: 'Failed to reset password' 
    }, { status: 500 })
  }
}
