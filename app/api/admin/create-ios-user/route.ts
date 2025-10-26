import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - admin only' }, { status: 401 })
    }

    const { email, password, name, isAdmin } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { credentials: true }
    })

    let user
    if (existingUser) {
      user = existingUser
      console.log('[create-ios-user] User already exists:', email)
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: name || email.split('@')[0],
          isAdmin: isAdmin || false,
          language: 'en'
        }
      })
      console.log('[create-ios-user] Created new user:', email)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create or update credentials
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

    console.log('[create-ios-user] Created/updated credentials for:', email)

    return NextResponse.json({
      success: true,
      message: `User ${existingUser ? 'updated' : 'created'} successfully`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        hasCredentials: true
      }
    })
  } catch (error) {
    console.error('Error creating iOS user:', error)
    return NextResponse.json(
      { error: 'Failed to create user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
