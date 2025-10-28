import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// GET /api/admin/users - Fetch all users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is admin
    if (!session?.user || !(session.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        language: true,
        isAdmin: true,
        createdAt: true,
        householdMemberships: {
          select: {
            id: true,
            role: true,
            joinedAt: true,
            household: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to match the expected format
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: null, // Will be available after running add-user-fields.sql
      contact: null, // Will be available after running add-user-fields.sql
      language: user.language,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      households: user.householdMemberships.map((membership: any) => ({
        id: membership.household.id,
        name: membership.household.name,
        role: membership.role,
        joinedAt: membership.joinedAt.toISOString()
      }))
    }))

    return NextResponse.json({ users: transformedUsers })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is admin
    if (!session?.user || !(session.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone, contact, password, isAdmin } = body

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        isAdmin: isAdmin || false,
        language: 'en' // Default language
        // phone, contact, password will be available after running add-user-fields.sql
      },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true
      }
    })

    console.log(`[Admin] Created new user: ${user.email} (Admin: ${user.isAdmin})`)

    return NextResponse.json({ 
      message: 'User created successfully',
      user 
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
