import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isLanguageSupported } from '@/lib/language'

// PATCH /api/user/language - Update user's language preference
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const body = await request.json()
    const { language } = body

    // Validate language code
    if (!language || !isLanguageSupported(language)) {
      return NextResponse.json({ 
        error: 'Invalid or unsupported language code' 
      }, { status: 400 })
    }

    // Update user's language preference
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { language }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        language: updatedUser.language
      }
    })
  } catch (error) {
    console.error('Error updating user language:', error)
    return NextResponse.json({ error: 'Failed to update language preference' }, { status: 500 })
  }
}

// GET /api/user/language - Get user's current language preference
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, language: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      language: user.language || 'en'
    })
  } catch (error) {
    console.error('Error getting user language:', error)
    return NextResponse.json({ error: 'Failed to get language preference' }, { status: 500 })
  }
}
