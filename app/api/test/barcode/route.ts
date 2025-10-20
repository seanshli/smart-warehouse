import { NextRequest, NextResponse } from 'next/server'

// Ensure this route is always treated as dynamic during build
export const dynamic = 'force-dynamic'
import { recognizeItemFromBarcode } from '@/lib/ai'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barcode = searchParams.get('barcode') || '4710901898748'
    
    console.log('Testing barcode:', barcode)
    const result = await recognizeItemFromBarcode(barcode)
    
    return NextResponse.json({
      barcode,
      result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
