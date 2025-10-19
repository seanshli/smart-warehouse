import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyUserPassword } from '@/lib/credentials'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { credentials: true }
    })

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found',
        email: email.toLowerCase()
      })
    }

    if (!user.credentials) {
      return NextResponse.json({ 
        success: false, 
        error: 'No credentials found for user',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
          hasCredentials: false
        }
      })
    }

    // Verify password
    const isValidPassword = await verifyUserPassword(email, password)
    
    if (!isValidPassword) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid password',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
          hasCredentials: true
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        adminRole: (user as any).adminRole,
        hasCredentials: true
      }
    })

  } catch (error) {
    console.error('Error testing login:', error)
    return NextResponse.json(
      { error: 'Failed to test login', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
