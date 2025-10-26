import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    
    console.log(`Making ${email} an admin...`)
    
    // Update the user to be an admin
    const user = await prisma.user.update({
      where: { email: email },
      data: { isAdmin: true }
    })
    
    console.log(`Successfully made ${email} an admin:`, user)
    
    return NextResponse.json({
      success: true,
      message: `Successfully made ${email} an admin`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin
      }
    })
    
  } catch (error) {
    console.error('Error making user admin:', error)
    return NextResponse.json(
      { error: 'Failed to make user admin', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
