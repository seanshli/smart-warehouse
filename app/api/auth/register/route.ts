import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createUserWithCredentials, storeUserPassword } from '@/lib/credentials'
import bcrypt from 'bcryptjs'
import { getTranslations } from '@/lib/translations'

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
      // Get user's language preference (default to 'en' if not set)
      const userLanguage = user.language || 'en'
      const t = getTranslations(userLanguage)
      
      // Create some default rooms in preferred order
      const defaultRooms = [
        { name: t.livingRoom, description: t.livingRoom },
        { name: t.masterBedroom, description: t.masterBedroom },
        { name: t.kidRoom, description: t.kidRoom },
        { name: t.kitchen, description: t.kitchen },
        { name: t.garage, description: t.garage }
      ]

      for (const roomData of defaultRooms) {
        const room = await prisma.room.create({
          data: {
            ...roomData,
            householdId: household.id
          }
        })
        
        // Create a default "Main Cabinet" for each room
        await prisma.cabinet.create({
          data: {
            name: t.mainCabinet,
            description: t.mainCabinet,
            roomId: room.id,
            householdId: household.id
          }
        })
      }

      // Create some default categories
      const defaultCategories = [
        { name: t.electronics, description: t.electronics, level: 1 },
        { name: t.kitchen, description: t.kitchen, level: 1 },
        { name: t.tools, description: t.tools, level: 1 },
        { name: t.clothing, description: t.clothing, level: 1 },
        { name: t.books, description: t.books, level: 1 },
        { name: t.miscellaneous, description: t.miscellaneous, level: 1 }
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to create user: ' + errorMessage },
      { status: 500 }
    )
  }
}
