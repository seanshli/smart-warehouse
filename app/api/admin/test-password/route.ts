import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyUserPassword } from '@/lib/credentials'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/test-password
 * Test password verification for a user (no auth required for testing)
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Find user with credentials
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { credentials: true }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        email: email.toLowerCase()
      }, { status: 404 })
    }

    if (!user.credentials) {
      return NextResponse.json({
        success: false,
        error: 'No credentials found',
        email: email.toLowerCase(),
        hasCredentials: false
      }, { status: 404 })
    }

    // Get password hash details
    const passwordHash = user.credentials.password
    const hashPrefix = passwordHash.substring(0, 7) // $2a$12$ or similar
    const hashLength = passwordHash.length

    // Test password verification
    let verificationResult = false
    let verificationError: string | null = null
    try {
      verificationResult = await verifyUserPassword(email, password)
    } catch (error: any) {
      verificationError = error.message
    }

    // Also try direct bcrypt compare
    let directCompareResult = false
    let directCompareError: string | null = null
    try {
      directCompareResult = await bcrypt.compare(password, passwordHash)
    } catch (error: any) {
      directCompareError = error.message
    }

    // Check hash format
    const isValidBcryptHash = passwordHash.startsWith('$2a$') || passwordHash.startsWith('$2b$') || passwordHash.startsWith('$2y$')
    const expectedRounds = hashPrefix.includes('$12$') ? 12 : hashPrefix.includes('$10$') ? 10 : 'unknown'

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      credentials: {
        exists: true,
        hashPrefix: hashPrefix,
        hashLength: hashLength,
        isValidBcryptFormat: isValidBcryptHash,
        expectedRounds: expectedRounds
      },
      passwordVerification: {
        viaVerifyUserPassword: verificationResult,
        viaDirectBcrypt: directCompareResult,
        verificationError: verificationError,
        directCompareError: directCompareError,
        passwordMatches: verificationResult || directCompareResult
      },
      recommendation: !verificationResult && !directCompareResult
        ? 'Password does not match. You may need to reset the password using the API endpoint.'
        : 'Password verification successful!'
    })

  } catch (error) {
    console.error('Error testing password:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test password',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
