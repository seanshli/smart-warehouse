import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { storeUserPassword } from '@/lib/credentials'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      // Update existing user to admin
      const updatedUser = await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: { isAdmin: true }
      })

      return NextResponse.json({
        message: 'User updated to admin',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          isAdmin: updatedUser.isAdmin
        }
      })
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash(password, 12)
    
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name || null,
        isAdmin: true,
      }
    })

    // Store the hashed password in the credential system
    storeUserPassword(email, hashedPassword)

    return NextResponse.json({
      message: 'Admin user created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        isAdmin: newUser.isAdmin
      }
    })

  } catch (error) {
    console.error('Error creating admin user:', error)
    return NextResponse.json(
      { error: 'Failed to create admin user' },
      { status: 500 }
    )
  }
}
