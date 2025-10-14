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
    console.log('Activities API - User ID:', userId)
    console.log('Activities API - User language from DB:', user?.language)
    console.log('Activities API - Final language used:', userLanguage)
    const t = getTranslations(userLanguage)

    // Simple item name translation function
    const translateItemName = (itemName: string, targetLanguage: string): string => {
      if (targetLanguage !== 'en') return itemName
      
      // Common item name translations from Chinese to English
      const translations: Record<string, string> = {
        '日本製銀色天然礦泉水瓶 400ml': 'Japanese Silver Natural Mineral Water Bottle 400ml',
        'Panasonic 黑色多功能遙控器': 'Panasonic Black Multifunction Remote Control',
        'Beige Cotton T-Shirt': 'Beige Cotton T-Shirt', // Already in English
        '白色短袖T恤': 'White Short Sleeve T-Shirt',
        '這是一個銀色的天然礦泉水瓶,容量為400毫升,瓶身上印有綠色水滴圖案,標示為日本製造。': 'This is a silver natural mineral water bottle, with a capacity of 400ml, with a green water drop pattern printed on the bottle, marked as made in Japan.',
        '這是一款黑色的Panasonic遙控器,具有多個流媒體按鈕如Netflix、Hulu、YouTube等,適用於控制多種設備。': 'This is a black Panasonic remote control, with multiple streaming media buttons such as Netflix, Hulu, YouTube, etc., suitable for controlling multiple devices.',
        'A plain beige t-shirt made of cotton, featuring a crew neck and short sleeves.': 'A plain beige t-shirt made of cotton, featuring a crew neck and short sleeves.', // Already in English
        '這是一件白色的短袖T恤,上面印有 \'THE COME MUSIC\' 字樣,並有紅色、藍色和黑色的條紋設計。': 'This is a white short-sleeved T-shirt, with \'THE COME MUSIC\' printed on it, and red, blue, and black stripe designs.'
      }
      
      return translations[itemName] || itemName
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
