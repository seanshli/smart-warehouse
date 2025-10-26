import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyUserPassword } from '@/lib/credentials'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { credentials: true }
    })

    const debugInfo = {
      email: email.toLowerCase(),
      userFound: !!user,
      userId: user?.id,
      hasCredentials: !!user?.credentials,
      credentialsUserId: user?.credentials?.userId,
      credentialsMatch: user?.credentials?.userId === user?.id,
      passwordVerification: false,
      error: null as string | null
    }

    if (!user) {
      debugInfo.error = 'User not found'
      return NextResponse.json(debugInfo, { status: 404 })
    }

    if (!user.credentials) {
      debugInfo.error = 'User has no credentials stored'
      return NextResponse.json(debugInfo, { status: 404 })
    }

    // Verify password
    try {
      const isValid = await verifyUserPassword(email, password)
      debugInfo.passwordVerification = isValid
      
      if (!isValid) {
        debugInfo.error = 'Invalid password'
      }
    } catch (error: any) {
      debugInfo.error = error.message
      debugInfo.passwordVerification = false
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error('Error in auth-test:', error)
    return NextResponse.json(
      { error: 'Failed to test authentication', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
