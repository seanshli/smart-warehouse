import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = body

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

    console.log('Starting registration for:', email)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json({ 
        error: 'User already exists. Please sign in instead.' 
      }, { status: 400 })
    }

    console.log('User does not exist, creating...')

    // Create user first
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name,
        language: 'en'
      }
    })

    console.log('User created with ID:', user.id)

    // Create household
    const household = await prisma.household.create({
      data: {
        name: `${name}'s Household`,
        description: 'Your personal household inventory'
      }
    })

    console.log('Household created with ID:', household.id)

    // Create household membership
    const membership = await prisma.householdMember.create({
      data: {
        userId: user.id,
        householdId: household.id,
        role: 'OWNER'
      }
    })

    console.log('Membership created with ID:', membership.id)

    // Create default rooms
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

    console.log('Default rooms created')

    // Create default categories
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

    console.log('Default categories created')

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      household: {
        id: household.id,
        name: household.name
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to create user: ' + error.message },
      { status: 500 }
    )
  }
}
