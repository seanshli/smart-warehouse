import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const email = 'sean.li@smtengo.com'
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { credentials: true }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found',
        email: email,
        userExists: false
      })
    }

    // Check if user has credentials
    const hasCredentials = !!user.credentials

    // Test password verification
    let passwordTest = null
    if (user.credentials) {
      const testPassword = 'Smtengo1324!'
      passwordTest = await bcrypt.compare(testPassword, user.credentials.password)
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        hasCredentials: hasCredentials,
        credentialsExists: !!user.credentials
      },
      passwordTest: {
        testPassword: 'Smtengo1324!',
        isValid: passwordTest,
        hasCredentials: hasCredentials
      },
      debug: {
        userExists: true,
        hasCredentials: hasCredentials,
        credentialsTable: user.credentials ? 'exists' : 'null'
      }
    })
  } catch (error) {
    console.error('Error in debug-credentials:', error)
    return NextResponse.json(
      { error: 'Failed to debug credentials', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
