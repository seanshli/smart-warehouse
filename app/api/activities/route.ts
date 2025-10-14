import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTranslations } from '@/lib/translations'
import { translateItemContent } from '@/lib/item-translations'

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
    console.log('Activities API - User ID:', userId)
    console.log('Activities API - User language from DB:', user?.language)
    console.log('Activities API - Final language used:', userLanguage)
    const t = getTranslations(userLanguage)

    // Use centralized translation function
    const translateItemName = (itemName: string, targetLanguage: string): string => {
      return translateItemContent(itemName, targetLanguage)
    }

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
              const translatedItemName = translateItemName(itemName, userLanguage)
              translatedDescription = t.itemCreatedWithQuantity.replace('{itemName}', translatedItemName).replace('{quantity}', quantity)
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
              const translatedItemName = translateItemName(itemName, userLanguage)
              translatedDescription = t.itemMovedFromTo.replace('{itemName}', translatedItemName).replace('{from}', from).replace('{to}', to)
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
          // For activities that are just item descriptions, try to translate them
          if (activity.description && activity.description.length > 10) {
            translatedDescription = translateItemName(activity.description, userLanguage)
          }
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
