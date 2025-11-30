import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { storeUserPassword } from '@/lib/credentials'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/reset-password
 * Reset password using token
 */
export async function POST(request: NextRequest) {
  try {
    const { email, token, newPassword } = await request.json()

    if (!email || !token || !newPassword) {
      return NextResponse.json(
        { error: 'Email, token, and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { credentials: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid reset token' },
        { status: 400 }
      )
    }

    // TODO: Verify token from PasswordResetToken table
    // For now, in development, we'll accept any token (remove in production)
    // In production, verify the token from the database
    if (process.env.NODE_ENV === 'production') {
      // Verify token from database
      // const resetToken = await prisma.passwordResetToken.findFirst({
      //   where: {
      //     userId: user.id,
      //     token: tokenHash,
      //     expiresAt: { gt: new Date() },
      //   },
      // })
      // if (!resetToken) {
      //   return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
      // }
      return NextResponse.json(
        { error: 'Password reset token verification not yet implemented. Please contact admin.' },
        { status: 501 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update password
    await storeUserPassword(email.toLowerCase(), hashedPassword)

    // TODO: Delete reset token from database
    // await prisma.passwordResetToken.delete({ where: { id: resetToken.id } })

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now sign in with your new password.',
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}

