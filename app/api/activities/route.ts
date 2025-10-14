import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTranslations } from '@/lib/translations'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    
    // Get user's language preference
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { language: true }
    })
    
    const userLanguage = user?.language || 'en'
    const t = getTranslations(userLanguage)

    // Get user's household
    const household = await prisma.household.findFirst({
      where: {
        members: {
          some: {
            userId: userId
          }
        }
      }
    })

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    // Fetch all item history for items in the user's household
    const activities = await prisma.itemHistory.findMany({
      where: {
        item: {
          householdId: household.id
        }
      },
      include: {
        item: true,
        performer: true,
        oldRoom: true,
        newRoom: true,
        oldCabinet: true,
        newCabinet: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Translate activity descriptions based on user's language
    const translatedActivities = activities.map(activity => {
      let translatedDescription = activity.description
      
      // Translate common activity descriptions
      switch (activity.action) {
        case 'created':
          if (activity.description.includes('created with quantity')) {
            const match = activity.description.match(/Item "([^"]+)" created with quantity (\d+)/)
            if (match) {
              const [, itemName, quantity] = match
              translatedDescription = t.itemCreatedWithQuantity.replace('{itemName}', itemName).replace('{quantity}', quantity)
            }
          } else if (activity.description.includes('created')) {
            translatedDescription = t.itemCreated
          }
          break
        case 'quantity_updated':
          if (activity.description.includes('Quantity increased from')) {
            const match = activity.description.match(/Quantity increased from (\d+) to (\d+)/)
            if (match) {
              const [, from, to] = match
              translatedDescription = t.quantityIncreasedFromTo.replace('{from}', from).replace('{to}', to)
            }
          } else if (activity.description.includes('Quantity decreased from')) {
            const match = activity.description.match(/Quantity decreased from (\d+) to (\d+)/)
            if (match) {
              const [, from, to] = match
              translatedDescription = t.quantityDecreasedFromTo.replace('{from}', from).replace('{to}', to)
            }
          }
          break
        case 'moved':
          if (activity.description.includes('moved from')) {
            const match = activity.description.match(/(.+?) moved from (.+?) to (.+)/)
            if (match) {
              const [, itemName, from, to] = match
              translatedDescription = t.itemMovedFromTo.replace('{itemName}', itemName).replace('{from}', from).replace('{to}', to)
            }
          }
          break
        case 'updated':
          translatedDescription = t.itemUpdated
          break
        case 'deleted':
          translatedDescription = t.itemDeleted
          break
        default:
          // Keep original description if no translation available
          break
      }
      
      return {
        ...activity,
        description: translatedDescription
      }
    })

    return NextResponse.json(translatedActivities)
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}
