import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check if demo user exists
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demo@smartwarehouse.com' }
    })
    
    if (!demoUser) {
      return NextResponse.json({ 
        error: 'Demo user not found',
        exists: false 
      }, { status: 404 })
    }
    
    return NextResponse.json({ 
      message: 'Demo user found',
      exists: true,
      user: {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name
      }
    })
  } catch (error: any) {
    console.error('Error checking demo user:', error)
    return NextResponse.json(
      { error: 'Database error', details: error.message },
      { status: 500 }
    )
  }
}
