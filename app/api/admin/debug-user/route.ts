import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') || 'admin@smartwarehouse.com'

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

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        adminRole: (user as any).adminRole,
        language: user.language,
        createdAt: user.createdAt,
        hasCredentials: !!user.credentials,
        credentialsId: user.credentials?.id
      }
    })

  } catch (error) {
    console.error('Error debugging user:', error)
    return NextResponse.json(
      { error: 'Failed to debug user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
