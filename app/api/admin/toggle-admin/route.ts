import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Update the current user to admin
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { isAdmin: true }
    })

    console.log(`Updated ${session.user.email} to admin`)

    return NextResponse.json({
      message: 'User updated to admin successfully',
      user: {
        email: updatedUser.email,
        name: updatedUser.name,
        isAdmin: updatedUser.isAdmin
      }
    })

  } catch (error) {
    console.error('Error updating user to admin:', error)
    return NextResponse.json(
      { error: 'Failed to update user to admin', details: error.message },
      { status: 500 }
    )
  }
}
