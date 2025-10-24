import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyUserPassword } from '@/lib/credentials'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log('[test-login] Testing login for:', email)
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { credentials: true }
    })

    if (!user) {
      console.log('[test-login] User not found:', email)
      return NextResponse.json({ 
        success: false, 
        error: 'User not found',
        email: email
      })
    }

    console.log('[test-login] User found:', user.email, 'hasCredentials:', !!user.credentials)

    if (!user.credentials) {
      console.log('[test-login] No credentials found for user:', email)
      return NextResponse.json({ 
        success: false, 
        error: 'No credentials found',
        email: email,
        userExists: true,
        hasCredentials: false
      })
    }

    // Test password verification
    const isValidPassword = await verifyUserPassword(email, password)
    console.log('[test-login] Password verification result:', isValidPassword)

    if (!isValidPassword) {
      console.log('[test-login] Invalid password for:', email)
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid password',
        email: email,
        userExists: true,
        hasCredentials: true,
        passwordValid: false
      })
    }

    console.log('[test-login] Login successful for:', email)
    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin
      }
    })
  } catch (error) {
    console.error('[test-login] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Login test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
