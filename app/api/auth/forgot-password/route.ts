import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/forgot-password
 * Request password reset - sends reset token to user's email
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { credentials: true },
    })

    // Don't reveal if user exists or not (security best practice)
    if (!user || !user.credentials) {
      // Still return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Store reset token in user credentials (or create a separate reset tokens table)
    // For now, we'll store it in a temporary field or use a separate approach
    // Since we don't have a reset token field, we'll use a simple approach:
    // Store the token hash in the database (you may want to create a separate PasswordResetToken table)
    
    // For simplicity, we'll create a reset token record
    // You may want to create a separate PasswordResetToken model in Prisma
    const tokenHash = await bcrypt.hash(resetToken, 10)
    
    // Store in a way that can be retrieved later
    // For now, we'll use a simple approach with environment variable or database
    // In production, create a PasswordResetToken table
    
    // TODO: Create PasswordResetToken table and store token there
    // For now, we'll log it (in production, send via email)
    console.log(`[Password Reset] Token for ${email}: ${resetToken}`)
    console.log(`[Password Reset] Reset link: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`)

    // In production, send email with reset link
    // await sendPasswordResetEmail(user.email, resetToken)

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
      // In development, return the token for testing (remove in production)
      ...(process.env.NODE_ENV === 'development' && {
        resetToken,
        resetLink: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`,
      }),
    })
  } catch (error) {
    console.error('Error in forgot password:', error)
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
}

