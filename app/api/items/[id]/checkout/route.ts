import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CacheInvalidation } from '@/lib/cache'
import { checkAndCreateNotifications } from '@/lib/notifications'
import { transcribeAudioFormData } from '@/lib/speech-to-text'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const itemId = params.id
    const body = await request.json()

    // Verify user has access to this item
    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        household: {
          members: {
            some: {
              userId: userId
            }
          }
        }
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const checkoutQuantity = parseInt(body.quantity)
    const reason = body.reason || 'Checked out'
    const voiceUrl = body.voiceUrl || null

    if (checkoutQuantity <= 0) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
    }

    if (checkoutQuantity > item.quantity) {
      return NextResponse.json({ error: 'Cannot checkout more items than available' }, { status: 400 })
    }

    // Update the item quantity
    const newQuantity = item.quantity - checkoutQuantity
    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        quantity: newQuantity,
        updatedAt: new Date()
      },
      include: {
        category: {
          include: {
            parent: true
          }
        },
        room: true,
        cabinet: true
      }
    })

    // Build description with reason if provided
    let description = `Item checked out. Quantity decreased from ${item.quantity} to ${newQuantity}`
    if (reason && reason.trim() !== 'Checked out') {
      description += `. Reason: ${reason}`
    }

    // Transcribe voice comment if available (non-blocking)
    let voiceTranscript: string | null = null
    if (voiceUrl) {
      try {
        // Get user's language preference for better transcription
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { language: true }
        })
        const userLanguage = user?.language || 'en'
        
        // Map language codes for Whisper (en, zh, ja, etc.)
        const whisperLanguage = userLanguage === 'zh-TW' || userLanguage === 'zh' ? 'zh' : 
                                userLanguage === 'ja' ? 'ja' : 'en'
        
        const transcript = await transcribeAudioFormData(voiceUrl, whisperLanguage)
        if (transcript) {
          voiceTranscript = transcript
          // Append transcript to description for searchability
          description += `. Voice note: "${transcript}"`
        }
      } catch (error) {
        console.error('Failed to transcribe voice comment:', error)
        // Continue without transcript - not critical
      }
    }

    // Log checkout activity with voice comment and transcript if available
    await (prisma as any).itemHistory.create({
      data: {
        itemId: itemId,
        action: 'checkout',
        description: description,
        voiceUrl: voiceUrl ? `data:audio/webm;codecs=opus;base64,${voiceUrl}` : null,
        voiceTranscript: voiceTranscript,
        performedBy: userId
      }
    })

    // Create notifications for checkout (especially for low inventory)
    try {
      await checkAndCreateNotifications(updatedItem, userId, 'updated', item)
    } catch (error) {
      console.error('Failed to create notifications for checkout:', error)
    }

    // Clear cache after checkout to ensure UI reflects updated quantity
    if (item.householdId) {
      CacheInvalidation.clearItemCache(item.householdId)
      console.log('Checkout: Cleared cache for household:', item.householdId)
    }

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error checking out item:', error)
    return NextResponse.json({ error: 'Failed to checkout item' }, { status: 500 })
  }
}