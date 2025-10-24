import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { theme, fontSize, language } = body

    // Update user preferences in database
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        preferences: {
          theme: theme || 'system',
          fontSize: fontSize || 'medium',
          language: language || 'en'
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving user preferences:', error)
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user preferences from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { preferences: true }
    })

    return NextResponse.json({ 
      preferences: user?.preferences || {
        theme: 'system',
        fontSize: 'medium',
        language: 'en'
      }
    })
  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
  }
}
