import { NextRequest, NextResponse } from 'next/server'
import { recognizeItemFromBarcode, recognizeItemFromBarcodeImage, recognizeItemFromImage } from '@/lib/ai'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('=== AI Recognition API Called ===')
    
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      console.log('No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const body = await request.json()
    const { type, imageBase64, barcode } = body

    console.log('Request type:', type)
    console.log('Image base64 length:', imageBase64?.length || 0)
    console.log('Barcode:', barcode)

    // Get user's language preference
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { language: true }
    })
    
    const userLanguage = user?.language || 'en'
    console.log('User language:', userLanguage)

    let result

    switch (type) {
      case 'image':
        console.log('Calling recognizeItemFromImage...')
        result = await recognizeItemFromImage(imageBase64, userLanguage)
        break
      case 'barcode':
        console.log('Calling recognizeItemFromBarcode...')
        result = await recognizeItemFromBarcode(barcode, userLanguage)
        break
      case 'barcode-image':
        console.log('Calling recognizeItemFromBarcodeImage...')
        result = await recognizeItemFromBarcodeImage(imageBase64)
        break
      default:
        console.log('Invalid recognition type:', type)
        return NextResponse.json({ error: 'Invalid recognition type' }, { status: 400 })
    }

    console.log('AI Recognition result:', result)

    // Add language information to result
    result.language = userLanguage

    return NextResponse.json(result)
  } catch (error) {
    console.error('AI recognition API error:', error)
    console.error('Error stack:', (error as Error).stack)
    return NextResponse.json(
      { 
        error: 'Failed to recognize item',
        details: (error as Error).message 
      },
      { status: 500 }
    )
  }
}