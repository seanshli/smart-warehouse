import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// GET /api/warehouse/barcodes - Search for barcode in database
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const { searchParams } = new URL(request.url)
    const barcode = searchParams.get('barcode')

    if (!barcode) {
      return NextResponse.json({ error: 'Barcode parameter is required' }, { status: 400 })
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

    // Search for barcode in database
    const barcodeRecord = await prisma.barcode.findFirst({
      where: {
        barcode: barcode,
        user_id: userId
      }
    })

    if (barcodeRecord) {
      return NextResponse.json({
        found: true,
        data: barcodeRecord
      })
    } else {
      return NextResponse.json({
        found: false,
        data: null
      })
    }
  } catch (error) {
    console.error('Error searching barcode:', error)
    return NextResponse.json({ error: 'Failed to search barcode' }, { status: 500 })
  }
}

// POST /api/warehouse/barcodes - Create or update barcode record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const body = await request.json()
    const {
      barcode,
      name,
      description,
      category,
      subcategory,
      brand,
      imageUrl,
      confidence,
      source = 'user',
      isVerified = true
    } = body

    // Validate required fields
    if (!barcode || !name || !category) {
      return NextResponse.json({ 
        error: 'Barcode, name, and category are required' 
      }, { status: 400 })
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

    // Create or update barcode record
    const existingBarcode = await prisma.barcode.findFirst({
      where: {
        barcode: barcode,
        user_id: userId
      }
    })

    let barcodeRecord
    if (existingBarcode) {
      barcodeRecord = await prisma.barcode.update({
        where: {
          id: existingBarcode.id
        },
        data: {
          product_name: name,
          description
        }
      })
    } else {
      barcodeRecord = await prisma.barcode.create({
        data: {
          user_id: userId,
          barcode: barcode,
          product_name: name,
          description
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: barcodeRecord
    })
  } catch (error) {
    console.error('Error creating/updating barcode:', error)
    return NextResponse.json({ error: 'Failed to save barcode' }, { status: 500 })
  }
}
