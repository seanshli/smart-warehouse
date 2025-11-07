import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { trackActivity, createActivityDescription, ActivityType, ActivityAction } from '@/lib/activity-tracker'

export const dynamic = 'force-dynamic'

/**
 * API endpoint to track user activities from the frontend
 * This allows the frontend to log activities without blocking the main flow
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const body = await request.json()

    const {
      householdId,
      activityType,
      action,
      description,
      metadata,
      itemId,
      roomId,
      cabinetId,
      categoryId
    } = body

    // Validate required fields
    if (!householdId || !activityType || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: householdId, activityType, action' },
        { status: 400 }
      )
    }

    // Verify user has access to this household
    const household = await prisma.household.findFirst({
      where: {
        id: householdId,
        members: {
          some: {
            userId: userId
          }
        }
      }
    })

    if (!household) {
      return NextResponse.json({ error: 'Household not found or access denied' }, { status: 403 })
    }

    // Create description if not provided
    const finalDescription = description || createActivityDescription(
      activityType as ActivityType,
      action as ActivityAction,
      metadata
    )

    // Track the activity
    await trackActivity({
      userId,
      householdId,
      activityType: activityType as ActivityType,
      action: action as ActivityAction,
      description: finalDescription,
      metadata,
      itemId,
      roomId,
      cabinetId,
      categoryId
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking activity:', error)
    return NextResponse.json(
      { error: 'Failed to track activity' },
      { status: 500 }
    )
  }
}

