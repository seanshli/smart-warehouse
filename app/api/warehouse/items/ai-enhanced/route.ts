import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { householdMemberships: { include: { household: true } } }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { image, description, language = 'en' } = await request.json()

    if (!image && !description) {
      return NextResponse.json({ error: 'Image or description is required' }, { status: 400 })
    }

    // Get user's household
    const household = user.householdMemberships[0]?.household
    if (!household) {
      return NextResponse.json({ error: 'User must belong to a household' }, { status: 400 })
    }

    let aiResult
    if (image) {
      // AI image recognition
      const response = await fetch(image)
      const imageBuffer = await response.arrayBuffer()
      const base64Image = Buffer.from(imageBuffer).toString('base64')

      aiResult = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image and provide detailed information about the item. Return a JSON object with:
                - name: The item name in ${language}
                - description: Detailed description in ${language}
                - category: Main category
                - subcategory: Subcategory if applicable
                - estimatedQuantity: Suggested quantity (default 1)
                - estimatedMinQuantity: Suggested minimum quantity (default 0)
                - room: Suggested room location
                - cabinet: Suggested cabinet location
                - barcode: If visible in image
                - qrCode: If visible in image
                - aiConfidence: Confidence score (0-1)
                
                Be specific and accurate. Use the language: ${language}`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    } else {
      // AI text analysis
      aiResult = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Analyze this item description and provide detailed information. Return a JSON object with:
            - name: The item name in ${language}
            - description: Enhanced description in ${language}
            - category: Main category
            - subcategory: Subcategory if applicable
            - estimatedQuantity: Suggested quantity (default 1)
            - estimatedMinQuantity: Suggested minimum quantity (default 0)
            - room: Suggested room location
            - cabinet: Suggested cabinet location
            - aiConfidence: Confidence score (0-1)
            
            Original description: ${description}
            Be specific and accurate. Use the language: ${language}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    }

    const aiResponse = aiResult.choices[0]?.message?.content
    if (!aiResponse) {
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 })
    }

    let itemData
    try {
      itemData = JSON.parse(aiResponse)
    } catch (parseError) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    // Check for duplicates before creating
    const duplicateCheck = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/duplicate-detection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        itemName: itemData.name,
        description: itemData.description,
        category: itemData.category,
        householdId: household.id
      })
    })

    const duplicateResult = await duplicateCheck.json()
    
    if (duplicateResult.hasDuplicates) {
      return NextResponse.json({
        success: false,
        message: 'Potential duplicate items detected',
        duplicates: duplicateResult.duplicates,
        aiAnalysis: itemData,
        shouldCreate: false
      })
    }

    // Find or create category
    let category = await prisma.category.findFirst({
      where: {
        name: itemData.category,
        householdId: household.id,
        level: 1
      }
    })

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: itemData.category,
          householdId: household.id,
          level: 1
        }
      })
    }

    // Find or create subcategory if provided
    let subcategory = null
    if (itemData.subcategory) {
      subcategory = await prisma.category.findFirst({
        where: {
          name: itemData.subcategory,
          householdId: household.id,
          level: 2,
          parentId: category.id
        }
      })

      if (!subcategory) {
        subcategory = await prisma.category.create({
          data: {
            name: itemData.subcategory,
            householdId: household.id,
            level: 2,
            parentId: category.id
          }
        })
      }
    }

    // Find or create room
    let room = null
    if (itemData.room) {
      room = await prisma.room.findFirst({
        where: {
          name: itemData.room,
          householdId: household.id
        }
      })

      if (!room) {
        room = await prisma.room.create({
          data: {
            name: itemData.room,
            householdId: household.id
          }
        })
      }
    }

    // Find or create cabinet
    let cabinet = null
    if (itemData.cabinet && room) {
      cabinet = await prisma.cabinet.findFirst({
        where: {
          name: itemData.cabinet,
          roomId: room.id
        }
      })

      if (!cabinet) {
        cabinet = await prisma.cabinet.create({
          data: {
            name: itemData.cabinet,
            roomId: room.id
          }
        })
      }
    }

    // Create the item
    const item = await prisma.item.create({
      data: {
        name: itemData.name,
        description: itemData.description,
        quantity: itemData.estimatedQuantity || 1,
        minQuantity: itemData.estimatedMinQuantity || 0,
        imageUrl: image,
        barcode: itemData.barcode,
        qrCode: itemData.qrCode,
        categoryId: subcategory ? subcategory.id : category.id,
        roomId: room?.id,
        cabinetId: cabinet?.id,
        householdId: household.id,
        addedById: user.id,
        language: language,
        aiDescription: aiResponse
      }
    })

    // Create item history
    await prisma.itemHistory.create({
      data: {
        itemId: item.id,
        action: 'created',
        description: `Item "${item.name}" created with quantity ${item.quantity}`,
        performedBy: user.id
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Item created successfully',
      item,
      aiAnalysis: itemData,
      duplicates: duplicateResult.duplicates,
      shouldCreate: true
    })

  } catch (error) {
    console.error('Error in AI-enhanced item creation:', error)
    return NextResponse.json(
      { error: 'Failed to create item', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
