import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createUserWithCredentials, storeUserPassword } from '@/lib/credentials'
import bcrypt from 'bcryptjs'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, invitationCode } = body

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    let user
    if (existingUser) {
      // User already exists, check if they want to join a household
      if (!invitationCode) {
        return NextResponse.json({ 
          error: 'User already exists. Please sign in instead, or provide an invitation code to join a household.' 
        }, { status: 400 })
      }
      user = existingUser
      
      // Store/update the password hash for existing users joining households
      const hashedPassword = await bcrypt.hash(password, 12)
      storeUserPassword(email.toLowerCase(), hashedPassword)
    } else {
      // Create new user
      user = await createUserWithCredentials({
        name,
        email,
        password
      })

      // Store the hashed password for new users
      const hashedPassword = await bcrypt.hash(password, 12)
      storeUserPassword(email.toLowerCase(), hashedPassword)
    }

    let household

    if (invitationCode) {
      // User is joining an existing household
      const existingHousehold = await prisma.household.findUnique({
        where: { invitationCode }
      })

      if (!existingHousehold) {
        return NextResponse.json({ error: 'Invalid invitation code' }, { status: 400 })
      }

      // Check if user is already a member of this household
      const existingMembership = await prisma.householdMember.findUnique({
        where: {
          userId_householdId: {
            userId: user.id,
            householdId: existingHousehold.id
          }
        }
      })

      if (existingMembership) {
        return NextResponse.json({ 
          error: 'You are already a member of this household' 
        }, { status: 400 })
      }

      // Add user to existing household as USER
      await prisma.householdMember.create({
        data: {
          userId: user.id,
          householdId: existingHousehold.id,
          role: 'USER'
        }
      })

      household = existingHousehold
    } else {
      // Create a default household for the user
      household = await prisma.household.create({
        data: {
          name: `${name}'s Household`,
          description: 'Your personal household inventory',
          members: {
            create: {
              userId: user.id,
              role: 'OWNER'
            }
          }
        }
      })
    }

    // Only create default rooms and categories for new households
    if (!invitationCode) {
      // Create some default rooms
      const defaultRooms = [
        { name: 'Kitchen', description: 'Kitchen area' },
        { name: 'Living Room', description: 'Main living area' },
        { name: 'Bedroom', description: 'Bedroom' },
        { name: 'Garage', description: 'Garage and storage' }
      ]

      for (const roomData of defaultRooms) {
        await prisma.room.create({
          data: {
            ...roomData,
            householdId: household.id
          }
        })
      }

      // Create some default categories
      const defaultCategories = [
        { name: 'Electronics', description: 'Electronic devices and accessories', level: 1 },
        { name: 'Kitchen', description: 'Kitchen utensils and appliances', level: 1 },
        { name: 'Tools', description: 'Hand tools and equipment', level: 1 },
        { name: 'Clothing', description: 'Clothing and accessories', level: 1 },
        { name: 'Books', description: 'Books and reading materials', level: 1 },
        { name: 'Miscellaneous', description: 'Other items', level: 1 }
      ]

      for (const categoryData of defaultCategories) {
        await prisma.category.create({
          data: {
            ...categoryData,
            householdId: household.id
          }
        })
      }
    }

    return NextResponse.json({
      message: invitationCode ? 'User joined household successfully' : 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      household: {
        id: household.id,
        name: household.name
      },
      isExistingUser: !!existingUser
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
